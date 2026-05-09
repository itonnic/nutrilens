'use client';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatKcal } from '@/lib/utils';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  className?: string;
}

export function CalorieRing({ consumed, target, size = 168, className }: CalorieRingProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, consumed / target) : 0;
  const offset = circumference * (1 - ratio);
  const remaining = Math.max(0, target - consumed);

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg className="ring-progress absolute inset-0" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={12}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#calorieGradient)"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="calorieGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67B26F" />
            <stop offset="100%" stopColor="#B8E986" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-3xl font-semibold leading-none tabular-nums">
          {formatKcal(consumed, locale)}
        </div>
        <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
          / {formatKcal(target, locale)} kcal
        </div>
        <div className="mt-2 text-sm font-medium text-primary">
          {remaining > 0
            ? t('kcalLeft', { kcal: formatKcal(remaining, locale) })
            : t('targetReached')}
        </div>
      </div>
    </div>
  );
}
