import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayIso(): string {
  return new Date().toISOString();
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfWeekUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const offset = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - offset);
  return d;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pct(value: number, target: number): number {
  if (!target) return 0;
  return clamp(Math.round((value / target) * 100), 0, 999);
}

/**
 * Format a kcal value using the user's locale grouping (e.g. `1,234` in en-US,
 * `1.234` in de-DE, `1٬234` in ar). Pass `locale` from the component (via
 * `useLocale()`) to avoid the implicit-browser-locale gotcha during SSR.
 */
export function formatKcal(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale).format(Math.round(value));
}

export function formatGrams(value: number, digits = 0): string {
  // The "g" suffix is universal across our supported locales — no l10n needed.
  return `${value.toFixed(digits)}g`;
}

export function formatTime(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
