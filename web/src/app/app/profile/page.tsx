'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Droplet,
  Loader2,
  LogOut,
  Mail,
  RefreshCcw,
  Trash2,
  User,
  Wheat,
} from 'lucide-react';
import {
  UpdateProfileSchema,
  type UpdateProfileInput,
  NutritionTargetsSchema,
  type NutritionTargetsInput,
  type ProfileResponse,
  computeNutritionTargets,
} from '@nutrilens/shared';
import { api } from '@/lib/api-client';
import { useCurrentUser, useLogout, useRequireAuth } from '@/hooks/use-auth';
import { useToast } from '@/components/ui/toaster';
import { AppShell } from '@/components/app/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DietaryPref = NonNullable<UpdateProfileInput['dietaryPreferences']>[number];

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  if (authLoading || !user) {
    return (
      <AppShell>
        <PageLoading />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProfileTabs />
    </AppShell>
  );
}

function ProfileTabs() {
  const t = useTranslations('profile');
  const profileQuery = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto md:w-auto">
          <TabsTrigger value="profile">{t('tabProfile')}</TabsTrigger>
          <TabsTrigger value="targets">{t('tabTargets')}</TabsTrigger>
          <TabsTrigger value="weight">{t('tabWeight')}</TabsTrigger>
          <TabsTrigger value="account">{t('tabAccount')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {profileQuery.isLoading ? (
            <SectionSkeleton />
          ) : profileQuery.data ? (
            <ProfileForm profile={profileQuery.data} />
          ) : (
            <ErrorBox message={t('couldNotLoadProfile')} />
          )}
        </TabsContent>

        <TabsContent value="targets">
          {profileQuery.isLoading ? (
            <SectionSkeleton />
          ) : profileQuery.data ? (
            <TargetsForm profile={profileQuery.data} />
          ) : (
            <ErrorBox message={t('couldNotLoadTargets')} />
          )}
        </TabsContent>

        <TabsContent value="weight">
          <WeightLog />
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Profile tab ---------- */

function ProfileForm({ profile }: { profile: ProfileResponse }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('profile');

  const dietOptions: { value: DietaryPref; labelKey: string }[] = [
    { value: 'VEGETARIAN', labelKey: 'dietVegetarian' },
    { value: 'VEGAN', labelKey: 'dietVegan' },
    { value: 'LOW_CARB', labelKey: 'dietLowCarb' },
    { value: 'HIGH_PROTEIN', labelKey: 'dietHighProtein' },
    { value: 'GLUTEN_FREE', labelKey: 'dietGlutenFree' },
    { value: 'LACTOSE_FREE', labelKey: 'dietLactoseFree' },
  ];

  const activityLabels: Record<string, string> = {
    SEDENTARY: t('activitySedentary'),
    LIGHT: t('activityLight'),
    MODERATE: t('activityModerate'),
    ACTIVE: t('activityActive'),
    VERY_ACTIVE: t('activityVeryActive'),
  };

  const defaults: UpdateProfileInput = {
    age: profile.age ?? 30,
    gender: profile.gender ?? 'OTHER',
    heightCm: profile.heightCm ?? 170,
    weightKg: profile.weightKg ?? 70,
    activityLevel: profile.activityLevel ?? 'MODERATE',
    goalType: profile.goalType ?? 'MAINTAIN',
    goalSpeed: profile.goalSpeed ?? 'BALANCED',
    targetWeightKg: profile.targetWeightKg ?? null,
    dietaryPreferences:
      (profile.dietaryPreferences as DietaryPref[] | undefined) ?? [],
    customDietNotes: profile.customDietNotes ?? '',
    unitSystem: profile.unitSystem ?? 'METRIC',
    timezone:
      profile.timezone ??
      (typeof window !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'UTC'),
  };

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });

  const goalType = form.watch('goalType');
  const showSpeed = goalType === 'LOSE' || goalType === 'GAIN';
  const showTarget = goalType === 'LOSE' || goalType === 'GAIN';

  const mutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => api.updateProfile(input),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      toast({ title: t('profileUpdated'), variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('updateFailed');
      toast({ title: t('couldNotSave'), description: msg, variant: 'error' });
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    // Normalize empty notes to null
    const payload: UpdateProfileInput = {
      ...values,
      customDietNotes: values.customDietNotes?.trim()
        ? values.customDietNotes
        : null,
      targetWeightKg: showTarget ? values.targetWeightKg ?? null : null,
    };
    mutation.mutate(payload);
  });

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-accent-green/15 via-white to-accent-lime/20">
      <CardHeader>
        <CardTitle>{t('personalInfo')}</CardTitle>
        <CardDescription>{t('personalInfoDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('ageLabel')} htmlFor="age">
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                min={10}
                max={120}
                {...form.register('age', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('genderLabel')} htmlFor="gender">
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(v) =>
                      field.onChange(v as UpdateProfileInput['gender'])
                    }
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder={t('selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">{t('genderMale')}</SelectItem>
                      <SelectItem value="FEMALE">{t('genderFemale')}</SelectItem>
                      <SelectItem value="OTHER">{t('genderOther')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label={t('heightLabel')} htmlFor="heightCm">
              <Input
                id="heightCm"
                type="number"
                inputMode="numeric"
                min={100}
                max={260}
                step="0.1"
                {...form.register('heightCm', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('weightLabel')} htmlFor="weightKg">
              <Input
                id="weightKg"
                type="number"
                inputMode="decimal"
                min={30}
                max={400}
                step="0.1"
                {...form.register('weightKg', { valueAsNumber: true })}
              />
            </Field>
            <Field label={t('activityLevelLabel')} htmlFor="activityLevel">
              <Controller
                control={form.control}
                name="activityLevel"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(v) =>
                      field.onChange(v as UpdateProfileInput['activityLevel'])
                    }
                  >
                    <SelectTrigger id="activityLevel">
                      <SelectValue placeholder={t('selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(activityLabels).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label={t('goalLabel')} htmlFor="goalType">
              <Controller
                control={form.control}
                name="goalType"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(v) =>
                      field.onChange(v as UpdateProfileInput['goalType'])
                    }
                  >
                    <SelectTrigger id="goalType">
                      <SelectValue placeholder={t('selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOSE">{t('goalLose')}</SelectItem>
                      <SelectItem value="MAINTAIN">{t('goalMaintain')}</SelectItem>
                      <SelectItem value="GAIN">{t('goalGain')}</SelectItem>
                      <SelectItem value="HEALTHIER">{t('goalHealthier')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {showSpeed && (
              <Field label={t('goalSpeedLabel')} htmlFor="goalSpeed">
                <Controller
                  control={form.control}
                  name="goalSpeed"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(v) =>
                        field.onChange(v as UpdateProfileInput['goalSpeed'])
                      }
                    >
                      <SelectTrigger id="goalSpeed">
                        <SelectValue placeholder={t('selectPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SLOW">{t('speedSteady')}</SelectItem>
                        <SelectItem value="BALANCED">{t('speedBalanced')}</SelectItem>
                        <SelectItem value="AGGRESSIVE">{t('speedAggressive')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}
            {showTarget && (
              <Field label={t('targetWeightLabel')} htmlFor="targetWeightKg">
                <Input
                  id="targetWeightKg"
                  type="number"
                  inputMode="decimal"
                  min={30}
                  max={400}
                  step="0.1"
                  placeholder={t('targetWeightOptional')}
                  {...form.register('targetWeightKg', {
                    setValueAs: (v) =>
                      v === '' || v == null ? null : Number(v),
                  })}
                />
              </Field>
            )}
          </div>

          {/* Dietary preferences */}
          <div className="space-y-2">
            <Label>{t('dietaryLabel')}</Label>
            <Controller
              control={form.control}
              name="dietaryPreferences"
              render={({ field }) => {
                const selected = (field.value ?? []) as DietaryPref[];
                const toggle = (v: DietaryPref) => {
                  const next = selected.includes(v)
                    ? selected.filter((x) => x !== v)
                    : [...selected, v];
                  field.onChange(next);
                };
                return (
                  <div className="flex flex-wrap gap-2">
                    {dietOptions.map((opt) => {
                      const isOn = selected.includes(opt.value);
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={isOn ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => toggle(opt.value)}
                          aria-pressed={isOn}
                        >
                          {isOn && <Check className="h-3.5 w-3.5" />}
                          {t(opt.labelKey)}
                        </Button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </div>

          <Field label={t('notesLabel')} htmlFor="customDietNotes">
            <Textarea
              id="customDietNotes"
              maxLength={500}
              placeholder={t('notesPlaceholder')}
              {...form.register('customDietNotes')}
            />
          </Field>

          {/* Unit system */}
          <div className="space-y-2">
            <Label>{t('unitsLabel')}</Label>
            <Controller
              control={form.control}
              name="unitSystem"
              render={({ field }) => (
                <div className="inline-flex rounded-full border border-white/70 bg-gradient-to-br from-white via-accent-lime/15 to-accent-blue/15 p-1 shadow-sm">
                  {(['METRIC', 'IMPERIAL'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => field.onChange(u)}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-sm font-medium transition',
                        field.value === u
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      aria-pressed={field.value === u}
                    >
                      {u === 'METRIC' ? t('unitMetric') : t('unitImperial')}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={onSubmit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('saveChanges')}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ---------- Targets tab ---------- */

function TargetsForm({ profile }: { profile: ProfileResponse }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('profile');

  const defaults: NutritionTargetsInput = profile.targets ?? {
    dailyCalories: 2000,
    proteinGrams: 125,
    carbsGrams: 225,
    fatGrams: 67,
    fiberGrams: 28,
    waterMl: 2310,
  };

  const form = useForm<NutritionTargetsInput>({
    resolver: zodResolver(NutritionTargetsSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: (input: NutritionTargetsInput) => api.updateTargets(input),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      toast({ title: t('targetsUpdated'), variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('updateFailed');
      toast({ title: t('couldNotSave'), description: msg, variant: 'error' });
    },
  });

  const recompute = () => {
    if (
      profile.age == null ||
      profile.heightCm == null ||
      profile.weightKg == null ||
      !profile.activityLevel ||
      !profile.goalType
    ) {
      toast({
        title: t('profileIncompleteTitle'),
        description: t('profileIncompleteDesc'),
        variant: 'error',
      });
      return;
    }
    const next = computeNutritionTargets({
      age: profile.age,
      gender: profile.gender ?? 'OTHER',
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      activityLevel: profile.activityLevel,
      goal: profile.goalType,
      speed: profile.goalSpeed ?? 'BALANCED',
    });
    form.reset(next);
    toast({ title: t('recomputedFromProfile') });
  };

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-accent-orange/15 via-white to-accent-yellow/20">
      <CardHeader>
        <CardTitle>{t('dailyTargets')}</CardTitle>
        <CardDescription>{t('targetsDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label={t('calLabel')}
            unit={t('calUnit')}
            min={800}
            max={8000}
            step={50}
            {...form.register('dailyCalories', { valueAsNumber: true })}
            error={form.formState.errors.dailyCalories?.message}
          />
          <NumberField
            label={t('proteinLabel')}
            unit={t('proteinUnit')}
            min={0}
            max={500}
            step={1}
            {...form.register('proteinGrams', { valueAsNumber: true })}
            error={form.formState.errors.proteinGrams?.message}
          />
          <NumberField
            label={t('carbsLabel')}
            unit={t('carbsUnit')}
            min={0}
            max={1000}
            step={1}
            {...form.register('carbsGrams', { valueAsNumber: true })}
            error={form.formState.errors.carbsGrams?.message}
          />
          <NumberField
            label={t('fatLabel')}
            unit={t('fatUnit')}
            min={0}
            max={400}
            step={1}
            {...form.register('fatGrams', { valueAsNumber: true })}
            error={form.formState.errors.fatGrams?.message}
          />
          <NumberField
            label={t('fiberLabel')}
            icon={<Wheat className="h-4 w-4 text-accent-orange" />}
            unit={t('fiberUnit')}
            min={0}
            max={200}
            step={1}
            {...form.register('fiberGrams', { valueAsNumber: true })}
            error={form.formState.errors.fiberGrams?.message}
          />
          <NumberField
            label={t('waterLabel')}
            icon={<Droplet className="h-4 w-4 text-accent-blue" />}
            unit={t('waterUnit')}
            min={0}
            max={8000}
            step={50}
            {...form.register('waterMl', { valueAsNumber: true })}
            error={form.formState.errors.waterMl?.message}
          />
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="secondary" onClick={recompute}>
          <RefreshCcw className="h-4 w-4" />
          {t('recompute')}
        </Button>
        <Button onClick={onSubmit} disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('saveTargets')}
        </Button>
      </CardFooter>
    </Card>
  );
}

type NumberFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'inputMode'
> & {
  label: string;
  unit: string;
  icon?: React.ReactNode;
  error?: string;
};

const NumberField = React.forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField({ label, unit, icon, error, ...rest }, ref) {
  const id = React.useId();
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white via-accent-lime/10 to-accent-green/12 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <Input
        id={id}
        ref={ref}
        type="number"
        inputMode="numeric"
        className="mt-2 text-base font-semibold"
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

/* ---------- Weight log tab ---------- */

function WeightLog() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('profile');
  const locale = useLocale();
  const weightsQuery = useQuery({
    queryKey: ['weights'],
    queryFn: () => api.listWeights(),
  });

  const [open, setOpen] = React.useState(false);
  const [weightInput, setWeightInput] = React.useState('');

  const addMutation = useMutation({
    mutationFn: (weightKg: number) => api.addWeight({ weightKg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weights'] });
      toast({ title: t('weightAdded'), variant: 'success' });
      setWeightInput('');
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('couldNotAddWeight');
      toast({ title: t('failed'), description: msg, variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWeight(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weights'] });
      toast({ title: t('entryRemoved') });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('couldNotDelete');
      toast({ title: t('failed'), description: msg, variant: 'error' });
    },
  });

  const handleAdd = () => {
    const num = Number(weightInput);
    if (!Number.isFinite(num) || num < 20 || num > 500) {
      toast({
        title: t('invalidWeight'),
        description: t('invalidWeightDesc'),
        variant: 'error',
      });
      return;
    }
    addMutation.mutate(num);
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-accent-purple/15 via-white to-accent-blue/15">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t('weightLog')}</CardTitle>
          <CardDescription>{t('weightLogDesc')}</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">{t('addWeight')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('logWeightTitle')}</DialogTitle>
              <DialogDescription>{t('logWeightDesc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="weight-input">{t('weightInputLabel')}</Label>
              <Input
                id="weight-input"
                type="number"
                inputMode="decimal"
                min={20}
                max={500}
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={t('weightInputPlaceholder')}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  {t('cancelBtn')}
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t('saveBtn')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {weightsQuery.isLoading ? (
          <ListSkeleton />
        ) : weightsQuery.data && weightsQuery.data.length > 0 ? (
          <ul className="divide-y divide-border">
            {weightsQuery.data.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="text-sm font-semibold">
                    {entry.weightKg.toFixed(1)} {t('kgUnit')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.loggedAt).toLocaleString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('deleteEntryAria')}
                  onClick={() => deleteMutation.mutate(entry.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-dashed border-accent-purple/30 bg-gradient-to-br from-white via-accent-purple/8 to-accent-blue/12 p-8 text-center text-sm text-muted-foreground">
            {t('noWeightEntries')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Account tab ---------- */

function AccountTab() {
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();
  const t = useTranslations('profile');

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-accent-teal/15 via-white to-accent-green/10">
      <CardHeader>
        <CardTitle>{t('account')}</CardTitle>
        <CardDescription>{t('accountSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !user ? (
          <ListSkeleton />
        ) : (
          <div className="space-y-3">
            <ReadOnlyRow icon={<User className="h-4 w-4" />} label={t('accountName')} value={user.name} />
            <ReadOnlyRow
              icon={<Mail className="h-4 w-4" />}
              label={t('accountEmail')}
              value={user.email}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="destructive" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t('accountSignOut')}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ReadOnlyRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white via-accent-teal/10 to-accent-green/10 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-teal/20 text-accent-teal shadow-sm">
          {icon}
        </span>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-sm font-medium">{value}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- shared ---------- */

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PageLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-10 w-full" />
      <div className="skeleton h-64 w-full" />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-32 w-full rounded-3xl" />
      <div className="skeleton h-32 w-full rounded-3xl" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      <div className="skeleton h-12 w-full rounded-2xl" />
      <div className="skeleton h-12 w-full rounded-2xl" />
      <div className="skeleton h-12 w-full rounded-2xl" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}
