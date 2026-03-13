import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { placeOrderHandler } from '../../modules/orders/orders.controller.js';
import { placeOrderSchema } from '../../modules/orders/orders.schemas.js';

export const ordersRouter = Router();

ordersRouter.post(
  '/',
  requireAuth(),
  requireRole('customer'),
  validateBody(placeOrderSchema),
  placeOrderHandler,
);
