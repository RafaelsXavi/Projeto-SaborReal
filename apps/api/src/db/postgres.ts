import { Pool } from 'pg';

import { env } from '../config/env.js';

let pool: Pool | null = null;

export function getPgPool(): Pool | null {
  if (!env.DATABASE_URL) return null;
  if (pool) return pool;

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    ssl: env.PG_SSL
      ? { rejectUnauthorized: env.PG_SSL_REJECT_UNAUTHORIZED }
      : undefined,
  });

  return pool;
}

export async function pgPing() {
  const p = getPgPool();
  if (!p)
    return { ok: false as const, reason: 'DATABASE_URL_not_set' as const };

  // Lightweight query to verify connectivity.
  await p.query('select 1');
  return { ok: true as const };
}
