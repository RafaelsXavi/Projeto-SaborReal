import type { Role } from '@saborreal/shared';
import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.js';
import { requirePgPool } from './auth.pg.js';
import {
  accessTokenCookieOptions,
  csrfCookieOptions,
  issueAccessToken,
  newCsrfToken,
  refreshTokenCookieOptions,
} from './auth.service.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  hashRefreshToken,
  newRefreshToken,
  PgRefreshTokensRepo,
} from './refreshTokens.repo.js';
import { PgUsersRepo } from './users.repo.js';

function parseIdentifier(identifier: string) {
  const raw = identifier.trim();
  const looksLikeEmail = raw.includes('@');
  if (looksLikeEmail)
    return { email: raw.toLowerCase(), phone: null as string | null };
  return { email: null as string | null, phone: raw };
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getCookie(req: Parameters<RequestHandler>[0], name: string) {
  const value = req.cookies?.[name];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function clearAuthCookies(res: Parameters<RequestHandler>[1]) {
  res.clearCookie(env.ACCESS_TOKEN_COOKIE_NAME, { path: '/' });
  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, { path: '/v1/auth' });
  res.clearCookie(env.CSRF_COOKIE_NAME, { path: '/' });
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);

    const body = req.body as { identifier: string; password: string };
    const id = parseIdentifier(body.identifier);

    const passwordHash = hashPassword(body.password);
    const user = await users.create({
      email: id.email,
      phone: id.phone,
      passwordHash,
      role: 'customer',
    });

    res
      .status(201)
      .json({ ok: true, user: { userId: user.id, role: user.role } });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    // Postgres unique violation.
    if (
      typeof err === 'object' &&
      err &&
      'code' in err &&
      err.code === '23505'
    ) {
      return next(new AppError('USER_ALREADY_EXISTS', 409));
    }
    next(err);
  }
};

