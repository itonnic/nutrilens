'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
};

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);

  const toast = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto w-full max-w-sm rounded-2xl border bg-white/95 p-4 shadow-card backdrop-blur',
              t.variant === 'error' && 'border-red-200 text-red-900',
              t.variant === 'success' && 'border-emerald-200',
            )}
          >
            {t.title && <div className="text-sm font-semibold">{t.title}</div>}
            {t.description && (
              <div className="mt-0.5 text-sm text-muted-foreground">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// stub component to satisfy layout import — actual UI rendered above
export function Toaster() {
  return null;
}
