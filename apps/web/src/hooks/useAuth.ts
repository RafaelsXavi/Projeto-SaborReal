import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, setCsrfToken } from '../api';

export type Role = 'customer' | 'admin' | 'motoboy';
export type AuthUser = { userId: string; role: Role };

type SessionResponse =
  | { authenticated: false }
  | { authenticated: true; user: AuthUser; csrfToken?: string };

async function fetchSession(): Promise<AuthUser | null> {
  const res = await apiFetch('/v1/auth/session');
  const body = (await res.json()) as SessionResponse;
  if (body.authenticated && typeof body.csrfToken === 'string') {
    setCsrfToken(body.csrfToken);
  }
  return body.authenticated ? body.user : null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (input: { identifier: string; password: string }) => {
      const res = await apiFetch('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      const body = (await res.json()) as { ok?: boolean; csrfToken?: string };
      if (typeof body.csrfToken === 'string') setCsrfToken(body.csrfToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: { identifier: string; password: string }) => {
      await apiFetch('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiFetch('/v1/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      setCsrfToken(null);
    },
  });

  async function devCreateUser(input: {
    identifier: string;
    password: string;
    role: Role;
  }) {
    await apiFetch('/v1/auth/dev-create-user', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  return {
    user: user ?? null,
    loading: isLoading,
    register: registerMutation.mutateAsync,
    devCreateUser,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshSession: () =>
      queryClient.invalidateQueries({ queryKey: ['session'] }),
  };
}
