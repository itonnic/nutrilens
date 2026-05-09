import type { MealResponse } from './meals';

export interface DailyDashboardResponse {
  date: string;
  targets: {
    dailyCalories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
    waterMl: number;
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    waterMl: number;
  };
  remaining: {
    calories: number;
  };
  balanceScore: number;
  balanceLabel: string;
  meals: MealResponse[];
  insight: string | null;
}

export interface WeeklyDashboardDay {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  proteinTargetHit: boolean;
  calorieTargetHit: boolean;
  meals: number;
}

export interface WeeklyDashboardResponse {
  start: string;
  end: string;
  days: WeeklyDashboardDay[];
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  proteinTargetHitDays: number;
  calorieTargetHitDays: number;
  bestDay: string | null;
  highestCalorieDay: string | null;
  missedDays: number;
  insight: string;
}

export interface MonthlyDashboardDay {
  date: string;
  calories: number;
  score: number;
  hasTracking: boolean;
}

export interface MonthlyDashboardResponse {
  month: string;
  days: MonthlyDashboardDay[];
  averageCalories: number;
  averageProtein: number;
  daysTracked: number;
  topFoods: { name: string; count: number }[];
  weightTrend: { date: string; weightKg: number }[];
  insight: string;
}
