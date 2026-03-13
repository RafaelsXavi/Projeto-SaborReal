import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.js';
import { verifyAccessTokenFromString } from './auth.service.js';

function bearerFromAuthHeader(headerValue: string | undefined) {
  if (!headerValue) return null;
  const [scheme, value] = headerValue.split(' ');
  if (scheme?.toLowerCase() !== 'bearer') return null;
  if (!value) return null;
  return value.trim();
}

export function jwtAuth(): RequestHandler {
  return (req, res, next) => {
    const bearer = bearerFromAuthHeader(req.header('authorization'));
    const cookieToken =
      typeof req.cookies?.[env.ACCESS_TOKEN_COOKIE_NAME] === 'string'
        ? (req.cookies[env.ACCESS_TOKEN_COOKIE_NAME] as string)
        : null;
    const token = bearer ?? cookieToken;

    if (!token) return next();

    try {
      const claims = verifyAccessTokenFromString(token);
      req.auth = { userId: claims.sub, role: claims.role };
    } catch (_err) {
      // Treat invalid/expired tokens as anonymous; protected routes will reject.
      if (!bearer && cookieToken) {
        res.clearCookie(env.ACCESS_TOKEN_COOKIE_NAME, { path: '/' });
      }
      delete req.auth;
    }

    next();
  };
}

export function csrfProtection(): RequestHandler {
  const unsafe = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  return (req, _res, next) => {
    if (!unsafe.has(req.method.toUpperCase())) return next();

    const bearer = bearerFromAuthHeader(req.header('authorization'));
    if (bearer) return next();

    const hasCookieAuth =
      Boolean(req.cookies?.[env.ACCESS_TOKEN_COOKIE_NAME]) ||
      Boolean(req.cookies?.[env.REFRESH_TOKEN_COOKIE_NAME]);
    if (!hasCookieAuth) return next();

    const csrfCookie =
      typeof req.cookies?.[env.CSRF_COOKIE_NAME] === 'string'
        ? (req.cookies[env.CSRF_COOKIE_NAME] as string)
        : null;
    const csrfHeader = req.header('x-csrf-token')?.trim() ?? null;

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return next(new AppError('CSRF_INVALID', 403));
    }

    next();
  };
}
