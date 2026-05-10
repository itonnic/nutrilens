'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  BarChart3,
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  Home,
  LineChart,
  MoreVertical,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NutriLensMark } from '@/components/illustrations/nutrilens-mark';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const stepStyles = [
  {
    icon: Camera,
    accent: 'bg-accent-lime/40 text-accent-green',
    card: 'from-accent-lime/45 via-white to-accent-green/15 border-accent-lime/45',
  },
  {
    icon: Sparkles,
    accent: 'bg-accent-purple/30 text-accent-purple',
    card: 'from-accent-purple/35 via-white to-accent-teal/15 border-accent-purple/35',
  },
  {
    icon: LineChart,
    accent: 'bg-accent-orange/30 text-accent-orange',
    card: 'from-accent-orange/35 via-white to-accent-yellow/30 border-accent-orange/35',
  },
] as const;

const featureStyles = [
  {
    icon: Sparkles,
    accent: 'text-accent-purple',
    card: 'from-accent-purple/30 via-white to-accent-lime/20 border-accent-purple/30',
    iconBg: 'bg-accent-purple/20',
  },
  {
    icon: NutriLensMark,
    accent: 'text-accent-green',
    card: 'from-accent-green/25 via-white to-accent-teal/20 border-accent-green/30',
    iconBg: 'bg-accent-green/20',
  },
  {
    icon: LineChart,
    accent: 'text-accent-blue',
    card: 'from-accent-blue/30 via-white to-accent-purple/20 border-accent-blue/30',
    iconBg: 'bg-accent-blue/20',
  },
  {
    icon: BookOpen,
    accent: 'text-accent-orange',
    card: 'from-accent-orange/30 via-white to-accent-yellow/25 border-accent-orange/30',
    iconBg: 'bg-accent-orange/20',
  },
] as const;

