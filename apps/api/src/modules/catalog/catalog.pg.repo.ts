import { randomUUID } from 'node:crypto';
import type { CatalogCategory, CatalogItem } from '@saborreal/shared';
import type { Pool } from 'pg';

export class PgCatalogRepo {
  constructor(private pool: Pool) {}

  private async getItemById(id: string): Promise<CatalogItem | null> {
    const res = await this.pool.query<{
      id: string;
      name: string;
      description: string;
      price_cents: number;
      category_id: string;
      category_name: string;
      image_url: string;
      available: boolean;
    }>(
      `select
         i.id,
         i.name,
         i.description,
         i.price_cents,
         i.category_id,
         c.name as category_name,
         i.image_url,
         i.available
       from catalog_items i
       join catalog_categories c on c.id = i.category_id
       where i.id = $1
       limit 1`,
      [id],
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      priceCents: row.price_cents,
      categoryId: row.category_id,
      categoryName: row.category_name,
      imageUrl: row.image_url,
      available: row.available,
    };
  }

  private async assertCategoryExists(categoryId: string) {
    const res = await this.pool.query<{ id: string }>(
      `select id from catalog_categories where id = $1 limit 1`,
      [categoryId],
    );
    if (res.rowCount === 0) throw new Error('CATALOG_CATEGORY_NOT_FOUND');
  }

  async listCategories(): Promise<CatalogCategory[]> {
    const res = await this.pool.query<{
      id: string;
      name: string;
      sort_order: number;
    }>(
      `select id, name, sort_order
       from catalog_categories
       order by sort_order asc, name asc`,
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      sortOrder: r.sort_order,
    }));
  }

  async listItems(): Promise<CatalogItem[]> {
    const res = await this.pool.query<{
      id: string;
      name: string;
      description: string;
      price_cents: number;
      category_id: string;
      category_name: string;
      image_url: string;
      available: boolean;
    }>(
      `select
         i.id,
         i.name,
         i.description,
         i.price_cents,
         i.category_id,
         c.name as category_name,
         i.image_url,
         i.available
       from catalog_items i
       join catalog_categories c on c.id = i.category_id
       order by c.sort_order asc, i.name asc`,
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      priceCents: r.price_cents,
      categoryId: r.category_id,
      categoryName: r.category_name,
      imageUrl: r.image_url,
      available: r.available,
    }));
  }

  async createItem(
    input: Omit<CatalogItem, 'id' | 'categoryName'>,
  ): Promise<CatalogItem> {
    await this.assertCategoryExists(input.categoryId);

    const id = `item-${randomUUID()}`;
    const priceBrl = (input.priceCents / 100).toFixed(2);

    await this.pool.query(
      `insert into catalog_items (
         id, name, description, price_cents, price_brl, category_id, image_url, available
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id,
        input.name,
        input.description ?? '',
        input.priceCents,
        priceBrl,
        input.categoryId,
        input.imageUrl ?? '',
        input.available ?? true,
      ],
    );

    const created = await this.getItemById(id);
    if (!created) throw new Error('CATALOG_ITEM_CREATE_FAILED');
    return created;
  }

  async updateItem(
    id: string,
    input: Partial<Omit<CatalogItem, 'id' | 'categoryName'>>,
  ): Promise<CatalogItem> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(input.name);
    }
    if (input.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(input.description);
    }
    if (input.priceCents !== undefined) {
      fields.push(`price_cents = $${idx++}`);
      values.push(input.priceCents);
      fields.push(`price_brl = $${idx++}`);
      values.push((input.priceCents / 100).toFixed(2));
    }
    if (input.categoryId !== undefined) {
      await this.assertCategoryExists(input.categoryId);
      fields.push(`category_id = $${idx++}`);
      values.push(input.categoryId);
    }
    if (input.imageUrl !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(input.imageUrl);
    }
    if (input.available !== undefined) {
      fields.push(`available = $${idx++}`);
      values.push(input.available);
    }

    if (fields.length === 0) {
      const existing = await this.getItemById(id);
      if (!existing) throw new Error('CATALOG_ITEM_NOT_FOUND');
      return existing;
    }

    values.push(id);
    const res = await this.pool.query(
      `update catalog_items
       set ${fields.join(', ')}, updated_at = now()
       where id = $${idx}
       returning id`,
      values,
    );
    if (res.rowCount === 0) throw new Error('CATALOG_ITEM_NOT_FOUND');

    const updated = await this.getItemById(id);
    if (!updated) throw new Error('CATALOG_ITEM_NOT_FOUND');
    return updated;
  }

  async deleteItem(id: string): Promise<void> {
    const res = await this.pool.query(
      'delete from catalog_items where id = $1',
      [id],
    );
    if (res.rowCount === 0) throw new Error('CATALOG_ITEM_NOT_FOUND');
  }
}
