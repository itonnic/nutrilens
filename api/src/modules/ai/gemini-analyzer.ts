import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
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
5. Return only valid JSON matching the required schema (no prose, no markdown fences).
6. Use conservative estimates when uncertain.
7. Include confidence scores between 0 and 1.
8. Warn when sauce, oil, dressing, hidden ingredients, or portion size are unclear.
9. Do not give medical advice.
10. Do not claim exact accuracy.`;

/**
 * Google Gemini analyzer.
 *
 * - Uses the official @google/genai SDK (v1.x) against the Gemini Developer API.
 * - Sends raw image bytes inline (base64) — no public URL needed, works for
 *   localhost-only storage.
 * - Forces strict JSON output via responseMimeType + responseJsonSchema, then
 *   re-validates with our Zod schema for defense in depth.
 * - Free tier on `gemini-1.5-flash` (15 RPM, 1500 RPD). Switch to
 *   `gemini-2.0-flash-exp` for better quality, harder rate limits.
 */
@Injectable()
export class GeminiMealAnalyzer implements MealVisionAnalyzer {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiMealAnalyzer.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(config: AppConfigService) {
    if (!config.geminiApiKey) {
      throw new Error('GEMINI_API_KEY missing — set AI_PROVIDER=mock or provide a key');
    }
    this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    this.model = config.geminiModel;
  }

  async analyzeMeal(input: AnalyzeMealInput): Promise<MealAnalysisResult> {
    const note = input.userNote ? `User note: ${input.userNote}` : 'User note: (none)';
    const meal = input.mealType ? `Meal type: ${input.mealType}` : 'Meal type: (unknown)';
    const locale = isSupportedLocale(input.locale) ? input.locale : DEFAULT_LOCALE;
    const language = localeToLanguageName(locale);
    // Tell Gemini which language the user-facing strings (mealTitle,
    // assumptions, warnings, suggestions, item names) should come back in.
    // Numbers, units, ingredient quantities and the JSON shape itself are
    // language-neutral and stay untouched.
    const localeInstruction = `Respond in ${language}. Translate user-facing fields (mealTitle, item names, assumptions, warnings, suggestions, manualReviewReasons) into ${language}. Keep all numeric values, units (g, ml, kcal, oz, etc.) and the JSON keys in English.`;
    const promptText = `${SYSTEM_PROMPT}\n\n${localeInstruction}\n\nAnalyze the meal in this photo.\n${meal}\n${note}\n\nReturn JSON only matching the required schema.`;

    // Gemini wants `inlineData` (base64) for image bytes. We always come in
    // with a buffer via the AI processor; but if a caller only has a URL we
    // fall back to fetching it ourselves so the analyzer is symmetric with
    // the OpenAI one.
    let base64: string;
    let mimeType: string;
    if (input.imageBuffer && input.imageMime) {
      base64 = input.imageBuffer.toString('base64');
      mimeType = input.imageMime;
    } else {
      this.logger.debug(`Fetching ${input.imageUrl} since no buffer was provided`);
      const res = await fetch(input.imageUrl);
      if (!res.ok) {
        throw new Error(`Could not fetch meal image (${res.status})`);
      }
      mimeType = res.headers.get('content-type') ?? 'image/jpeg';
      const ab = await res.arrayBuffer();
      base64 = Buffer.from(ab).toString('base64');
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        // The SDK accepts a JSON Schema directly via `responseJsonSchema`.
        // Some preview models still expect the OpenAPI-flavoured `responseSchema`,
        // so we send the same shape under both names — Gemini ignores the
        // unsupported one.
        responseJsonSchema: MEAL_ANALYSIS_JSON_SCHEMA as unknown as Record<
          string,
          unknown
        >,
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      throw new Error('Gemini returned empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonFences(text));
    } catch (err) {
      this.logger.error(`Failed to parse Gemini response: ${text.slice(0, 500)}`);
      throw new Error('Could not parse Gemini response as JSON');
    }
    return MealAnalysisResultSchema.parse(parsed);
  }
}

/**
 * Some Gemini models still wrap JSON in ```json ... ``` fences even when you
 * ask for `application/json`. Strip them defensively.
 */
function stripJsonFences(text: string): string {
  const fenced = /^```(?:json)?\s*\n([\s\S]*?)\n```$/m;
  const match = text.match(fenced);
  return match ? match[1] : text;
}
