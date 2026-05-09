import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import type { MealAnalysisResult } from '@nutrilens/shared';
import type { AnalyzeMealInput, MealVisionAnalyzer } from './types';

/**
 * Deterministic mock analyzer for local dev.
 * Picks a fixture meal based on a hash of the image URL so repeats look stable,
 * but different images produce different fixtures.
 */
@Injectable()
export class MockMealAnalyzer implements MealVisionAnalyzer {
  readonly name = 'mock';

  private readonly fixtures: MealAnalysisResult[] = [
    {
      mealTitle: 'Grilled chicken salad with avocado',
      mealType: 'lunch',
      confidence: 0.78,
      imageQuality: { score: 0.85, issues: [] },
      detectedItems: [
        {
          name: 'Grilled chicken breast',
          category: 'protein',
          estimatedQuantity: 150,
          unit: 'g',
          portionConfidence: 0.7,
          visible: true,
          preparationMethod: 'grilled',
          assumptions: ['Estimated as plain grilled, no breading'],
          nutrition: { calories: 247, protein: 46, carbs: 0, fat: 5, fiber: 0, sugar: 0, sodium: 110 },
        },
        {
          name: 'Mixed greens',
          category: 'vegetable',
          estimatedQuantity: 80,
          unit: 'g',
          portionConfidence: 0.65,
          visible: true,
          assumptions: [],
          nutrition: { calories: 16, protein: 1.4, carbs: 2.5, fat: 0.2, fiber: 1.6, sugar: 0.6, sodium: 22 },
        },
        {
          name: 'Avocado',
          category: 'fat',
          estimatedQuantity: 70,
          unit: 'g',
          portionConfidence: 0.72,
          visible: true,
          assumptions: ['Half avocado'],
          nutrition: { calories: 112, protein: 1.4, carbs: 6, fat: 10, fiber: 4.7, sugar: 0.4, sodium: 5 },
        },
        {
          name: 'Cherry tomatoes',
          category: 'vegetable',
          estimatedQuantity: 60,
          unit: 'g',
          portionConfidence: 0.6,
          visible: true,
          assumptions: [],
          nutrition: { calories: 11, protein: 0.5, carbs: 2.4, fat: 0.1, fiber: 0.7, sugar: 1.6, sodium: 3 },
        },
        {
          name: 'Olive oil dressing',
          category: 'fat',
          estimatedQuantity: 1,
          unit: 'tbsp',
          portionConfidence: 0.45,
          visible: false,
          assumptions: ['Estimated 1 tbsp; oil amount is hard to see'],
          nutrition: { calories: 119, protein: 0, carbs: 0, fat: 13.5, fiber: 0, sugar: 0, sodium: 0 },
        },
      ],
      totals: { calories: 505, protein: 49.3, carbs: 10.9, fat: 28.8, fiber: 7, sugar: 2.6, sodium: 140 },
      assumptions: [
        'Dressing estimated as 1 tbsp olive oil',
        'Portion size estimated from plate area',
      ],
      warnings: ['Dressing/oil amount is uncertain'],
      suggestions: ['High protein, moderate fat — a great choice for satiety'],
    },
    {
      mealTitle: 'Spaghetti bolognese',
      mealType: 'dinner',
      confidence: 0.82,
      imageQuality: { score: 0.9, issues: [] },
      detectedItems: [
        {
          name: 'Spaghetti (cooked)',
          category: 'carb',
          estimatedQuantity: 220,
          unit: 'g',
          portionConfidence: 0.6,
          visible: true,
          preparationMethod: 'boiled',
          assumptions: ['Approx 220g cooked'],
          nutrition: { calories: 348, protein: 12.6, carbs: 70.4, fat: 1.5, fiber: 4.2, sugar: 1.6, sodium: 4 },
        },
        {
          name: 'Bolognese sauce',
          category: 'mixed',
          estimatedQuantity: 180,
          unit: 'g',
          portionConfidence: 0.55,
          visible: true,
          assumptions: ['Tomato + ground beef sauce'],
          nutrition: { calories: 248, protein: 16.4, carbs: 9, fat: 15.4, fiber: 2.1, sugar: 5.6, sodium: 460 },
        },
        {
          name: 'Parmesan cheese',
          category: 'dairy',
          estimatedQuantity: 12,
          unit: 'g',
          portionConfidence: 0.5,
          visible: true,
          assumptions: ['Sprinkled on top'],
          nutrition: { calories: 47, protein: 4.3, carbs: 0.4, fat: 3.1, fiber: 0, sugar: 0.1, sodium: 187 },
        },
      ],
      totals: { calories: 643, protein: 33.3, carbs: 79.8, fat: 20, fiber: 6.3, sugar: 7.3, sodium: 651 },
      assumptions: ['Pasta portion estimated at 220g cooked', 'Sauce composition assumed standard'],
      warnings: ['Pasta portion size has moderate uncertainty'],
      suggestions: ['Consider lighter sides if your goal is weight loss'],
    },
    {
      mealTitle: 'Greek yogurt with berries and granola',
      mealType: 'breakfast',
      confidence: 0.88,
      imageQuality: { score: 0.92, issues: [] },
      detectedItems: [
        {
          name: 'Greek yogurt (plain, low fat)',
          category: 'dairy',
          estimatedQuantity: 200,
          unit: 'g',
          portionConfidence: 0.78,
          visible: true,
          assumptions: [],
          nutrition: { calories: 118, protein: 20, carbs: 7.2, fat: 1, fiber: 0, sugar: 7.2, sodium: 70 },
        },
        {
          name: 'Mixed berries',
          category: 'fruit',
          estimatedQuantity: 80,
          unit: 'g',
          portionConfidence: 0.72,
          visible: true,
          assumptions: ['Strawberries + blueberries'],
          nutrition: { calories: 41, protein: 0.6, carbs: 9.5, fat: 0.3, fiber: 2.4, sugar: 6.7, sodium: 1 },
        },
        {
          name: 'Granola',
          category: 'carb',
          estimatedQuantity: 30,
          unit: 'g',
          portionConfidence: 0.6,
          visible: true,
          assumptions: ['Standard sweetened granola'],
          nutrition: { calories: 142, protein: 3.5, carbs: 21.3, fat: 5.4, fiber: 2.4, sugar: 9, sodium: 24 },
        },
        {
          name: 'Honey',
          category: 'sweetener',
          estimatedQuantity: 1,
          unit: 'tbsp',
          portionConfidence: 0.4,
          visible: false,
          assumptions: ['Possibly drizzled, ~1 tbsp'],
          nutrition: { calories: 64, protein: 0.1, carbs: 17.3, fat: 0, fiber: 0, sugar: 17.2, sodium: 1 },
        },
      ],
      totals: { calories: 365, protein: 24.2, carbs: 55.3, fat: 6.7, fiber: 4.8, sugar: 40.1, sodium: 96 },
      assumptions: ['Honey amount uncertain'],
      warnings: ['Sugar is on the higher side due to fruit + granola + honey'],
      suggestions: ['Excellent protein for breakfast — sets up the day well'],
    },
    {
      mealTitle: 'Coffee with milk',
      mealType: 'drink',
      confidence: 0.92,
      imageQuality: { score: 0.95, issues: [] },
      detectedItems: [
        {
          name: 'Brewed coffee',
          category: 'beverage',
          estimatedQuantity: 200,
          unit: 'ml',
          portionConfidence: 0.85,
          visible: true,
          assumptions: [],
          nutrition: { calories: 4, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5 },
        },
        {
          name: 'Whole milk',
          category: 'dairy',
          estimatedQuantity: 60,
          unit: 'ml',
          portionConfidence: 0.6,
          visible: true,
          assumptions: ['Splash of milk'],
          nutrition: { calories: 37, protein: 1.9, carbs: 2.9, fat: 2, fiber: 0, sugar: 3, sodium: 26 },
        },
      ],
      totals: { calories: 41, protein: 2.2, carbs: 2.9, fat: 2, fiber: 0, sugar: 3, sodium: 31 },
      assumptions: ['Milk type assumed whole'],
      warnings: [],
      suggestions: [],
    },
  ];

