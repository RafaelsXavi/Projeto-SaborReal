import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type { Order, OrderLine } from './orders.types.js';

function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(',')}}`;
}

function hashBody(value: unknown) {
  const canonical = stableStringify(value);
  return createHash('sha256').update(canonical).digest('hex');
}

type OrderRow = {
  id: string;
  user_id: string;
  status: Order['status'];
  created_at: string;
  courier_id: string | null;
};

type LineRow = {
  order_id: string;
  line_no: number;
  item_id: string;
  qty: number;
};

function toOrder(row: OrderRow, lines: OrderLine[]): Order {
  const base: Order = {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    lines,
  };
  if (row.courier_id) {
    return { ...base, courierId: row.courier_id };
  }
  return base;
}

export class PgOrdersRepo {
  constructor(private pool: Pool) {}

  async placeOrder(input: {
    userId: string;
    lines: OrderLine[];
    idempotencyKey: string;
    body: unknown;
  }): Promise<{ order: Order; replay: boolean }> {
    const orderId = randomUUID();
    const bodyHash = hashBody(input.body);
    const nowIso = new Date().toISOString();

    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const existing = await client.query(
        `select order_id, body_hash
         from order_idempotency
         where user_id = $1 and key = $2
         limit 1`,
        [input.userId, input.idempotencyKey],
      );

      const existingRow = existing.rows[0] as
        | { order_id: string; body_hash: string }
        | undefined;

      if (existingRow) {
        if (existingRow.body_hash !== bodyHash) {
          throw new Error('IDEMPOTENCY_KEY_REUSED');
        }

        await client.query('commit');
        const order = await this.getById(existingRow.order_id);
        if (!order) throw new Error('IDEMPOTENCY_ORDER_MISSING');
        return { order, replay: true };
      }

      await client.query(
        `insert into orders (id, user_id, status)
         values ($1, $2, 'PLACED')`,
        [orderId, input.userId],
      );

      for (const [idx, l] of input.lines.entries()) {
        await client.query(
          `insert into order_lines (order_id, line_no, item_id, qty)
           values ($1, $2, $3, $4)`,
          [orderId, idx + 1, l.id, l.qty],
        );
      }

      await client.query(
        `insert into order_idempotency (user_id, key, body_hash, order_id)
         values ($1, $2, $3, $4)`,
        [input.userId, input.idempotencyKey, bodyHash, orderId],
      );

      await client.query('commit');
      return {
        order: {
          id: orderId,
          userId: input.userId,
          status: 'PLACED',
          createdAt: nowIso,
          lines: input.lines,
        },
        replay: false,
      };
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  }

  async getById(orderId: string): Promise<Order | null> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, courier_id
       from orders
       where id = $1
       limit 1`,
      [orderId],
    );
    const oRow = oRes.rows[0];
    if (!oRow) return null;

    const lRes = await this.pool.query<LineRow>(
      `select order_id, line_no, item_id, qty
       from order_lines
       where order_id = $1
       order by line_no asc`,
      [orderId],
    );
    const lines: OrderLine[] = lRes.rows.map((r) => ({
      id: r.item_id,
      qty: r.qty,
    }));
    return toOrder(oRow, lines);
  }

  async listAll(): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, courier_id
       from orders
       order by created_at asc`,
    );
    return this.attachLines(oRes.rows);
  }

  async listByUser(userId: string): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, courier_id
       from orders
       where user_id = $1
       order by created_at asc`,
      [userId],
    );
    return this.attachLines(oRes.rows);
  }

  async listByCourier(courierId: string): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, courier_id
       from orders
       where courier_id = $1
       order by created_at asc`,
      [courierId],
    );
    return this.attachLines(oRes.rows);
  }

  async listAvailableForCourier(): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, courier_id
       from orders
       where courier_id is null and status <> 'CANCELLED'
       order by created_at asc`,
    );
    return this.attachLines(oRes.rows);
  }

  async acceptOrder(input: {
    orderId: string;
    courierId: string;
  }): Promise<Order> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const res = await client.query<OrderRow>(
        `update orders
         set courier_id = $2,
             status = 'OUT_FOR_DELIVERY'
         where id = $1
           and courier_id is null
           and status <> 'CANCELLED'
         returning id, user_id, status, created_at, courier_id`,
        [input.orderId, input.courierId],
      );
      const row = res.rows[0];
      if (!row) {
        const exists = await client.query<{ id: string }>(
          `select id from orders where id = $1 limit 1`,
          [input.orderId],
        );
        if (exists.rowCount === 0) throw new Error('ORDER_NOT_FOUND');
        const current = await client.query<{
          courier_id: string | null;
          status: string;
        }>(`select courier_id, status from orders where id = $1 limit 1`, [
          input.orderId,
        ]);
        const cur = current.rows[0];
        if (cur?.status === 'CANCELLED') throw new Error('ORDER_NOT_AVAILABLE');
        if (cur?.courier_id) throw new Error('ORDER_ALREADY_ASSIGNED');
        throw new Error('ORDER_NOT_AVAILABLE');
      }

      const order = await this.getById(row.id);
      if (!order) throw new Error('ORDER_NOT_FOUND');
      await client.query('commit');
      return order;
    } catch (err) {
      await client.query('rollback');
      throw err;
    } finally {
      client.release();
    }
  }

  async updateStatus(input: {
    orderId: string;
    status: Order['status'];
  }): Promise<Order> {
    const res = await this.pool.query<OrderRow>(
      `update orders
       set status = $2
       where id = $1
       returning id, user_id, status, created_at, courier_id`,
      [input.orderId, input.status],
    );
    const row = res.rows[0];
    if (!row) throw new Error('ORDER_NOT_FOUND');
    const order = await this.getById(row.id);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    return order;
  }

  async cancelOrder(input: {
    orderId: string;
    userId: string;
  }): Promise<Order> {
    const res = await this.pool.query<OrderRow>(
      `update orders
       set status = 'CANCELLED'
       where id = $1
         and user_id = $2
         and status not in ('COMPLETED', 'CANCELLED')
       returning id, user_id, status, created_at, courier_id`,
      [input.orderId, input.userId],
    );
    const row = res.rows[0];
    if (!row) {
      const exists = await this.pool.query<{
        id: string;
        status: Order['status'];
      }>(`select id, status from orders where id = $1 limit 1`, [
        input.orderId,
      ]);
      if (exists.rowCount === 0) throw new Error('ORDER_NOT_FOUND');
      const s = exists.rows[0]?.status;
      if (s === 'COMPLETED' || s === 'CANCELLED') {
        throw new Error('ORDER_NOT_CANCELLABLE');
      }
      throw new Error('FORBIDDEN');
    }
    const order = await this.getById(row.id);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    return order;
  }

  async completeByCourier(input: {
    orderId: string;
    courierId: string;
  }): Promise<Order> {
    const res = await this.pool.query<OrderRow>(
      `update orders
       set status = 'COMPLETED'
       where id = $1
         and courier_id = $2
         and status = 'OUT_FOR_DELIVERY'
       returning id, user_id, status, created_at, courier_id`,
      [input.orderId, input.courierId],
    );
    const row = res.rows[0];
    if (!row) {
      const exists = await this.pool.query<{
        id: string;
        courier_id: string | null;
        status: Order['status'];
      }>(`select id, courier_id, status from orders where id = $1 limit 1`, [
        input.orderId,
      ]);
      if (exists.rowCount === 0) throw new Error('ORDER_NOT_FOUND');
      const cur = exists.rows[0];
      if (!cur?.courier_id) throw new Error('ORDER_NOT_ASSIGNED');
      if (cur.courier_id !== input.courierId) throw new Error('FORBIDDEN');
      throw new Error('ORDER_NOT_COMPLETABLE');
    }
    const order = await this.getById(row.id);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    return order;
  }

  private async attachLines(orders: OrderRow[]): Promise<Order[]> {
    if (orders.length === 0) return [];
    const ids = orders.map((o) => o.id);
    const lRes = await this.pool.query<LineRow>(
      `select order_id, line_no, item_id, qty
       from order_lines
       where order_id = any($1::uuid[])
       order by order_id asc, line_no asc`,
      [ids],
    );

    const grouped = new Map<string, OrderLine[]>();
    for (const row of lRes.rows) {
      const arr = grouped.get(row.order_id) ?? [];
      arr.push({ id: row.item_id, qty: row.qty });
      grouped.set(row.order_id, arr);
    }

    return orders.map((o) => toOrder(o, grouped.get(o.id) ?? []));
  }
}
