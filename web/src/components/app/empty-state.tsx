'use client';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  /** A lucide icon (or any node). Defaults to Sparkles. */
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'card-soft flex flex-col items-center gap-3 overflow-hidden bg-gradient-to-br from-accent-lime/25 via-white to-accent-purple/15 p-8 text-center',
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
        {icon ?? <Sparkles className="h-6 w-6" aria-hidden />}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {ctaLabel && ctaHref && (
        <Button asChild size="sm">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
