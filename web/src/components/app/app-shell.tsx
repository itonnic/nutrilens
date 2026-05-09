'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { BookOpen, Camera, Home, LineChart, Settings } from 'lucide-react';
import { NutriLensMark } from '@/components/illustrations/nutrilens-mark';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLogout, useCurrentUser } from '@/hooks/use-auth';
import { LanguageSwitcher } from '@/components/app/language-switcher';

// Hrefs are static; labels are pulled from the `nav` namespace at render time
// so the bottom bar + desktop nav update instantly when the user switches
// locale.
type NavItem = {
  href: string;
  labelKey: 'today' | 'diary' | 'upload' | 'insights' | 'profile';
  icon: typeof Home;
  primary?: boolean;
};

const NAV: readonly NavItem[] = [
  { href: '/app', labelKey: 'today', icon: Home },
  { href: '/app/meals', labelKey: 'diary', icon: BookOpen },
  { href: '/app/upload', labelKey: 'upload', icon: Camera, primary: true },
  { href: '/app/analytics', labelKey: 'insights', icon: LineChart },
  { href: '/app/profile', labelKey: 'profile', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout();
  const { data: user } = useCurrentUser({ enabled: true });
  const t = useTranslations('nav');

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <NutriLensMark className="h-5 w-5 text-foreground" aria-hidden />
            </span>
            NutriLens
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-white hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.name ?? ''}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              {t('signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/40 bg-background/85 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5 items-center px-2 py-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="-mt-6 mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft"
                  aria-label={t(item.labelKey)}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
