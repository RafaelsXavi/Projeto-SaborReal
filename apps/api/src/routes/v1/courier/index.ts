import { Router } from 'express';
import { requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';
import { courierCompleteOrder } from '../../../modules/orders/orders.courier.controller.js';
import {
  acceptOrder,
  listAvailableOrders,
  listOrdersForCourier,
} from '../../../modules/orders/orders.service.js';

export const courierRouter = Router();

courierRouter.use(requireRole('courier'));

courierRouter.get('/orders/available', async (_req, res, next) => {
  try {
    const orders = await listAvailableOrders();
    res.json({ ok: true, orders });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

courierRouter.get('/orders/mine', async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const orders = await listOrdersForCourier(req.auth.userId);
    res.json({ ok: true, orders });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

courierRouter.post('/orders/:id/accept', async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const orderId = req.params.id;
    if (!orderId) return next(new AppError('INVALID_ORDER_ID', 400));

    try {
      const order = await acceptOrder({ orderId, courierId: req.auth.userId });
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

courierRouter.post('/orders/:id/complete', courierCompleteOrder);
