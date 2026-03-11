import { Router } from 'express';
import { adminRouter } from './admin/index.js';
import { catalogRouter } from './catalog.js';
import { courierRouter } from './courier/index.js';
import { meRouter } from './me/index.js';
import { ordersRouter } from './orders.js';

export const v1Router = Router();

v1Router.use('/catalog', catalogRouter);
v1Router.use('/orders', ordersRouter);

// Surface-isolated route groups (RBAC enforced inside each group)
v1Router.use('/admin', adminRouter);
v1Router.use('/courier', courierRouter);
v1Router.use('/me', meRouter);
