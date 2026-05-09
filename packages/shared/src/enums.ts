export const MealType = {
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  SNACK: 'SNACK',
  DRINK: 'DRINK',
} as const;
export type MealType = (typeof MealType)[keyof typeof MealType];
export const MEAL_TYPES = Object.values(MealType);

export const MealSource = {
  AI: 'AI',
  MANUAL: 'MANUAL',
  BARCODE: 'BARCODE',
  RECIPE: 'RECIPE',
} as const;
export type MealSource = (typeof MealSource)[keyof typeof MealSource];

export const MealStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;
export type MealStatus = (typeof MealStatus)[keyof typeof MealStatus];

export const ActivityLevel = {
  SEDENTARY: 'SEDENTARY',
  LIGHT: 'LIGHT',
  MODERATE: 'MODERATE',
  ACTIVE: 'ACTIVE',
  VERY_ACTIVE: 'VERY_ACTIVE',
} as const;
export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

export const GoalType = {
  LOSE: 'LOSE',
  MAINTAIN: 'MAINTAIN',
  GAIN: 'GAIN',
  HEALTHIER: 'HEALTHIER',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GoalSpeed = {
  SLOW: 'SLOW',
  BALANCED: 'BALANCED',
  AGGRESSIVE: 'AGGRESSIVE',
} as const;
export type GoalSpeed = (typeof GoalSpeed)[keyof typeof GoalSpeed];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const UnitSystem = {
  METRIC: 'METRIC',
  IMPERIAL: 'IMPERIAL',
} as const;
export type UnitSystem = (typeof UnitSystem)[keyof typeof UnitSystem];

export const DietaryPreference = {
  VEGETARIAN: 'VEGETARIAN',
  VEGAN: 'VEGAN',
  LOW_CARB: 'LOW_CARB',
  HIGH_PROTEIN: 'HIGH_PROTEIN',
  GLUTEN_FREE: 'GLUTEN_FREE',
  LACTOSE_FREE: 'LACTOSE_FREE',
} as const;
export type DietaryPreference = (typeof DietaryPreference)[keyof typeof DietaryPreference];

export const AiJobStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;
export type AiJobStatus = (typeof AiJobStatus)[keyof typeof AiJobStatus];

export const FoodUnit = {
  G: 'g',
  ML: 'ml',
  PIECE: 'piece',
  TBSP: 'tbsp',
  CUP: 'cup',
  SERVING: 'serving',
} as const;
export type FoodUnit = (typeof FoodUnit)[keyof typeof FoodUnit];
