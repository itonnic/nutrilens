import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';
import { isRtl, type Locale } from '@/i18n/locales';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Locale-aware page metadata. Next.js calls this on every request and Next-intl
 * resolves the active locale from the same cookie/header chain we use in
 * `src/i18n/request.ts`, so search engines and social-card scrapers get
 * translated `<title>` + `<meta description>` per locale.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  const title = t('metaTitle');
  const description = t('metaDescription');
  const ogDescription = t('ogDescription');
  const ogAlt = t('ogAlt');

  return {
    metadataBase: new URL(appUrl),
    title,
    description,
    applicationName: t('appName'),
    openGraph: {
      title,
      description: ogDescription,
      images: [
        {
          url: '/images/nutrilens-social-preview.png',
          width: 1731,
          height: 909,
          alt: ogAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: ['/images/nutrilens-social-preview.png'],
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#F8F7F2',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // next-intl middleware has already resolved the locale by the time this
  // renders. We pull the resolved locale + messages from the request scope so
  // every server tree under here can call `useTranslations(...)` for free.
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = isRtl(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${geist.variable} font-sans`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
