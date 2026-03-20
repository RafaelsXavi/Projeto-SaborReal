import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env.js';

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
    const status = err instanceof AppError ? err.status : 500;
    const code = err instanceof AppError ? err.code : 'INTERNAL';

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
      env.NODE_ENV === 'production' && status === 500
        ? 'UNEXPECTED'
        : err instanceof AppError
          ? err.message
          : 'UNEXPECTED';

    res.status(status).json({
      error: {
        code,
        message,
      },
    });
  };
}
