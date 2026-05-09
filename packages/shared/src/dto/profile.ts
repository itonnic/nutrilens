import { z } from 'zod';

export const OnboardingSchema = z.object({
  age: z.number().int().min(10).max(120),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable(),
  heightCm: z.number().min(100).max(260),
  weightKg: z.number().min(30).max(400),
  activityLevel: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']),
  goalType: z.enum(['LOSE', 'MAINTAIN', 'GAIN', 'HEALTHIER']),
  goalSpeed: z.enum(['SLOW', 'BALANCED', 'AGGRESSIVE']).default('BALANCED'),
  targetWeightKg: z.number().min(30).max(400).optional().nullable(),
  dietaryPreferences: z
    .array(
      z.enum([
        'VEGETARIAN',
        'VEGAN',
        'LOW_CARB',
        'HIGH_PROTEIN',
        'GLUTEN_FREE',
        'LACTOSE_FREE',
      ]),
    )
    .default([]),
  customDietNotes: z.string().max(500).optional().nullable(),
  unitSystem: z.enum(['METRIC', 'IMPERIAL']).default('METRIC'),
  timezone: z.string().default('UTC'),
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export const UpdateProfileSchema = OnboardingSchema.partial();
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const NutritionTargetsSchema = z.object({
  dailyCalories: z.number().int().min(800).max(8000),
  proteinGrams: z.number().int().min(0).max(500),
  carbsGrams: z.number().int().min(0).max(1000),
  fatGrams: z.number().int().min(0).max(400),
  fiberGrams: z.number().int().min(0).max(200),
  waterMl: z.number().int().min(0).max(8000),
});
export type NutritionTargetsInput = z.infer<typeof NutritionTargetsSchema>;

export interface ProfileResponse {
  id: string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE' | null;
  goalType: 'LOSE' | 'MAINTAIN' | 'GAIN' | 'HEALTHIER' | null;
  goalSpeed: 'SLOW' | 'BALANCED' | 'AGGRESSIVE' | null;
  targetWeightKg: number | null;
  dietaryPreferences: string[];
  customDietNotes: string | null;
  unitSystem: 'METRIC' | 'IMPERIAL';
  timezone: string;
  hasOnboarded: boolean;
  targets: {
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    waterMl: number;
  } | null;
}
