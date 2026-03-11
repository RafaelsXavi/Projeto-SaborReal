import { Router } from 'express';
import { requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';

export const courierRouter = Router();

courierRouter.use(requireRole('courier'));

courierRouter.get('/orders/available', (_req, _res, next) => {
  next(new AppError('NOT_IMPLEMENTED', 501));
});

courierRouter.post('/orders/:id/accept', (_req, _res, next) => {
  next(new AppError('NOT_IMPLEMENTED', 501));
});
