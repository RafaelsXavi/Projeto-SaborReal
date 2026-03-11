import { Router } from 'express';
import { requireAuth, requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';

export const meRouter = Router();

meRouter.use(requireAuth());
meRouter.use(requireRole('customer', 'admin', 'courier'));

meRouter.get('/orders', (_req, _res, next) => {
  next(new AppError('NOT_IMPLEMENTED', 501));
});
