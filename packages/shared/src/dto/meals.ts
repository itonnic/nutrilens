import { z } from 'zod';
import { FoodUnitSchema, type MealAnalysisResult } from '../ai-schema';

export const MealTypeInputSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DRINK']);

export const UploadMealSchema = z.object({
  mealType: MealTypeInputSchema,
  userNote: z.string().max(500).optional(),
  consumedAt: z.string().datetime().optional(),
});
export type UploadMealInput = z.infer<typeof UploadMealSchema>;

export const AnalyzeMealSchema = z.object({
  mealId: z.string().uuid(),
  userNote: z.string().max(500).optional(),
});
export type AnalyzeMealInput = z.infer<typeof AnalyzeMealSchema>;

export const MealItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  quantity: z.number().nonnegative(),
  unit: FoodUnitSchema,
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional().nullable(),
  sugar: z.number().nonnegative().optional().nullable(),
  sodium: z.number().nonnegative().optional().nullable(),
});
export type MealItemInput = z.infer<typeof MealItemInputSchema>;

export const UpdateMealSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  mealType: MealTypeInputSchema.optional(),
  consumedAt: z.string().datetime().optional(),
  userNote: z.string().max(500).optional().nullable(),
  items: z.array(MealItemInputSchema).optional(),
});
export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;

export const ConfirmMealSchema = z.object({
  items: z.array(MealItemInputSchema).optional(),
  title: z.string().min(1).max(140).optional(),
});
export type ConfirmMealInput = z.infer<typeof ConfirmMealSchema>;

export interface MealItemResponse {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  confidence: number | null;
  assumptions: string[];
}

export interface MealResponse {
  id: string;
  userId: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DRINK';
  title: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  consumedAt: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  confidence: number | null;
  source: 'AI' | 'MANUAL' | 'BARCODE' | 'RECIPE';
  status: 'DRAFT' | 'CONFIRMED' | 'NEEDS_REVIEW';
  userNote: string | null;
  items: MealItemResponse[];
  aiResult: MealAnalysisResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiJobResponse {
  id: string;
  mealId: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  resultJson: MealAnalysisResult | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
