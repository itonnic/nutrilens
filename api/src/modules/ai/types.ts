import type { MealAnalysisResult } from '@nutrilens/shared';

export interface AnalyzeMealInput {
  imageUrl: string;
  imageBuffer?: Buffer;
  imageMime?: string;
  userNote?: string;
  mealType?: string;
  locale?: string;
}

export interface MealVisionAnalyzer {
  readonly name: string;
  analyzeMeal(input: AnalyzeMealInput): Promise<MealAnalysisResult>;
}

export const ANALYZER_TOKEN = 'MEAL_VISION_ANALYZER';
