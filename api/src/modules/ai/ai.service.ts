import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { AiJobResponse, MealAnalysisResult } from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { MEAL_ANALYSIS_QUEUE, MealAnalysisJobData } from './ai.processor';
import { sanitizeUserText } from '../../common/sanitize';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(MEAL_ANALYSIS_QUEUE) private readonly queue: Queue<MealAnalysisJobData>,
  ) {}

  async enqueueAnalysis(args: {
    userId: string;
    mealId: string;
    imageUrl: string;
    /** Object-storage key (when available) so the worker can read raw bytes
     *  and pass them inline to providers that can't reach localhost URLs. */
    storageKey?: string | null;
    userNote?: string;
    mealType?: string;
    /** UI locale of the user that triggered the analysis. The processor
     *  forwards this to the analyzer so titles, warnings, assumptions and
     *  suggestions come back in the user's language. Defaults to `en`. */
    locale?: string;
  }): Promise<AiJobResponse> {
    const job = await this.prisma.aiAnalysisJob.create({
      data: {
        userId: args.userId,
        mealId: args.mealId,
        imageUrl: args.imageUrl,
        status: 'PENDING',
      },
    });

    try {
      await this.queue.add(
        'analyze',
        {
          jobId: job.id,
          userId: args.userId,
          mealId: args.mealId,
          imageUrl: args.imageUrl,
          storageKey: args.storageKey ?? undefined,
          userNote: args.userNote,
          mealType: args.mealType,
          locale: args.locale,
        },
        {
          attempts: 2,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    } catch (err) {
      // Redis is down or unreachable. Mark the job FAILED so the row reflects
      // reality and surface a 503 to the caller — much friendlier than a raw
      // ECONNREFUSED bubbling up as a 500.
      const message = err instanceof Error ? err.message : 'Queue error';
      this.logger.error(`Failed to enqueue meal analysis: ${message}`);
      await this.prisma.aiAnalysisJob
        .update({
          where: { id: job.id },
          data: { status: 'FAILED', errorMessage: `Queue unavailable: ${message}` },
        })
        .catch(() => undefined);
      throw new ServiceUnavailableException(
        'Analysis queue is unavailable. Please try again in a moment.',
      );
    }

    return this.toJobResponse(job);
  }

  async getJob(userId: string, jobId: string): Promise<AiJobResponse> {
    const job = await this.prisma.aiAnalysisJob.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundException('Job not found');
    return this.toJobResponse(job);
  }

  /**
   * Re-enqueue analysis for an existing meal. Used by `POST /ai/analyze-meal`.
   * Owner-scoped: throws NotFound for meals that don't belong to the user.
   */
  async reanalyzeMeal(
    userId: string,
    mealId: string,
    userNote?: string,
    locale?: string,
  ): Promise<AiJobResponse> {
    const meal = await this.prisma.meal.findFirst({ where: { id: mealId, userId } });
    if (!meal) throw new NotFoundException('Meal not found');
    if (!meal.imageUrl) throw new BadRequestException('Meal has no image to analyze');

    const safeNote = userNote === undefined ? undefined : sanitizeUserText(userNote);
    if (safeNote !== undefined) {
      await this.prisma.meal.update({
        where: { id: mealId },
        data: { userNote: safeNote || null },
      });
    }

    return this.enqueueAnalysis({
      userId,
      mealId,
      imageUrl: meal.imageUrl,
      storageKey: meal.storageKey,
      userNote: safeNote ?? meal.userNote ?? undefined,
      mealType: meal.mealType,
      locale,
    });
  }

  private toJobResponse(job: {
    id: string;
    mealId: string | null;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    resultJson: unknown;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AiJobResponse {
    return {
      id: job.id,
      mealId: job.mealId,
      status: job.status,
      resultJson: (job.resultJson as MealAnalysisResult | null) ?? null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
