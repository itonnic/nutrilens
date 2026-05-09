'use client';

import * as React from 'react';
import { useRouter } from '@/i18n/routing';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  Droplet,
  Dumbbell,
  Heart,
  Leaf,
  Loader2,
  Minus,
  Plus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wheat,
  Zap,
} from 'lucide-react';
import {
  OnboardingSchema,
  type OnboardingInput,
  computeNutritionTargets,
  NutritionTargetsSchema,
} from '@nutrilens/shared';
import { api } from '@/lib/api-client';
import { useRequireAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatKcal } from '@/lib/utils';

const TOTAL_STEPS = 5;

type GoalType = OnboardingInput['goalType'];
type GoalSpeed = OnboardingInput['goalSpeed'];
type ActivityLevel = OnboardingInput['activityLevel'];
type DietaryPref = NonNullable<OnboardingInput['dietaryPreferences']>[number];

type OnboardingT = ReturnType<typeof useTranslations<'onboarding'>>;

const GOAL_OPTIONS: {
  value: GoalType;
  titleKey: 'goalLose' | 'goalMaintain' | 'goalGain' | 'goalHealthier';
  descKey: 'goalLoseDesc' | 'goalMaintainDesc' | 'goalGainDesc' | 'goalHealthierDesc';
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}[] = [
  {
    value: 'LOSE',
    titleKey: 'goalLose',
    descKey: 'goalLoseDesc',
    Icon: TrendingDown,
    accent: 'text-accent-orange',
  },
  {
    value: 'MAINTAIN',
    titleKey: 'goalMaintain',
    descKey: 'goalMaintainDesc',
    Icon: Scale,
    accent: 'text-accent-blue',
  },
  {
    value: 'GAIN',
    titleKey: 'goalGain',
    descKey: 'goalGainDesc',
    Icon: TrendingUp,
    accent: 'text-accent-green',
  },
  {
    value: 'HEALTHIER',
    titleKey: 'goalHealthier',
    descKey: 'goalHealthierDesc',
    Icon: Heart,
    accent: 'text-accent-purple',
  },
];

const SPEED_OPTIONS: {
  value: GoalSpeed;
  titleKey: 'speedSlow' | 'speedBalanced' | 'speedAggressive';
  descKey: 'speedSlowDesc' | 'speedBalancedDesc' | 'speedAggressiveDesc';
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'SLOW',
    titleKey: 'speedSlow',
    descKey: 'speedSlowDesc',
    Icon: Leaf,
  },
  {
    value: 'BALANCED',
    titleKey: 'speedBalanced',
    descKey: 'speedBalancedDesc',
    Icon: Activity,
  },
  {
    value: 'AGGRESSIVE',
    titleKey: 'speedAggressive',
    descKey: 'speedAggressiveDesc',
    Icon: Zap,
  },
];

const ACTIVITY_OPTIONS: {
  value: ActivityLevel;
  titleKey:
    | 'activitySedentary'
    | 'activityLight'
    | 'activityModerate'
    | 'activityActive'
    | 'activityVeryActive';
  descKey:
    | 'activitySedentaryDesc'
    | 'activityLightDesc'
    | 'activityModerateDesc'
    | 'activityActiveDesc'
    | 'activityVeryActiveDesc';
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'SEDENTARY',
    titleKey: 'activitySedentary',
    descKey: 'activitySedentaryDesc',
    Icon: Activity,
  },
  {
    value: 'LIGHT',
    titleKey: 'activityLight',
    descKey: 'activityLightDesc',
    Icon: Bike,
  },
  {
    value: 'MODERATE',
    titleKey: 'activityModerate',
    descKey: 'activityModerateDesc',
    Icon: Activity,
  },
  {
    value: 'ACTIVE',
    titleKey: 'activityActive',
    descKey: 'activityActiveDesc',
    Icon: Dumbbell,
  },
  {
    value: 'VERY_ACTIVE',
    titleKey: 'activityVeryActive',
    descKey: 'activityVeryActiveDesc',
    Icon: Zap,
  },
];

const DIET_OPTIONS: {
  value: DietaryPref;
  labelKey:
    | 'dietVegetarian'
    | 'dietVegan'
    | 'dietLowCarb'
    | 'dietHighProtein'
    | 'dietGlutenFree'
    | 'dietLactoseFree';
}[] = [
  { value: 'VEGETARIAN', labelKey: 'dietVegetarian' },
  { value: 'VEGAN', labelKey: 'dietVegan' },
  { value: 'LOW_CARB', labelKey: 'dietLowCarb' },
  { value: 'HIGH_PROTEIN', labelKey: 'dietHighProtein' },
  { value: 'GLUTEN_FREE', labelKey: 'dietGlutenFree' },
  { value: 'LACTOSE_FREE', labelKey: 'dietLactoseFree' },
];

