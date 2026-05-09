'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { MEAL_TYPES, type MealResponse, type MealType } from '@nutrilens/shared';
import { AppShell } from '@/components/app/app-shell';
import { MealCard, MealCardSkeleton } from '@/components/app/meal-card';
import { EmptyState } from '@/components/app/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useRequireAuth } from '@/hooks/use-auth';
import { cn, formatKcal, isoDate } from '@/lib/utils';

type MealTypeFilter = MealType | 'ALL';

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function isToday(iso: string): boolean {
  return iso === isoDate(new Date());
}

function prettyDate(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function DiaryPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const t = useTranslations('diary');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const tMealTypes = useTranslations('mealTypes');
  const locale = useLocale();

  const [date, setDate] = useState<string>(() => isoDate(new Date()));
  const [mealTypeFilter, setMealTypeFilter] = useState<MealTypeFilter>('ALL');
  const [minCalories, setMinCalories] = useState<string>('');
  const [maxCalories, setMaxCalories] = useState<string>('');
  const [search, setSearch] = useState('');

  const mealsQuery = useQuery<MealResponse[]>({
    queryKey: ['meals', date],
    queryFn: () => api.listMeals(date),
    enabled: !authLoading,
    // Poll while any meal is still analyzing so the diary updates as the
    // worker finishes — no manual refresh needed after upload.
    refetchInterval: (query) => {
      const list = query.state.data;
      if (!list) return false;
      return list.some((m) => m.status === 'DRAFT') ? 3000 : false;
    },
  });

  const filtered = useMemo(() => {
    if (!mealsQuery.data) return [];
    const min = minCalories ? Number(minCalories) : null;
    const max = maxCalories ? Number(maxCalories) : null;
    const term = search.trim().toLowerCase();

    return mealsQuery.data
      .filter((m) => (mealTypeFilter === 'ALL' ? true : m.mealType === mealTypeFilter))
      .filter((m) => (min === null ? true : m.calories >= min))
      .filter((m) => (max === null ? true : m.calories <= max))
      .filter((m) => {
        if (!term) return true;
        const inTitle = m.title.toLowerCase().includes(term);
        const inItems = m.items.some((it) => it.name.toLowerCase().includes(term));
        return inTitle || inItems;
      })
      .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime());
  }, [mealsQuery.data, mealTypeFilter, minCalories, maxCalories, search]);

  const totalKcal = useMemo(
    () => filtered.reduce((sum, m) => sum + m.calories, 0),
    [filtered],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </header>

        {/* Date selector */}
        <div className="card-soft flex items-center justify-between gap-2 overflow-hidden bg-gradient-to-br from-white via-accent-lime/10 to-accent-blue/10 p-3">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={tCommon('previous')}
            onClick={() => setDate((d) => shiftDate(d, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-1 items-center justify-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-2xl border border-border bg-white/80 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              aria-label={tCommon('today')}
            />
            <div className="text-sm font-medium">
              {isToday(date) ? tCommon('today') : prettyDate(date, locale)}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={tCommon('next')}
            onClick={() => setDate((d) => shiftDate(d, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="card-soft space-y-4 overflow-hidden bg-gradient-to-br from-white via-accent-purple/8 to-accent-orange/10 p-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('filtersAllTypes')}
            </Label>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={t('filtersAllTypes')}
                active={mealTypeFilter === 'ALL'}
                onClick={() => setMealTypeFilter('ALL')}
              />
              {MEAL_TYPES.map((mt) => (
                <FilterChip
                  key={mt}
                  label={tMealTypes(mt)}
                  active={mealTypeFilter === mt}
                  onClick={() => setMealTypeFilter(mt)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('filterCalorieRange')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder={t('filterMin')}
                  value={minCalories}
                  onChange={(e) => setMinCalories(e.target.value)}
                  className="h-9"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder={t('filterMax')}
                  value={maxCalories}
                  onChange={(e) => setMaxCalories(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="meal-search"
                className="text-xs uppercase tracking-wide text-muted-foreground"
              >
                {tCommon('search')}
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="meal-search"
                  placeholder={tCommon('search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary line */}
        {!mealsQuery.isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
            <span>{t('mealCount', { count: filtered.length })}</span>
            <span className="font-medium tabular-nums text-foreground">
              {formatKcal(totalKcal, locale)} kcal
            </span>
          </div>
        )}

        {/* Results */}
        {mealsQuery.isLoading ? (
          <div className="space-y-3">
            <MealCardSkeleton />
            <MealCardSkeleton />
            <MealCardSkeleton />
          </div>
        ) : mealsQuery.error ? (
          <div className="card-soft overflow-hidden bg-gradient-to-br from-red-50 via-white to-accent-orange/15 p-5 text-center">
            <div className="text-sm font-semibold">{t('couldNotLoadMeals')}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {mealsQuery.error instanceof Error ? mealsQuery.error.message : t('tryAgainLater')}
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => mealsQuery.refetch()}
            >
              {tCommon('tryAgain')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          mealsQuery.data && mealsQuery.data.length > 0 ? (
            <EmptyState
              title={t('noMealsMatch')}
              description={t('noMealsMatchDesc')}
            />
          ) : (
            <EmptyState
              title={t('noMealsYet')}
              description={
                isToday(date)
                  ? t('noMealsYetDesc')
                  : tDashboard('noDataDesc')
              }
              ctaLabel={tDashboard('noDataCta')}
              ctaHref="/app/upload"
            />
          )
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MealCard key={m.id} meal={m} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-soft'
          : 'border-border bg-white/70 text-foreground hover:bg-white',
      )}
    >
      {label}
    </button>
  );
}
