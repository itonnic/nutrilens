import { ACTIVITY_FACTORS, ActivityLevel, GoalSpeed, GoalType } from './enums';

export interface BmrInput {
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
}

/** Mifflin-St Jeor BMR. For OTHER, average of male+female formula. */
export function calculateBmr({ age, gender, heightCm, weightKg }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === 'MALE') return base + 5;
  if (gender === 'FEMALE') return base - 161;
  return base - 78; // average of +5 and -161
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

const GOAL_ADJUSTMENTS: Record<GoalType, Record<GoalSpeed, number>> = {
  LOSE: { SLOW: -250, BALANCED: -500, AGGRESSIVE: -750 },
  GAIN: { SLOW: 250, BALANCED: 400, AGGRESSIVE: 600 },
  MAINTAIN: { SLOW: 0, BALANCED: 0, AGGRESSIVE: 0 },
  HEALTHIER: { SLOW: 0, BALANCED: 0, AGGRESSIVE: 0 },
};

export function applyGoalAdjustment(
  tdee: number,
  goal: GoalType,
  speed: GoalSpeed = 'BALANCED',
): number {
  return tdee + GOAL_ADJUSTMENTS[goal][speed];
}

export interface MacroSplit {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export const MACRO_PRESETS: Record<'GENERAL' | 'WEIGHT_LOSS' | 'MUSCLE_GAIN', MacroSplit> = {
  GENERAL: { proteinPct: 0.25, carbsPct: 0.45, fatPct: 0.3 },
  WEIGHT_LOSS: { proteinPct: 0.3, carbsPct: 0.4, fatPct: 0.3 },
  MUSCLE_GAIN: { proteinPct: 0.25, carbsPct: 0.5, fatPct: 0.25 },
};

export function presetForGoal(goal: GoalType): MacroSplit {
  if (goal === 'LOSE') return MACRO_PRESETS.WEIGHT_LOSS;
  if (goal === 'GAIN') return MACRO_PRESETS.MUSCLE_GAIN;
  return MACRO_PRESETS.GENERAL;
}

export interface NutritionTargets {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterMl: number;
}

/** Convert calorie target into macro grams. 4 kcal/g protein & carbs, 9 kcal/g fat. */
export function macrosFromCalories(calories: number, split: MacroSplit) {
  return {
    proteinGrams: Math.round((calories * split.proteinPct) / 4),
    carbsGrams: Math.round((calories * split.carbsPct) / 4),
    fatGrams: Math.round((calories * split.fatPct) / 9),
  };
}

export interface ComputeTargetsInput extends BmrInput {
  activityLevel: ActivityLevel;
  goal: GoalType;
  speed?: GoalSpeed;
  macroSplit?: MacroSplit;
}

export function computeNutritionTargets(input: ComputeTargetsInput): NutritionTargets {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, input.activityLevel);
  const calories = Math.round(applyGoalAdjustment(tdee, input.goal, input.speed));
  const split = input.macroSplit ?? presetForGoal(input.goal);
  const macros = macrosFromCalories(calories, split);
  const fiberGrams = Math.max(20, Math.round((calories / 1000) * 14));
  const waterMl = Math.round(input.weightKg * 33);
  return {
    dailyCalories: calories,
    proteinGrams: macros.proteinGrams,
    carbsGrams: macros.carbsGrams,
    fatGrams: macros.fatGrams,
    fiberGrams,
    waterMl,
  };
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterMl: number;
}

export interface BalanceScoreInput {
  totals: DailyTotals;
  targets: NutritionTargets;
}

/** 0-100 daily Balance Score. Weights: 35/25/15/15/10. */
export function calculateBalanceScore({ totals, targets }: BalanceScoreInput): number {
  const calorieAdh = adherence(totals.calories, targets.dailyCalories);
  const proteinAdh = adherence(totals.protein, targets.proteinGrams);
  const fiberAdh = adherence(totals.fiber, targets.fiberGrams);
  const waterAdh = adherence(totals.waterMl, targets.waterMl);
  const macroBalance = balanceComponent(totals, targets);

  const score =
    calorieAdh * 35 + proteinAdh * 25 + fiberAdh * 15 + macroBalance * 15 + waterAdh * 10;
  return Math.round(Math.max(0, Math.min(100, score)));
}

function adherence(actual: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = actual / target;
  if (ratio <= 1) return ratio;
  // overshoot penalty: lose 1 point per 1% over up to 50% over
  return Math.max(0, 1 - (ratio - 1) * 0.5);
}

function balanceComponent(t: DailyTotals, g: NutritionTargets): number {
  const totalCals = t.calories || 1;
  const protPct = (t.protein * 4) / totalCals;
  const carbPct = (t.carbs * 4) / totalCals;
  const fatPct = (t.fat * 9) / totalCals;
  const targetCals = g.dailyCalories || 1;
  const targetProtPct = (g.proteinGrams * 4) / targetCals;
  const targetCarbPct = (g.carbsGrams * 4) / targetCals;
  const targetFatPct = (g.fatGrams * 9) / targetCals;
  const diff =
    Math.abs(protPct - targetProtPct) +
    Math.abs(carbPct - targetCarbPct) +
    Math.abs(fatPct - targetFatPct);
  // diff range ~ 0..2; map to 1..0
  return Math.max(0, 1 - diff);
}

/**
 * Stable, locale-neutral key matching the four `dashboard.*` translations the
 * web ships. Server returns the key — the client translates it. Avoids
 * baking a single language into the dashboard payload.
 */
export type BalanceLabelKey = 'balanced' | 'goodProgress' | 'needsBalance' | 'incompleteTracking';

export function balanceLabel(score: number): BalanceLabelKey {
  if (score >= 85) return 'balanced';
  if (score >= 70) return 'goodProgress';
  if (score >= 50) return 'needsBalance';
  return 'incompleteTracking';
}
