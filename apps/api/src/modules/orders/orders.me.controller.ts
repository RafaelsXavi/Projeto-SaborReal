import type { RequestHandler } from 'express';
import { getPgPool } from '../../db/postgres.js';
import { AppError } from '../../middleware/error.js';
import { PgJobsRepo } from '../jobs/jobs.repo.js';
import { cancelOrder } from './orders.service.js';

export const cancelMyOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const raw = req.params.id;
    const orderId = typeof raw === 'string' ? raw : null;
    if (!orderId) return next(new AppError('INVALID_ORDER_ID', 400));

    try {
      const order = await cancelOrder({ orderId, userId: req.auth.userId });
      res.json({ ok: true, order });

      const pool = getPgPool();
      if (pool) {
        const jobs = new PgJobsRepo(pool);
        void jobs.enqueue({
          name: 'orders.after_cancel',
          payload: { orderId, userId: req.auth.userId },
        });
      }
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      if (err.message === 'DATABASE_NOT_CONFIGURED') {
        return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
      }
      if (err.message === 'ORDER_NOT_FOUND') {
        return next(new AppError('ORDER_NOT_FOUND', 404));
      }
      if (err.message === 'ORDER_NOT_CANCELLABLE') {
        return next(new AppError('ORDER_NOT_CANCELLABLE', 409));
      }
      if (err.message === 'FORBIDDEN') {
        return next(new AppError('FORBIDDEN', 403));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
