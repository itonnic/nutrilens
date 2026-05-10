'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Droplet, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { isoDate, pct } from '@/lib/utils';

interface Props {
  date: string;
  targetMl: number;
  consumedMl: number;
}

export function WaterTracker({ date, targetMl, consumedMl }: Props) {
  const qc = useQueryClient();
  const dateKey = isoDate(new Date(date));
  const { data: entries } = useQuery({
    queryKey: ['water', dateKey],
    queryFn: () => api.listWater(date),
  });

  const add = useMutation({
    mutationFn: (amountMl: number) =>
      api.addWater({
        amountMl,
        // Water is added for the day currently shown in the tracker. Without this,
        // adding water while viewing yesterday/another date stores it under "now",
        // so the selected day's dashboard does not update.
        loggedAt: new Date(date).toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water', dateKey] });
      qc.invalidateQueries({ queryKey: ['daily'] });
    },
  });

  const ratio = targetMl > 0 ? Math.min(1, consumedMl / targetMl) : 0;

  return (
    <div className="card-soft overflow-hidden bg-gradient-to-br from-accent-blue/25 via-white to-accent-teal/15 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-blue/20 text-accent-blue shadow-sm">
            <Droplet className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-medium">Water</div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {Math.round(consumedMl)} / {targetMl} ml · {pct(consumedMl, targetMl)}%
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[250, 500].map((amt) => (
            <Button
              key={amt}
              size="sm"
              variant="secondary"
              onClick={() => add.mutate(amt)}
              disabled={add.isPending}
            >
              <Plus className="h-3.5 w-3.5" />
              {amt}
            </Button>
          ))}
        </div>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full bg-macro-water transition-all"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {entries && entries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 text-xs text-muted-foreground">
          {entries.map((e) => (
            <span key={e.id} className="rounded-full bg-white/80 px-2 py-0.5 tabular-nums">
              +{e.amountMl}ml
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
