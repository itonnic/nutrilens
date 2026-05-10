import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  balanceLabel,
  calculateBalanceScore,
  type DailyDashboardResponse,
  type MealResponse,
  type MonthlyDashboardResponse,
  type WeeklyDashboardResponse,
} from '@nutrilens/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsService } from '../ai/insights.service';

const DAILY_CACHE_TTL_MS = 30_000;

interface DailyCacheEntry {
  expiresAt: number;
  payload: DailyDashboardResponse;
}

@Injectable()
export class DashboardService {
  /**
   * Per-(user,date) micro cache for the daily dashboard.
   * 30s TTL strikes a balance between freshness and avoiding repeated
   * aggregations on dashboard-poll patterns. Invalidated on writes via
   * `invalidateDailyForUser` (called from MealsService / WaterService).
   */
  private dailyCache = new Map<string, DailyCacheEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: InsightsService,
  ) {}

  invalidateDailyForUser(userId: string): void {
    for (const key of this.dailyCache.keys()) {
      if (key.startsWith(`${userId}:`)) this.dailyCache.delete(key);
    }
  }

  async daily(userId: string, dateIso: string, locale?: string): Promise<DailyDashboardResponse> {
    const dayKey = isoYmd(dateIso);
    // Locale is part of the cache key — the only locale-dependent field on
    // the response is `insight`, so two users on the same day with different
    // languages must each get their own slot.
    const cacheKey = `${userId}:${dayKey}:${locale ?? 'en'}`;
    const cached = this.dailyCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.payload;
    }
    const payload = await this.computeDaily(userId, dateIso, locale);
    this.dailyCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + DAILY_CACHE_TTL_MS,
    });
    return payload;
  }

  private async computeDaily(
    userId: string,
    dateIso: string,
    locale?: string,
  ): Promise<DailyDashboardResponse> {
    const targets = await this.prisma.nutritionTarget.findUnique({ where: { userId } });
    if (!targets) throw new NotFoundException('Complete onboarding first');

    const { start, end } = dayBounds(dateIso);
    const [meals, water] = await Promise.all([
      this.prisma.meal.findMany({
        where: { userId, consumedAt: { gte: start, lt: end }, status: 'CONFIRMED' },
        orderBy: { consumedAt: 'asc' },
        include: { items: true },
      }),
      this.prisma.waterEntry.aggregate({
        _sum: { amountMl: true },
        where: { userId, loggedAt: { gte: start, lt: end } },
      }),
    ]);

    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat,
        fiber: acc.fiber + (m.fiber ?? 0),
        waterMl: 0,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0 },
    );
    totals.waterMl = water._sum.amountMl ?? 0;

    const targetsOut = {
      dailyCalories: targets.dailyCalories,
      proteinGrams: targets.proteinGrams,
      carbsGrams: targets.carbsGrams,
      fatGrams: targets.fatGrams,
      fiberGrams: targets.fiberGrams,
      waterMl: targets.waterMl,
    };

    const score = calculateBalanceScore({ totals, targets: targetsOut });
    // also include unconfirmed meals (DRAFT/NEEDS_REVIEW) so the user sees them — but they don't count in totals
    const unconfirmed = await this.prisma.meal.findMany({
      where: { userId, consumedAt: { gte: start, lt: end }, status: { in: ['DRAFT', 'NEEDS_REVIEW'] } },
      orderBy: { consumedAt: 'asc' },
      include: { items: true },
    });

    const allMeals: MealResponse[] = [...meals, ...unconfirmed]
      .sort((a, b) => a.consumedAt.getTime() - b.consumedAt.getTime())
      .map((m) => mealToResponse(m));

    // If only draft/review meals exist, avoid showing the contradictory
    // "no meals logged" insight while the pending meal is visibly listed.
    const insight = meals.length === 0 && allMeals.length > 0
      ? null
      : this.insights.daily(totals, targetsOut, locale);

    return {
      date: start.toISOString().slice(0, 10),
      targets: targetsOut,
      totals,
      remaining: { calories: Math.round(targetsOut.dailyCalories - totals.calories) },
      balanceScore: score,
      balanceLabel: balanceLabel(score),
      meals: allMeals,
      insight,
    };
  }

  async weekly(
    userId: string,
    startDateIso: string,
    locale?: string,
  ): Promise<WeeklyDashboardResponse> {
    const targets = await this.prisma.nutritionTarget.findUnique({ where: { userId } });
    if (!targets) throw new NotFoundException('Complete onboarding first');

    const { start } = dayBounds(startDateIso);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);

    const meals = await this.prisma.meal.findMany({
      where: { userId, consumedAt: { gte: start, lt: end }, status: 'CONFIRMED' },
      orderBy: { consumedAt: 'asc' },
    });

    const days: WeeklyDashboardResponse['days'] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + 1);
      const dayMeals = meals.filter((m) => m.consumedAt >= d && m.consumedAt < next);
      const day = dayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          carbs: acc.carbs + m.carbs,
          fat: acc.fat + m.fat,
          fiber: acc.fiber + (m.fiber ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );
      days.push({
        date: d.toISOString().slice(0, 10),
        ...day,
        proteinTargetHit: day.protein >= targets.proteinGrams * 0.9,
        calorieTargetHit:
          day.calories >= targets.dailyCalories * 0.9 && day.calories <= targets.dailyCalories * 1.1,
        meals: dayMeals.length,
      });
    }

    const trackedDays = days.filter((d) => d.meals > 0);
    const sumOf = (k: keyof typeof days[number]): number =>
      trackedDays.reduce((s, d) => s + (d[k] as number), 0);
    const averages = trackedDays.length
      ? {
          calories: Math.round(sumOf('calories') / trackedDays.length),
          protein: Math.round(sumOf('protein') / trackedDays.length),
          carbs: Math.round(sumOf('carbs') / trackedDays.length),
          fat: Math.round(sumOf('fat') / trackedDays.length),
          fiber: Math.round(sumOf('fiber') / trackedDays.length),
        }
      : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    const proteinTargetHitDays = days.filter((d) => d.proteinTargetHit).length;
    const calorieTargetHitDays = days.filter((d) => d.calorieTargetHit).length;
    const missedDays = days.filter((d) => d.meals === 0).length;
    const bestDay = trackedDays
      .filter((d) => d.proteinTargetHit && d.calorieTargetHit)
      .map((d) => d.date)[0] ?? null;
    const highestCalorieDay =
      trackedDays.length === 0
        ? null
        : trackedDays.reduce((a, b) => (a.calories > b.calories ? a : b)).date;

    const insight = this.insights.weekly({
      averageCalories: averages.calories,
      proteinTargetHitDays,
      missedDays,
      targets: {
        dailyCalories: targets.dailyCalories,
        proteinGrams: targets.proteinGrams,
        carbsGrams: targets.carbsGrams,
        fatGrams: targets.fatGrams,
        fiberGrams: targets.fiberGrams,
        waterMl: targets.waterMl,
      },
      locale,
    });

    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      days,
      averages,
      proteinTargetHitDays,
      calorieTargetHitDays,
      bestDay,
      highestCalorieDay,
      missedDays,
      insight,
    };
  }

  async monthly(
    userId: string,
    monthStr: string,
    locale?: string,
  ): Promise<MonthlyDashboardResponse> {
    // Strict YYYY-MM parsing — JS Date silently rolls over (month=13 becomes Jan of next year)
    // so we have to validate the components ourselves before creating any Date objects.
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthStr);
    if (!match) {
      throw new BadRequestException(
        'Invalid month — expected format YYYY-MM (e.g. 2025-03), with month between 01 and 12.',
      );
    }
    const year = Number(match[1]);
    const monIdx = Number(match[2]) - 1;
    const start = new Date(Date.UTC(year, monIdx, 1));
    const end = new Date(Date.UTC(year, monIdx + 1, 1));
    const daysInMonth = new Date(Date.UTC(year, monIdx + 1, 0)).getUTCDate();

    const [meals, weights, targets] = await Promise.all([
      this.prisma.meal.findMany({
        where: { userId, consumedAt: { gte: start, lt: end }, status: 'CONFIRMED' },
        include: { items: true },
      }),
      this.prisma.weightEntry.findMany({
        where: { userId, loggedAt: { gte: start, lt: end } },
        orderBy: { loggedAt: 'asc' },
      }),
      this.prisma.nutritionTarget.findUnique({ where: { userId } }),
    ]);

    if (!targets) throw new NotFoundException('Complete onboarding first');

    const targetsOut = {
      dailyCalories: targets.dailyCalories,
      proteinGrams: targets.proteinGrams,
      carbsGrams: targets.carbsGrams,
      fatGrams: targets.fatGrams,
      fiberGrams: targets.fiberGrams,
      waterMl: targets.waterMl,
    };

    const days: MonthlyDashboardResponse['days'] = [];
    let totalCals = 0;
    let totalProtein = 0;
    let trackedDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStart = new Date(Date.UTC(year, monIdx, d));
      const dayEnd = new Date(Date.UTC(year, monIdx, d + 1));
      const dayMeals = meals.filter((m) => m.consumedAt >= dayStart && m.consumedAt < dayEnd);
      const dayTotals = dayMeals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          carbs: acc.carbs + m.carbs,
          fat: acc.fat + m.fat,
          fiber: acc.fiber + (m.fiber ?? 0),
          waterMl: 0,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0 },
      );
      const score = calculateBalanceScore({ totals: dayTotals, targets: targetsOut });
      const hasTracking = dayMeals.length > 0;
      if (hasTracking) {
        trackedDays += 1;
        totalCals += dayTotals.calories;
        totalProtein += dayTotals.protein;
      }
      days.push({
        date: dayStart.toISOString().slice(0, 10),
        calories: Math.round(dayTotals.calories),
        score,
        hasTracking,
      });
    }

    // top foods: count item.name across meals
    const itemCounts = new Map<string, number>();
    for (const meal of meals) {
      for (const item of meal.items) {
        const k = item.name.toLowerCase();
        itemCounts.set(k, (itemCounts.get(k) ?? 0) + 1);
      }
    }
    const topFoods = Array.from(itemCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const insight = this.insights.monthly({
      daysTracked: trackedDays,
      averageCalories: trackedDays ? totalCals / trackedDays : 0,
      locale,
    });

    return {
      month: monthStr,
      days,
      averageCalories: trackedDays ? Math.round(totalCals / trackedDays) : 0,
      averageProtein: trackedDays ? Math.round(totalProtein / trackedDays) : 0,
      daysTracked: trackedDays,
      topFoods,
      weightTrend: weights.map((w) => ({
        date: w.loggedAt.toISOString().slice(0, 10),
        weightKg: w.weightKg,
      })),
      insight,
    };
  }
}

function dayBounds(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException('Invalid date — expected ISO format like 2025-03-15.');
  }
  const start = new Date(d);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function isoYmd(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function mealToResponse(meal: {
  id: string;
  userId: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'DRINK';
  title: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  consumedAt: Date;
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
  aiRawJson: unknown;
  items: {
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
  }[];
  createdAt: Date;
  updatedAt: Date;
}): MealResponse {
  const ai = meal.aiRawJson;
  const aiResult =
    ai && typeof ai === 'object' && 'mealTitle' in (ai as object)
      ? ((ai as unknown) as MealResponse['aiResult'])
      : null;
  return {
    id: meal.id,
    userId: meal.userId,
    mealType: meal.mealType,
    title: meal.title,
    imageUrl: meal.imageUrl,
    thumbnailUrl: meal.thumbnailUrl,
    consumedAt: meal.consumedAt.toISOString(),
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber,
    sugar: meal.sugar,
    sodium: meal.sodium,
    confidence: meal.confidence,
    source: meal.source,
    status: meal.status,
    userNote: meal.userNote,
    aiResult,
    items: meal.items,
    createdAt: meal.createdAt.toISOString(),
    updatedAt: meal.updatedAt.toISOString(),
  };
}
