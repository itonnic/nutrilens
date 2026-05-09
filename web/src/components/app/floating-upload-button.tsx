'use client';
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standalone FAB used on pages that don't already render `AppShell` (which
 * has its own bottom-nav-centered upload button on mobile). Hidden on desktop.
 */
export function FloatingUploadButton({
  href = '/app/upload',
  className,
  label = 'Add a meal',
}: {
  href?: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:scale-105 active:scale-95 md:hidden',
        className,
      )}
    >
      <Camera className="h-6 w-6" />
    </Link>
  );
}
