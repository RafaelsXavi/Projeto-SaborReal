import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/error.js';
import { updateOrderStatus } from './orders.service.js';

export const adminUpdateOrderStatus: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const raw = req.params.id;
    const orderId = typeof raw === 'string' ? raw : null;
    if (!orderId) return next(new AppError('INVALID_ORDER_ID', 400));

    const body = req.body as { status: string };
    try {
      const order = await updateOrderStatus({
        orderId,
        status: body.status as never,
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
      if (err.message === 'ORDER_COURIER_REQUIRED') {
        return next(new AppError('ORDER_COURIER_REQUIRED', 409));
      }
      if (err.message === 'ORDER_INVALID_STATUS_TRANSITION') {
        return next(new AppError('ORDER_INVALID_STATUS_TRANSITION', 409));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};
