'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Clock, Sparkles, AlertCircle, UtensilsCrossed } from 'lucide-react';
import type { MealResponse } from '@nutrilens/shared';
import { cn, formatTime } from '@/lib/utils';

function ConfidenceBadge({ value }: { value: number }) {
  const tDetail = useTranslations('mealDetail');
  const tone =
    value >= 0.75
      ? 'bg-emerald-100/80 text-emerald-700'
      : value >= 0.5
        ? 'bg-amber-100/80 text-amber-800'
        : 'bg-red-100/80 text-red-700';
  const percent = Math.round(value * 100);
  return (
    <span
      title={tDetail('aiConfidence', { percent })}
      className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
        tone,
      )}
    >
      {percent}%
    </span>
  );
}

export function MealCard({ meal, href }: { meal: MealResponse; href?: string }) {
  const url = href ?? `/app/meals/${meal.id}`;
  const tDiary = useTranslations('diary');
  const tMealTypes = useTranslations('mealTypes');
  const locale = useLocale();
  const [imageFailed, setImageFailed] = useState(false);
  const showThumbnail = Boolean(meal.thumbnailUrl && !imageFailed);
  // Subtle status-based tint so the diary doesn't read as a wall of identical
  // white cards. Keeps the same component contract.
  const tone =
    meal.status === 'DRAFT'
      ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/40'
      : meal.status === 'NEEDS_REVIEW'
        ? 'bg-gradient-to-br from-accent-orange/10 via-white to-accent-yellow/15'
        : 'bg-gradient-to-br from-accent-lime/15 via-white to-accent-green/10';
  return (
    <Link
      href={url}
      className={cn(
        'card-soft group flex items-center gap-3 overflow-hidden p-3 transition hover:-translate-y-0.5 hover:shadow-soft sm:gap-4',
        tone,
      )}
    >
      <div className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl bg-gradient-to-br from-accent-lime/30 via-white to-accent-orange/20 shadow-sm sm:h-24 sm:w-24">
        {showThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.thumbnailUrl!}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-accent-green">
            <UtensilsCrossed className="h-7 w-7" aria-hidden />
          </div>
        )}
        {meal.status !== 'CONFIRMED' && (
          <div className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-white/90 px-2 py-1 text-center text-[10px] font-semibold leading-none text-amber-900 shadow-sm backdrop-blur">
            {meal.status === 'DRAFT' ? tDiary('mealAnalyzing') : tDiary('mealReview')}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(meal.consumedAt, locale)}
          </span>
          <span aria-hidden>·</span>
          <span className="truncate">{tMealTypes(meal.mealType)}</span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5">
            {meal.confidence !== null && meal.source === 'AI' && (
              <ConfidenceBadge value={meal.confidence} />
            )}
            {meal.source === 'AI' && (
              <span className="inline-flex items-center gap-1 text-primary">
                <Sparkles className="h-3 w-3" />
                {tDiary('aiBadge')}
              </span>
            )}
          </span>
        </div>
        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{meal.title}</div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{Math.round(meal.calories)} kcal</span>
          <span>P {Math.round(meal.protein)}g</span>
          <span>C {Math.round(meal.carbs)}g</span>
          <span>F {Math.round(meal.fat)}g</span>
        </div>
      </div>
      {meal.confidence !== null && meal.confidence < 0.6 && (
        <AlertCircle className="h-4 w-4 flex-none text-amber-500" />
      )}
    </Link>
  );
}

export function MealCardSkeleton() {
  return (
    <div className={cn('card-soft flex items-center gap-4 p-3')}>
      <div className="skeleton h-20 w-20 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
