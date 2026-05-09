import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { NutriLensMark } from '@/components/illustrations/nutrilens-mark';

export async function generateMetadata() {
  const t = await getTranslations('privacy');
  return {
    title: t('metaTitle'),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const tCommon = await getTranslations('common');
  const contactEmail = t('contactEmail');
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent-teal/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 h-96 w-96 rounded-full bg-accent-purple/25 blur-3xl"
      />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 text-base font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <NutriLensMark className="h-4 w-4 text-foreground" aria-hidden />
            </span>
            {t('appName')}
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              {tCommon('back')}
            </Link>
          </Button>
        </div>

        <article className="card-soft prose prose-sm max-w-none overflow-hidden bg-gradient-to-br from-white via-accent-teal/15 to-accent-purple/15 p-8 prose-headings:font-semibold">
          <h1 className="mb-2 text-2xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('lastUpdated')}</p>

          <section className="mt-6 space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-semibold">{t('h1')}</h2>
            <p>{t('p1')}</p>

            <h2 className="text-lg font-semibold">{t('h2')}</h2>
            <p>{t('p2')}</p>

            <h2 className="text-lg font-semibold">{t('h3')}</h2>
            <p>{t('p3')}</p>

            <h2 className="text-lg font-semibold">{t('h4')}</h2>
            <p>{t('p4')}</p>

            <h2 className="text-lg font-semibold">{t('h5')}</h2>
            <ul className="list-disc pl-5">
              <li>{t('li1')}</li>
              <li>{t('li2')}</li>
              <li>{t('li3')}</li>
              <li>{t('li4')}</li>
            </ul>

            <h2 className="text-lg font-semibold">{t('h6')}</h2>
            <p>
              {t('p6')}{' '}
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium text-primary"
              >
                {contactEmail}
              </a>
              .
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
