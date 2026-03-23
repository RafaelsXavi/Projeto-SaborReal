import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env.js';

function looksLikeDbUnavailable(err: unknown) {
  const e = err as { code?: unknown; errno?: unknown; message?: unknown } | null;
  const code = typeof e?.code === 'string' ? e.code : null;
  const errno = typeof e?.errno === 'number' ? e.errno : null;
  const message = typeof e?.message === 'string' ? e.message : '';

  // Common Node/pg network error codes
  const networkCodes = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EAI_AGAIN',
    'ENOTFOUND',
    'ENETUNREACH',
    'EHOSTUNREACH',
  ]);

  if (code && networkCodes.has(code)) return true;
  // Windows/Node socket errors can show up as errno values too.
  if (errno && [-4078, -4048].includes(errno)) return true;
  // Fallback for messages coming from drivers / proxies.
  if (message.includes('ECONNREFUSED')) return true;
  if (message.toLowerCase().includes('timeout')) return true;
  if (message.toLowerCase().includes('certificate')) return true;

  return false;
}

export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, status = 400, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

export function notFoundHandler(): RequestHandler {
  return (_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'NOT_FOUND' },
    });
  };
}

export function errorHandler(): ErrorRequestHandler {
  return (err, req, res, _next) => {
    const isAppError = err instanceof AppError;
    const dbUnavailable = !isAppError && looksLikeDbUnavailable(err);

    const status = isAppError ? err.status : dbUnavailable ? 503 : 500;
    const code = isAppError ? err.code : dbUnavailable ? 'DATABASE_UNAVAILABLE' : 'INTERNAL';

    // Log full details server-side, but keep client responses minimal.
    req.log?.error(
      {
        err,
        code,
        status,
        method: req.method,
        url: req.url,
        userId: req.auth?.userId,
        requestId: req.id,
      },
      'request_error',
    );

    const message =
      env.NODE_ENV === 'production' && status >= 500
        ? 'UNEXPECTED'
        : err instanceof AppError
          ? err.message
          : dbUnavailable
            ? 'DATABASE_UNAVAILABLE'
            : 'UNEXPECTED';

    res.status(status).json({
      error: {
        code,
        message,
      },
    });
  };
}
