/**
 * Server-side locale handling for AI prompts and insight messages.
 *
 * The web app already has its own `src/i18n/locales.ts` with the same list —
 * the two must stay in sync. This duplicate exists because the api package
 * doesn't depend on the web package, and putting it in `@nutrilens/shared`
 * would mean every server imports React-flavoured i18n types it doesn't need.
 */

export const SUPPORTED_LOCALES = [
  'en',
  'tr',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ar',
  'ja',
  'zh',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Long-form names we feed to LLM prompts. Keeping these out of band of the UI
 * locale codes lets us tell Gemini "Respond in Brazilian Portuguese" instead of
 * "Respond in pt", which produces noticeably better adherence.
 */
const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  tr: 'Turkish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Brazilian Portuguese',
  ar: 'Modern Standard Arabic',
  ja: 'Japanese',
  zh: 'Simplified Chinese',
};

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Resolve a `Accept-Language` HTTP header into one of our supported locales.
 *
 * The header looks like `tr-TR,tr;q=0.9,en-US;q=0.8` — we walk through the
 * candidates in order, strip the region (`tr-TR` → `tr`) and quality factor,
 * and return the first one we ship. Falls back to `en` when nothing matches.
 */
export function resolveLocaleFromHeader(header?: string | null): SupportedLocale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header.split(',');
  for (const raw of candidates) {
    const [tag] = raw.split(';');
    if (!tag) continue;
    const trimmed = tag.trim().toLowerCase();
    const primary = trimmed.split('-')[0];
    if (isSupportedLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}

export function localeToLanguageName(locale: SupportedLocale): string {
  return LANGUAGE_NAMES[locale];
}
