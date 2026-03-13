import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';
import { cancelMyOrder } from '../../../modules/orders/orders.me.controller.js';
import { listOrdersForUser } from '../../../modules/orders/orders.service.js';

export const meRouter = Router();

meRouter.use(requireAuth());
meRouter.use(requireRole('customer', 'admin', 'courier'));

meRouter.get('/orders', async (req, res, next) => {
  try {
    if (!req.auth) return next(new AppError('UNAUTHENTICATED', 401));
    const orders = await listOrdersForUser(req.auth.userId);
    res.json({ ok: true, orders });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

meRouter.post('/orders/:id/cancel', cancelMyOrder);
