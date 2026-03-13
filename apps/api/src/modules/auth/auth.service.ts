import { randomBytes } from 'node:crypto';
import type { Role } from '@saborreal/shared';
import type { CookieOptions } from 'express';
import { env } from '../../config/env.js';
import { signAccessToken, verifyAccessToken } from './jwt.js';

export type SessionUser = { userId: string; role: Role };

export function cookieSecurityOptions(): Pick<
  CookieOptions,
  'secure' | 'sameSite' | 'path'
> {
  const secure = env.NODE_ENV === 'production';
  return { secure, sameSite: 'lax', path: '/' };
}

export function issueAccessToken(user: SessionUser) {
  return signAccessToken({
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    ttlSeconds: env.ACCESS_TOKEN_TTL_SECONDS,
    userId: user.userId,
    role: user.role,
  });
}

export function verifyAccessTokenFromString(token: string) {
  return verifyAccessToken({
    secret: env.JWT_SECRET,
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    token,
  });
}

export function newCsrfToken() {
  return randomBytes(32).toString('base64url');
}

export function accessTokenCookieOptions(): CookieOptions {
  return {
    ...cookieSecurityOptions(),
    httpOnly: true,
    maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000,
  };
}

export function refreshTokenCookieOptions(): CookieOptions {
  return {
    ...cookieSecurityOptions(),
    httpOnly: true,
    path: '/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export function csrfCookieOptions(): CookieOptions {
  return {
    ...cookieSecurityOptions(),
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
  };
}
