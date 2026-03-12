import { Router } from 'express';
import { mongoPing, pgPing } from '../db/index.js';
import { AppError } from '../middleware/error.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Readiness: validates external dependencies. Keep /healthz lightweight.
healthRouter.get('/readyz', async (_req, res, next) => {
  try {
    const [pg, mongo] = await Promise.allSettled([pgPing(), mongoPing()]);

    const pgOk = pg.status === 'fulfilled' && pg.value.ok;
    const mongoOk = mongo.status === 'fulfilled' && mongo.value.ok;

    if (!pgOk || !mongoOk) {
      return next(new AppError('NOT_READY', 503));
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
