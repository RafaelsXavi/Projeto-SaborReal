import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api';

export type Role = 'customer' | 'admin' | 'courier';
export type AuthUser = { userId: string; role: Role };

type SessionResponse =
  | { authenticated: false }
  | { authenticated: true; user: AuthUser };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const res = await apiFetch('/v1/auth/session');
    const body = (await res.json()) as SessionResponse;
    setUser(body.authenticated ? body.user : null);
  }, []);

  useEffect(() => {
    setLoading(true);
    refreshSession()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshSession]);

  async function register(input: { identifier: string; password: string }) {
    await apiFetch('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

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

  async function login(input: { identifier: string; password: string }) {
    await apiFetch('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    await refreshSession();
  }

  async function logout() {
    await apiFetch('/v1/auth/logout', { method: 'POST' });
    setUser(null);
  }

  return { user, loading, register, devCreateUser, login, logout, refreshSession };
}
