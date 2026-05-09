import { ArrowLeft, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NutriLensMark } from '@/components/illustrations/nutrilens-mark';
import { LanguageSwitcher } from '@/components/app/language-switcher';

export const metadata = {
  title: 'Forgot password — NutriLens',
};

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');

  const supportEmail = 'hello@nutrilens.app';
  const betaBody = t('forgotBetaBody', { email: supportEmail });
  const emailIndex = betaBody.indexOf(supportEmail);
  const beforeEmail = emailIndex >= 0 ? betaBody.slice(0, emailIndex) : betaBody;
  const afterEmail =
    emailIndex >= 0 ? betaBody.slice(emailIndex + supportEmail.length) : '';

  return (
    <main className="relative grid min-h-screen overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent-blue/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-purple/30 blur-3xl"
      />

      <div className="relative m-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2 text-base font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary shadow-sm">
            <NutriLensMark className="h-4 w-4 text-foreground" aria-hidden />
          </span>
          {tCommon('appName')}
        </div>

        <Card className="overflow-hidden bg-gradient-to-br from-accent-blue/20 via-white to-accent-purple/20 p-7">
          <CardHeader>
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-accent-blue/20 text-accent-blue shadow-sm">
              <Mail className="h-5 w-5" aria-hidden />
            </div>
            <CardTitle>{t('forgotTitle')}</CardTitle>
            <CardDescription>
              {t('forgotSubtitle')}
            </CardDescription>
          </CardHeader>

          <div className="mt-6 overflow-hidden rounded-2xl border border-accent-yellow/40 bg-gradient-to-br from-accent-yellow/30 via-white to-accent-orange/15 p-4 text-sm text-muted-foreground shadow-sm">
            <p className="font-medium text-foreground">{t('forgotBetaTitle')}</p>
            <p className="mt-1">
              {beforeEmail}
              <a
                href={`mailto:${supportEmail}?subject=Password%20reset`}
                className="font-medium text-primary"
              >
                {supportEmail}
              </a>
              {afterEmail}
            </p>
          </div>

          <Button asChild variant="ghost" className="mt-6 w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4" />
              {t('backToSignIn')}
            </Link>
          </Button>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/register" className="font-medium text-primary">
            {t('createOne')}
          </Link>
        </p>
      </div>
    </main>
  );
}
