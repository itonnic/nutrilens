import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  MEAL_ANALYSIS_JSON_SCHEMA,
  MealAnalysisResultSchema,
  type MealAnalysisResult,
} from '@nutrilens/shared';
import { AppConfigService } from '../../config/app-config.service';
import type { AnalyzeMealInput, MealVisionAnalyzer } from './types';
import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  localeToLanguageName,
} from '../../common/locales';

const SYSTEM_PROMPT = `You are a nutrition estimation assistant inside a food tracking app.

Your task:
1. Identify visible food and drink items in the photo.
2. Estimate portion sizes conservatively.
3. Estimate calories and nutrition values per item and totals.
4. State assumptions clearly.
5. Return only valid JSON matching the required schema (no prose).
6. Use conservative estimates when uncertain.
7. Include confidence scores.
8. Warn when sauce, oil, dressing, hidden ingredients, or portion size are unclear.
9. Do not give medical advice.
10. Do not claim exact accuracy.`;

@Injectable()
export class OpenAiMealAnalyzer implements MealVisionAnalyzer {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiMealAnalyzer.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(config: AppConfigService) {
    if (!config.openAiApiKey) {
      throw new Error('OPENAI_API_KEY missing — set AI_PROVIDER=mock or provide a key');
    }
    this.client = new OpenAI({ apiKey: config.openAiApiKey });
    this.model = config.openAiModel;
  }

  async analyzeMeal(input: AnalyzeMealInput): Promise<MealAnalysisResult> {
    const userMessage = this.buildUserMessage(input);
    const locale = isSupportedLocale(input.locale) ? input.locale : DEFAULT_LOCALE;
    const language = localeToLanguageName(locale);
    // Tell the model which language the user-facing strings should come back
    // in. Numbers, units and JSON keys stay neutral.
    const localizedSystem = `${SYSTEM_PROMPT}\n\nRespond in ${language}. Translate user-facing fields (mealTitle, item names, assumptions, warnings, suggestions, manualReviewReasons) into ${language}. Keep all numeric values, units (g, ml, kcal, oz, etc.) and the JSON keys in English.`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: localizedSystem },
        userMessage,
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'meal_analysis',
          schema: MEAL_ANALYSIS_JSON_SCHEMA as unknown as Record<string, unknown>,
          strict: true,
        },
      },
    });

    const text = response.choices[0]?.message?.content ?? '';
    if (!text) {
      throw new Error('OpenAI returned empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      this.logger.error(`Failed to parse OpenAI response: ${text}`);
      throw new Error('Could not parse AI response as JSON');
    }
    return MealAnalysisResultSchema.parse(parsed);
  }

  private buildUserMessage(input: AnalyzeMealInput): OpenAI.Chat.ChatCompletionMessageParam {
    const note = input.userNote ? `User note: ${input.userNote}` : 'User note: (none)';
    const meal = input.mealType ? `Meal type: ${input.mealType}` : 'Meal type: (unknown)';
    const text = `Analyze the meal in this photo.\n${meal}\n${note}\n\nReturn JSON only.`;

    let imagePart: OpenAI.Chat.ChatCompletionContentPart;
    if (input.imageBuffer && input.imageMime) {
      const b64 = input.imageBuffer.toString('base64');
      imagePart = {
        type: 'image_url',
        image_url: { url: `data:${input.imageMime};base64,${b64}` },
      };
    } else {
      imagePart = { type: 'image_url', image_url: { url: input.imageUrl } };
    }

    return {
      role: 'user',
      content: [{ type: 'text', text }, imagePart],
    };
  }
}