export const devCreateUser: RequestHandler = async (req, res, next) => {
  try {
    if (!env.DEV_AUTH_ENABLED) return next(new AppError('NOT_FOUND', 404));

    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);

    const body = req.body as {
      identifier: string;
      password: string;
      role: Role;
    };

    const id = parseIdentifier(body.identifier);
    const passwordHash = hashPassword(body.password);
    const user = await users.create({
      email: id.email,
      phone: id.phone,
      passwordHash,
      role: body.role,
    });

    res
      .status(201)
      .json({ ok: true, user: { userId: user.id, role: user.role } });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    if (
      typeof err === 'object' &&
      err &&
      'code' in err &&
      err.code === '23505'
    ) {
      return next(new AppError('USER_ALREADY_EXISTS', 409));
    }
    next(err);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  const body = req.body as { identifier: string; password: string };
  const identifier = body.identifier.toLowerCase();

  // DEV MOCK AUTH FALLBACK (Global)
  if (env.DEV_AUTH_ENABLED) {
    const devAccounts: Record<string, { role: Role; pass: string }> = {
      'admin@saborreal.com': { role: 'admin', pass: 'admin1234' },
      'motoboy@saborreal.com': { role: 'motoboy', pass: 'motoboy1234' },
      'customer@saborreal.com': { role: 'customer', pass: 'customer1234' },
    };

    if (
      devAccounts[identifier] &&
      devAccounts[identifier].pass === body.password
    ) {
      const sessionUser = {
        userId: `mock-${identifier.split('@')[0]}`,
        role: devAccounts[identifier].role,
      };
      const accessToken = issueAccessToken(sessionUser);
      const csrfToken = newCsrfToken();

      res.cookie(
        env.ACCESS_TOKEN_COOKIE_NAME,
        accessToken,
        accessTokenCookieOptions(),
      );
      res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
      return res.json({ ok: true, user: sessionUser, csrfToken });
    }
  }

  try {
    const pool = requirePgPool();
    const users = new PgUsersRepo(pool);
    const refreshTokens = new PgRefreshTokensRepo(pool);

    const id = parseIdentifier(body.identifier);
    const user = id.email
      ? await users.findByEmail(id.email)
      : await users.findByPhone(id.phone ?? '');

    if (!user || !verifyPassword(body.password, user.passwordHash)) {
      return next(new AppError('INVALID_CREDENTIALS', 401));
    }

    const sessionUser = { userId: user.id, role: user.role };
    const accessToken = issueAccessToken(sessionUser);
    const csrfToken = newCsrfToken();

    const refreshToken = newRefreshToken();
    const refreshRecord = await refreshTokens.create({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS),
      userAgent: req.header('user-agent') ?? null,
      ip: req.ip ?? null,
    });

    res.cookie(
      env.ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      accessTokenCookieOptions(),
    );
    res.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshTokenCookieOptions(),
    );
    res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());

    res.json({
      ok: true,
      user: sessionUser,
      csrfToken,
      refreshTokenId:
        env.NODE_ENV === 'production' ? undefined : refreshRecord.id,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const pool = requirePgPool();
    const refreshTokens = new PgRefreshTokensRepo(pool);
    const users = new PgUsersRepo(pool);

    const raw = getCookie(req, env.REFRESH_TOKEN_COOKIE_NAME);
    if (!raw) return next(new AppError('UNAUTHENTICATED', 401));

    const tokenHash = hashRefreshToken(raw);
    const record = await refreshTokens.findByTokenHash(tokenHash);
    if (!record) return next(new AppError('UNAUTHENTICATED', 401));

    const now = new Date();
    if (record.revokedAt) {
      await refreshTokens.revokeDescendants(record.id);
      await refreshTokens.revokeUserTokens(record.userId);
      clearAuthCookies(res);
      return next(new AppError('TOKEN_REUSED', 401));
    }

    if (now.getTime() >= new Date(record.expiresAt).getTime()) {
      clearAuthCookies(res);
      return next(new AppError('REFRESH_EXPIRED', 401));
    }

    const user = await users.findById(record.userId);
    if (!user) {
      clearAuthCookies(res);
      return next(new AppError('UNAUTHENTICATED', 401));
    }

    const nextRefreshRaw = newRefreshToken();
    const nextRefresh = await refreshTokens.create({
      userId: user.id,
      tokenHash: hashRefreshToken(nextRefreshRaw),
      expiresAt: addDays(now, env.REFRESH_TOKEN_TTL_DAYS),
      userAgent: req.header('user-agent') ?? null,
      ip: req.ip ?? null,
    });

    await refreshTokens.revoke({
      tokenId: record.id,
      replacedByTokenId: nextRefresh.id,
    });

    const sessionUser = { userId: user.id, role: user.role };
    const accessToken = issueAccessToken(sessionUser);
    const csrfToken = newCsrfToken();

    res.cookie(
      env.ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      accessTokenCookieOptions(),
    );
    res.cookie(
      env.REFRESH_TOKEN_COOKIE_NAME,
      nextRefreshRaw,
      refreshTokenCookieOptions(),
    );
    res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());

    res.json({ ok: true, user: sessionUser, csrfToken });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const pool = requirePgPool();
    const refreshTokens = new PgRefreshTokensRepo(pool);

    const raw = getCookie(req, env.REFRESH_TOKEN_COOKIE_NAME);
    if (raw) {
      const tokenHash = hashRefreshToken(raw);
      const record = await refreshTokens.findByTokenHash(tokenHash);
      if (record) await refreshTokens.revoke({ tokenId: record.id });
    }

    clearAuthCookies(res);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      // Still clear cookies even if DB isn't available.
      clearAuthCookies(res);
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};

export const session: RequestHandler = (req, res) => {
  if (!req.auth) return res.json({ authenticated: false });
  const existing =
    typeof req.cookies?.[env.CSRF_COOKIE_NAME] === 'string'
      ? (req.cookies[env.CSRF_COOKIE_NAME] as string)
      : null;
  const csrfToken = existing ?? newCsrfToken();
  if (!existing) {
    res.cookie(env.CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions());
  }
  res.json({ authenticated: true, user: req.auth, csrfToken });
};
