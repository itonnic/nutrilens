/**
 * Single source of truth for the locales the app supports.
 *
 * Adding a new locale:
 *   1. add the code to `LOCALES` below
 *   2. drop a `messages/<code>.json` next to `messages/en.json`
 *   3. add a label to `LOCALE_LABELS`
 *
 * The default locale (`en`) is rendered without a path prefix:
 *   /login          → English
 *   /tr/login       → Turkish
 *   /fr/login       → French
 */
export const LOCALES = [
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

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Languages that read right-to-left. We flip <html dir="rtl"> for these. */
export const RTL_LOCALES: readonly Locale[] = ['ar'];

/** Labels shown in the language switcher (in the language itself). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ar: 'العربية',
  ja: '日本語',
  zh: '中文',
};

/** Two-letter flag code (used to render an emoji flag in the switcher). */
export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  tr: '🇹🇷',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  ar: '🇸🇦',
  ja: '🇯🇵',
  zh: '🇨🇳',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
