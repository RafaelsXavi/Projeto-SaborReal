import { Router } from 'express';
import { requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';
import { motoboyCompleteOrder } from '../../../modules/orders/orders.motoboy.controller.js';
import {
  acceptOrder,
  getMotoboyStats,
  listAvailableOrdersEnriched,
  listOrdersForMotoboyEnriched,
} from '../../../modules/orders/orders.service.js';

export const motoboyRouter = Router();

motoboyRouter.use(requireRole('motoboy'));

motoboyRouter.get('/orders/available', async (_req, res, next) => {
  try {
    const orders = await listAvailableOrdersEnriched();
    res.json({ ok: true, orders });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

motoboyRouter.get('/orders/mine', async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const orders = await listOrdersForMotoboyEnriched(req.auth.userId);
    res.json({ ok: true, orders });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

motoboyRouter.post('/orders/:id/accept', async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const orderId = req.params.id;
    if (!orderId) return next(new AppError('INVALID_ORDER_ID', 400));

    try {
      const order = await acceptOrder({ orderId, motoboyId: req.auth.userId });
      res.json({ ok: true, order });
    } catch (err) {
      if (!(err instanceof Error)) throw err;
      if (err.message === 'DATABASE_NOT_CONFIGURED') {
        return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
      }
      if (err.message === 'ORDER_NOT_FOUND') {
        return next(new AppError('ORDER_NOT_FOUND', 404));
      }
      if (err.message === 'ORDER_ALREADY_ASSIGNED') {
        return next(new AppError('ORDER_ALREADY_ASSIGNED', 409));
      }
      if (err.message === 'ORDER_NOT_AVAILABLE') {
        return next(new AppError('ORDER_NOT_AVAILABLE', 409));
      }
      if (err.message === 'ORDER_NOT_READY_FOR_PICKUP') {
        return next(new AppError('ORDER_NOT_READY_FOR_PICKUP', 409));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

motoboyRouter.get('/stats', async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const stats = await getMotoboyStats(req.auth.userId);
    res.json({ ok: true, stats });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

motoboyRouter.post('/orders/:id/complete', motoboyCompleteOrder);
