export type ApiErrorBody = { error?: { code?: string; message?: string } };

export type ApiFetchError = Error & { status: number; code: string };

export function isApiFetchError(value: unknown): value is ApiFetchError {
  if (!(value instanceof Error)) return false;
  const v = value as Partial<ApiFetchError>;
  return typeof v.status === 'number' && typeof v.code === 'string';
}

export function userFriendlyError(value: unknown) {
  // Também pode vir de erros locais (ex.: throw new Error('UNAUTHENTICATED'))
  if (value instanceof Error && value.message === 'UNAUTHENTICATED') {
    return 'Você precisa entrar para continuar.';
  }

  if (isApiFetchError(value)) {
    switch (value.code) {
      case 'DATABASE_NOT_CONFIGURED':
        return 'API sem banco configurado (Postgres). Rode as migrations e suba o Postgres.';
      case 'INVALID_CREDENTIALS':
        return 'Credenciais inválidas.';
      case 'USER_ALREADY_EXISTS':
        return 'Usuário já existe.';
      case 'UNAUTHENTICATED':
        return 'Você precisa entrar para continuar.';
      case 'FORBIDDEN':
        return 'Você não tem permissão para executar esta ação.';
      case 'CSRF_INVALID':
        return 'Sessão inválida (CSRF). Refaça o login.';
      case 'IDEMPOTENCY_KEY_REUSED':
        return 'Idempotency-Key reutilizada com payload diferente.';
      default:
        return value.message;
    }
  }

  return value instanceof Error ? value.message : String(value);
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const p = part.trim();
    if (!p.startsWith(prefix)) continue;
    return decodeURIComponent(p.slice(prefix.length));
  }
  return null;
}

export function apiBaseUrl() {
  return (
    (import.meta.env.VITE_API_URL as string | undefined) ??
    'http://localhost:3001'
  );
}

export async function apiFetch(
  pathname: string,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(pathname, apiBaseUrl());
  const method = (init?.method ?? 'GET').toUpperCase();
  const unsafe = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  const csrfToken = unsafe ? readCookie('sr_csrf') : null;

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (res.ok) return res;

  let body: ApiErrorBody | undefined;
  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // ignore
  }

  const code = body?.error?.code ?? 'HTTP_ERROR';
  const message = body?.error?.message ?? `Request failed (${res.status})`;

  const err = Object.assign(new Error(`${code}: ${message}`), {
    status: res.status,
    code,
  }) as ApiFetchError;

  throw err;
}

