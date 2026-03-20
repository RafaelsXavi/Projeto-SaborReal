import { Router } from 'express';
import { requireRole } from '../../../middleware/auth.js';
import { AppError } from '../../../middleware/error.js';
import { validateBody } from '../../../middleware/validate.js';
import { listAuditEvents } from '../../../modules/audit/audit.admin.controller.js';
import {
  createMotoboy,
  deleteMotoboy,
  listMotoboys,
  updateMotoboy,
} from '../../../modules/auth/motoboys.admin.controller.js';
import {
  adminCreateCatalogItem,
  adminDeleteCatalogItem,
  adminUpdateCatalogItem,
} from '../../../modules/catalog/catalog.admin.controller.js';
import {
  getJob,
  listJobs,
} from '../../../modules/jobs/jobs.admin.controller.js';
import { adminUpdateOrderStatus } from '../../../modules/orders/orders.admin.controller.js';
import { updateOrderStatusSchema } from '../../../modules/orders/orders.schemas.js';
import { listAllOrders } from '../../../modules/orders/orders.service.js';

export const adminRouter = Router();

adminRouter.use(requireRole('admin'));

adminRouter.get('/orders', async (_req, res, next) => {
  try {
    const orders = await listAllOrders();
    res.json({ ok: true, orders });
  } catch (err) {
    if (err instanceof Error && err.message === 'DATABASE_NOT_CONFIGURED') {
      return next(new AppError('DATABASE_NOT_CONFIGURED', 503));
    }
    next(err);
  }
});

adminRouter.patch(
  '/orders/:id/status',
  validateBody(updateOrderStatusSchema),
  adminUpdateOrderStatus,
);

adminRouter.get('/jobs', listJobs);
adminRouter.get('/jobs/:id', getJob);
adminRouter.get('/audit', listAuditEvents);

// Motoboy CRUD
adminRouter.get('/motoboys', listMotoboys);
adminRouter.post('/motoboys', createMotoboy);
adminRouter.put('/motoboys/:id', updateMotoboy);
adminRouter.delete('/motoboys/:id', deleteMotoboy);

// Catalog CRUD
adminRouter.post('/catalog', adminCreateCatalogItem);
adminRouter.patch('/catalog/:id', adminUpdateCatalogItem);
adminRouter.delete('/catalog/:id', adminDeleteCatalogItem);
