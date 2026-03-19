import { Router } from 'express';
import { listCatalog } from '../../modules/catalog/catalog.service.js';

export const catalogRouter = Router();

catalogRouter.get('/', async (_req, res, next) => {
  try {
    const catalog = await listCatalog();
    // Keep `items` at the top-level for backward compatibility with older web clients.
    res.json({
      ok: true,
      items: catalog.items,
      categories: catalog.categories,
    });
  } catch (err) {
    next(err);
  }
});
