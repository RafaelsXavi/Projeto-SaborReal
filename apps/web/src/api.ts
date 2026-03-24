export type ApiErrorBody = { error?: { code?: string; message?: string } };

export type ApiFetchError = Error & { status: number; code: string };

export function isApiFetchError(value: unknown): value is ApiFetchError {
  if (!(value instanceof Error)) return false;
  const v = value as Partial<ApiFetchError>;
  return typeof v.status === 'number' && typeof v.code === 'string';
}

export function userFriendlyError(value: unknown) {
  // Tambem pode vir de erros locais (ex.: throw new Error('UNAUTHENTICATED'))
  if (value instanceof Error && value.message === 'UNAUTHENTICATED') {
    return 'Voce precisa entrar para continuar.';
  }

  if (isApiFetchError(value)) {
    switch (value.code) {
      case 'DATABASE_NOT_CONFIGURED':
        return 'Sistema em manutenção (banco).';
      case 'DATABASE_UNAVAILABLE':
        return 'Tente novamente em instantes.';
      case 'INVALID_CREDENTIALS':
        return 'Login ou senha incorretos.';
      case 'USER_ALREADY_EXISTS':
        return 'Este cadastro já existe.';
      case 'UNAUTHENTICATED':
        return 'Entre na sua conta para continuar.';
      case 'FORBIDDEN':
        return 'Você não tem permissão.';
      case 'CSRF_INVALID':
        return 'Sessão expirada. Entre de novo.';
      case 'IDEMPOTENCY_KEY_REUSED':
        return 'Pedido já enviado.';
      case 'ORDER_NOT_READY_FOR_PICKUP':
        return 'Pedido ainda não está pronto.';
      case 'ORDER_MOTOBOY_REQUIRED':
        return 'Aguardando motoboy.';
      case 'ORDER_ALREADY_ASSIGNED':
        return 'Pedido já em entrega.';
      case 'ORDER_INVALID_STATUS_TRANSITION':
        return 'Status inválido.';
      case 'ORDER_NOT_AVAILABLE':
        return 'Pedido indisponível.';
      case 'ORDER_NOT_ASSIGNED':
        return 'Aguardando motoboy.';
      case 'ORDER_NOT_COMPLETABLE':
        return 'Não pode finalizar agora.';
      case 'ORDER_NOT_CANCELLABLE':
        return 'Não pode cancelar agora.';
      case 'ORDER_NOT_FOUND':
        return 'Pedido não encontrado.';
      case 'INVALID_CEP':
        return 'CEP inválido.';
      case 'CEP_NOT_FOUND':
        return 'CEP não encontrado.';
      case 'DELIVERY_ADDRESS_NOT_FOUND':
        return 'Endereço não localizado.';
      case 'DELIVERY_ROUTE_NOT_FOUND':
        return 'Rota não encontrada.';
      case 'DELIVERY_QUOTE_FAILED':
        return 'Falha ao calcular frete.';
      default:
        return 'Algo deu errado. Tente de novo.';
    }
  }

  return value instanceof Error ? value.message : String(value);
}

const CSRF_STORAGE_KEY = 'sr_csrf';
let cachedCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  cachedCsrfToken = token;
  if (typeof window === 'undefined') return;
  if (!token) {
    window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
}

export function getCsrfToken() {
  if (cachedCsrfToken) return cachedCsrfToken;
  if (typeof window === 'undefined') return null;
  const token = window.sessionStorage.getItem(CSRF_STORAGE_KEY);
  cachedCsrfToken = token;
  return token;
}

export function apiBaseUrl() {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit && explicit.trim()) return explicit;
  if (!import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3001';
}

export async function apiFetch(
  pathname: string,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(pathname, apiBaseUrl());
  const method = (init?.method ?? 'GET').toUpperCase();
  const unsafe = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
  const csrfToken = unsafe ? getCsrfToken() : null;

  const headers = new Headers(init?.headers);
  const hasBody = init?.body != null && method !== 'GET' && method !== 'HEAD';
  const isFormData = hasBody && init.body instanceof FormData;
  if (hasBody && !headers.has('Content-Type') && !isFormData) {
    headers.set('Content-Type', 'application/json');
  }
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);

  const fetchOptions: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  const MAX_RETRIES = 2;
  let attempt = 0;
  let res: Response;

  while (true) {
    res = await fetch(url, fetchOptions);
    if (res.ok) return res;

    // Retry only on GET requests for certain status codes (502, 503, 504)
    if (
      !unsafe &&
      attempt < MAX_RETRIES &&
      [502, 503, 504].includes(res.status)
    ) {
      attempt++;
      const delay = 500 * Math.pow(2, attempt); // 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    break; // don't retry, let error logic handle it
  }

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
