'use client';

import { Link, useRouter } from '@/i18n/routing';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NutriLensMark } from '@/components/illustrations/nutrilens-mark';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { LoginSchema, type LoginInput } from '@nutrilens/shared';
import { api, ApiError, setToken } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/toaster';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  // We read the reason from window.location instead of useSearchParams() so
  // this page can be statically generated (useSearchParams forces a CSR bailout
  // and demands a Suspense boundary in Next.js 15).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reason = new URLSearchParams(window.location.search).get('reason');
    if (reason === 'expired') {
      toast({
        title: t('sessionExpired'),
        description: t('sessionExpiredDesc'),
        variant: 'default',
      });
    }
  }, [toast, t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    try {
      const result = await api.login(values);
      setToken(result.accessToken);
      toast({
        title: t('welcomeToast'),
        description: t('welcomeToastDesc', { name: result.user.name }),
        variant: 'success',
      });
      router.push(result.user.hasOnboarded ? '/app' : '/app/onboarding');
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401
            ? t('invalidCredentials')
            : err.message
          : tErrors('generic');
      toast({
        title: t('signInFailed'),
        description: message,
        variant: 'error',
      });
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute right-4 top-4 z-20">
        <LanguageSwitcher />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-accent-lime/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent-purple/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-accent-orange/20 blur-3xl"
      />

      <div className="container relative flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <NutriLensMark className="h-5 w-5 text-foreground" aria-hidden />
            </span>
            {tCommon('appName')}
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            {tCommon('tagline')}
          </p>
        </div>

        <Card className="overflow-hidden bg-gradient-to-br from-accent-lime/20 via-white to-accent-purple/20">
          <CardHeader>
            <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
            <CardDescription>{t('welcomeBackSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {t('forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  {...register('password')}
                />
                {errors.password && (
                  <p id="password-error" className="text-xs text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('signingIn')}
                  </>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('createOne')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground/80">
          {t('demoHint')}
        </p>
      </div>
    </main>
  );
}
