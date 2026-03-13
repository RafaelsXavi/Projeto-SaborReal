import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

import { env } from '../config/env.js';

type MigrationRow = { filename: string; checksum: string };

function sha256Hex(input: string) {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

async function ensureMigrationsTable(pool: Pool) {
  await pool.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
}

async function getApplied(pool: Pool) {
  const res = await pool.query<MigrationRow>(
    'select filename, checksum from schema_migrations order by filename asc',
  );
  return new Map(res.rows.map((r) => [r.filename, r.checksum]));
}

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Cannot run migrations.');
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  try {
    const client = await pool.connect();
    try {
      await ensureMigrationsTable(pool);
      const applied = await getApplied(pool);

      const migrationsDir = fileURLToPath(
        new URL('../../migrations', import.meta.url),
      );
      const files = (await readdir(migrationsDir))
        .filter((f) => f.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b));

      for (const filename of files) {
        const fullPath = join(migrationsDir, filename);
        const sql = await readFile(fullPath, 'utf8');
        const checksum = sha256Hex(sql);

        const existingChecksum = applied.get(filename);
        if (existingChecksum) {
          if (existingChecksum !== checksum) {
            throw new Error(
              `Migration checksum changed: ${filename}. Refuse to run.`,
            );
          }
          continue;
        }

        await client.query('begin');
        try {
          await client.query(sql);
          await client.query(
            'insert into schema_migrations (filename, checksum) values ($1, $2)',
            [filename, checksum],
          );
          await client.query('commit');
          // eslint-disable-next-line no-console
          console.log(`applied ${filename}`);
        } catch (err) {
          await client.query('rollback');
          throw err;
        }
      }

      // eslint-disable-next-line no-console
      console.log('migrations up to date');
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

await main();
