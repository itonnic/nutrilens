import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import type { MealAnalysisResult } from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ANALYZER_TOKEN, MealVisionAnalyzer } from './types';
import { MockMealAnalyzer } from './mock-analyzer';

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
  private readonly fallback = new MockMealAnalyzer();

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
      // Primary analyzer (OpenAI in prod, Mock when AI_PROVIDER=mock).
      const result = await this.analyzer.analyzeMeal(analyzerInput);
      await this.persistResult(jobId, mealId, result, this.analyzer.name);
      this.logger.log(`Job ${jobId} completed via ${this.analyzer.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Primary analyzer (${this.analyzer.name}) failed for ${jobId}: ${message}`);

      // If the primary is OpenAI and it failed (rate limit, network, bad key,
      // model error...), fall back to the deterministic mock so the user
      // never sees an empty meal. The persisted `aiRawJson._fallback` flag
      // makes the soft-failure auditable.
      if (this.analyzer.name !== 'mock') {
        try {
          this.logger.warn(`Falling back to mock analyzer for ${jobId}`);
          const result = await this.fallback.analyzeMeal(analyzerInput);
          await this.persistResult(jobId, mealId, result, 'mock-fallback', message);
          return;
        } catch (fallbackErr) {
          const fbMsg =
            fallbackErr instanceof Error ? fallbackErr.message : 'Mock fallback also failed';
          this.logger.error(`Fallback also failed for ${jobId}: ${fbMsg}`);
        }
      }

      // Both failed: mark the job FAILED and the meal NEEDS_REVIEW so the
      // user can manually fill it in.
      await this.prisma.$transaction([
        this.prisma.aiAnalysisJob.update({
          where: { id: jobId },
          data: { status: 'FAILED', errorMessage: message },
        }),
        this.prisma.meal.update({
          where: { id: mealId },
          data: { status: 'NEEDS_REVIEW' },
        }),
      ]);
    }
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
