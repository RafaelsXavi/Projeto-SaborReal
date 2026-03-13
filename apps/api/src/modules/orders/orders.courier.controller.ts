import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/error.js';
import { completeByCourier } from './orders.service.js';

export const courierCompleteOrder: RequestHandler = async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const raw = req.params.id;
    const orderId = typeof raw === 'string' ? raw : null;
    if (!orderId) return next(new AppError('INVALID_ORDER_ID', 400));

    try {
      const order = await completeByCourier({
        orderId,
        courierId: req.auth.userId,
      });
      res.json({ ok: true, order });
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      if (err.message === 'DATABASE_NOT_CONFIGURED') {
        return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
      }
      if (err.message === 'ORDER_NOT_FOUND') {
        return next(new AppError('ORDER_NOT_FOUND', 404));
      }
      if (err.message === 'ORDER_NOT_ASSIGNED') {
        return next(new AppError('ORDER_NOT_ASSIGNED', 409));
      }
      if (err.message === 'ORDER_NOT_COMPLETABLE') {
        return next(new AppError('ORDER_NOT_COMPLETABLE', 409));
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
