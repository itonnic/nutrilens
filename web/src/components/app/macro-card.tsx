'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { pct } from '@/lib/utils';

interface MacroCardProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: 'protein' | 'carbs' | 'fat' | 'fiber' | 'water';
  decimals?: number;
}

const COLOR_TO_VAR: Record<MacroCardProps['color'], string> = {
  protein: '#67B26F',
  carbs: '#F7D774',
  fat: '#A78BFA',
  fiber: '#5EE3D8',
  water: '#7CC5FF',
};

// Subtle gradient surface per macro so the four cards on the dashboard read as
// distinct color territories rather than four identical white tiles.
const COLOR_TO_SURFACE: Record<MacroCardProps['color'], string> = {
  protein: 'bg-gradient-to-br from-accent-green/15 via-white to-accent-lime/20',
  carbs: 'bg-gradient-to-br from-accent-yellow/25 via-white to-accent-orange/15',
  fat: 'bg-gradient-to-br from-accent-purple/20 via-white to-accent-purple/5',
  fiber: 'bg-gradient-to-br from-accent-teal/25 via-white to-accent-green/10',
  water: 'bg-gradient-to-br from-accent-blue/25 via-white to-accent-teal/15',
};

export function MacroCard({
  label,
  value,
  target,
  unit = 'g',
  color,
  decimals = 0,
  className,
}: MacroCardProps & { className?: string }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <div className={cn('card-soft overflow-hidden p-4', COLOR_TO_SURFACE[color], className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value.toFixed(decimals)}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: COLOR_TO_VAR[color] }}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">{pct(value, target)}%</div>
    </div>
  );
}
