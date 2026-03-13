import { createHash, randomUUID } from 'node:crypto';
import type { Order, OrderLine } from './orders.types.js';

type IdempotencyRecord = { key: string; bodyHash: string; orderId: string };

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

export class InMemoryOrdersRepo {
  private orders = new Map<string, Order>();
  private idempotency = new Map<string, IdempotencyRecord>();

  placeOrder(input: {
    userId: string;
    lines: OrderLine[];
    idempotencyKey: string;
    body: unknown;
  }): { order: Order; replay: boolean } {
    const idKey = `${input.userId}:${input.idempotencyKey}`;
    const bodyHash = hashBody(input.body);

    const existing = this.idempotency.get(idKey);
    if (existing) {
      if (existing.bodyHash !== bodyHash) {
        throw new Error('IDEMPOTENCY_KEY_REUSED');
      }
      const order = this.orders.get(existing.orderId);
      if (!order) throw new Error('IDEMPOTENCY_ORDER_MISSING');
      return { order, replay: true };
    }

    const id = randomUUID();
    const order: Order = {
      id,
      userId: input.userId,
      status: 'PLACED',
      lines: input.lines,
      createdAt: new Date().toISOString(),
    };

    this.orders.set(id, order);
    this.idempotency.set(idKey, {
      key: input.idempotencyKey,
      bodyHash,
      orderId: id,
    });

    return { order, replay: false };
  }

  listAll(): Order[] {
    return Array.from(this.orders.values()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  listByUser(userId: string): Order[] {
    return this.listAll().filter((o) => o.userId === userId);
  }

  listAvailableForCourier(): Order[] {
    return this.listAll().filter(
      (o) => !o.courierId && o.status !== 'CANCELLED',
    );
  }

  acceptOrder(input: { orderId: string; courierId: string }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.courierId) throw new Error('ORDER_ALREADY_ASSIGNED');
    if (order.status === 'CANCELLED') throw new Error('ORDER_NOT_AVAILABLE');

    const next: Order = {
      ...order,
      courierId: input.courierId,
      status: 'OUT_FOR_DELIVERY',
    };
    this.orders.set(order.id, next);
    return next;
  }

  updateStatus(input: { orderId: string; status: Order['status'] }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    const next: Order = { ...order, status: input.status };
    this.orders.set(order.id, next);
    return next;
  }

  cancelOrder(input: { orderId: string; userId: string }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.userId !== input.userId) throw new Error('FORBIDDEN');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      throw new Error('ORDER_NOT_CANCELLABLE');
    }
    const next: Order = { ...order, status: 'CANCELLED' };
    this.orders.set(order.id, next);
    return next;
  }

  completeByCourier(input: { orderId: string; courierId: string }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (!order.courierId) throw new Error('ORDER_NOT_ASSIGNED');
    if (order.courierId !== input.courierId) throw new Error('FORBIDDEN');
    if (order.status !== 'OUT_FOR_DELIVERY')
      throw new Error('ORDER_NOT_COMPLETABLE');

    const next: Order = { ...order, status: 'COMPLETED' };
    this.orders.set(order.id, next);
    return next;
  }
}
