import { Router } from 'express';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { mongoPing, pgPing } from '../db/index.js';
import { AppError } from '../middleware/error.js';

export const healthRouter = Router();

function summarizeSettled(
  r: PromiseSettledResult<{ ok: boolean; reason?: string }>,
) {
  if (r.status === 'fulfilled') {
    if (r.value.ok) return 'ok';
    return `not_ok(${r.value.reason ?? 'unknown'})`;
  }
  const reason =
    (r.reason as { message?: unknown } | null)?.message ?? r.reason;
  return `rejected(${String(reason)})`;
}

healthRouter.get('/', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Readiness: validates external dependencies. Keep /healthz lightweight.
healthRouter.get('/readyz', async (_req, res, next) => {
  try {
    const [pg, mongo] = await Promise.allSettled([
      pgPing(),
      env.MONGO_URI ? mongoPing() : Promise.resolve({ ok: true as const }),
    ]);

    const pgOk = pg.status === 'fulfilled' && pg.value.ok;
    const mongoOk = mongo.status === 'fulfilled' && mongo.value.ok;

    if (!pgOk || !mongoOk) {
      const details = {
        ok: false as const,
        hasDbEnv: Boolean(env.DATABASE_URL),
        pg: summarizeSettled(pg),
        mongo: summarizeSettled(mongo),
      };

      logger.error(
        {
          ...details,
          requestId: (res as any).get?.('X-Request-Id'),
        },
        'readiness_failed',
      );

      // Secure opt-in diagnostics even in production (use env.READYZ_TOKEN).
      const token =
        typeof env.READYZ_TOKEN === 'string' && env.READYZ_TOKEN.length > 0
          ? env.READYZ_TOKEN
          : null;
      const supplied =
        typeof (_req as any).query?.token === 'string'
          ? ((_req as any).query.token as string)
          : null;
      if (token && supplied === token) {
        return res.status(503).json(details);
      }

      // In production, keep readiness failure reasons out of the response body.
      if (env.NODE_ENV === 'production') {
        return next(new AppError('NOT_READY', 503));
      }

      const msg = `NOT_READY: hasDbEnv=${Boolean(env.DATABASE_URL)} procDbEnv=${Boolean(process.env.DATABASE_URL)} pg=${summarizeSettled(pg)} mongo=${summarizeSettled(mongo)}`;
      return next(new AppError('NOT_READY', 503, msg));
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
