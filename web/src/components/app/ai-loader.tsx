'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  'Detecting foods…',
  'Estimating portions…',
  'Matching nutrition data…',
  'Preparing summary…',
];

export function AiAnalysisLoader({ imageUrl }: { imageUrl?: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 1100);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="card-soft overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-12"
          style={{
            background:
              'linear-gradient(180deg, rgba(103,178,111,0) 0%, rgba(103,178,111,0.55) 50%, rgba(103,178,111,0) 100%)',
          }}
          initial={{ top: '0%' }}
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="space-y-3 p-5">
        <div className="text-base font-medium">Analyzing your meal…</div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full transition ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