  async analyzeMeal(input: AnalyzeMealInput): Promise<MealAnalysisResult> {
    const seed = createHash('sha256').update(input.imageUrl).digest();
    const idx = seed.readUInt32BE(0) % this.fixtures.length;
    // simulate latency
    await new Promise((r) => setTimeout(r, 1200));
    const fixture: MealAnalysisResult = JSON.parse(JSON.stringify(this.fixtures[idx]));

    // Respect user-provided meal type so the result lines up with what the
    // user actually selected on upload.
    if (input.mealType) {
      const t = input.mealType.toLowerCase();
      if (
        t === 'breakfast' ||
        t === 'lunch' ||
        t === 'dinner' ||
        t === 'snack' ||
        t === 'drink'
      ) {
        fixture.mealType = t;
      }
    }

    // Honour a small set of natural-language hints in the user note so the
    // mock feels somewhat reactive to feedback.
    if (input.userNote) {
      const note = input.userNote.toLowerCase();
      const half = /\b(half|half\s+portion|half-portion|1\/2)\b/.test(note);
      const double = /\b(double|big|large|extra\s+large|2x)\b/.test(note);
      const noSauce = /\b(no\s+(sauce|dressing|oil)|without\s+(sauce|dressing|oil))\b/.test(note);

      const scale = half ? 0.5 : double ? 2 : 1;
      if (scale !== 1) {
        for (const item of fixture.detectedItems) {
          item.estimatedQuantity = round1(item.estimatedQuantity * scale);
          item.nutrition = scaleNutrition(item.nutrition, scale);
          item.assumptions = [...item.assumptions, `User note: scaled portion x${scale}`];
        }
        fixture.totals = scaleNutrition(fixture.totals, scale);
        fixture.assumptions = [...fixture.assumptions, `Portion scaled by user note (x${scale}).`];
      }

      if (noSauce) {
        const before = fixture.detectedItems.length;
        fixture.detectedItems = fixture.detectedItems.filter(
          (it) => !/dressing|oil|sauce/i.test(it.name),
        );
        if (fixture.detectedItems.length !== before) {
          fixture.totals = sumNutrition(fixture.detectedItems.map((it) => it.nutrition));
          fixture.assumptions = [
            ...fixture.assumptions,
            'Sauce/oil removed per user note.',
          ];
        }
      }
    }

    return fixture;
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function scaleNutrition(
  n: MealAnalysisResult['totals'],
  s: number,
): MealAnalysisResult['totals'] {
  const apply = (v: number | undefined) =>
    v === undefined ? undefined : round1(v * s);
  return {
    calories: round1(n.calories * s),
    protein: round1(n.protein * s),
    carbs: round1(n.carbs * s),
    fat: round1(n.fat * s),
    fiber: apply(n.fiber),
    sugar: apply(n.sugar),
    sodium: apply(n.sodium),
  };
}

function sumNutrition(
  parts: MealAnalysisResult['totals'][],
): MealAnalysisResult['totals'] {
  const acc = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };
  for (const p of parts) {
    acc.calories += p.calories;
    acc.protein += p.protein;
    acc.carbs += p.carbs;
    acc.fat += p.fat;
    acc.fiber += p.fiber ?? 0;
    acc.sugar += p.sugar ?? 0;
    acc.sodium += p.sodium ?? 0;
  }
  return {
    calories: round1(acc.calories),
    protein: round1(acc.protein),
    carbs: round1(acc.carbs),
    fat: round1(acc.fat),
    fiber: round1(acc.fiber),
    sugar: round1(acc.sugar),
    sodium: round1(acc.sodium),
  };
}
