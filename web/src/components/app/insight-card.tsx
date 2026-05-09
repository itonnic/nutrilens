'use client';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  text: string | null | undefined;
  title?: string;
  className?: string;
}

/**
 * Small card used to surface AI-generated insights on the daily / weekly /
 * monthly dashboards. Renders nothing when `text` is empty.
 */
export function InsightCard({ text, title = 'AI insight', className }: InsightCardProps) {
  if (!text) return null;
  return (
    <div
      className={cn(
        'card-soft overflow-hidden bg-gradient-to-br from-accent-purple/20 via-white to-accent-lime/20 p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-accent-purple/20 text-accent-purple shadow-sm">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}
