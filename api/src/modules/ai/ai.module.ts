import { Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfigService } from '../../config/app-config.service';
import { ANALYZER_TOKEN } from './types';
import { OpenAiMealAnalyzer } from './openai-analyzer';
import { GeminiMealAnalyzer } from './gemini-analyzer';
import { MockMealAnalyzer } from './mock-analyzer';
import { AiAnalysisProcessor, MEAL_ANALYSIS_QUEUE } from './ai.processor';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';
import { InsightsService } from './insights.service';

const logger = new Logger('AiModule');

@Module({
  imports: [
    AuthModule,
    BullModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: { url: config.redisUrl },
      }),
    }),
    BullModule.registerQueue({ name: MEAL_ANALYSIS_QUEUE }),
  ],
  providers: [
    {
      provide: ANALYZER_TOKEN,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        // If a real provider is requested but its key is missing, log a clear
        // warning and fall back to the mock analyzer at boot time. This keeps
        // `make dev` zero-config while still letting prod fail fast if you
        // really misconfigure.
        if (config.aiProvider === 'openai') {
          if (!config.openAiApiKey) {
            logger.warn(
              'AI_PROVIDER=openai but OPENAI_API_KEY is empty. Using the mock analyzer until you add a key.',
            );
            return new MockMealAnalyzer();
          }
          logger.log(`Using OpenAI analyzer (model=${config.openAiModel}).`);
          return new OpenAiMealAnalyzer(config);
        }
        if (config.aiProvider === 'gemini') {
          if (!config.geminiApiKey) {
            logger.warn(
              'AI_PROVIDER=gemini but GEMINI_API_KEY is empty. Using the mock analyzer until you add a key.',
            );
            return new MockMealAnalyzer();
          }
          logger.log(`Using Gemini analyzer (model=${config.geminiModel}).`);
          return new GeminiMealAnalyzer(config);
        }
        logger.log('Using deterministic mock analyzer (AI_PROVIDER=mock).');
        return new MockMealAnalyzer();
      },
    },
    AiAnalysisProcessor,
    AiService,
    InsightsService,
  ],
  controllers: [AiController],
  exports: [AiService, InsightsService, BullModule],
})
export class AiModule {}
