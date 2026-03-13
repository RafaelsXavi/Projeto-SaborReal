import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { Pool } from 'pg';

import { logger } from '../../config/logger.js';
import { createHandlers } from './jobs.handlers.js';
import { PgJobsRepo } from './jobs.repo.js';

export type WorkerOptions = {
  pool: Pool;
  pollIntervalMs?: number;
  batchSize?: number;
};

export async function runWorker(options: WorkerOptions) {
  const workerId = `worker-${randomUUID()}`;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const batchSize = options.batchSize ?? 5;

  const repo = new PgJobsRepo(options.pool);
  const handlers = createHandlers(options.pool);
  let stopping = false;

  function shutdown() {
    stopping = true;
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  logger.info({ workerId, pollIntervalMs, batchSize }, 'jobs_worker_start');

  while (!stopping) {
    const jobs = await repo.fetchAndLock({ limit: batchSize, workerId });
    if (jobs.length === 0) {
      await delay(pollIntervalMs);
      continue;
    }

    for (const job of jobs) {
      const handler = handlers[job.name];
      if (!handler) {
        await repo.markFailed({
          jobId: job.id,
          error: `missing handler: ${job.name}`,
          retryAfterSeconds: 60,
        });
        continue;
      }

      try {
        await handler(job);
        await repo.markSucceeded(job.id);
        logger.info({ jobId: job.id, name: job.name }, 'job_succeeded');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await repo.markFailed({ jobId: job.id, error: message });
        logger.warn({ jobId: job.id, name: job.name, err }, 'job_failed');
      }
    }
  }

  logger.info({ workerId }, 'jobs_worker_stop');
}
