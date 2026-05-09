'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ApiError, api, getToken, setToken } from '@/lib/api-client';
import type { AuthUser } from '@nutrilens/shared';

export function useCurrentUser(opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? Boolean(getToken());
  return useQuery<AuthUser>({
    queryKey: ['me'],
    queryFn: () => api.me(),
    enabled,
    retry: false,
  });
}

export function useRequireAuth(): { user: AuthUser | undefined; isLoading: boolean } {
  const router = useRouter();
  const { data, isLoading, error } = useCurrentUser({ enabled: true });

  useEffect(() => {
    if (!isLoading && (error || !getToken())) {
      router.replace('/login');
    }
  }, [isLoading, error, router]);

  return { user: data, isLoading };
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return () => {
    setToken(null);
    qc.clear();
    router.push('/login');
  };
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}
