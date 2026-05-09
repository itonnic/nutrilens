'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Globe } from 'lucide-react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  type Locale,
} from '@/i18n/locales';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  /** "compact" shows only the flag/code; "full" shows the language name. */
  variant?: 'compact' | 'full';
}

/**
 * Locale picker. Persists the choice via the `NEXT_LOCALE` cookie that
 * next-intl middleware reads on the next request, and re-routes to the same
 * pathname under the chosen locale prefix.
 */
export function LanguageSwitcher({ className, variant = 'compact' }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations('language');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    // Persist the choice — the cookie is read in `src/i18n/request.ts` on the
    // next request to pick translation messages.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => {
      // `router.refresh()` re-runs the RSC render so every server-translated
      // string updates immediately without a full reload.
      router.refresh();
      setOpen(false);
    });
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('label')}
        disabled={isPending}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-white',
          isPending && 'opacity-60',
        )}
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <span aria-hidden>{LOCALE_FLAGS[locale]}</span>
        {variant === 'full' && <span>{LOCALE_LABELS[locale]}</span>}
        {variant === 'compact' && (
          <span className="uppercase text-muted-foreground">{locale}</span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white via-accent-lime/10 to-accent-purple/10 p-1 shadow-card backdrop-blur"
          >
            {LOCALES.map((code) => {
              const selected = code === locale;
              return (
                <li key={code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(code)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
                      selected
                        ? 'bg-primary/10 font-semibold text-foreground'
                        : 'hover:bg-white/80',
                    )}
                  >
                    <span aria-hidden className="text-base">
                      {LOCALE_FLAGS[code]}
                    </span>
                    <span className="flex-1">{LOCALE_LABELS[code]}</span>
                    {selected && <Check className="h-4 w-4 text-primary" aria-hidden />}
                    {code === DEFAULT_LOCALE && !selected && (
                      <span className="text-[10px] uppercase text-muted-foreground">
                        default
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
