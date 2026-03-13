import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/error.js';
import { requirePgPool } from '../auth/auth.pg.js';
import { PgAuditRepo } from './audit.repo.js';

export const listAuditEvents: RequestHandler = async (req, res, next) => {
  try {
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === 'string'
        ? Math.min(Math.max(Number(limitRaw), 1), 200)
        : 50;

    const pool = requirePgPool();
    const repo = new PgAuditRepo(pool);
    const events = await repo.listRecent(Number.isFinite(limit) ? limit : 50);
    res.json({ ok: true, events });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};
