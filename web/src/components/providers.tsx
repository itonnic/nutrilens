'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider } from './ui/toaster';
import { setOnUnauthorized, setToken } from '@/lib/api-client';

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/forgot-password', '/privacy']);

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry on 4xx — those are client errors and won't recover.
              const status = (error as { status?: number } | null)?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 1;
            },
          },
        },
      }),
  );

  // Centralized 401 handler: clear the token, drop the query cache, and bounce
  // the user to /login (unless they're already on a public route).
  useEffect(() => {
    setOnUnauthorized(() => {
      setToken(null);
      client.clear();
      const onPublicRoute = PUBLIC_PATHS.has(pathname);
      if (!onPublicRoute) {
        router.replace('/login?reason=expired');
      }
    });
    return () => setOnUnauthorized(null);
  }, [client, router, pathname]);

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
