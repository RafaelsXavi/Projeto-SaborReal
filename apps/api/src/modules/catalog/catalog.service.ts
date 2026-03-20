import type { CatalogItem } from '@saborreal/shared';
import { getPgPool } from '../../db/postgres.js';
import { PgCatalogRepo } from './catalog.pg.repo.js';
import { seedCatalog } from './catalog.seed.js';
import type { CatalogResponse } from './catalog.types.js';

const CATALOG_CACHE_TTL_MS = 30_000;
let catalogCache: { at: number; value: CatalogResponse } | null = null;

function getRepo(): PgCatalogRepo | null {
  const pool = getPgPool();
  return pool ? new PgCatalogRepo(pool) : null;
}

function invalidateCache() {
  catalogCache = null;
}

export async function listCatalog(): Promise<CatalogResponse> {
  const repo = getRepo();
  if (!repo) return seedCatalog;

  const now = Date.now();
  if (catalogCache && now - catalogCache.at < CATALOG_CACHE_TTL_MS) {
    return catalogCache.value;
  }

  try {
    const [categories, items] = await Promise.all([
      repo.listCategories(),
      repo.listItems(),
    ]);

    const value: CatalogResponse = { categories, items };
    catalogCache = { at: now, value };
    return value;
  } catch (err) {
    const code = (err as { code?: unknown } | null)?.code;
    const errno = (err as { errno?: unknown } | null)?.errno;
    if (code === '42P01' || code === 'ECONNREFUSED' || errno === -4078) {
      return seedCatalog;
    }
    throw err;
  }
}

export async function adminCreateItem(
  input: Omit<CatalogItem, 'id' | 'categoryName'>,
) {
  const repo = getRepo();
  if (!repo) throw new Error('DATABASE_NOT_CONFIGURED');
  const item = await repo.createItem(input);
  invalidateCache();
  return item;
}

export async function adminUpdateItem(
  id: string,
  input: Partial<Omit<CatalogItem, 'id' | 'categoryName'>>,
) {
  const repo = getRepo();
  if (!repo) throw new Error('DATABASE_NOT_CONFIGURED');
  const item = await repo.updateItem(id, input);
  invalidateCache();
  return item;
}

export async function adminDeleteItem(id: string) {
  const repo = getRepo();
  if (!repo) throw new Error('DATABASE_NOT_CONFIGURED');
  await repo.deleteItem(id);
  invalidateCache();
}
