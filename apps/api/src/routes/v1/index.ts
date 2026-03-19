import { Router } from 'express';
import { authRouter } from '../../modules/auth/auth.routes.js';
import { adminRouter } from './admin/index.js';
import { catalogRouter } from './catalog.js';
import { motoboyRouter } from './motoboy/index.js';
import { meRouter } from './me/index.js';
import { ordersRouter } from './orders.js';

export const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/catalog', catalogRouter);
v1Router.use('/orders', ordersRouter);

// Surface-isolated route groups (RBAC enforced inside each group)
v1Router.use('/admin', adminRouter);
v1Router.use('/motoboy', motoboyRouter);
v1Router.use('/me', meRouter);
