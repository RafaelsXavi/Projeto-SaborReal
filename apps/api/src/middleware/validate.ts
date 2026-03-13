import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from './error.js';

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError('INVALID_BODY', 400));
    req.body = parsed.data;
    next();
  };
}
