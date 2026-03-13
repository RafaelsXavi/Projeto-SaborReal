import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/error.js';
import { requirePgPool } from '../auth/auth.pg.js';
import { PgJobsRepo } from './jobs.repo.js';

export const listJobs: RequestHandler = async (req, res, next) => {
  try {
    const limitRaw = req.query.limit;
    const limit =
      typeof limitRaw === 'string'
        ? Math.min(Math.max(Number(limitRaw), 1), 200)
        : 50;

    const pool = requirePgPool();
    const repo = new PgJobsRepo(pool);
    const jobs = await repo.listRecent(Number.isFinite(limit) ? limit : 50);
    res.json({ ok: true, jobs });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};

export const getJob: RequestHandler = async (req, res, next) => {
  try {
    const raw = req.params.id;
    const id = typeof raw === 'string' ? raw : null;
    if (!id) return next(new AppError('INVALID_JOB_ID', 400));

    const pool = requirePgPool();
    const repo = new PgJobsRepo(pool);
    const job = await repo.getById(id);
    if (!job) return next(new AppError('NOT_FOUND', 404));
    res.json({ ok: true, job });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
};
