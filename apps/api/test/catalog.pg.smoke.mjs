import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import dotenv from 'dotenv';
import { Pool } from 'pg';

// Ensure DATABASE_URL is available before importing dist/env (it parses process.env at import time).
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: resolve(process.cwd(), '../../.env') });
}

const { createApp } = await import('../dist/app.js');

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await fn(baseUrl);
  } finally {
    server.close();
  }
}

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

await run('Catalog: /v1/catalog returns Postgres-backed items', async () => {
  if (process.env.SMOKE_WITH_DB !== 'true') {
    console.log('skip - set SMOKE_WITH_DB=true to run');
    return;
  }

  const databaseUrl = requireEnv('DATABASE_URL');

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const catId = `test-cat-${crypto.randomUUID()}`;
  const itemId = `test-item-${crypto.randomUUID()}`;
  const catName = `__test_${catId}`;

  try {
    await pool.query(
      `insert into catalog_categories (id, name, sort_order)
       values ($1, $2, 9999)`,
      [catId, catName],
    );

    await pool.query(
      `insert into catalog_items (
         id, name, description, price_brl, price_cents, category_id, image_url, available
       ) values ($1, $2, $3, $4, $5, $6, $7, true)`,
      [
        itemId,
        '__Test Item',
        'Inserted by catalog.pg.smoke.mjs',
        '9.90',
        990,
        catId,
        'https://placehold.co/600x600?text=Test',
      ],
    );

    await withServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/v1/catalog`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.ok, true);
      assert.ok(Array.isArray(body.items));
      assert.ok(Array.isArray(body.categories));

      const found = body.items.find((i) => i.id === itemId);
      assert.ok(found, 'expected /v1/catalog to include inserted item');
      assert.equal(found.categoryId, catId);
      assert.equal(found.available, true);
      assert.equal(typeof found.priceCents, 'number');
    });
  } finally {
    // Cleanup is best-effort; keep it isolated to the test-created ids.
    await pool.query(`delete from catalog_items where id = $1`, [itemId]);
    await pool.query(`delete from catalog_categories where id = $1`, [catId]);
    await pool.end();
  }
});
