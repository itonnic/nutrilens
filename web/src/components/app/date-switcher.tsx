'use client';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateSwitcherProps {
  label: string;
  isToday: boolean;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}

/**
 * Pill-shaped prev / today / next switcher used by the daily dashboard and the
 * weekly/monthly analytics tabs. Future bound is enforced via `canGoForward`.
 */
export function DateSwitcher({
  label,
  isToday,
  canGoForward,
  onPrev,
  onNext,
  onToday,
  className,
}: DateSwitcherProps) {
  const t = useTranslations('common');
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-white bg-white/80 p-1 shadow-sm',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrev}
        aria-label={t('previous')}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <button
        type="button"
        onClick={onToday}
        disabled={isToday}
        className={cn(
          'h-9 rounded-full px-4 text-sm font-medium transition-colors',
          isToday
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted/40',
        )}
      >
        {isToday ? t('today') : label}
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!canGoForward}
        aria-label={t('next')}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
