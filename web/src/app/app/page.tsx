'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  ChevronRight,
  Droplets,
  Flame,
  Loader2,
  Plus,
  Scale,
  Sparkles,
  Target,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { balanceLabel as balanceLabelFn } from '@nutrilens/shared';
import type { WeightEntryResponse } from '@nutrilens/shared';
import { api, ApiError } from '@/lib/api-client';
import { useRequireAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/app/app-shell';
import { CalorieRing } from '@/components/app/calorie-ring';
import { MacroCard } from '@/components/app/macro-card';
import { MealCard, MealCardSkeleton } from '@/components/app/meal-card';
import { WaterTracker } from '@/components/app/water-tracker';
import { EmptyState } from '@/components/app/empty-state';
import { DateSwitcher } from '@/components/app/date-switcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toaster';
import { cn, formatKcal, isoDate } from '@/lib/utils';

function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn('card-soft p-6 skeleton h-40', className)} />;
}

function MiniMetric({
  icon: Icon,
  label,
  value,
  tone = 'bg-white/70 text-foreground',
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/70 bg-white/65 p-3 shadow-[0_12px_28px_rgba(24,38,30,0.08)] backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
        <span className={cn('grid h-7 w-7 place-items-center rounded-full', tone)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export default function DailyDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const tOnboarding = useTranslations('onboarding');
  const locale = useLocale();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    if (!authLoading && user && !user.hasOnboarded) {
      router.replace('/app/onboarding');
    }
  }, [authLoading, user, router]);

  const dateStr = isoDate(selectedDate);
  const todayStr = isoDate(new Date());
  const isToday = dateStr === todayStr;
  const isFuture = dateStr > todayStr;

  const dailyQuery = useQuery({
    queryKey: ['daily', dateStr],
    queryFn: () => api.daily(dateStr),
    enabled: Boolean(user?.hasOnboarded) && !isFuture,
    // Auto-refresh while any meal is still analyzing or pending review so the
    // dashboard catches up without the user having to refresh.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const hasPending = data.meals.some(
        (m) => m.status === 'DRAFT' || m.status === 'NEEDS_REVIEW',
      );
      return hasPending ? 3000 : false;
    },
  });

  const weightsQuery = useQuery({
    queryKey: ['weights'],
    queryFn: () => api.listWeights(),
    enabled: Boolean(user),
  });

  const lastWeight: WeightEntryResponse | undefined = useMemo(() => {
    const list = weightsQuery.data;
    if (!list || list.length === 0) return undefined;
    return [...list].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
    )[0];
  }, [weightsQuery.data]);

  function shiftDay(delta: number) {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + delta);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (next > today) return d;
      return next;
    });
  }

  function jumpToToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setSelectedDate(t);
  }

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const name = user?.name?.split(' ')[0] ?? 'there';
    if (h < 12) return t('morningGreeting', { name });
    if (h < 18) return t('afternoonGreeting', { name });
    return t('eveningGreeting', { name });
  }, [user?.name, t]);

  const dayLabel = useMemo(() => {
    return selectedDate.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate, locale]);

  const data = dailyQuery.data;
  const isLoading = authLoading || (!data && dailyQuery.isLoading);
  const queryError =
    dailyQuery.isError && !data
      ? dailyQuery.error instanceof Error
        ? dailyQuery.error.message
        : tErrors('generic')
      : null;

  return (
    <AppShell>
      <section className="flex flex-col gap-5 md:gap-6">
        {/* Greeting + date switcher */}
        <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,.9),rgba(232,255,221,.72)_48%,rgba(255,232,201,.66))] p-5 shadow-[0_22px_60px_rgba(24,38,30,0.12)] backdrop-blur-xl md:p-6">
          <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-accent-lime/45 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-accent-purple/20 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {dayLabel}
              </p>
              <h1 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
                {greeting}
              </h1>
            </div>
            <DateSwitcher
              isToday={isToday}
              onPrev={() => shiftDay(-1)}
              onNext={() => shiftDay(1)}
              onToday={jumpToToday}
              canGoForward={!isToday}
              label={isToday ? tCommon('today') : dayLabel}
            />
          </div>
        </header>

        {queryError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <div className="font-medium">{t('couldNotReachServer')}</div>
            <div className="mt-1 text-red-800/80">{queryError}</div>
            <button
              type="button"
              onClick={() => dailyQuery.refetch()}
              className="mt-3 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
            >
              {tCommon('tryAgain')}
            </button>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <>
                <CardSkeleton className="h-72" />
                <div className="grid grid-cols-2 gap-3">
                  <CardSkeleton className="h-24" />
                  <CardSkeleton className="h-24" />
                  <CardSkeleton className="h-24" />
                  <CardSkeleton className="h-24" />
                </div>
                <CardSkeleton className="h-24" />
              </>
            ) : data ? (
              <>
                {/* Calorie ring card */}
                <div className="card-soft relative flex flex-col items-center gap-5 overflow-hidden bg-[linear-gradient(155deg,rgba(23,32,25,.98),rgba(8,189,132,.84)_55%,rgba(184,233,134,.74))] p-5 text-white shadow-[0_26px_70px_rgba(8,80,56,0.28)] md:p-6">
                  <div className="pointer-events-none absolute -right-12 top-4 h-36 w-36 rounded-full bg-white/18 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent-yellow/25 blur-2xl" />
                  <div className="relative flex w-full items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/75 ring-1 ring-white/15">
                        <Flame className="h-3.5 w-3.5 text-accent-yellow" />
                        {tOnboarding('calories')}
                      </div>
                      <div className="mt-3 text-2xl font-semibold leading-tight tracking-tight">
                        {t('consumed', {
                          calories: formatKcal(data.totals.calories, locale),
                        })}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/14 px-3 py-1.5 text-xs font-semibold text-white shadow-sm ring-1 ring-white/15',
                      )}
                      title={t('score', { score: data.balanceScore })}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-accent-lime" />
                      {t(data.balanceLabel || balanceLabelFn(data.balanceScore))}
                    </span>
                  </div>
                  <CalorieRing
                    consumed={data.totals.calories}
                    target={data.targets.dailyCalories}
                    size={210}
                    className="relative [&_*]:text-white"
                  />
                  <div className="relative grid w-full grid-cols-3 gap-2">
                    <MiniMetric
                      icon={Target}
                      label={t('remaining', {
                        kcal: Math.max(0, Math.round(data.remaining.calories)),
                      })}
                      value={`${Math.round((data.totals.calories / Math.max(data.targets.dailyCalories, 1)) * 100)}%`}
                      tone="bg-accent-lime/25 text-accent-lime"
                    />
                    <MiniMetric
                      icon={UtensilsCrossed}
                      label={t('todaysMeals')}
                      value={`${data.meals.length}`}
                      tone="bg-white/15 text-white"
                    />
                    <MiniMetric
                      icon={Droplets}
                      label={tOnboarding('water')}
                      value={`${Math.round(data.totals.waterMl / 1000)}L`}
                      tone="bg-accent-blue/25 text-accent-blue"
                    />
                  </div>
                  <div className="relative flex w-full items-center justify-between rounded-2xl bg-white/12 px-4 py-3 text-xs text-white/78 ring-1 ring-white/15">
                    <span className="tabular-nums">
                      {t('score', { score: data.balanceScore })}
                    </span>
                    <span className="font-medium text-white">
                      / {formatKcal(data.targets.dailyCalories, locale)} kcal
                    </span>
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-2 gap-3">
                  <MacroCard
                    label={tOnboarding('protein')}
                    value={data.totals.protein}
                    target={data.targets.proteinGrams}
                    color="protein"
                  />
                  <MacroCard
                    label={tOnboarding('carbs')}
                    value={data.totals.carbs}
                    target={data.targets.carbsGrams}
                    color="carbs"
                  />
                  <MacroCard
                    label={tOnboarding('fat')}
                    value={data.totals.fat}
                    target={data.targets.fatGrams}
                    color="fat"
                  />
                  <MacroCard
                    label={tOnboarding('fiber')}
                    value={data.totals.fiber}
                    target={data.targets.fiberGrams}
                    color="fiber"
                  />
                </div>

                {/* Water */}
                <WaterTracker
                  date={dateStr}
                  targetMl={data.targets.waterMl}
                  consumedMl={data.totals.waterMl}
                />
              </>
            ) : (
              <EmptyState
                title={isFuture ? t('futureDayTitle') : t('noDataTitle')}
                description={
                  isFuture ? t('futureDayDesc') : t('noDataDesc')
                }
                ctaLabel={t('noDataCta')}
                ctaHref="/app/upload"
              />
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-3 px-1 text-lg font-semibold">{t('todaysMeals')}</h2>
              <div className="flex flex-col gap-3">
                {isLoading ? (
                  <>
                    <MealCardSkeleton />
                    <MealCardSkeleton />
                  </>
                ) : data && data.meals.length > 0 ? (
                  data.meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
                ) : (
                  <EmptyState
                    title={t('noMealsTitle')}
                    description={t('noMealsDesc')}
                    ctaLabel={t('snapMealCta')}
                    ctaHref="/app/upload"
                    icon={<Camera className="h-6 w-6" aria-hidden />}
                  />
                )}
              </div>
            </div>

            {/* AI insight */}
            {!isLoading && data?.insight && (
              <div className="card-soft flex items-start gap-3 overflow-hidden bg-gradient-to-br from-accent-purple/20 via-white to-accent-lime/25 p-5">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{t('aiInsight')}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{data.insight}</p>
                </div>
              </div>
            )}

            {/* Weight shortcut */}
            <WeightShortcutCard lastWeight={lastWeight} loading={weightsQuery.isLoading} />

            {/* CTA card (mobile-friendly; desktop has nav as well) */}
            <Link
              href="/app/upload"
              className="card-soft md:hidden flex items-center gap-4 overflow-hidden bg-gradient-to-br from-accent-orange/25 via-white to-accent-yellow/20 p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Camera className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{t('snapMealCta')}</div>
                <div className="text-sm text-muted-foreground">
                  {t('snapMealCtaDesc')}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function WeightShortcutCard({
  lastWeight,
  loading,
}: {
  lastWeight?: WeightEntryResponse;
  loading: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (open && lastWeight) {
      setValue(lastWeight.weightKg.toString());
    } else if (open) {
      setValue('');
    }
  }, [open, lastWeight]);

  const addWeight = useMutation({
    mutationFn: (weightKg: number) => api.addWeight({ weightKg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weights'] });
      qc.invalidateQueries({ queryKey: ['monthly'] });
      toast({ title: t('weightSaved'), variant: 'success' });
      setOpen(false);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : tErrors('generic');
      toast({ title: tErrors('generic'), description: message, variant: 'error' });
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 20 || n > 500) {
      toast({
        title: t('weightSaveFailed'),
        description: t('weightInvalidRange'),
        variant: 'error',
      });
      return;
    }
    addWeight.mutate(n);
  }

  return (
    <div className="card-soft flex items-center gap-4 overflow-hidden bg-gradient-to-br from-accent-purple/20 via-white to-accent-blue/15 p-5">
      <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
        <Scale className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-muted-foreground">{t('latestWeight')}</div>
        {loading ? (
          <div className="mt-1 skeleton h-5 w-24" />
        ) : lastWeight ? (
          <div className="font-semibold tabular-nums">
            {lastWeight.weightKg.toFixed(1)} kg{' '}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {new Date(lastWeight.loggedAt).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        ) : (
          <div className="font-semibold text-muted-foreground">{t('weightNotLogged')}</div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary">
            <Plus className="h-3.5 w-3.5" />
            {t('updateWeight')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('weightModalTitle')}</DialogTitle>
            <DialogDescription>{t('weightModalDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weight-kg">{t('weightLabel')}</Label>
              <Input
                id="weight-kg"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={20}
                max={500}
                placeholder={t('weightPlaceholder')}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {tCommon('cancel')}
                </Button>
              </DialogClose>
              <Button type="submit" disabled={addWeight.isPending}>
                {addWeight.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {t('savingWeight')}
                  </>
                ) : (
                  t('saveWeight')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
