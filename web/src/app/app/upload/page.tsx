'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Camera, RotateCcw, Sparkles, Upload as UploadIcon, X } from 'lucide-react';
import { MEAL_TYPES, type MealType } from '@nutrilens/shared';
import { AppShell } from '@/components/app/app-shell';
import { AiAnalysisLoader } from '@/components/app/ai-loader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toaster';
import { ApiError, api } from '@/lib/api-client';
import { useRequireAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { compressImage, pickImageFromClipboard } from '@/lib/image';

type UploadPhase =
  | { kind: 'empty' }
  | { kind: 'selected'; file: File; previewUrl: string }
  | { kind: 'analyzing'; previewUrl: string; mealId: string; jobId: string }
  | { kind: 'failed'; previewUrl: string; mealId: string; errorMessage: string };

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: authLoading } = useRequireAuth();
  const t = useTranslations('upload');
  const tCommon = useTranslations('common');
  const tMealTypes = useTranslations('mealTypes');

  const [phase, setPhase] = useState<UploadPhase>({ kind: 'empty' });
  const [mealType, setMealType] = useState<MealType>('LUNCH');
  const [userNote, setUserNote] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs when phase changes
  useEffect(() => {
    return () => {
      if (phase.kind === 'selected' || phase.kind === 'analyzing' || phase.kind === 'failed') {
        URL.revokeObjectURL(phase.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_MIME.has(file.type)) {
        return t('invalidImageDesc');
      }
      if (file.size > MAX_BYTES) {
        return t('imageTooLarge');
      }
      return null;
    },
    [t],
  );

  const handleFile = useCallback(
    async (incoming: File) => {
      const err = validateFile(incoming);
      if (err) {
        toast({ title: t('invalidImage'), description: err, variant: 'error' });
        return;
      }
      // Compress in the browser before upload to save bandwidth.
      const file = await compressImage(incoming).catch(() => incoming);
      const previewUrl = URL.createObjectURL(file);
      setPhase({ kind: 'selected', file, previewUrl });
    },
    [toast, validateFile, t],
  );

  // Paste-from-clipboard support (desktop).
  useEffect(() => {
    if (phase.kind !== 'empty') return;
    function onPaste(e: ClipboardEvent) {
      if (!e.clipboardData) return;
      const file = pickImageFromClipboard(e.clipboardData.items);
      if (file) {
        e.preventDefault();
        void handleFile(file);
      }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [phase.kind, handleFile]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const reset = useCallback(() => {
    if (phase.kind !== 'empty') {
      URL.revokeObjectURL(phase.previewUrl);
    }
    setPhase({ kind: 'empty' });
    setUserNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [phase]);

  const uploadMutation = useMutation({
    mutationFn: async (vars: { file: File; mealType: MealType; userNote: string }) => {
      const form = new FormData();
      form.append('image', vars.file);
      form.append('mealType', vars.mealType);
      if (vars.userNote.trim()) form.append('userNote', vars.userNote.trim());
      return api.uploadMeal(form);
    },
    onSuccess: (data) => {
      if (phase.kind !== 'selected') return;
      setPhase({
        kind: 'analyzing',
        previewUrl: phase.previewUrl,
        mealId: data.meal.id,
        jobId: data.jobId,
      });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { duplicateMealId?: string; message?: string } | undefined;
        const dupId = body?.duplicateMealId;
        toast({
          title: t('duplicateDetected'),
          description: dupId
            ? t('duplicateOpening')
            : err.message,
          variant: 'default',
        });
        if (dupId) {
          router.push(`/app/meals/${dupId}`);
        }
        return;
      }
      const msg = err instanceof Error ? err.message : t('uploadFailed');
      toast({ title: t('uploadFailed'), description: msg, variant: 'error' });
    },
  });

  const reanalyzeMutation = useMutation({
    mutationFn: (mealId: string) => api.reanalyze(mealId),
    onSuccess: (data) => {
      if (phase.kind !== 'failed') return;
      setPhase({
        kind: 'analyzing',
        previewUrl: phase.previewUrl,
        mealId: phase.mealId,
        jobId: data.jobId,
      });
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : t('analysisFailed');
      toast({ title: t('analysisFailed'), description: msg, variant: 'error' });
    },
  });

  // Poll AI job
  const polling = phase.kind === 'analyzing';
  const jobId = polling ? phase.jobId : null;

  const jobQuery = useQuery({
    queryKey: ['ai-job', jobId],
    queryFn: () => api.getAiJob(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 1500;
    },
    refetchIntervalInBackground: true,
  });

  // React to job state changes
  useEffect(() => {
    if (phase.kind !== 'analyzing') return;
    const job = jobQuery.data;
    if (!job) return;
    if (job.status === 'COMPLETED') {
      router.push(`/app/meals/${phase.mealId}?fromUpload=1`);
    } else if (job.status === 'FAILED') {
      setPhase({
        kind: 'failed',
        previewUrl: phase.previewUrl,
        mealId: phase.mealId,
        errorMessage: job.errorMessage ?? t('analysisFailed'),
      });
    }
  }, [jobQuery.data, phase, router, t]);

  const canAnalyze = phase.kind === 'selected' && !uploadMutation.isPending;

  const previewSrc = useMemo(() => {
    if (phase.kind === 'empty') return undefined;
    return phase.previewUrl;
  }, [phase]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-72 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </header>

        {phase.kind === 'empty' && (
          <EmptyUploadCard
            dragActive={dragActive}
            setDragActive={setDragActive}
            onDrop={onDrop}
            onPick={(f) => {
              if (f) void handleFile(f);
            }}
            fileInputRef={fileInputRef}
            cameraInputRef={cameraInputRef}
          />
        )}

        {phase.kind === 'selected' && (
          <div className="card-soft overflow-hidden bg-gradient-to-br from-accent-lime/20 via-white to-accent-green/15">
            <div className="relative aspect-[4/3] w-full bg-muted">
              {previewSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewSrc} alt="meal preview" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                onClick={reset}
                aria-label={t('removeImage')}
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-foreground/70 text-white backdrop-blur transition hover:bg-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="text-xs text-muted-foreground">
                {phase.file.name} · {(phase.file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          </div>
        )}

        {phase.kind === 'analyzing' && previewSrc && (
          <AiAnalysisLoader imageUrl={previewSrc} />
        )}

        {phase.kind === 'failed' && (
          <div className="card-soft space-y-4 overflow-hidden bg-gradient-to-br from-red-50 via-white to-accent-orange/15 p-5">
            {previewSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="meal preview"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            )}
            <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
              <div className="text-sm font-semibold text-red-900">{t('analysisFailed')}</div>
              <div className="mt-1 text-sm text-red-800">{phase.errorMessage}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => reanalyzeMutation.mutate(phase.mealId)}
                disabled={reanalyzeMutation.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                {reanalyzeMutation.isPending ? tCommon('loading') : t('tryAnalyzeAgain')}
              </Button>
              <Button variant="secondary" onClick={reset}>
                {t('startOver')}
              </Button>
            </div>
          </div>
        )}

        {(phase.kind === 'empty' || phase.kind === 'selected') && (
          <section className="card-soft space-y-4 overflow-hidden bg-gradient-to-br from-accent-purple/15 via-white to-accent-teal/15 p-5">
            <div className="space-y-2">
              <Label>{t('mealType')}</Label>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setMealType(mt)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-medium transition',
                      mealType === mt
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border bg-white/70 text-foreground hover:bg-white',
                    )}
                    aria-pressed={mealType === mt}
                  >
                    {tMealTypes(mt)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-note">{t('userNote')}</Label>
              <Textarea
                id="user-note"
                placeholder={t('userNotePlaceholder')}
                value={userNote}
                maxLength={500}
                onChange={(e) => setUserNote(e.target.value)}
              />
              <div className="text-right text-xs text-muted-foreground">
                {userNote.length}/500
              </div>
            </div>
          </section>
        )}

        {phase.kind === 'selected' && (
          <div className="sticky bottom-20 md:bottom-4 z-10">
            <Button
              size="lg"
              className="w-full"
              disabled={!canAnalyze}
              onClick={() =>
                uploadMutation.mutate({
                  file: phase.file,
                  mealType,
                  userNote,
                })
              }
            >
              <Sparkles className="h-4 w-4" />
              {uploadMutation.isPending ? t('analyzing') : t('analyze')}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyUploadCard({
  dragActive,
  setDragActive,
  onDrop,
  onPick,
  fileInputRef,
  cameraInputRef,
}: {
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  onDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
  onPick: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const t = useTranslations('upload');
  return (
    <div className="space-y-3">
      <label
        htmlFor="file-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={cn(
          'block cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition',
          dragActive
            ? 'border-primary bg-gradient-to-br from-accent-green/25 via-white to-accent-lime/30 shadow-soft'
            : 'border-accent-purple/30 bg-gradient-to-br from-accent-purple/10 via-white to-accent-lime/15 hover:-translate-y-0.5 hover:border-accent-purple/50',
        )}
      >
        <div className="mx-auto mb-5 max-w-xs overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 p-2 shadow-soft">
          <NextImage
            src="/images/nutrilens-upload-empty.png"
            alt=""
            aria-hidden
            width={1254}
            height={1254}
            sizes="(min-width: 768px) 320px, calc(100vw - 96px)"
            className="aspect-square w-full rounded-[1.35rem] object-cover"
          />
        </div>
        <div className="mt-4 font-semibold">{t('dropTitle')}</div>
        <div className="text-sm text-muted-foreground">
          {t('dropSubtitle')}
        </div>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadIcon className="h-4 w-4" />
          {t('choosePhoto')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => cameraInputRef.current?.click()}
          className="md:hidden"
        >
          <Camera className="h-4 w-4" />
          {t('takePhoto')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => fileInputRef.current?.click()}
          className="hidden md:flex"
        >
          <Camera className="h-4 w-4" />
          {t('fromDevice')}
        </Button>
      </div>

      <input
        id="file-input"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
