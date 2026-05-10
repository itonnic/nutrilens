import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { MealAnalysisResult } from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ANALYZER_TOKEN, MealVisionAnalyzer } from './types';

export const MEAL_ANALYSIS_QUEUE = 'meal-analysis';

export interface MealAnalysisJobData {
  jobId: string;
  userId: string;
  mealId: string;
  imageUrl: string;
  /** Object-storage key, when known. If present we read the file off disk
   *  and ship the raw bytes to the analyzer (so providers like OpenAI that
   *  can't reach localhost URLs can still see the image). */
  storageKey?: string;
  userNote?: string;
  mealType?: string;
  /** UI locale of the requesting user (e.g. `tr`, `ja`). The analyzer adds a
   *  "Respond in <language>" instruction to the prompt so the model returns
   *  the meal title, assumptions, warnings and suggestions in this language. */
  locale?: string;
}

@Processor(MEAL_ANALYSIS_QUEUE, { concurrency: 2 })
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @Inject(ANALYZER_TOKEN) private readonly analyzer: MealVisionAnalyzer,
  ) {
    super();
  }

  async process(job: Job<MealAnalysisJobData>): Promise<void> {
    const { jobId, userId, mealId, imageUrl, storageKey, userNote, mealType, locale } = job.data;
    this.logger.log(
      `Processing meal analysis ${jobId} (meal=${mealId}) via ${this.analyzer.name} (locale=${locale ?? 'en'})`,
    );

    await this.prisma.aiAnalysisJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    });

    // Resolve raw image bytes for providers that can't fetch our public URL.
    // Required for OpenAI when the public base URL is `localhost:4000`.
    let imageBuffer: Buffer | undefined;
    let imageMime: string | undefined;
    if (storageKey) {
      try {
        const file = await this.storage.readMealImage(storageKey);
        imageBuffer = file.buffer;
        imageMime = file.mimeType;
      } catch (err) {
        this.logger.warn(
          `Could not read storage bytes for ${storageKey}: ${
            err instanceof Error ? err.message : err
          }. Falling back to imageUrl.`,
        );
      }
    }

    const analyzerInput = { imageUrl, imageBuffer, imageMime, userNote, mealType, locale };

    try {
      // Primary analyzer (OpenAI/Gemini in prod, Mock only when AI_PROVIDER=mock).
      const result = await this.analyzer.analyzeMeal(analyzerInput);
      await this.persistResult(jobId, mealId, result, this.analyzer.name);
      this.logger.log(`Job ${jobId} completed via ${this.analyzer.name}`);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Unknown error';
      const publicMessage = this.toPublicErrorMessage(err);
      this.logger.error(
        `Analyzer (${this.analyzer.name}) failed for ${jobId}: ${rawMessage} -> ${publicMessage}`,
      );

      // No silent mock fallback: surface the real AI failure to the UI so the
      // user knows whether they hit a provider rate limit, quota, or outage.
      await this.prisma.$transaction([
        this.prisma.aiAnalysisJob.update({
          where: { id: jobId },
          data: { status: 'FAILED', errorMessage: publicMessage },
        }),
        this.prisma.meal.update({
          where: { id: mealId },
          data: { status: 'NEEDS_REVIEW' },
        }),
      ]);
    }
  }

  private toPublicErrorMessage(err: unknown): string {
    const status =
      typeof err === 'object' && err !== null && 'status' in err && typeof err.status === 'number'
        ? err.status
        : undefined;
    const code =
      typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
        ? err.code
        : undefined;
    const type =
      typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string'
        ? err.type
        : undefined;
    const message = err instanceof Error ? err.message : String(err ?? 'Unknown error');
    const haystack = `${status ?? ''} ${code ?? ''} ${type ?? ''} ${message}`.toLowerCase();

    if (
      status === 429 ||
      /rate limit|too many requests|insufficient_quota|quota exceeded|billing/i.test(haystack)
    ) {
      return 'AI rate limit reached. Please wait a minute and try again.';
    }

    if (
      status === 401 ||
      status === 403 ||
      /invalid api key|authentication|unauthorized|forbidden/i.test(haystack)
    ) {
      return 'AI provider authentication failed. Please try again later.';
    }

    if (
      status === 408 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      /timeout|timed out|econnreset|econnrefused|enotfound|eai_again|service unavailable|temporarily unavailable|overloaded|connection/i.test(
        haystack,
      )
    ) {
      return 'AI service is temporarily unavailable. Please try again shortly.';
    }

    return 'AI analysis failed. Please try again.';
  }

  private async persistResult(
    jobId: string,
    mealId: string,
    result: MealAnalysisResult,
    providerName: string,
    fallbackReason?: string,
  ) {
    const itemsCreate = result.detectedItems.map((item) => ({
      name: item.name,
      quantity: item.estimatedQuantity,
      unit: item.unit,
      calories: item.nutrition.calories,
      protein: item.nutrition.protein,
      carbs: item.nutrition.carbs,
      fat: item.nutrition.fat,
      fiber: item.nutrition.fiber ?? null,
      sugar: item.nutrition.sugar ?? null,
      sodium: item.nutrition.sodium ?? null,
      confidence: item.portionConfidence,
      assumptions: item.assumptions,
    }));

    // Tag the raw blob with provenance so we can audit later (which provider,
    // was it a fallback, what was the original error). The Meal contract
    // already serializes `aiResult` from this column on the response, but the
    // extra `_provenance` key is opaque to the rest of the app.
    const rawWithProvenance = {
      ...result,
      _provenance: {
        provider: providerName,
        fallbackReason: fallbackReason ?? null,
        analyzedAt: new Date().toISOString(),
      },
    };

    await this.prisma.$transaction([
      this.prisma.mealItem.deleteMany({ where: { mealId } }),
      this.prisma.meal.update({
        where: { id: mealId },
        data: {
          title: result.mealTitle,
          calories: result.totals.calories,
          protein: result.totals.protein,
          carbs: result.totals.carbs,
          fat: result.totals.fat,
          fiber: result.totals.fiber ?? null,
          sugar: result.totals.sugar ?? null,
          sodium: result.totals.sodium ?? null,
          confidence: result.confidence,
          aiRawJson: rawWithProvenance as unknown as object,
          status: 'NEEDS_REVIEW',
          source: 'AI',
          items: { create: itemsCreate },
        },
      }),
      this.prisma.aiAnalysisJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          resultJson: rawWithProvenance as unknown as object,
        },
      }),
    ]);
  }
}
