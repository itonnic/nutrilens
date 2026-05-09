import { ArrowLeft, Compass } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Not found — NutriLens',
};

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card-soft mx-auto max-w-md overflow-hidden bg-gradient-to-br from-accent-purple/25 via-white to-accent-lime/25 p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-purple/20 text-accent-purple shadow-sm">
          <Compass className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t('pageNotFoundTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('notFoundDesc')}
        </p>
        <Button asChild className="mt-6">
          <Link href="/app">
            <ArrowLeft className="h-4 w-4" />
            {t('backToDashboard')}
          </Link>
        </Button>
      </div>
    </main>
  );
}
