import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { DEFAULT_LOCALE, isLocale } from './locales';

/**
 * Per-request translation loader. Next-intl calls this once per RSC render and
 * caches the result.
 *
 * We resolve the active locale from:
 *   1. The `NEXT_LOCALE` cookie (set by the language-switcher UI).
 *   2. The first language in `Accept-Language` whose primary tag we ship.
 *   3. The default locale (`en`).
 *
 * This runs without any middleware-driven rewrite — the App Router serves a
 * single flat tree (no `[locale]` segment) and the locale comes purely from
 * the request context. Keeps URLs short while supporting 10 languages.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

  let locale: string = DEFAULT_LOCALE;
  if (cookieLocale && isLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    const accept = headerStore.get('accept-language') ?? '';
    // Take the first language tag like `tr-TR;q=0.9` and strip region/q.
    const primary = accept.split(',')[0]?.split(';')[0]?.trim().toLowerCase();
    const short = primary?.split('-')[0];
    if (short && isLocale(short)) locale = short;
  }

  let messages: AbstractIntlMessages;
  try {
    messages = (await import(`../../messages/${locale}.json`))
      .default as AbstractIntlMessages;
  } catch {
    notFound();
    // notFound() throws, but TS doesn't see that — keep TS happy.
    throw new Error('unreachable');
  }

  return { locale, messages };
});