export default function LandingPage() {
  const t = useTranslations('landing');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  const steps = [
    {
      title: t('stepSnap'),
      description: t('stepSnapDesc'),
      ...stepStyles[0],
    },
    {
      title: t('stepEstimate'),
      description: t('stepEstimateDesc'),
      ...stepStyles[1],
    },
    {
      title: t('stepTrack'),
      description: t('stepTrackDesc'),
      ...stepStyles[2],
    },
  ];

  const features = [
    {
      title: t('featureAi'),
      description: t('featureAiDesc'),
      ...featureStyles[0],
    },
    {
      title: t('featureMacros'),
      description: t('featureMacrosDesc'),
      ...featureStyles[1],
    },
    {
      title: t('featureInsights'),
      description: t('featureInsightsDesc'),
      ...featureStyles[2],
    },
    {
      title: t('featureManual'),
      description: t('featureManualDesc'),
      ...featureStyles[3],
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(184,233,134,.42),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(94,227,216,.25),transparent_28%),linear-gradient(135deg,#F6FBF2_0%,#FBF7EF_48%,#F2ECFF_100%)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 select-none text-[18vw] font-semibold leading-none tracking-[-0.08em] text-foreground/[0.045]"
        >
          NutriLens
        </div>
        <div aria-hidden className="absolute -right-28 top-24 h-72 w-72 rounded-full bg-accent-lime/30 blur-3xl" />
        <div aria-hidden className="absolute -left-24 bottom-20 h-72 w-72 rounded-full bg-accent-purple/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />

        <div className="container relative z-10 flex min-h-[88svh] max-w-7xl flex-col px-4 pb-8 pt-5 sm:pt-8">
          <nav className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 py-1.5 pl-2 pr-4 text-base font-semibold tracking-tight shadow-sm backdrop-blur"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                <NutriLensMark className="h-6 w-6 text-foreground" aria-hidden />
              </span>
              NutriLens
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 p-1 shadow-sm backdrop-blur">
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/login">{tNav('signIn')}</Link>
                </Button>
                <Button asChild size="default" className="sm:h-9 sm:px-4 sm:text-xs">
                  <Link href="/register">{tNav('getStarted')}</Link>
                </Button>
              </div>
            </div>
          </nav>

          <div className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 lg:py-10">
            <div className="relative z-20 max-w-2xl text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                <Camera className="h-3.5 w-3.5 text-accent-purple" aria-hidden />
                {t('tagline')}
              </span>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
                NutriLens
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-foreground/78 sm:text-xl lg:mx-0">
                {t('heroSubtitle')}
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="w-full shadow-card sm:w-auto">
                  <Link href="/register">{t('startTracking')}</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full border-white/70 bg-white/75 backdrop-blur sm:w-auto"
                >
                  <Link href="/login">{tNav('signIn')}</Link>
                </Button>
              </div>
              <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-2 text-left sm:gap-3 lg:mx-0">
                {[
                  ['Photo', 'first'],
                  ['AI', 'reviewable'],
                  ['Free beta', 'no card'],
                ].map(([top, bottom]) => (
                  <div
                    key={top}
                    className="rounded-2xl border border-white/70 bg-white/72 px-3 py-3 shadow-sm backdrop-blur-xl sm:px-4"
                  >
                    <div className="text-sm font-semibold text-foreground">{top}</div>
                    <div className="text-xs text-muted-foreground">{bottom}</div>
                  </div>
                ))}
              </div>
            </div>

            <HeroPhoneShowcase />
          </div>
        </div>
      </section>

      <div className="container relative max-w-6xl px-4 pb-20">
        {/* How it works */}
        <section className="mt-14 sm:mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('howItWorks')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('howItWorksSubtitle')}
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Card
                key={step.title}
                className={cn(
                  'relative overflow-hidden bg-gradient-to-br transition duration-300 hover:-translate-y-1 hover:shadow-soft',
                  step.card,
                )}
              >
                <div
                  aria-hidden
                  className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/55"
                />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold',
                        step.accent,
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'grid h-9 w-9 place-items-center rounded-xl',
                        step.accent,
                      )}
                    >
                      <step.icon className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                  <CardTitle className="mt-4">{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Feature grid */}
        <section className="mt-24 sm:mt-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('featuresTitle')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('featuresSubtitle')}
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className={cn(
                  'relative overflow-hidden bg-gradient-to-br transition duration-300 hover:-translate-y-1 hover:shadow-soft',
                  feature.card,
                )}
              >
                <div
                  aria-hidden
                  className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-white/45"
                />
                <CardHeader>
                  <span
                    className={cn(
                      'relative grid h-11 w-11 place-items-center rounded-2xl shadow-sm',
                      feature.iconBg,
                      feature.accent,
                    )}
                  >
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Demo dashboard mockup */}
        <section className="mt-24 sm:mt-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('demoTitle')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('demoSubtitle')}
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 lg:grid-cols-5">
            {/* Calorie ring card */}
            <Card className="overflow-hidden bg-gradient-to-br from-accent-green/30 via-white to-accent-lime/30 border-accent-green/25 lg:col-span-2">
              <CardHeader>
                <CardDescription>Today</CardDescription>
                <CardTitle>Calories</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <CalorieRing value={1480} target={2100} />
                <div className="text-center">
                  <div className="text-2xl font-semibold tracking-tight tabular-nums">
                    1,480
                    <span className="ml-1 text-base font-normal text-muted-foreground">
                      / 2,100 kcal
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">620 kcal remaining</div>
                </div>
              </CardContent>
            </Card>

            {/* Macros card */}
            <Card className="overflow-hidden bg-gradient-to-br from-accent-orange/20 via-white to-accent-purple/20 border-accent-orange/25 lg:col-span-3">
              <CardHeader>
                <CardDescription>Macros</CardDescription>
                <CardTitle>Daily breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <MacroBar
                  label="Protein"
                  value={92}
                  target={140}
                  unit="g"
                  color="bg-macro-protein"
                />
                <MacroBar
                  label="Carbs"
                  value={168}
                  target={240}
                  unit="g"
                  color="bg-macro-carbs"
                />
                <MacroBar
                  label="Fat"
                  value={48}
                  target={70}
                  unit="g"
                  color="bg-macro-fat"
                />
                <MacroBar
                  label="Fiber"
                  value={22}
                  target={30}
                  unit="g"
                  color="bg-macro-fiber"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Disclaimer */}
        <p className="mx-auto mt-12 max-w-2xl text-center text-xs text-muted-foreground">
          {tCommon('estimateNotMedical')}
        </p>

        {/* Pricing */}
        <section className="mt-16 sm:mt-20">
          <Card className="mx-auto max-w-md overflow-hidden bg-gradient-to-br from-accent-lime/40 via-white to-accent-purple/20 text-center border-accent-green/25">
            <CardHeader>
              <span className="mx-auto inline-flex w-fit items-center gap-2 rounded-full bg-accent-lime/40 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-accent-green/20">
                <Sparkles className="h-3.5 w-3.5 text-accent-green" aria-hidden />
                Beta
              </span>
              <CardTitle className="mt-4 text-2xl">{t('betaTitle')}</CardTitle>
              <CardDescription>
                {t('betaSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full">
                <Link href="/register">{tNav('getStarted')}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/15 text-primary">
                <NutriLensMark className="h-4 w-4 text-foreground" aria-hidden />
              </span>
              <span className="font-medium text-foreground">NutriLens</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t('footer')}
              </Link>
              <span>© {new Date().getFullYear()} NutriLens</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function HeroPhoneShowcase() {
  return (
    <div className="relative mx-auto h-[520px] w-full max-w-[680px] overflow-visible sm:h-[610px] lg:h-[660px]">
      <div aria-hidden className="absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gradient-to-br from-accent-lime/45 via-accent-teal/20 to-accent-purple/25 blur-3xl" />
      <div className="absolute left-1/2 top-3 w-[255px] -translate-x-1/2 sm:top-16 sm:w-[292px] lg:w-[320px]">
        <PhoneFrame className="shadow-[0_34px_90px_rgba(24,38,30,0.28)]">
          <DashboardPreviewScreen />
        </PhoneFrame>
      </div>
      <div className="absolute right-[3%] top-36 hidden w-[218px] rotate-[7deg] opacity-95 md:block lg:right-2 lg:w-[248px]">
        <PhoneFrame compact className="shadow-[0_24px_70px_rgba(24,38,30,0.18)]">
          <CalorieGoalScreen />
        </PhoneFrame>
      </div>
      <div className="absolute bottom-6 left-0 right-0 mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-[1.6rem] border border-white/70 bg-white/70 p-2 shadow-card backdrop-blur-xl sm:bottom-10">
        {[["1.6k", "kcal"], ["92g", "protein"], ["87%", "score"]].map(([value, label]) => (
          <div key={label} className="rounded-[1.15rem] bg-white/70 px-3 py-2 text-center shadow-sm">
            <div className="text-lg font-semibold tabular-nums tracking-tight">{value}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneFrame({
  children,
  className,
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[2.65rem] border-[6px] border-[#172019] bg-[#172019] p-1.5 shadow-[0_22px_70px_rgba(31,36,32,0.18)]',
        compact && 'rounded-[2.35rem] border-[5px]', 
        className,
      )}
    >
      <div className={cn('relative aspect-[9/19] overflow-hidden rounded-[2.2rem] bg-[#F9FAF6]', compact && 'rounded-[1.95rem]')}>
        <div className="absolute left-0 right-0 top-0 z-20 flex h-11 items-center justify-between px-6 pt-3 text-[11px] font-semibold text-foreground">
          <span>9:41</span>
          <span className="h-5 w-16 rounded-full bg-[#172019]" />
          <span className="flex items-center gap-1">
            <span className="h-2 w-3 rounded-sm border border-foreground" />
          </span>
        </div>
        <div className="h-full pt-12">{children}</div>
      </div>
    </div>
  );
}

function PhotoInsightScreen() {
  const tNav = useTranslations('nav');
  return (
    <div className="relative h-full overflow-hidden bg-[#FAFAF6] px-5 pb-5 text-center">
      <div className="relative z-10 pt-8">
        <div className="text-3xl font-semibold tracking-tight text-accent-green">
          AI Food
        </div>
        <div className="mt-3 text-3xl font-light leading-tight text-foreground/75">
          Insights At
        </div>
        <div className="text-3xl font-semibold leading-tight text-foreground">
          Your Fingertips
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[54%]">
        <Image
          src="/images/nutrilens-social-preview.png"
          alt=""
          aria-hidden
          fill
          sizes="260px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#FAFAF6]/20" />
      </div>

      {[
        ['250 Kcal', 'left-7 bottom-[38%] rotate-[8deg]'],
        ['90 Kcal', 'left-1/2 bottom-[30%] -translate-x-1/2 -rotate-[6deg]'],
        ['525 Kcal', 'right-5 bottom-[43%] -rotate-[8deg]'],
      ].map(([label, className]) => (
        <div
          key={label}
          className={cn(
            'absolute z-10 rounded-full border border-accent-orange/25 bg-white/80 px-3 py-1 text-[10px] font-medium text-foreground shadow-sm backdrop-blur',
            className,
          )}
        >
          {label}
        </div>
      ))}

      <Link
        href="/register"
        className="absolute inset-x-5 bottom-5 z-20 flex h-12 items-center justify-between rounded-full bg-white px-2 pl-3 text-sm font-semibold text-foreground shadow-card"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" aria-hidden />
        </span>
        {tNav('getStarted')}
        <span className="pr-3 text-muted-foreground">&gt;&gt;</span>
      </Link>
    </div>
  );
}

function DashboardPreviewScreen() {
  return (
    <div className="h-full bg-[linear-gradient(180deg,#FBFEF7_0%,#F3F7EF_100%)] px-4 pb-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold tracking-tight">Hello, John</div>
          <div className="text-[11px] text-muted-foreground">Monday Mar 22</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-orange/20 text-xs font-semibold">
          JL
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.55rem] bg-[linear-gradient(135deg,#16261B_0%,#1A9F71_58%,#B8E986_100%)] p-5 text-white shadow-card">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_42%,rgba(255,255,255,.22),transparent_38%)]" />
        <div className="relative mx-auto grid h-40 place-items-center">
          <div className="absolute h-32 w-32 rounded-full border-[14px] border-white/40 border-l-white" />
          <div className="text-center">
            <div className="text-3xl font-semibold tabular-nums">1620</div>
            <div className="text-xs">Kcal</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MetricTile value="92" label="Protein" unit="g" className="bg-white/85 shadow-sm" />
        <MetricTile value="620" label="Left" unit="kcal" className="bg-accent-yellow/70 shadow-sm" />
      </div>

      <div className="mt-4 text-sm font-semibold">Today's Meal</div>
      <div className="mt-2 rounded-[1.45rem] bg-white/82 p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>Breakfast</span>
          <span className="text-[10px] font-medium text-foreground/55">05.00pm-07.00pm</span>
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((item) => (
              <span
                key={item}
                className={cn(
                  'h-8 w-8 rounded-full border-2 border-white shadow-sm',
                  item === 0 && 'bg-accent-green',
                  item === 1 && 'bg-accent-orange',
                  item === 2 && 'bg-accent-yellow',
                )}
              />
            ))}
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-accent-blue text-white">
              <Plus className="h-5 w-5" aria-hidden />
            </span>
          </div>
          <div className="text-xl font-semibold tabular-nums">742 kcal</div>
        </div>
      </div>

      <PhoneBottomNav active="Home" />
    </div>
  );
}

function CalorieGoalScreen() {
  const tCommon = useTranslations('common');
  return (
    <div className="h-full bg-[linear-gradient(180deg,#FBFEF7_0%,#F7F0FF_100%)] px-4 pb-4">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          aria-label={tCommon('back')}
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-foreground shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div className="text-base font-semibold">Calorie Goal</div>
        <button
          type="button"
          aria-label="More options"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-foreground shadow-sm"
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="mx-auto grid h-44 w-44 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#B8E986,#08BD84_55%,#087A5C)] text-white shadow-soft">
        <div className="text-center">
          <div className="text-4xl font-light tabular-nums">2650</div>
          <div className="text-xs font-medium opacity-80">Kilo Calories</div>
        </div>
      </div>

      <div className="relative mx-auto mt-6 h-12 rounded-2xl bg-gradient-to-r from-accent-teal/25 via-[#08BD84]/75 to-accent-teal/25">
        <div className="absolute left-[58%] top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-2xl border-2 border-white bg-[#009F70] text-white shadow-card">
          <Camera className="h-5 w-5" aria-hidden />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <SmallMacro value="122g" label="Protein" dot="bg-[#08BD84]" />
        <SmallMacro value="55g" label="Carbs" dot="bg-accent-lime" />
        <SmallMacro value="10g" label="Nutrients" dot="bg-foreground" />
      </div>

      <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-center text-[11px] font-medium text-primary">
        You are on track
      </div>
      <Link
        href="/register"
        className="mt-4 flex h-11 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-white"
      >
        Set Calorie Goal
      </Link>

      <PhoneBottomNav active="Analysis" floating />
    </div>
  );
}

function MetricTile({
  value,
  label,
  unit,
  className,
}: {
  value: string;
  label: string;
  unit: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[1.25rem] p-4', className)}>
      <div className="text-2xl font-semibold tabular-nums">
        {value}
        <span className="ml-1 text-xs font-normal">{unit}</span>
      </div>
      <div className="mt-4 text-xs text-foreground/70">{label}</div>
    </div>
  );
}

function SmallMacro({ value, label, dot }: { value: string; label: string; dot: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-2 py-4 text-center shadow-sm">
      <span className={cn('mx-auto block h-4 w-4 rounded-full', dot)} />
      <div className="mt-3 text-base font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function PhoneBottomNav({
  active,
  floating = false,
}: {
  active: 'Home' | 'Analysis';
  floating?: boolean;
}) {
  const items = [
    { label: 'Home', icon: Home },
    { label: 'Meals', icon: Utensils },
    { label: 'Analysis', icon: BarChart3 },
  ] as const;

  return (
    <div className="absolute inset-x-0 bottom-0 rounded-t-[1.6rem] bg-white px-5 pb-4 pt-3 shadow-[0_-12px_35px_rgba(31,36,32,0.08)]">
      {floating && (
        <span className="absolute left-1/2 top-0 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card">
          <Plus className="h-6 w-6" aria-hidden />
        </span>
      )}
      <div className="flex items-end justify-between text-[10px]">
        {items.map((item) => (
          <span
            key={item.label}
            className={cn(
              'flex flex-col items-center gap-1',
              active === item.label ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CalorieRing({ value, target }: { value: number; target: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, value / target);
  const dash = circumference * ratio;
  return (
    <div
      className="relative h-36 w-36"
      role="progressbar"
      aria-label="Calories logged"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${target} calories logged`}
    >
      <svg viewBox="0 0 140 140" className="ring-progress h-full w-full" aria-hidden>
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#67B26F" />
            <stop offset="100%" stopColor="#B8E986" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {Math.round(ratio * 100)}%
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            of goal
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <div
      role="progressbar"
      aria-label={`${label} progress`}
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={value}
      aria-valuetext={`${value}${unit} of ${target}${unit}`}
    >
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value}
          {unit} / {target}
          {unit}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
