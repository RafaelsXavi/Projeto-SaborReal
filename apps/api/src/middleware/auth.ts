import type { Role } from '@saborreal/shared';
import type { RequestHandler } from 'express';
import { AppError } from './error.js';

export type AuthContext = {
  userId: string;
  role: Role;
};

// Later: populate this from session/cookies/JWT.
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    next();
  };
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    if (!roles.includes(req.auth.role))
      return next(new AppError('FORBIDDEN', 403));
    next();
  };
}
