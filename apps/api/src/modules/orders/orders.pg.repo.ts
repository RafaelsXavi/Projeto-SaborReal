import { createHash, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import type {
  EnrichedOrder,
  EnrichedOrderLine,
  Order,
  OrderLine,
} from './orders.types.js';

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
  motoboy_id: string | null;
  distance_km: number | null;
  delivery_fee: number | null;
  delivery_cep: string | null;
  delivery_number: string | null;
  delivery_notes: string | null;
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
    distanceKm: row.distance_km ?? undefined,
    deliveryFee: row.delivery_fee ?? undefined,
    deliveryCep: row.delivery_cep ?? undefined,
    deliveryNumber: row.delivery_number ?? undefined,
    deliveryNotes: row.delivery_notes ?? undefined,
  };
  if (row.motoboy_id) {
    return { ...base, motoboyId: row.motoboy_id };
  }
  return base;
}

const FLOW_RANK: Record<Exclude<Order['status'], 'CANCELLED'>, number> = {
  PLACED: 1,
  PREPARING: 2,
  READY_FOR_PICKUP: 3,
  OUT_FOR_DELIVERY: 4,
  COMPLETED: 5,
};

function validateStatusUpdate(input: {
  currentStatus: Order['status'];
  motoboyId: string | null;
  nextStatus: Order['status'];
}) {
  const { currentStatus, nextStatus, motoboyId } = input;

  if (nextStatus === currentStatus) return;

  if (currentStatus === 'CANCELLED' || currentStatus === 'COMPLETED') {
    throw new Error('ORDER_INVALID_STATUS_TRANSITION');
  }

  if (nextStatus === 'CANCELLED') return;

  if (nextStatus === 'OUT_FOR_DELIVERY' || nextStatus === 'COMPLETED') {
    if (!motoboyId) throw new Error('ORDER_MOTOBOY_REQUIRED');
  }

  if (motoboyId) {
    const nextRank = FLOW_RANK[nextStatus];
    if (nextRank < FLOW_RANK.OUT_FOR_DELIVERY) {
      throw new Error('ORDER_INVALID_STATUS_TRANSITION');
    }
  }

  const currentRank = FLOW_RANK[currentStatus];
  const nextRank = FLOW_RANK[nextStatus];
  if (nextRank < currentRank) {
    throw new Error('ORDER_INVALID_STATUS_TRANSITION');
  }
}

export class PgOrdersRepo {
  constructor(private pool: Pool) {}

