import 'dotenv/config';
import { logger } from './config/logger.js';
import { getPgPool } from './db/postgres.js';
import { runWorker } from './modules/jobs/jobs.worker.js';

const pool = getPgPool();
if (!pool) {
  logger.error('DATABASE_URL not set; worker cannot start');
  process.exitCode = 1;
} else {
  await runWorker({ pool });
}
