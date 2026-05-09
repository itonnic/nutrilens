import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalyzeMealSchema, type AnalyzeMealInput } from '@nutrilens/shared';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUserPayload } from '../../common/decorators';
import { ZodValidationPipe } from '../../common/zod.pipe';
import { resolveLocaleFromHeader } from '../../common/locales';

/**
 * AI analysis endpoints.
 *
 * `POST /ai/analyze-meal` is the spec-canonical entry point. It re-enqueues the
 * vision analyzer for an existing meal. The per-user rate limit comes from
 * `AI_RATE_LIMIT_PER_MINUTE` (see ThrottlerOptions in AppModule).
 *
 * Note: the meal must already exist (created by `POST /meals/upload`). This
 * endpoint never creates new meal records.
 */
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  /**
   * Per-user limit comes from the named 'ai' throttler in `AppModule`
   * (configured via `AI_RATE_LIMIT_PER_MINUTE`).
   */
  @Post('analyze-meal')
  @Throttle({ ai: {} })
  analyzeMeal(
    @CurrentUser() user: AuthUserPayload,
    @Body(new ZodValidationPipe(AnalyzeMealSchema)) body: AnalyzeMealInput,
    @Headers('accept-language') acceptLanguage: string | undefined,
  ) {
    return this.ai.reanalyzeMeal(
      user.userId,
      body.mealId,
      body.userNote,
      resolveLocaleFromHeader(acceptLanguage),
    );
  }

  @Get('jobs/:id')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  getJob(@CurrentUser() user: AuthUserPayload, @Param('id') id: string) {
    return this.ai.getJob(user.userId, id);
  }
}
