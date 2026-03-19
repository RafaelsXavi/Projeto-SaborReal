import { getPgPool } from '../../db/postgres.js';
import { seedCatalog } from './catalog.seed.js';
import type { CatalogResponse } from './catalog.types.js';

export async function listCatalog(): Promise<CatalogResponse> {
  const pool = getPgPool();
  if (!pool) return seedCatalog;

  // If migrations weren't applied, fall back to seed in dev.
  try {
    const categoriesRes = await pool.query<{
      id: string;
      name: string;
      sort_order: number;
    }>(
      `select id, name, sort_order
       from catalog_categories
       order by sort_order asc, name asc`,
    );

    const itemsRes = await pool.query<{
      id: string;
      name: string;
      description: string;
      price_cents: number;
      category_id: string;
      category_name: string;
      image_url: string;
      available: boolean;
      sort_order: number;
    }>(
      `select
         i.id,
         i.name,
         i.description,
         i.price_cents,
         i.category_id,
         c.name as category_name,
         i.image_url,
         i.available,
         c.sort_order
       from catalog_items i
       join catalog_categories c on c.id = i.category_id
       order by c.sort_order asc, i.name asc`,
    );

    return {
      categories: categoriesRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        sortOrder: r.sort_order,
      })),
      items: itemsRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        priceCents: r.price_cents,
        categoryId: r.category_id,
        categoryName: r.category_name,
        imageUrl: r.image_url,
        available: r.available,
      })),
    };
  } catch (err) {
    // Postgres "undefined_table" is 42P01.
    const code = (err as { code?: unknown } | null)?.code;
    const errno = (err as { errno?: unknown } | null)?.errno;
    if (code === '42P01' || code === 'ECONNREFUSED' || errno === -4078) {
      return seedCatalog;
    }
    throw err;
  }
}
