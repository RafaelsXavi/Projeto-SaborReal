import { Router } from 'express';
import { requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';

export const adminRouter = Router();

adminRouter.use(requireRole('admin'));

adminRouter.get('/orders', (_req, _res, next) => {
  next(new AppError('NOT_IMPLEMENTED', 501));
});
