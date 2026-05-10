'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
  Utensils,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  MonthlyDashboardResponse,
  WeeklyDashboardResponse,
} from '@nutrilens/shared';
import { api } from '@/lib/api-client';
import { useRequireAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/app/app-shell';
import { EmptyState } from '@/components/app/empty-state';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatKcal, isoDate, startOfWeekUTC } from '@/lib/utils';

const GRID = '#E7EAE7';

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function monthString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function shortDay(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { weekday: 'short' });
}

function shortDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function intensityClass(score: number, hasTracking: boolean): string {
  if (!hasTracking) return 'bg-muted/40 text-muted-foreground';
  if (score >= 85) return 'bg-primary text-primary-foreground';
  if (score >= 70) return 'bg-primary/60 text-primary-foreground';
  if (score >= 50) return 'bg-accent-yellow/70 text-amber-900';
  if (score >= 30) return 'bg-accent-orange/60 text-orange-900';
  return 'bg-muted text-muted-foreground';
}

export default function AnalyticsPage() {
  const { user, isLoading } = useRequireAuth();
  const t = useTranslations('analytics');

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{t('analyticsLabel')}</p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {t('yourTrends')}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t('confirmedOnlyHint')}
          </p>
        </header>

        <Tabs defaultValue="weekly" className="flex flex-col gap-6">
          <TabsList className="self-start">
            <TabsTrigger value="weekly">{t('weekly')}</TabsTrigger>
            <TabsTrigger value="monthly">{t('monthly')}</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" forceMount className="data-[state=inactive]:hidden">
            <WeeklyView enabled={Boolean(user) && !isLoading} />
          </TabsContent>
          <TabsContent value="monthly" forceMount className="data-[state=inactive]:hidden">
            <MonthlyView enabled={Boolean(user) && !isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function WeeklyView({ enabled }: { enabled: boolean }) {
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const locale = useLocale();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekUTC(new Date()));
  const startStr = isoDate(weekStart);

  const query = useQuery<WeeklyDashboardResponse>({
    queryKey: ['weekly', startStr],
    queryFn: () => api.weekly(startStr),
    enabled,
  });

  function shiftWeek(delta: number) {
    setWeekStart((d) => {
      const next = new Date(d);
      next.setUTCDate(next.getUTCDate() + delta * 7);
      const todayStart = startOfWeekUTC(new Date());
      if (next > todayStart) return d;
      return next;
    });
  }

  const todayWeek = useMemo(() => startOfWeekUTC(new Date()), []);
  const isCurrentWeek = startStr === isoDate(todayWeek);

  const data = query.data;
  const queryError =
    query.isError && !data
      ? query.error instanceof Error
        ? query.error.message
        : t('couldNotLoadWeekly')
      : null;

  return (
    <div className="flex flex-col gap-5">
      {queryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-medium">{t('couldNotLoadWeek')}</div>
          <div className="mt-1 text-red-800/80">{queryError}</div>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
          >
            {tCommon('tryAgain')}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('weekOf')}
          </div>
          <div className="text-base font-semibold">
            {data
              ? `${shortDate(data.start, locale)} — ${shortDate(data.end, locale)}`
              : `${shortDate(startStr, locale)} — …`}
          </div>
        </div>
        <div className="inline-flex items-center gap-1 self-start rounded-full border border-white bg-white/80 p-1 shadow-sm sm:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => shiftWeek(-1)}
            aria-label={t('previousWeek')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setWeekStart(todayWeek)}
            disabled={isCurrentWeek}
            className={cn(
              'h-9 rounded-full px-4 text-sm font-medium transition-colors',
              isCurrentWeek
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/40',
            )}
          >
            {t('thisWeek')}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => shiftWeek(1)}
            disabled={isCurrentWeek}
            aria-label={t('nextWeek')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<Flame className="h-4 w-4" />}
          accent="bg-accent-orange/20 text-orange-700"
          surface="bg-gradient-to-br from-accent-orange/20 via-white to-accent-yellow/15"
          label={t('avgCalories')}
          value={data ? formatKcal(data.averages.calories, locale) : t('noDataDash')}
          unit={t('avgCaloriesUnit')}
          loading={!data}
        />
        <KpiCard
          icon={<Award className="h-4 w-4" />}
          accent="bg-primary/15 text-primary"
          surface="bg-gradient-to-br from-accent-green/20 via-white to-accent-lime/20"
          label={t('avgProtein')}
          value={data ? `${Math.round(data.averages.protein)}` : t('noDataDash')}
          unit={t('avgProteinUnit')}
          loading={!data}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          accent="bg-accent-purple/20 text-accent-purple"
          surface="bg-gradient-to-br from-accent-purple/20 via-white to-accent-blue/15"
          label={t('bestDay')}
          value={data?.bestDay ? shortDate(data.bestDay, locale) : t('noDataDash')}
          unit={t('bestDayUnit')}
          loading={!data}
        />
        <KpiCard
          icon={<Calendar className="h-4 w-4" />}
          accent="bg-accent-yellow/30 text-amber-700"
          surface="bg-gradient-to-br from-accent-yellow/25 via-white to-accent-orange/15"
          label={t('highestCal')}
          value={data?.highestCalorieDay ? shortDate(data.highestCalorieDay, locale) : t('noDataDash')}
          unit={t('highestCalUnit')}
          loading={!data}
        />
      </div>

      {/* Chart */}
      <div className="card-soft overflow-hidden bg-gradient-to-br from-white via-accent-orange/8 to-accent-yellow/15 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{t('dailyCalories')}</div>
            <div className="text-sm text-muted-foreground">
              {t('barsVsTarget')}
            </div>
          </div>
        </div>
        <div className="h-72 w-full">
          {data ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.days.map((d) => ({
                  ...d,
                  label: shortDay(d.date, locale),
                }))}
                margin={{ top: 12, right: 8, left: -12, bottom: 4 }}
              >
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(103, 178, 111, 0.08)' }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="card-soft px-3 py-2 text-xs">
                        <div className="font-semibold">{label}</div>
                        <div className="mt-1 tabular-nums text-muted-foreground">
                          {t('tooltipKcalProtein', {
                            kcal: Math.round(p.calories),
                            grams: Math.round(p.protein),
                          })}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={data.averages.calories || 0}
                  stroke="#A78BFA"
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
                <Bar
                  dataKey="calories"
                  fill="#67B26F"
                  radius={[10, 10, 4, 4]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="skeleton h-full w-full" />
          )}
        </div>
      </div>

      {/* Hit rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <HitRateCard
          label={t('proteinHitRate')}
          hit={data?.proteinTargetHitDays ?? 0}
          total={7}
          color="bg-macro-protein"
          loading={!data}
        />
        <HitRateCard
          label={t('calorieHitRate')}
          hit={data?.calorieTargetHitDays ?? 0}
          total={7}
          color="bg-accent-orange"
          loading={!data}
        />
      </div>

      {/* Missed days banner */}
      {data && data.missedDays >= 3 && (
        <div className="card-soft flex items-start gap-3 overflow-hidden border-l-4 border-accent-orange bg-gradient-to-br from-accent-orange/20 via-white to-accent-yellow/15 p-4">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-accent-orange/20 text-orange-700 shadow-sm">
            <Calendar className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">
              {t('missedDaysTitle', { count: data.missedDays })}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('missedDaysDesc')}
            </p>
          </div>
        </div>
      )}

      {/* AI insight */}
      {data?.insight && (
        <div className="card-soft flex items-start gap-3 overflow-hidden bg-gradient-to-br from-accent-purple/20 via-white to-accent-lime/25 p-5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{tDashboard('aiInsight')}</div>
            <p className="mt-1 text-sm text-muted-foreground">{data.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyView({ enabled }: { enabled: boolean }) {
  const t = useTranslations('analytics');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const locale = useLocale();
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const monthStr = monthString(monthDate);

  const query = useQuery<MonthlyDashboardResponse>({
    queryKey: ['monthly', monthStr],
    queryFn: () => api.monthly(monthStr),
    enabled,
  });

  const today = new Date();
  const currentMonthStr = monthString(today);
  const isCurrentMonth = monthStr === currentMonthStr;

  function shiftMonth(delta: number) {
    setMonthDate((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
      const nextStr = monthString(next);
      if (nextStr > currentMonthStr) return d;
      return next;
    });
  }

  const data = query.data;
  const monthLabel = useMemo(
    () =>
      monthDate.toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      }),
    [monthDate, locale],
  );
  const queryError =
    query.isError && !data
      ? query.error instanceof Error
        ? query.error.message
        : t('couldNotLoadMonthly')
      : null;

  return (
    <div className="flex flex-col gap-5">
      {queryError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-medium">{t('couldNotLoadMonth')}</div>
          <div className="mt-1 text-red-800/80">{queryError}</div>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-900 hover:bg-red-100"
          >
            {tCommon('tryAgain')}
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('month')}
          </div>
          <div className="text-base font-semibold">{monthLabel}</div>
        </div>
        <div className="inline-flex items-center gap-1 self-start rounded-full border border-white bg-white/80 p-1 shadow-sm sm:self-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => shiftMonth(-1)}
            aria-label={t('previousMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            disabled={isCurrentMonth}
            className={cn(
              'h-9 rounded-full px-4 text-sm font-medium transition-colors',
              isCurrentMonth
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/40',
            )}
          >
            {t('thisMonth')}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => shiftMonth(1)}
            disabled={isCurrentMonth}
            aria-label={t('nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar heatmap */}
      <div className="card-soft overflow-hidden bg-gradient-to-br from-white via-accent-lime/10 to-accent-green/15 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{t('balanceHeatmap')}</div>
            <div className="text-sm text-muted-foreground">
              {t('balanceHeatmapDesc')}
            </div>
          </div>
          <Legend />
        </div>
        {data ? (
          <Heatmap days={data.days} />
        ) : (
          <div className="skeleton h-56 w-full" />
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard
          icon={<Flame className="h-4 w-4" />}
          accent="bg-accent-orange/20 text-orange-700"
          surface="bg-gradient-to-br from-accent-orange/20 via-white to-accent-yellow/15"
          label={t('avgDailyCalories')}
          value={data ? formatKcal(data.averageCalories, locale) : t('noDataDash')}
          unit={t('avgCaloriesUnit')}
          loading={!data}
        />
        <KpiCard
          icon={<Award className="h-4 w-4" />}
          accent="bg-primary/15 text-primary"
          surface="bg-gradient-to-br from-accent-green/20 via-white to-accent-lime/20"
          label={t('avgProtein')}
          value={data ? Math.round(data.averageProtein).toString() : t('noDataDash')}
          unit={t('avgProteinUnit')}
          loading={!data}
        />
        <KpiCard
          icon={<Calendar className="h-4 w-4" />}
          accent="bg-accent-purple/20 text-accent-purple"
          surface="bg-gradient-to-br from-accent-purple/20 via-white to-accent-blue/15"
          label={t('daysTracked')}
          value={data ? data.daysTracked.toString() : t('noDataDash')}
          unit={data ? t('daysTrackedOf', { total: data.days.length }) : ''}
          loading={!data}
        />
      </div>

      {/* Top foods + Weight */}
      <div className="grid gap-4 md:grid-cols-2">
        <TopFoodsCard data={data} />
        <WeightTrendCard data={data} />
      </div>

      {data?.insight && (
        <div className="card-soft flex items-start gap-3 overflow-hidden bg-gradient-to-br from-accent-purple/20 via-white to-accent-lime/25 p-5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">{tDashboard('aiInsight')}</div>
            <p className="mt-1 text-sm text-muted-foreground">{data.insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Heatmap({ days }: { days: MonthlyDashboardResponse['days'] }) {
  const t = useTranslations('analytics');
  if (days.length === 0) {
    return (
      <EmptyState
        title={t('noTrackingData')}
        description={t('noTrackingDataDesc')}
        ctaLabel={t('snapMealCta')}
        ctaHref="/app/upload"
      />
    );
  }
  // Determine starting weekday (Mon=0..Sun=6) for first day
  const first = new Date(days[0].date);
  const firstWeekday = (first.getUTCDay() + 6) % 7;
  const placeholders = Array.from({ length: firstWeekday });
  const weekdayLabels = [
    t('weekdayMon'),
    t('weekdayTue'),
    t('weekdayWed'),
    t('weekdayThu'),
    t('weekdayFri'),
    t('weekdaySat'),
    t('weekdaySun'),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        {weekdayLabels.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {placeholders.map((_, i) => (
          <div key={`ph-${i}`} className="aspect-square rounded-xl" />
        ))}
        {days.map((day) => {
          const d = new Date(day.date);
          const dayNum = d.getUTCDate();
          const tooltip = day.hasTracking
            ? t('heatmapTooltipTracked', {
                date: day.date,
                kcal: Math.round(day.calories),
                score: day.score,
              })
            : t('heatmapTooltipNoData', { date: day.date });
          return (
            <div
              key={day.date}
              title={tooltip}
              className={cn(
                'group relative aspect-square rounded-xl text-center text-xs font-medium transition',
                intensityClass(day.score, day.hasTracking),
              )}
            >
              <span className="absolute left-1.5 top-1 text-[10px] opacity-80">
                {dayNum}
              </span>
              {day.hasTracking && (
                <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold tabular-nums">
                  {day.score}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  const t = useTranslations('analytics');
  return (
    <div className="hidden items-center gap-1.5 text-[10px] text-muted-foreground sm:flex">
      <span>{t('low')}</span>
      <span className="h-3 w-3 rounded bg-muted" />
      <span className="h-3 w-3 rounded bg-accent-orange/60" />
      <span className="h-3 w-3 rounded bg-accent-yellow/70" />
      <span className="h-3 w-3 rounded bg-primary/60" />
      <span className="h-3 w-3 rounded bg-primary" />
      <span>{t('high')}</span>
    </div>
  );
}

function TopFoodsCard({ data }: { data?: MonthlyDashboardResponse }) {
  const t = useTranslations('analytics');
  const max = data && data.topFoods.length > 0 ? data.topFoods[0].count : 0;
  return (
    <div className="card-soft overflow-hidden bg-gradient-to-br from-accent-green/15 via-white to-accent-yellow/15 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-accent-green/20 text-accent-green shadow-sm">
          <Utensils className="h-4 w-4" />
        </span>
        <div>
          <div className="text-lg font-semibold">{t('topFoods')}</div>
          <div className="text-sm text-muted-foreground">{t('mostTrackedThisMonth')}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {!data ? (
          <>
            <div className="skeleton h-6 w-full" />
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-6 w-2/3" />
          </>
        ) : data.topFoods.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noMealsTracked')}</p>
        ) : (
          data.topFoods.slice(0, 8).map((f) => {
            const ratio = max > 0 ? Math.max(0.06, f.count / max) : 0.06;
            return (
              <div key={f.name} className="flex items-center gap-3">
                <div className="w-32 shrink-0 truncate text-sm font-medium" title={f.name}>
                  {f.name}
                </div>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
                <div className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {f.count}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function WeightTrendCard({ data }: { data?: MonthlyDashboardResponse }) {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const trend = data?.weightTrend ?? [];
  return (
    <div className="card-soft overflow-hidden bg-gradient-to-br from-accent-purple/15 via-white to-accent-blue/15 p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <div className="text-lg font-semibold">{t('weightTrend')}</div>
          <div className="text-sm text-muted-foreground">{t('weightTrendDesc')}</div>
        </div>
      </div>
      <div className="mt-4 h-48">
        {!data ? (
          <div className="skeleton h-full w-full" />
        ) : trend.length === 0 ? (
          <div className="grid h-full place-items-center">
            <p className="text-sm text-muted-foreground">
              {t('noWeightDataDesc')}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend.map((d) => ({ ...d, label: shortDate(d.date, locale) }))}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="card-soft px-3 py-2 text-xs">
                      <div className="font-semibold">{label}</div>
                      <div className="mt-1 tabular-nums text-muted-foreground">
                        {t('tooltipKgValue', {
                          value: (payload[0].value as number).toFixed(1),
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="weightKg"
                stroke="#A78BFA"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#A78BFA' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  accent,
  surface,
  label,
  value,
  unit,
  loading,
}: {
  icon: React.ReactNode;
  /** Tailwind classes for the icon chip (bg + text). */
  accent: string;
  /** Tailwind gradient classes for the card surface; defaults to white. */
  surface?: string;
  label: string;
  value: string;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <div className={cn('card-soft overflow-hidden p-4', surface)}>
      <div className="flex items-center gap-2">
        <span className={cn('grid h-8 w-8 place-items-center rounded-xl shadow-sm', accent)}>
          {icon}
        </span>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="skeleton h-7 w-24" />
        ) : (
          <div className="text-2xl font-semibold tabular-nums leading-tight">{value}</div>
        )}
        {unit && <div className="mt-0.5 text-xs text-muted-foreground">{unit}</div>}
      </div>
    </div>
  );
}

function HitRateCard({
  label,
  hit,
  total,
  color,
  loading,
}: {
  label: string;
  hit: number;
  total: number;
  color: string;
  loading?: boolean;
}) {
  const t = useTranslations('analytics');
  const ratio = total > 0 ? (hit / total) * 100 : 0;
  return (
    <div className="card-soft overflow-hidden bg-gradient-to-br from-white via-accent-lime/10 to-accent-green/10 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        {loading ? (
          <div className="skeleton h-5 w-12" />
        ) : (
          <div className="text-sm font-semibold tabular-nums">
            {t('daysOf', { hit, total })}
          </div>
        )}
      </div>
      <div className="mt-3">
        <Progress value={loading ? 0 : ratio} indicatorClassName={color} />
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
        {loading ? t('noDataDash') : t('weekRatio', { percent: Math.round(ratio) })}
      </div>
    </div>
  );
}
