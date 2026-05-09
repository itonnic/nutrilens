import {
  applyGoalAdjustment,
  balanceLabel,
  calculateBalanceScore,
  calculateBmr,
  calculateTdee,
  computeNutritionTargets,
  macrosFromCalories,
  presetForGoal,
} from '@nutrilens/shared';

/**
 * Math sanity tests so a stray edit to the nutrition formulas can't silently
 * change the calorie target every user sees on their dashboard.
 */
describe('nutrition math', () => {
  describe('calculateBmr (Mifflin-St Jeor)', () => {
    it('matches the canonical example for a male', () => {
      // 35y MALE 180cm 85kg → 10*85 + 6.25*180 - 5*35 + 5 = 1805
      expect(calculateBmr({ age: 35, gender: 'MALE', heightCm: 180, weightKg: 85 })).toBe(1805);
    });

    it('matches the canonical example for a female', () => {
      // 28y FEMALE 168cm 65kg → 10*65 + 6.25*168 - 5*28 - 161 = 1399
      expect(calculateBmr({ age: 28, gender: 'FEMALE', heightCm: 168, weightKg: 65 })).toBe(1399);
    });

    it('uses the average offset for OTHER gender', () => {
      // Same body as MALE example but average offset (-78) → 10*85 + 6.25*180 - 5*35 - 78 = 1722
      expect(calculateBmr({ age: 35, gender: 'OTHER', heightCm: 180, weightKg: 85 })).toBe(1722);
    });
  });

  describe('calculateTdee', () => {
    it('multiplies BMR by the activity factor', () => {
      expect(calculateTdee(1805, 'SEDENTARY')).toBeCloseTo(2166, 0);
      expect(calculateTdee(1805, 'MODERATE')).toBeCloseTo(2797.75, 1);
      expect(calculateTdee(1805, 'VERY_ACTIVE')).toBeCloseTo(3429.5, 1);
    });
  });

  describe('applyGoalAdjustment', () => {
    it('subtracts 500 for balanced weight loss', () => {
      expect(applyGoalAdjustment(2166, 'LOSE', 'BALANCED')).toBe(1666);
    });

    it('adds 400 for balanced gain', () => {
      expect(applyGoalAdjustment(2166, 'GAIN', 'BALANCED')).toBe(2566);
    });

    it('leaves maintain unchanged', () => {
      expect(applyGoalAdjustment(2166, 'MAINTAIN', 'BALANCED')).toBe(2166);
    });

    it('uses aggressive deltas', () => {
      expect(applyGoalAdjustment(2000, 'LOSE', 'AGGRESSIVE')).toBe(1250);
      expect(applyGoalAdjustment(2000, 'GAIN', 'AGGRESSIVE')).toBe(2600);
    });
  });

  describe('macrosFromCalories', () => {
    it('uses 4/4/9 kcal-per-gram conversions', () => {
      const split = presetForGoal('GAIN');
      const macros = macrosFromCalories(2566, split);
      // Muscle gain preset: protein 25%, carbs 50%, fat 25%
      expect(macros.proteinGrams).toBe(Math.round((2566 * 0.25) / 4));
      expect(macros.carbsGrams).toBe(Math.round((2566 * 0.5) / 4));
      expect(macros.fatGrams).toBe(Math.round((2566 * 0.25) / 9));
    });
  });

  describe('computeNutritionTargets', () => {
    it('produces deterministic output for a known user (LOSE/BALANCED)', () => {
      const t = computeNutritionTargets({
        age: 28,
        gender: 'FEMALE',
        heightCm: 168,
        weightKg: 65,
        activityLevel: 'MODERATE',
        goal: 'LOSE',
        speed: 'BALANCED',
      });
      // BMR 1399 × 1.55 = 2168.45 → -500 → 1668
      expect(t.dailyCalories).toBe(1668);
      // weight loss preset: 30/40/30
      expect(t.proteinGrams).toBe(Math.round((1668 * 0.3) / 4));
      expect(t.carbsGrams).toBe(Math.round((1668 * 0.4) / 4));
      expect(t.fatGrams).toBe(Math.round((1668 * 0.3) / 9));
      expect(t.waterMl).toBe(Math.round(65 * 33));
      expect(t.fiberGrams).toBeGreaterThanOrEqual(20);
    });

    it('lifts the calorie target when switching from LOSE to GAIN', () => {
      const base = {
        age: 28,
        gender: 'FEMALE',
        heightCm: 168,
        weightKg: 65,
        activityLevel: 'MODERATE',
        speed: 'BALANCED',
      } as const;
      const lose = computeNutritionTargets({ ...base, goal: 'LOSE' });
      const gain = computeNutritionTargets({ ...base, goal: 'GAIN' });
      // LOSE -500, GAIN +400 → swap = +900
      expect(gain.dailyCalories - lose.dailyCalories).toBe(900);
    });
  });

  describe('calculateBalanceScore', () => {
    const targets = {
      dailyCalories: 2000,
      proteinGrams: 120,
      carbsGrams: 250,
      fatGrams: 65,
      fiberGrams: 30,
      waterMl: 2500,
    };

    it('is 0 when nothing is logged', () => {
      const score = calculateBalanceScore({
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, waterMl: 0 },
        targets,
      });
      expect(score).toBe(0);
    });

    it('approaches 100 when targets are perfectly hit', () => {
      const score = calculateBalanceScore({
        totals: {
          calories: 2000,
          protein: 120,
          carbs: 250,
          fat: 65,
          fiber: 30,
          waterMl: 2500,
        },
        targets,
      });
      expect(score).toBeGreaterThanOrEqual(95);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('is bounded to [0, 100]', () => {
      const score = calculateBalanceScore({
        totals: {
          calories: 99999,
          protein: 99999,
          carbs: 99999,
          fat: 99999,
          fiber: 99999,
          waterMl: 99999,
        },
        targets,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('balanceLabel', () => {
    it('uses the documented thresholds', () => {
      expect(balanceLabel(95)).toBe('Balanced day');
      expect(balanceLabel(85)).toBe('Balanced day');
      expect(balanceLabel(70)).toBe('Good progress');
      expect(balanceLabel(50)).toBe('Needs balance');
      expect(balanceLabel(0)).toBe('Incomplete tracking');
    });
  });
});
