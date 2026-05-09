'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Mirror to the browser console so the user can copy the digest if they
    // want to report it. Server-side reporting hooks plug in here later.
    // eslint-disable-next-line no-console
    console.error('GlobalError boundary caught:', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card-soft mx-auto max-w-md p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-700">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">{t('boundaryTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('boundaryDesc')}
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {t('refPrefix', { digest: error.digest })}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()}>
            <RefreshCw className="h-4 w-4" />
            {t('tryAgain')}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/app">{t('backToDashboard')}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
