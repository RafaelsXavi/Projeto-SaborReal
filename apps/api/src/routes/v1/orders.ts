import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

export const ordersRouter = Router();

ordersRouter.post('/', requireAuth(), (_req, _res, next) => {
  // Checkout/idempotency + persistence will be implemented when we add DB.
  next(new AppError('NOT_IMPLEMENTED', 501));
});
