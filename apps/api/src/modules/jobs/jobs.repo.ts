import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';

import type { JobName, JobRow } from './jobs.types.js';

type DbJobRow = {
  id: string;
  name: JobName;
  payload: unknown;
  run_at: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  attempts: number;
  max_attempts: number;
  locked_at: string | null;
  locked_by: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbJobRow): JobRow {
  return {
    id: row.id,
    name: row.name,
    payload: row.payload,
    runAt: row.run_at,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgJobsRepo {
  constructor(private pool: Pool) {}

  async enqueue(input: {
    name: JobName;
    payload: unknown;
    runAt?: Date;
    maxAttempts?: number;
  }): Promise<JobRow> {
    const id = randomUUID();
    const res = await this.pool.query<DbJobRow>(
      `insert into jobs (id, name, payload, run_at, max_attempts)
       values ($1, $2, $3, $4, $5)
       returning id, name, payload, run_at, status, attempts, max_attempts, locked_at, locked_by, last_error, created_at, updated_at`,
      [
        id,
        input.name,
        input.payload ?? {},
        (input.runAt ?? new Date()).toISOString(),
        input.maxAttempts ?? 5,
      ],
    );
    const row = res.rows[0];
    if (!row) throw new Error('JOB_INSERT_FAILED');
    return mapRow(row);
  }

  async fetchAndLock(input: {
    limit: number;
    workerId: string;
  }): Promise<JobRow[]> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const res = await client.query<DbJobRow>(
        `with cte as (
           select id
           from jobs
           where status = 'pending'
             and run_at <= now()
           order by run_at asc
           limit $1
           for update skip locked
         )
         update jobs
         set status = 'processing',
             locked_at = now(),
             locked_by = $2,
             attempts = attempts + 1,
             updated_at = now()
         where id in (select id from cte)
         returning id, name, payload, run_at, status, attempts, max_attempts, locked_at, locked_by, last_error, created_at, updated_at`,
        [input.limit, input.workerId],
      );
      await client.query('commit');
      return res.rows.map(mapRow);
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  }

  async markSucceeded(jobId: string) {
    await this.pool.query(
      `update jobs
       set status = 'succeeded',
           updated_at = now()
       where id = $1`,
      [jobId],
    );
  }

  async markFailed(input: {
    jobId: string;
    error: string;
    retryAfterSeconds?: number;
  }) {
    const retryAfter = input.retryAfterSeconds ?? 30;
    await this.pool.query(
      `update jobs
       set status = case when attempts >= max_attempts then 'failed' else 'pending' end,
           last_error = $2,
           run_at = case when attempts >= max_attempts then run_at else now() + ($3 || ' seconds')::interval end,
           updated_at = now()
       where id = $1`,
      [input.jobId, input.error.slice(0, 2000), String(retryAfter)],
    );
  }

  async listRecent(limit = 50) {
    const res = await this.pool.query<DbJobRow>(
      `select id, name, payload, run_at, status, attempts, max_attempts, locked_at, locked_by, last_error, created_at, updated_at
       from jobs
       order by created_at desc
       limit $1`,
      [limit],
    );
    return res.rows.map(mapRow);
  }

  async getById(id: string) {
    const res = await this.pool.query<DbJobRow>(
      `select id, name, payload, run_at, status, attempts, max_attempts, locked_at, locked_by, last_error, created_at, updated_at
       from jobs
       where id = $1
       limit 1`,
      [id],
    );
    const row = res.rows[0];
    return row ? mapRow(row) : null;
  }
}