interface TargetsForm {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterMl: number;
}

const DEFAULT_VALUES: OnboardingInput = {
  age: 30,
  gender: 'OTHER',
  heightCm: 170,
  weightKg: 70,
  activityLevel: 'MODERATE',
  goalType: 'MAINTAIN',
  goalSpeed: 'BALANCED',
  targetWeightKg: null,
  dietaryPreferences: [],
  customDietNotes: '',
  unitSystem: 'METRIC',
  timezone:
    typeof window !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC',
};

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoading } = useRequireAuth();
  const [step, setStep] = React.useState(1);
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const tAuth = useTranslations('auth');
  const locale = useLocale();

  React.useEffect(() => {
    if (user?.hasOnboarded) {
      router.replace('/app');
    }
  }, [user, router]);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const watched = form.watch();

  // Live computed targets (used for step 5 preview)
  const computedTargets = React.useMemo<TargetsForm>(() => {
    try {
      return computeNutritionTargets({
        age: watched.age,
        gender: watched.gender ?? 'OTHER',
        heightCm: watched.heightCm,
        weightKg: watched.weightKg,
        activityLevel: watched.activityLevel,
        goal: watched.goalType,
        speed: watched.goalSpeed,
      });
    } catch {
      return {
        dailyCalories: 2000,
        proteinGrams: 125,
        carbsGrams: 225,
        fatGrams: 67,
        fiberGrams: 28,
        waterMl: 2310,
      };
    }
  }, [
    watched.age,
    watched.gender,
    watched.heightCm,
    watched.weightKg,
    watched.activityLevel,
    watched.goalType,
    watched.goalSpeed,
  ]);

  // Targets form (initialised from computed; user can override on step 5)
  const targetsForm = useForm<TargetsForm>({
    resolver: zodResolver(NutritionTargetsSchema),
    defaultValues: computedTargets,
    mode: 'onChange',
  });

  // Re-sync targets form whenever computed values change AND the user hasn't dirtied that field
  React.useEffect(() => {
    const dirty = targetsForm.formState.dirtyFields;
    (Object.keys(computedTargets) as (keyof TargetsForm)[]).forEach((key) => {
      if (!dirty[key]) {
        targetsForm.setValue(key, computedTargets[key], { shouldDirty: false });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedTargets]);

  const submitMutation = useMutation({
    mutationFn: async (input: OnboardingInput) => {
      const profile = await api.completeOnboarding(input);
      const targets = targetsForm.getValues();
      const dirtyKeys = Object.keys(targetsForm.formState.dirtyFields) as (keyof TargetsForm)[];
      if (dirtyKeys.length > 0) {
        await api.updateTargets(targets);
      }
      return profile;
    },
    onSuccess: () => {
      toast({
        title: tAuth('allSetTitle'),
        description: tAuth('allSetDesc'),
        variant: 'success',
      });
      router.push('/app');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : tErrors('generic');
      toast({ title: tErrors('generic'), description: msg, variant: 'error' });
    },
  });

  // Skip step 3 if not LOSE/GAIN
  const requiresSpeedStep =
    watched.goalType === 'LOSE' || watched.goalType === 'GAIN';

  const visibleSteps = React.useMemo(() => {
    const arr = [1, 2, 3, 4, 5];
    return requiresSpeedStep ? arr : arr.filter((s) => s !== 3);
  }, [requiresSpeedStep]);

  const currentVisibleIndex = visibleSteps.indexOf(step);
  const totalVisible = visibleSteps.length;

  // Per-step validation: returns true if current step is valid
  const stepIsValid = React.useMemo(() => {
    const v = watched;
    if (step === 1) {
      return (
        v.age >= 10 &&
        v.age <= 120 &&
        v.heightCm >= 100 &&
        v.heightCm <= 260 &&
        v.weightKg >= 30 &&
        v.weightKg <= 400 &&
        Boolean(v.gender)
      );
    }
    if (step === 2) {
      if (!v.goalType) return false;
      if ((v.goalType === 'LOSE' || v.goalType === 'GAIN') && v.targetWeightKg != null) {
        return v.targetWeightKg >= 30 && v.targetWeightKg <= 400;
      }
      return true;
    }
    if (step === 3) return Boolean(v.goalSpeed);
    if (step === 4) {
      if (!v.activityLevel) return false;
      if (v.customDietNotes && v.customDietNotes.length > 500) return false;
      return Boolean(v.unitSystem);
    }
    if (step === 5) return targetsForm.formState.isValid;
    return false;
  }, [step, watched, targetsForm.formState.isValid]);

  const handleNext = async () => {
    if (!stepIsValid) return;
    if (step === 5) {
      // submit
      const data = form.getValues();
      submitMutation.mutate(data);
      return;
    }
    let next = step + 1;
    if (next === 3 && !requiresSpeedStep) next = 4;
    setStep(Math.min(5, next));
  };

  const handleBack = () => {
    let prev = step - 1;
    if (prev === 3 && !requiresSpeedStep) prev = 2;
    setStep(Math.max(1, prev));
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressValue = ((currentVisibleIndex + 1) / totalVisible) * 100;

  return (
    <div className="min-h-screen px-4 py-8 md:py-14">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span>
              {t('stepCount', {
                current: currentVisibleIndex + 1,
                total: totalVisible,
              })}
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {tCommon('appName')}
            </span>
          </div>
          <Progress value={progressValue} />
        </div>

        {/* Animated card */}
        <div className="card-soft overflow-hidden bg-gradient-to-br from-accent-lime/15 via-white to-accent-purple/15 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {step === 1 && <StepBasics form={form} t={t} />}
              {step === 2 && <StepGoal form={form} t={t} />}
              {step === 3 && requiresSpeedStep && (
                <StepSpeed
                  form={form}
                  goal={watched.goalType}
                  t={t}
                  computedKcal={computedTargets.dailyCalories}
                />
              )}
              {step === 4 && <StepDiet form={form} t={t} />}
              {step === 5 && (
                <StepTargets
                  computed={computedTargets}
                  form={targetsForm}
                  profile={watched}
                  t={t}
                  locale={locale}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1 || submitMutation.isPending}
            >
              <ArrowLeft className="h-4 w-4" />
              {tCommon('back')}
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={!stepIsValid || submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tCommon('saving')}
                </>
              ) : step === 5 ? (
                <>
                  {t('getStarted')}
                  <Sparkles className="h-4 w-4" />
                </>
              ) : (
                <>
                  {tCommon('next')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- STEP 1 ---------- */

function StepBasics({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<OnboardingInput>>;
  t: OnboardingT;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('step1Title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('step1Subtitle')}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('age')} htmlFor="age">
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            min={10}
            max={120}
            {...form.register('age', { valueAsNumber: true })}
          />
        </Field>

        <Field label={t('gender')} htmlFor="gender">
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <Select
                value={field.value ?? undefined}
                onValueChange={(v) =>
                  field.onChange(v as OnboardingInput['gender'])
                }
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t('gender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">{t('genderMale')}</SelectItem>
                  <SelectItem value="FEMALE">{t('genderFemale')}</SelectItem>
                  <SelectItem value="OTHER">{t('genderOther')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label={`${t('height')} (cm)`} htmlFor="heightCm">
          <Input
            id="heightCm"
            type="number"
            inputMode="numeric"
            min={100}
            max={260}
            step="0.1"
            {...form.register('heightCm', { valueAsNumber: true })}
          />
        </Field>

        <Field label={`${t('weight')} (kg)`} htmlFor="weightKg">
          <Input
            id="weightKg"
            type="number"
            inputMode="decimal"
            min={30}
            max={400}
            step="0.1"
            {...form.register('weightKg', { valueAsNumber: true })}
          />
        </Field>
      </div>
    </div>
  );
}

/* ---------- STEP 2 ---------- */

function StepGoal({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<OnboardingInput>>;
  t: OnboardingT;
}) {
  const goalType = form.watch('goalType');
  const showTarget = goalType === 'LOSE' || goalType === 'GAIN';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('step2Title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('step2Subtitle')}
        </p>
      </header>

      <Controller
        control={form.control}
        name="goalType"
        render={({ field }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GOAL_OPTIONS.map((opt) => {
              const selected = field.value === opt.value;
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'group flex items-start gap-3 overflow-hidden rounded-3xl border p-4 text-left transition shadow-soft',
                    selected
                      ? 'border-primary bg-gradient-to-br from-accent-lime/35 via-white to-accent-green/20 ring-2 ring-primary/30'
                      : 'border-white/70 bg-gradient-to-br from-white via-white to-accent-lime/12 hover:-translate-y-0.5 hover:border-primary/40',
                  )}
                  aria-pressed={selected}
                >
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-2xl shadow-sm',
                      opt.accent,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">
                      {t(opt.titleKey)}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t(opt.descKey)}
                    </span>
                  </span>
                  {selected && (
                    <Check className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      />

      {showTarget && (
        <Field label={`${t('targetWeight')} (kg)`} htmlFor="targetWeightKg">
          <Input
            id="targetWeightKg"
            type="number"
            inputMode="decimal"
            min={30}
            max={400}
            step="0.1"
            placeholder="65"
            {...form.register('targetWeightKg', {
              setValueAs: (v) =>
                v === '' || v == null ? null : Number(v),
            })}
          />
        </Field>
      )}
    </div>
  );
}

/* ---------- STEP 3 ---------- */

function StepSpeed({
  form,
  goal,
  t,
  computedKcal,
}: {
  form: ReturnType<typeof useForm<OnboardingInput>>;
  goal: GoalType;
  t: OnboardingT;
  computedKcal: number;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('step3Title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('step3Subtitle')}
        </p>
      </header>

      <Controller
        control={form.control}
        name="goalSpeed"
        render={({ field }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {SPEED_OPTIONS.map((opt) => {
              const selected = field.value === opt.value;
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'flex flex-col gap-2 overflow-hidden rounded-3xl border p-4 text-left transition shadow-soft',
                    selected
                      ? 'border-primary bg-gradient-to-br from-accent-orange/25 via-white to-accent-yellow/25 ring-2 ring-primary/30'
                      : 'border-white/70 bg-gradient-to-br from-white via-white to-accent-yellow/15 hover:-translate-y-0.5 hover:border-primary/40',
                  )}
                  aria-pressed={selected}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-accent-orange/20 text-accent-orange shadow-sm">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-sm font-semibold">{t(opt.titleKey)}</span>
                  <span className="text-xs text-muted-foreground">
                    {t(opt.descKey, { kcal: computedKcal })}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      />
      {/* `goal` is preserved for prop compatibility (was used for unique copy per goal) */}
      <span className="sr-only" aria-hidden>
        {goal}
      </span>
    </div>
  );
}

/* ---------- STEP 4 ---------- */

function StepDiet({
  form,
  t,
}: {
  form: ReturnType<typeof useForm<OnboardingInput>>;
  t: OnboardingT;
}) {
  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('step4Title')}
        </h1>
      </header>

      {/* Activity level */}
      <div className="space-y-3">
        <Label>{t('activity')}</Label>
        <Controller
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {ACTIVITY_OPTIONS.map((opt) => {
                const selected = field.value === opt.value;
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      'flex items-start gap-3 overflow-hidden rounded-2xl border p-4 text-left transition shadow-sm',
                      selected
                        ? 'border-primary bg-gradient-to-br from-accent-green/20 via-white to-accent-lime/25 ring-2 ring-primary/30'
                        : 'border-white/70 bg-gradient-to-br from-white via-white to-accent-lime/12 hover:-translate-y-0.5 hover:border-primary/40',
                    )}
                    aria-pressed={selected}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-green/20 text-accent-green shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">
                        {t(opt.titleKey)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t(opt.descKey)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      {/* Dietary preferences chips */}
      <div className="space-y-3">
        <Label>{t('dietaryPreferences')}</Label>
        <p className="text-xs text-muted-foreground">{t('dietarySelectAll')}</p>
        <Controller
          control={form.control}
          name="dietaryPreferences"
          render={({ field }) => {
            const selected = (field.value ?? []) as DietaryPref[];
            const toggle = (v: DietaryPref) => {
              const next = selected.includes(v)
                ? selected.filter((x) => x !== v)
                : [...selected, v];
              field.onChange(next);
            };
            return (
              <div className="flex flex-wrap gap-2">
                {DIET_OPTIONS.map((opt) => {
                  const isOn = selected.includes(opt.value);
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={isOn ? 'default' : 'secondary'}
                      size="sm"
                      onClick={() => toggle(opt.value)}
                      aria-pressed={isOn}
                    >
                      {isOn && <Check className="h-3.5 w-3.5" />}
                      {t(opt.labelKey)}
                    </Button>
                  );
                })}
              </div>
            );
          }}
        />
      </div>

      {/* Custom diet notes */}
      <Field
        label={t('anythingElse')}
        htmlFor="customDietNotes"
        hint={t('anythingElseHint')}
      >
        <Textarea
          id="customDietNotes"
          maxLength={500}
          placeholder={t('anythingElsePlaceholder')}
          {...form.register('customDietNotes')}
        />
        <CharCount form={form} />
      </Field>

      {/* Unit system */}
      <div className="space-y-3">
        <Label>{t('units')}</Label>
        <Controller
          control={form.control}
          name="unitSystem"
          render={({ field }) => (
            <div className="inline-flex rounded-full border border-white/70 bg-gradient-to-br from-white via-accent-lime/15 to-accent-blue/15 p-1 shadow-sm">
              {(['METRIC', 'IMPERIAL'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => field.onChange(u)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium transition',
                    field.value === u
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-pressed={field.value === u}
                >
                  {u === 'METRIC' ? t('unitsMetric') : t('unitsImperial')}
                </button>
              ))}
            </div>
          )}
        />
      </div>
    </div>
  );
}

function CharCount({ form }: { form: ReturnType<typeof useForm<OnboardingInput>> }) {
  const value = form.watch('customDietNotes') ?? '';
  return (
    <div className="mt-1 text-right text-xs text-muted-foreground">
      {value.length}/500
    </div>
  );
}

/* ---------- STEP 5 ---------- */

function StepTargets({
  computed,
  form,
  profile,
  t,
  locale,
}: {
  computed: TargetsForm;
  form: ReturnType<typeof useForm<TargetsForm>>;
  profile: OnboardingInput;
  t: OnboardingT;
  locale: string;
}) {
  const values = form.watch();
  const errors = form.formState.errors;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('step5Title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('step5Subtitle')}
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-accent-purple/20 bg-gradient-to-br from-accent-purple/15 via-white to-accent-lime/20 p-4 text-sm shadow-sm">
        <div className="flex items-center gap-2 font-medium text-accent-purple">
          <Sparkles className="h-4 w-4" />
          <span>{formatKcal(computed.dailyCalories, locale)} kcal/day</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {profile.age} · {profile.weightKg} kg · {profile.heightCm} cm ·{' '}
          {profile.activityLevel.replace('_', ' ').toLowerCase()} ·{' '}
          {profile.goalType.toLowerCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TargetField
          label={t('calories')}
          unit="kcal"
          step={50}
          min={800}
          max={8000}
          value={values.dailyCalories}
          error={errors.dailyCalories?.message}
          onChange={(v) =>
            form.setValue('dailyCalories', v, { shouldDirty: true, shouldValidate: true })
          }
        />
        <TargetField
          label={t('protein')}
          unit="g"
          step={5}
          min={0}
          max={500}
          value={values.proteinGrams}
          error={errors.proteinGrams?.message}
          onChange={(v) =>
            form.setValue('proteinGrams', v, { shouldDirty: true, shouldValidate: true })
          }
        />
        <TargetField
          label={t('carbs')}
          unit="g"
          step={5}
          min={0}
          max={1000}
          value={values.carbsGrams}
          error={errors.carbsGrams?.message}
          onChange={(v) =>
            form.setValue('carbsGrams', v, { shouldDirty: true, shouldValidate: true })
          }
        />
        <TargetField
          label={t('fat')}
          unit="g"
          step={5}
          min={0}
          max={400}
          value={values.fatGrams}
          error={errors.fatGrams?.message}
          onChange={(v) =>
            form.setValue('fatGrams', v, { shouldDirty: true, shouldValidate: true })
          }
        />
        <TargetField
          label={t('fiber')}
          icon={<Wheat className="h-4 w-4 text-accent-orange" />}
          unit="g"
          step={1}
          min={0}
          max={200}
          value={values.fiberGrams}
          error={errors.fiberGrams?.message}
          onChange={(v) =>
            form.setValue('fiberGrams', v, { shouldDirty: true, shouldValidate: true })
          }
        />
        <TargetField
          label={t('water')}
          icon={<Droplet className="h-4 w-4 text-accent-blue" />}
          unit="ml"
          step={100}
          min={0}
          max={8000}
          value={values.waterMl}
          error={errors.waterMl?.message}
          onChange={(v) =>
            form.setValue('waterMl', v, { shouldDirty: true, shouldValidate: true })
          }
        />
      </div>
    </div>
  );
}

function TargetField({
  label,
  icon,
  unit,
  step,
  min,
  max,
  value,
  error,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  unit: string;
  step: number;
  min: number;
  max: number;
  value: number;
  error?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v)));
  return (
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white via-accent-lime/10 to-accent-green/12 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`- ${label}`}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          inputMode="numeric"
          className="text-center text-base font-semibold"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          min={min}
          max={max}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`+ ${label}`}
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ---------- shared ---------- */

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
