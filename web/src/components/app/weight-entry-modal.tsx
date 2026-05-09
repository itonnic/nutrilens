'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ApiError, api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';

interface WeightEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialWeightKg?: number | null;
  /** Called after a successful save with the new weight in kg. */
  onSaved?: (weightKg: number) => void;
}

/**
 * Reusable weight-entry modal used by the dashboard shortcut and the profile
 * "Weight log" tab. Encapsulates the API mutation and TanStack invalidation
 * so callers don't have to wire it up themselves.
 */
export function WeightEntryModal({
  open,
  onOpenChange,
  initialWeightKg,
  onSaved,
}: WeightEntryModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialWeightKg != null ? initialWeightKg.toString() : '');
      setError(null);
    }
  }, [open, initialWeightKg]);

  const save = useMutation({
    mutationFn: (weightKg: number) => api.addWeight({ weightKg }),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ['weights'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: t('weightSaved'), description: `${entry.weightKg} kg`, variant: 'success' });
      onSaved?.(entry.weightKg);
      onOpenChange(false);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : t('weightSaveFailedDesc');
      toast({ title: t('weightSaveFailed'), description: msg, variant: 'error' });
    },
  });

  function submit() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 20 || n > 500) {
      setError(t('weightInvalidRange'));
      return;
    }
    setError(null);
    save.mutate(n);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('weightModalTitle')}</DialogTitle>
          <DialogDescription>{t('weightModalDesc')}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="weight">{t('weightLabel')}</Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder={t('weightPlaceholder')}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? t('savingWeight') : t('saveWeight')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