  async placeOrder(input: {
    userId: string;
    lines: OrderLine[];
    idempotencyKey: string;
    body: unknown;
    distanceKm?: number | undefined;
    deliveryFee?: number | undefined;
    delivery?: { cep: string; number: string; notes?: string | undefined } | undefined;
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

      const distanceKm = input.distanceKm ?? 0;
      const deliveryFee = input.deliveryFee ?? 0;

      await client.query(
        `insert into orders (id, user_id, status, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes)
         values ($1, $2, 'PLACED', $3, $4, $5, $6, $7)`,
        [
          orderId,
          input.userId,
          distanceKm,
          deliveryFee,
          input.delivery?.cep ?? null,
          input.delivery?.number ?? null,
          input.delivery?.notes ?? null,
        ],
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
          distanceKm,
          deliveryFee,
          deliveryCep: input.delivery?.cep ?? undefined,
          deliveryNumber: input.delivery?.number ?? undefined,
          deliveryNotes: input.delivery?.notes ?? undefined,
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
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
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
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
       from orders
       order by created_at asc`,
    );
    return this.attachLines(oRes.rows);
  }

  async listByUser(userId: string): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
       from orders
       where user_id = $1
       order by created_at asc`,
      [userId],
    );
    return this.attachLines(oRes.rows);
  }

  async listByMotoboy(motoboyId: string): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
       from orders
       where motoboy_id = $1
       order by created_at asc`,
      [motoboyId],
    );
    return this.attachLines(oRes.rows);
  }

  async listAvailableForMotoboy(): Promise<Order[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
       from orders
       where motoboy_id is null and status = 'READY_FOR_PICKUP'
       order by created_at asc`,
    );
    return this.attachLines(oRes.rows);
  }

  async acceptOrder(input: {
    orderId: string;
    motoboyId: string;
  }): Promise<Order> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const res = await client.query<OrderRow>(
        `update orders
         set motoboy_id = $2,
             status = 'OUT_FOR_DELIVERY'
         where id = $1
           and motoboy_id is null
           and status = 'READY_FOR_PICKUP'
         returning id, user_id, status, created_at, motoboy_id`,
        [input.orderId, input.motoboyId],
      );
      const row = res.rows[0];
      if (!row) {
        const exists = await client.query<{ id: string }>(
          `select id from orders where id = $1 limit 1`,
          [input.orderId],
        );
        if (exists.rowCount === 0) throw new Error('ORDER_NOT_FOUND');
        const current = await client.query<{
          motoboy_id: string | null;
          status: string;
        }>(`select motoboy_id, status from orders where id = $1 limit 1`, [
          input.orderId,
        ]);
        const cur = current.rows[0];
        if (cur?.status === 'CANCELLED') throw new Error('ORDER_NOT_AVAILABLE');
        if (cur?.motoboy_id) throw new Error('ORDER_ALREADY_ASSIGNED');
        if (cur?.status !== 'READY_FOR_PICKUP')
          throw new Error('ORDER_NOT_READY_FOR_PICKUP');
        throw new Error('ORDER_NOT_AVAILABLE');
      }

      // Commit before reading through the pool (otherwise another connection may see stale data).
      await client.query('commit');

      const order = await this.getById(row.id);
      if (!order) throw new Error('ORDER_NOT_FOUND');
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
    const current = await this.pool.query<
      Pick<OrderRow, 'status' | 'motoboy_id'>
    >(
      `select status, motoboy_id
       from orders
       where id = $1
       limit 1`,
      [input.orderId],
    );
    const cur = current.rows[0];
    if (!cur) throw new Error('ORDER_NOT_FOUND');

    validateStatusUpdate({
      currentStatus: cur.status,
      motoboyId: cur.motoboy_id,
      nextStatus: input.status,
    });

    if (input.status === cur.status) {
      const order = await this.getById(input.orderId);
      if (!order) throw new Error('ORDER_NOT_FOUND');
      return order;
    }

    const res = await this.pool.query<OrderRow>(
      `update orders
       set status = $2
       where id = $1
       returning id, user_id, status, created_at, motoboy_id`,
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
       returning id, user_id, status, created_at, motoboy_id`,
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

  async completeByMotoboy(input: {
    orderId: string;
    motoboyId: string;
  }): Promise<Order> {
    const res = await this.pool.query<OrderRow>(
      `update orders
       set status = 'COMPLETED'
       where id = $1
         and motoboy_id = $2
         and status = 'OUT_FOR_DELIVERY'
       returning id, user_id, status, created_at, motoboy_id`,
      [input.orderId, input.motoboyId],
    );
    const row = res.rows[0];
    if (!row) {
      const exists = await this.pool.query<{
        id: string;
        motoboy_id: string | null;
        status: Order['status'];
      }>(`select id, motoboy_id, status from orders where id = $1 limit 1`, [
        input.orderId,
      ]);
      if (exists.rowCount === 0) throw new Error('ORDER_NOT_FOUND');
      const cur = exists.rows[0];
      if (!cur?.motoboy_id) throw new Error('ORDER_NOT_ASSIGNED');
      if (cur.motoboy_id !== input.motoboyId) throw new Error('FORBIDDEN');
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

  // ── Enriched queries for Motoboy ──────────────────────────────────────

  async listAvailableForMotoboyEnriched(): Promise<EnrichedOrder[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
       from orders
       where motoboy_id is null and status = 'READY_FOR_PICKUP'
       order by created_at asc`,
    );
    return this.attachEnrichedLines(oRes.rows);
  }

  async listByMotoboyEnriched(motoboyId: string): Promise<EnrichedOrder[]> {
    const oRes = await this.pool.query<OrderRow>(
      `select id, user_id, status, created_at, motoboy_id, distance_km, delivery_fee, delivery_cep, delivery_number, delivery_notes
       from orders
       where motoboy_id = $1
       order by created_at asc`,
      [motoboyId],
    );
    return this.attachEnrichedLines(oRes.rows);
  }

  private async attachEnrichedLines(
    orders: OrderRow[],
  ): Promise<EnrichedOrder[]> {
    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    const userIds = [...new Set(orders.map((o) => o.user_id))];

    // Run both queries in parallel for better latency
    const [lRes, pRes] = await Promise.all([
      this.pool.query<LineRow & { item_name: string | null }>(
        `select ol.order_id, ol.line_no, ol.item_id, ol.qty,
                coalesce(ci.name, ol.item_id) as item_name
         from order_lines ol
         left join catalog_items ci on ci.id = ol.item_id
         where ol.order_id = any($1::uuid[])
         order by ol.order_id asc, ol.line_no asc`,
        [orderIds],
      ),
      this.pool.query<{ id: string; phone: string | null }>(
        `select id, phone from users where id = any($1::uuid[])`,
        [userIds],
      ),
    ]);

    const phoneMap = new Map<string, string | null>();
    for (const row of pRes.rows) {
      phoneMap.set(row.id, row.phone);
    }

    const grouped = new Map<string, EnrichedOrderLine[]>();
    for (const row of lRes.rows) {
      const arr = grouped.get(row.order_id) ?? [];
      arr.push({
        id: row.item_id,
        qty: row.qty,
        name: row.item_name ?? row.item_id,
      });
      grouped.set(row.order_id, arr);
    }

    return orders.map((o) => {
      const base = toOrder(o, []);
      return {
        ...base,
        lines: grouped.get(o.id) ?? [],
        customerPhone: phoneMap.get(o.user_id) ?? null,
      };
    });
  }
}
