'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ImageOff,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  MEAL_TYPES,
  MealItemInputSchema,
  type MealItemInput,
  type MealItemResponse,
  type MealResponse,
} from '@nutrilens/shared';
import { AppShell } from '@/components/app/app-shell';
import { AiAnalysisLoader } from '@/components/app/ai-loader';
import { ConfirmDialog } from '@/components/app/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toaster';
import { api, ApiError } from '@/lib/api-client';
import { useRequireAuth } from '@/hooks/use-auth';
import { cn, formatKcal, formatTime } from '@/lib/utils';

const FOOD_UNITS = ['g', 'ml', 'piece', 'tbsp', 'cup', 'serving'] as const;
type FoodUnit = (typeof FOOD_UNITS)[number];

interface EditableItem {
  key: string;
  id?: string;
  name: string;
  quantity: number;
  unit: FoodUnit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

function newKey() {
  return Math.random().toString(36).slice(2, 10);
}

function toEditable(item: MealItemResponse): EditableItem {
  return {
    key: item.id || newKey(),
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: (FOOD_UNITS.includes(item.unit as FoodUnit) ? item.unit : 'g') as FoodUnit,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    fiber: item.fiber,
    sugar: item.sugar,
    sodium: item.sodium,
  };
}

function toMealItemInput(item: EditableItem): MealItemInput {
  return {
    id: item.id,
    name: item.name.trim(),
    quantity: Number(item.quantity) || 0,
    unit: item.unit,
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    carbs: Number(item.carbs) || 0,
    fat: Number(item.fat) || 0,
    fiber: item.fiber === null ? null : Number(item.fiber) || 0,
    sugar: item.sugar === null ? null : Number(item.sugar) || 0,
    sodium: item.sodium === null ? null : Number(item.sodium) || 0,
  };
}

function emptyItem(): EditableItem {
  return {
    key: newKey(),
    name: '',
    quantity: 100,
    unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: null,
    sugar: null,
    sodium: null,
  };
}

function humanizeAiError(
  errOrMessage: unknown,
  tCommon: ReturnType<typeof useTranslations>,
  fallbackTitle: string,
) {
  if (errOrMessage instanceof ApiError && errOrMessage.status === 429) {
    return { title: tCommon('aiRateLimitTitle'), description: tCommon('aiRateLimitDesc') };
  }

  const message = typeof errOrMessage === 'string'
    ? errOrMessage
    : errOrMessage instanceof Error
      ? errOrMessage.message
      : fallbackTitle;
  const haystack = message.toLowerCase();

  if (haystack.includes('rate limit') || haystack.includes('quota')) {
    return { title: tCommon('aiRateLimitTitle'), description: tCommon('aiRateLimitDesc') };
  }

  if (haystack.includes('temporarily unavailable') || haystack.includes('service unavailable')) {
    return { title: fallbackTitle, description: tCommon('aiUnavailableDesc') };
  }

  return { title: fallbackTitle, description: message };
}

export default function MealDetailPage() {
  const params = useParams<{ id: string }>();
  const mealId = params.id;
  const router = useRouter();
  const search = useSearchParams();
  const fromUpload = search.get('fromUpload') === '1';
  const qc = useQueryClient();
  const { toast } = useToast();
  const { isLoading: authLoading } = useRequireAuth();
  const t = useTranslations('mealDetail');

  const reviewRef = useRef<HTMLDivElement>(null);

  const mealQuery = useQuery<MealResponse>({
    queryKey: ['meal', mealId],
    queryFn: () => api.getMeal(mealId),
    enabled: Boolean(mealId),
    refetchInterval: (q) => (q.state.data?.status === 'DRAFT' ? 2000 : false),
    refetchIntervalInBackground: true,
  });

  if (authLoading) {
    return (
      <AppShell>
        <div className="space-y-3">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
          <div className="skeleton h-24 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (mealQuery.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="skeleton h-8 w-32" />
          <div className="skeleton aspect-[4/3] w-full rounded-3xl" />
          <div className="skeleton h-24 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (mealQuery.error || !mealQuery.data) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-3">
          <BackLink />
          <div className="card-soft overflow-hidden bg-gradient-to-br from-red-50 via-white to-accent-orange/15 p-6 text-center">
            <div className="text-base font-semibold">{t('notFound')}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {mealQuery.error instanceof Error ? mealQuery.error.message : t('notFoundDesc')}
            </div>
            <Button asChild className="mt-4">
              <Link href="/app/meals">{t('backToDiary')}</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const meal = mealQuery.data;

  const handleRefetch = () => {
    qc.invalidateQueries({ queryKey: ['meal', mealId] });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-5">
        <BackLink />

        {meal.status === 'DRAFT' && <DraftView meal={meal} />}

        {meal.status === 'NEEDS_REVIEW' && (
          <NeedsReviewView
            meal={meal}
            reviewRef={reviewRef}
            fromUpload={fromUpload}
            onUpdate={handleRefetch}
            onConfirm={(updated) => {
              qc.setQueryData(['meal', mealId], updated);
              toast({
                title: t('mealSaved'),
                description: t('mealSavedDesc'),
                variant: 'success',
              });
            }}
            onDeleted={() => router.push('/app/meals')}
          />
        )}

        {meal.status === 'CONFIRMED' && (
          <ConfirmedView
            meal={meal}
            onUpdate={handleRefetch}
            onDeleted={() => router.push('/app/meals')}
          />
        )}
      </div>
    </AppShell>
  );
}

function BackLink() {
  const t = useTranslations('mealDetail');
  return (
    <Link
      href="/app/meals"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('backToDiary')}
    </Link>
  );
}

function DraftView({ meal }: { meal: MealResponse }) {
  const t = useTranslations('mealDetail');
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-accent-orange/40 bg-gradient-to-br from-accent-orange/25 via-white to-accent-yellow/30 p-4 text-sm text-amber-900 shadow-sm">
        {t('stillAnalyzing')}
      </div>
      <AiAnalysisLoader imageUrl={meal.imageUrl ?? undefined} />
    </div>
  );
}

function NeedsReviewView({
  meal,
  reviewRef,
  fromUpload,
  onUpdate,
  onConfirm,
  onDeleted,
}: {
  meal: MealResponse;
  reviewRef: React.RefObject<HTMLDivElement | null>;
  fromUpload: boolean;
  onUpdate: () => void;
  onConfirm: (updated: MealResponse) => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('mealDetail');
  const tCommon = useTranslations('common');
  const tMealTypes = useTranslations('mealTypes');
  const [title, setTitle] = useState(meal.title);
  const [items, setItems] = useState<EditableItem[]>(meal.items.map(toEditable));
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiJobId, setAiJobId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Sync local state when remote meal changes (e.g., re-analysis completes)
  useEffect(() => {
    setTitle(meal.title);
    setItems(meal.items.map(toEditable));
  }, [meal.id, meal.updatedAt, meal.items, meal.title]);

  useEffect(() => {
    if (fromUpload && reviewRef.current) {
      reviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [fromUpload, reviewRef]);

  const totals = useMemo(() => computeTotals(items), [items]);

  const confirmMutation = useMutation({
    mutationFn: () => {
      const itemInputs = items.map(toMealItemInput);
      const parsed = itemInputs.map((it) => MealItemInputSchema.safeParse(it));
      const firstError = parsed.find((p) => !p.success);
      if (firstError && !firstError.success) {
        throw new Error(firstError.error.errors[0]?.message ?? 'Invalid item data');
      }
      return api.confirmMeal(meal.id, {
        items: itemInputs,
        title: title.trim() || meal.title,
      });
    },
    onSuccess: (updated) => onConfirm(updated),
    onError: (err) => {
      const msg = err instanceof Error ? err.message : t('couldNotSave');
      toast({ title: t('saveFailed'), description: msg, variant: 'error' });
    },
  });

  const saveLaterMutation = useMutation({
    mutationFn: () => {
      const itemInputs = items.map(toMealItemInput);
      const parsed = itemInputs.map((it) => MealItemInputSchema.safeParse(it));
      const firstError = parsed.find((p) => !p.success);
      if (firstError && !firstError.success) {
        throw new Error(firstError.error.errors[0]?.message ?? 'Invalid item data');
      }
      return api.updateMeal(meal.id, {
        title: title.trim() || meal.title,
        items: itemInputs,
      });
    },
    onSuccess: () => {
      toast({
        title: t('savedForLater'),
        description: t('savedForLaterDesc'),
        variant: 'success',
      });
      onUpdate();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : t('couldNotSaveChanges');
      toast({ title: t('saveFailed'), description: msg, variant: 'error' });
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: (note: string) => api.reanalyze(meal.id, note || undefined),
    onSuccess: (data) => {
      setReanalyzeOpen(false);
      setAiJobId(data.jobId);
      setAnalyzing(true);
      toast({
        title: t('reanalyzingToast'),
        description: t('reanalyzingDesc'),
      });
    },
    onError: (err) => {
      const friendly = humanizeAiError(err, tCommon, t('reanalyzeFailed'));
      toast({ title: friendly.title, description: friendly.description, variant: 'error' });
    },
  });

  useQuery({
    queryKey: ['meal-ai-job', meal.id, aiJobId],
    queryFn: () => api.getAiJob(aiJobId as string),
    enabled: analyzing && Boolean(aiJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 1500;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!analyzing || !aiJobId) return;

    void api.getAiJob(aiJobId).then((job) => {
      if (job.status === 'COMPLETED') {
        setAnalyzing(false);
        setAiJobId(null);
        onUpdate();
        void qc.invalidateQueries({ queryKey: ['meal', meal.id] });
        return;
      }

      if (job.status === 'FAILED') {
        const friendly = humanizeAiError(job.errorMessage ?? t('reanalyzeFailed'), tCommon, t('reanalyzeFailed'));
        setAnalyzing(false);
        setAiJobId(null);
        toast({ title: friendly.title, description: friendly.description, variant: 'error' });
        onUpdate();
        void qc.invalidateQueries({ queryKey: ['meal', meal.id] });
      }
    });
  }, [aiJobId, analyzing, meal.id, onUpdate, qc, t, tCommon, toast]);

  const deleteMutation = useDeleteMeal(meal.id, onDeleted);

  if (analyzing) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900">
          {t('reanalyzingMealNote')}
        </div>
        <AiAnalysisLoader imageUrl={meal.imageUrl ?? undefined} />
      </div>
    );
  }

  const confidence = meal.confidence ?? meal.aiResult?.confidence ?? null;

  return (
    <div ref={reviewRef} className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-accent-orange/40 bg-gradient-to-br from-accent-orange/25 via-white to-accent-yellow/30 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-accent-orange/25 text-accent-orange shadow-sm">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold text-amber-900">{t('aiEstimateBanner')}</div>
            <div className="mt-0.5 text-sm text-amber-900/80">
              {t('aiEstimateBannerDesc')}
            </div>
          </div>
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        <MealHeroImage imageUrl={meal.imageUrl} title={meal.title} />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{tMealTypes(meal.mealType)}</span>
            <span>·</span>
            <span>{formatTime(meal.consumedAt)}</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              <Sparkles className="h-3 w-3" />
              {t('aiSource')}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meal-title">{t('title')}</Label>
            <Input
              id="meal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TotalStat label={t('calories')} value={`${formatKcal(totals.calories)} kcal`} accent />
            <TotalStat label={t('protein')} value={`${totals.protein.toFixed(0)}g`} />
            <TotalStat label={t('carbs')} value={`${totals.carbs.toFixed(0)}g`} />
            <TotalStat label={t('fat')} value={`${totals.fat.toFixed(0)}g`} />
          </div>

          {confidence !== null && <ConfidencePill value={confidence} />}
        </div>
      </div>

      <EditableNutritionTable items={items} onChange={setItems} />

      {meal.aiResult && <AiInsights result={meal.aiResult} />}

      <div className="sticky bottom-20 md:bottom-4 z-10">
        <div className="card-soft flex flex-col gap-2 p-3 sm:flex-row">
          <Button
            size="lg"
            className="flex-1"
            disabled={confirmMutation.isPending}
            onClick={() => confirmMutation.mutate()}
          >
            <CheckCircle2 className="h-4 w-4" />
            {confirmMutation.isPending ? t('savingEdits') : t('confirmMeal')}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="flex-1"
            disabled={saveLaterMutation.isPending}
            onClick={() => saveLaterMutation.mutate()}
          >
            {saveLaterMutation.isPending ? t('savingEdits') : t('saveLater')}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setReanalyzeOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            {t('reanalyzeBtn')}
          </Button>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-700"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            {t('deleteBtn')}
          </Button>
        </div>
      </div>

      <ReanalyzeDialog
        open={reanalyzeOpen}
        onOpenChange={setReanalyzeOpen}
        onSubmit={(note) => reanalyzeMutation.mutate(note)}
        loading={reanalyzeMutation.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('deleteTitle')}
        description={t('deleteDesc')}
        confirmLabel={t('deleteBtn')}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

function ConfirmedView({
  meal,
  onUpdate,
  onDeleted,
}: {
  meal: MealResponse;
  onUpdate: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const t = useTranslations('mealDetail');
  const tCommon = useTranslations('common');
  const tMealTypes = useTranslations('mealTypes');
  const [editing, setEditing] = useState(false);
  const [reanalyzeOpen, setReanalyzeOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiJobId, setAiJobId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const qc = useQueryClient();

  const reanalyzeMutation = useMutation({
    mutationFn: (note: string) => api.reanalyze(meal.id, note || undefined),
    onSuccess: (data) => {
      setReanalyzeOpen(false);
      setAiJobId(data.jobId);
      setAnalyzing(true);
    },
    onError: (err) => {
      const friendly = humanizeAiError(err, tCommon, t('reanalyzeFailed'));
      toast({ title: friendly.title, description: friendly.description, variant: 'error' });
    },
  });

  useQuery({
    queryKey: ['meal-ai-job', meal.id, aiJobId],
    queryFn: () => api.getAiJob(aiJobId as string),
    enabled: analyzing && Boolean(aiJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 1500;
    },
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!analyzing || !aiJobId) return;

    void api.getAiJob(aiJobId).then((job) => {
      if (job.status === 'COMPLETED') {
        setAnalyzing(false);
        setAiJobId(null);
        void qc.invalidateQueries({ queryKey: ['meal', meal.id] });
        return;
      }

      if (job.status === 'FAILED') {
        const friendly = humanizeAiError(job.errorMessage ?? t('reanalyzeFailed'), tCommon, t('reanalyzeFailed'));
        setAnalyzing(false);
        setAiJobId(null);
        toast({ title: friendly.title, description: friendly.description, variant: 'error' });
        void qc.invalidateQueries({ queryKey: ['meal', meal.id] });
      }
    });
  }, [aiJobId, analyzing, meal.id, qc, t, tCommon, toast]);

  const deleteMutation = useDeleteMeal(meal.id, onDeleted);

  if (analyzing) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl border border-accent-purple/40 bg-gradient-to-br from-accent-purple/25 via-white to-accent-lime/25 p-4 text-sm text-foreground shadow-sm">
          {t('reanalyzing')}
        </div>
        <AiAnalysisLoader imageUrl={meal.imageUrl ?? undefined} />
      </div>
    );
  }

  if (editing) {
    return (
      <EditConfirmedMeal
        meal={meal}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          onUpdate();
        }}
      />
    );
  }

  const confidence = meal.confidence ?? meal.aiResult?.confidence ?? null;

  return (
    <div className="space-y-5">
      <div className="card-soft overflow-hidden">
        <MealHeroImage imageUrl={meal.imageUrl} title={meal.title} />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{tMealTypes(meal.mealType)}</span>
            <span>·</span>
            <span>{formatTime(meal.consumedAt)}</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {meal.source === 'AI' ? (
                <>
                  <Sparkles className="h-3 w-3" />
                  {t('sourceAi')}
                </>
              ) : (
                t('sourceManual')
              )}
            </span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight">{meal.title}</h2>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TotalStat label={t('calories')} value={`${formatKcal(meal.calories)} kcal`} accent />
            <TotalStat label={t('protein')} value={`${meal.protein.toFixed(0)}g`} />
            <TotalStat label={t('carbs')} value={`${meal.carbs.toFixed(0)}g`} />
            <TotalStat label={t('fat')} value={`${meal.fat.toFixed(0)}g`} />
          </div>

          {confidence !== null && <ConfidencePill value={confidence} />}

          {meal.userNote && (
            <div className="rounded-2xl bg-muted/40 p-3 text-sm">
              <span className="font-medium">{t('yourNote')}</span>{' '}
              <span className="text-muted-foreground">{meal.userNote}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-soft overflow-hidden bg-gradient-to-br from-white via-accent-lime/10 to-accent-green/15 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{t('items')}</h3>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            {tCommon('edit')}
          </Button>
        </div>
        <ul className="divide-y divide-border/60">
          {meal.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.quantity} {item.unit} · P {item.protein.toFixed(0)}g · C {item.carbs.toFixed(0)}g · F {item.fat.toFixed(0)}g
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums">
                {Math.round(item.calories)} kcal
              </div>
            </li>
          ))}
          {meal.items.length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">{t('noItemsRecorded')}</li>
          )}
        </ul>
      </div>

      {meal.aiResult && <AiInsights result={meal.aiResult} />}

      <ConfirmedActions
        meal={meal}
        onEdit={() => setEditing(true)}
        onReanalyze={() => setReanalyzeOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        deletePending={deleteMutation.isPending}
      />

      <ReanalyzeDialog
        open={reanalyzeOpen}
        onOpenChange={setReanalyzeOpen}
        onSubmit={(note) => reanalyzeMutation.mutate(note)}
        loading={reanalyzeMutation.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('deleteTitle')}
        description={t('deleteDesc')}
        confirmLabel={t('deleteBtn')}
        variant="destructive"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

function ConfirmedActions({
  meal,
  onEdit,
  onReanalyze,
  onDelete,
  deletePending,
}: {
  meal: MealResponse;
  onEdit: () => void;
  onReanalyze: () => void;
  onDelete: () => void;
  deletePending: boolean;
}) {
  const t = useTranslations('mealDetail');
  const tCommon = useTranslations('common');
  return (
    <div className="card-soft flex flex-wrap gap-2 overflow-hidden bg-gradient-to-br from-white via-accent-purple/10 to-accent-lime/10 p-3">
      <Button onClick={onEdit}>{tCommon('edit')}</Button>
      {meal.imageUrl && (
        <Button variant="secondary" onClick={onReanalyze}>
          <RotateCcw className="h-4 w-4" />
          {t('reanalyzeBtn')}
        </Button>
      )}
      <Button
        variant="destructive"
        onClick={onDelete}
        disabled={deletePending}
        className="ml-auto"
      >
        <Trash2 className="h-4 w-4" />
        {t('deleteBtn')}
      </Button>
    </div>
  );
}

function EditConfirmedMeal({
  meal,
  onCancel,
  onSaved,
}: {
  meal: MealResponse;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const t = useTranslations('mealDetail');
  const tMealTypes = useTranslations('mealTypes');
  const [title, setTitle] = useState(meal.title);
  const [mealType, setMealType] = useState(meal.mealType);
  const [items, setItems] = useState<EditableItem[]>(meal.items.map(toEditable));
  const totals = useMemo(() => computeTotals(items), [items]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const itemInputs = items.map(toMealItemInput);
      const parsed = itemInputs.map((it) => MealItemInputSchema.safeParse(it));
      const firstError = parsed.find((p) => !p.success);
      if (firstError && !firstError.success) {
        throw new Error(firstError.error.errors[0]?.message ?? 'Invalid item data');
      }
      return api.updateMeal(meal.id, {
        title: title.trim() || meal.title,
        mealType,
        items: itemInputs,
      });
    },
    onSuccess: () => {
      toast({ title: t('mealUpdated'), variant: 'success' });
      onSaved();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : t('couldNotSaveChanges');
      toast({ title: t('saveFailed'), description: msg, variant: 'error' });
    },
  });

  return (
    <div className="space-y-5">
      <div className="card-soft space-y-4 overflow-hidden bg-gradient-to-br from-white via-accent-yellow/10 to-accent-orange/15 p-5">
        <h2 className="text-lg font-semibold">{t('editMeal')}</h2>
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">{t('title')}</Label>
          <Input
            id="edit-title"
            value={title}
            maxLength={140}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t('mealType')}</Label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((mt) => (
              <button
                key={mt}
                type="button"
                onClick={() => setMealType(mt)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition',
                  mealType === mt
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-white/70',
                )}
              >
                {tMealTypes(mt)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TotalStat label={t('calories')} value={`${formatKcal(totals.calories)} kcal`} accent />
          <TotalStat label={t('protein')} value={`${totals.protein.toFixed(0)}g`} />
          <TotalStat label={t('carbs')} value={`${totals.carbs.toFixed(0)}g`} />
          <TotalStat label={t('fat')} value={`${totals.fat.toFixed(0)}g`} />
        </div>
      </div>

      <EditableNutritionTable items={items} onChange={setItems} />

      <div className="card-soft flex flex-wrap gap-2 overflow-hidden bg-gradient-to-br from-white via-accent-purple/10 to-accent-lime/10 p-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex-1"
        >
          {saveMutation.isPending ? t('savingEdits') : t('saveChanges')}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          {t('cancelBtn')}
        </Button>
      </div>
    </div>
  );
}

function useDeleteMeal(mealId: string, onDeleted: () => void) {
  const { toast } = useToast();
  const t = useTranslations('mealDetail');
  return useMutation({
    mutationFn: () => api.deleteMeal(mealId),
    onSuccess: () => {
      toast({ title: t('mealDeleted'), variant: 'success' });
      onDeleted();
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('couldNotDelete');
      toast({ title: t('deleteFailed'), description: msg, variant: 'error' });
    },
  });
}

// ---------------- Sub-components ----------------

function TotalStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-white/70 p-3',
        accent ? 'border-primary/30 bg-primary/5' : 'border-border',
      )}
    >
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function MealHeroImage({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  const t = useTranslations('mealDetail');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const showFallback = !imageUrl || failed;

  if (showFallback) {
    return (
      <div className="relative flex min-h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-accent-lime/20 via-white to-accent-green/15 p-6 sm:min-h-64">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(112,180,80,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(245,194,92,0.18),transparent_30%)]" />
        <div className="relative max-w-sm text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-white/85 text-primary shadow-sm ring-1 ring-white/70">
            <ImageOff className="h-6 w-6" />
          </div>
          <div className="mt-3 text-base font-semibold">{t('photoUnavailable')}</div>
          <p className="mt-1 text-sm text-muted-foreground">{t('photoUnavailableDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={title}
      onError={() => setFailed(true)}
      className="aspect-[16/10] max-h-[420px] w-full object-cover"
    />
  );
}

function ConfidencePill({ value }: { value: number }) {
  const t = useTranslations('mealDetail');
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.75
      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
      : value >= 0.5
        ? 'bg-amber-100 text-amber-900 border-amber-200'
        : 'bg-red-100 text-red-900 border-red-200';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        tone,
      )}
    >
      {t('aiConfidence', { percent: pct })}
    </div>
  );
}

function AiInsights({ result }: { result: NonNullable<MealResponse['aiResult']> }) {
  const t = useTranslations('mealDetail');
  const hasContent =
    result.assumptions.length || result.warnings.length || result.suggestions.length;
  if (!hasContent) return null;
  return (
    <div className="card-soft space-y-4 overflow-hidden bg-gradient-to-br from-accent-purple/15 via-white to-accent-lime/15 p-5">
      <h3 className="text-base font-semibold">{t('aiInsights')}</h3>
      {result.warnings.length > 0 && (
        <InsightSection
          title={t('warnings')}
          items={result.warnings}
          tone="border-red-200 bg-red-50/60 text-red-900"
        />
      )}
      {result.assumptions.length > 0 && (
        <InsightSection
          title={t('assumptions')}
          items={result.assumptions}
          tone="border-amber-200 bg-amber-50/60 text-amber-900"
        />
      )}
      {result.suggestions.length > 0 && (
        <InsightSection
          title={t('suggestions')}
          items={result.suggestions}
          tone="border-emerald-200 bg-emerald-50/60 text-emerald-900"
        />
      )}
    </div>
  );
}

function InsightSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className={cn('rounded-2xl border p-3', tone)}>
      <div className="text-sm font-semibold">{title}</div>
      <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function ReanalyzeDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (note: string) => void;
  loading: boolean;
}) {
  const t = useTranslations('mealDetail');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!open) setNote('');
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reanalyzeWithHint')}</DialogTitle>
          <DialogDescription>
            {t('reanalyzeDescription')}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('optionalNote')}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancelBtn')}
          </Button>
          <Button onClick={() => onSubmit(note)} disabled={loading}>
            {loading ? t('sending') : t('reanalyzeBtn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function computeTotals(items: EditableItem[]) {
  return items.reduce(
    (acc, it) => {
      acc.calories += Number(it.calories) || 0;
      acc.protein += Number(it.protein) || 0;
      acc.carbs += Number(it.carbs) || 0;
      acc.fat += Number(it.fat) || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function EditableNutritionTable({
  items,
  onChange,
}: {
  items: EditableItem[];
  onChange: (next: EditableItem[]) => void;
}) {
  const t = useTranslations('mealDetail');
  const update = (key: string, patch: Partial<EditableItem>) => {
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  };
  const remove = (key: string) => {
    onChange(items.filter((it) => it.key !== key));
  };
  const add = () => {
    onChange([...items, emptyItem()]);
  };

  return (
    <div className="card-soft space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{t('items')}</h3>
        <Button size="sm" variant="ghost" onClick={add}>
          <Plus className="h-4 w-4" />
          {t('addRow')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t('nutritionTotalsHint')}</p>
      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t('noItemsYet')}
        </div>
      )}
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.key}
            className="overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white via-accent-lime/8 to-accent-green/12 p-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <Input
                value={item.name}
                placeholder={t('itemPlaceholder')}
                maxLength={120}
                aria-label={t('itemNameAria')}
                onChange={(e) => update(item.key, { name: e.target.value })}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => remove(item.key)}
                aria-label={t('removeItemAria')}
                className="grid h-9 w-9 flex-none place-items-center rounded-full text-muted-foreground transition hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <NumberField
                label={t('quantityLabel')}
                value={item.quantity}
                onChange={(v) => update(item.key, { quantity: v })}
              />
              <div className="space-y-1">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t('unitLabel')}
                </Label>
                <Select
                  value={item.unit}
                  onValueChange={(v) => update(item.key, { unit: v as FoodUnit })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <NumberField
                label={t('caloriesLabel')}
                value={item.calories}
                onChange={(v) => update(item.key, { calories: v })}
              />
              <NumberField
                label={t('proteinLabel')}
                value={item.protein}
                onChange={(v) => update(item.key, { protein: v })}
              />
              <NumberField
                label={t('carbsLabel')}
                value={item.carbs}
                onChange={(v) => update(item.key, { carbs: v })}
              />
              <NumberField
                label={t('fatLabel')}
                value={item.fat}
                onChange={(v) => update(item.key, { fat: v })}
              />
              <NumberField
                label={t('fiberLabel')}
                value={item.fiber ?? 0}
                onChange={(v) => update(item.key, { fiber: v })}
              />
              <NumberField
                label={t('sugarLabel')}
                value={item.sugar ?? 0}
                onChange={(v) => update(item.key, { sugar: v })}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.1"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? Math.max(0, n) : 0);
        }}
        className="h-9 px-3"
      />
    </div>
  );
}
