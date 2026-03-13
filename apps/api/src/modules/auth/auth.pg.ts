import type { Pool } from 'pg';
import { getPgPool } from '../../db/postgres.js';

export function requirePgPool(): Pool {
  const pool = getPgPool();
  if (!pool) {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }
  return pool;
}
