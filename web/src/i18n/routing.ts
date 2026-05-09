import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from './locales';

/**
 * Routing config for next-intl.
 *
 * `localePrefix: 'never'` — every locale is served from the same un-prefixed
 * URL (e.g. `/login`, `/app`, `/app/upload`). The active locale comes from the
 * `NEXT_LOCALE` cookie that the language-switcher writes, with a fallback to
 * the `Accept-Language` header. This keeps URLs short and lets us use a single
 * App Router tree (no `[locale]` segment needed).
 *
 * If you ever want SEO-distinct URLs per locale, switch this to `'always'`
 * AND restructure the `app/` directory under `app/[locale]/...`.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'never',
});

/**
 * Locale-aware drop-in replacements for `next/link` and `next/navigation`.
 *
 * Usage:
 *   import { Link, useRouter } from '@/i18n/routing-helpers';
 *
 *   <Link href="/app/upload">Upload</Link>
 *   router.push('/app');
 *
 * Both will preserve the current locale — no manual prefixing needed.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
