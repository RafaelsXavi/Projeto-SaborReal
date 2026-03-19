import 'dotenv/config';
import { Pool } from 'pg';

import { env } from '../config/env.js';
import { seedCatalog } from '../modules/catalog/catalog.seed.js';

function brlFromCents(cents: number) {
  return (cents / 100).toFixed(2);
}

async function main() {
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Cannot seed catalog.');
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 1,
    ssl: env.PG_SSL
      ? { rejectUnauthorized: env.PG_SSL_REJECT_UNAUTHORIZED }
      : undefined,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query('begin');

      for (const c of seedCatalog.categories) {
        await client.query(
          `insert into catalog_categories (id, name, sort_order)
           values ($1, $2, $3)
           on conflict (id) do update
             set name = excluded.name,
                 sort_order = excluded.sort_order,
                 updated_at = now()`,
          [c.id, c.name, c.sortOrder],
        );
      }

      for (const item of seedCatalog.items) {
        await client.query(
          `insert into catalog_items (
             id,
             name,
             description,
             price_brl,
             price_cents,
             category_id,
             image_url,
             available
           )
           values ($1, $2, $3, $4, $5, $6, $7, $8)
           on conflict (id) do update
             set name = excluded.name,
                 description = excluded.description,
                 price_brl = excluded.price_brl,
                 price_cents = excluded.price_cents,
                 category_id = excluded.category_id,
                 image_url = excluded.image_url,
                 available = excluded.available,
                 updated_at = now()`,
          [
            item.id,
            item.name,
            item.description,
            brlFromCents(item.priceCents),
            item.priceCents,
            item.categoryId,
            item.imageUrl,
            item.available,
          ],
        );
      }

      await client.query('commit');

      // eslint-disable-next-line no-console
      console.log(
        `seeded catalog: categories=${seedCatalog.categories.length} items=${seedCatalog.items.length}`,
      );
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

await main();

