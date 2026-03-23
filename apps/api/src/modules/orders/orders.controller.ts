import type { Request, RequestHandler } from 'express';
import { getPgPool } from '../../db/postgres.js';
import { AppError } from '../../middleware/error.js';
import { PgJobsRepo } from '../jobs/jobs.repo.js';
import { placeOrderSchema } from './orders.schemas.js';
import { placeOrder } from './orders.service.js';

function getIdempotencyKey(req: Request) {
  const rawHeader = (req as any).get?.('idempotency-key') ?? req.headers?.['idempotency-key'];
  const raw = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)?.trim?.();
  if (!raw) return null;
  if (raw.length > 120) return null;
  return raw;
}

export const placeOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));

    const idempotencyKey = getIdempotencyKey(req);
    if (!idempotencyKey)
      return next(new AppError('MISSING_IDEMPOTENCY_KEY', 400));

    const validated = placeOrderSchema.safeParse(req.body);
    if (!validated.success) {
      return next(new AppError('INVALID_INPUT', 400));
    }

    const { lines, distanceKm, delivery } = validated.data;
    try {
      const result = await placeOrder({
        userId: req.auth.userId,
        lines,
        idempotencyKey,
        body: req.body,
        distanceKm,
        delivery,
      });

      res.status(result.replay ? 200 : 201).json({
        ok: true,
        replay: result.replay,
        order: result.order,
      });

      // Best-effort async job. For mission-critical side effects use an outbox table.
      const pool = getPgPool();
      if (pool) {
        const jobs = new PgJobsRepo(pool);
        void jobs
          .enqueue({
            name: 'orders.after_place',
            payload: { orderId: result.order.id, userId: req.auth.userId },
          })
          .catch(() => undefined);
      }
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      if (err.message === 'IDEMPOTENCY_KEY_REUSED') {
        return next(new AppError('IDEMPOTENCY_KEY_REUSED', 409));
      }
      if (err.message === 'DATABASE_NOT_CONFIGURED') {
        return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
