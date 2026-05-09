import { z } from 'zod';

export const FoodUnitSchema = z.enum(['g', 'ml', 'piece', 'tbsp', 'cup', 'serving']);

export const MealTypeOutputSchema = z.enum([
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'drink',
  'unknown',
]);

export const NutritionValuesSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional(),
  sugar: z.number().nonnegative().optional(),
  sodium: z.number().nonnegative().optional(),
});
export type NutritionValues = z.infer<typeof NutritionValuesSchema>;

export const DetectedItemSchema = z.object({
  name: z.string(),
  category: z.string(),
  estimatedQuantity: z.number().nonnegative(),
  unit: FoodUnitSchema,
  portionConfidence: z.number().min(0).max(1),
  visible: z.boolean(),
  preparationMethod: z.string().optional(),
  assumptions: z.array(z.string()).default([]),
  nutrition: NutritionValuesSchema,
});
export type DetectedItem = z.infer<typeof DetectedItemSchema>;

export const MealAnalysisResultSchema = z.object({
  mealTitle: z.string(),
  mealType: MealTypeOutputSchema,
  confidence: z.number().min(0).max(1),
  imageQuality: z.object({
    score: z.number().min(0).max(1),
    issues: z.array(z.string()).default([]),
  }),
  detectedItems: z.array(DetectedItemSchema),
  totals: NutritionValuesSchema,
  assumptions: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});
export type MealAnalysisResult = z.infer<typeof MealAnalysisResultSchema>;

/**
 * JSON Schema for OpenAI Structured Outputs.
 * Hand-written so we can pass it to OpenAI without zod-to-json-schema dep.
 */
export const MEAL_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mealTitle',
    'mealType',
    'confidence',
    'imageQuality',
    'detectedItems',
    'totals',
    'assumptions',
    'warnings',
    'suggestions',
  ],
  properties: {
    mealTitle: { type: 'string' },
    mealType: {
      type: 'string',
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'unknown'],
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    imageQuality: {
      type: 'object',
      additionalProperties: false,
      required: ['score', 'issues'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 1 },
        issues: { type: 'array', items: { type: 'string' } },
      },
    },
    detectedItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'name',
          'category',
          'estimatedQuantity',
          'unit',
          'portionConfidence',
          'visible',
          'assumptions',
          'nutrition',
        ],
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          estimatedQuantity: { type: 'number', minimum: 0 },
          unit: {
            type: 'string',
            enum: ['g', 'ml', 'piece', 'tbsp', 'cup', 'serving'],
          },
          portionConfidence: { type: 'number', minimum: 0, maximum: 1 },
          visible: { type: 'boolean' },
          preparationMethod: { type: 'string' },
          assumptions: { type: 'array', items: { type: 'string' } },
          nutrition: { $ref: '#/$defs/nutrition' },
        },
      },
    },
    totals: { $ref: '#/$defs/nutrition' },
    assumptions: { type: 'array', items: { type: 'string' } },
    warnings: { type: 'array', items: { type: 'string' } },
    suggestions: { type: 'array', items: { type: 'string' } },
  },
  $defs: {
    nutrition: {
      type: 'object',
      additionalProperties: false,
      required: ['calories', 'protein', 'carbs', 'fat'],
      properties: {
        calories: { type: 'number', minimum: 0 },
        protein: { type: 'number', minimum: 0 },
        carbs: { type: 'number', minimum: 0 },
        fat: { type: 'number', minimum: 0 },
        fiber: { type: 'number', minimum: 0 },
        sugar: { type: 'number', minimum: 0 },
        sodium: { type: 'number', minimum: 0 },
      },
    },
  },
} as const;
