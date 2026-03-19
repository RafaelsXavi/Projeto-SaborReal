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

export class InMemoryOrdersRepo {
  private orders = new Map<string, Order>();
  private idempotency = new Map<string, IdempotencyRecord>();

  placeOrder(input: {
    userId: string;
    lines: OrderLine[];
    idempotencyKey: string;
    body: unknown;
    distanceKm?: number | undefined;
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
    const distanceKm = input.distanceKm ?? 0;
    const deliveryFee = Number((distanceKm * 1.4).toFixed(2));

    const order: Order = {
      id,
      userId: input.userId,
      status: 'PLACED',
      lines: input.lines,
      distanceKm,
      deliveryFee,
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

  listAvailableForMotoboy(): Order[] {
    return this.listAll().filter(
      (o) => !o.motoboyId && o.status === 'READY_FOR_PICKUP',
    );
  }

  listByMotoboy(motoboyId: string): Order[] {
    return this.listAll().filter((o) => o.motoboyId === motoboyId);
  }

  acceptOrder(input: { orderId: string; motoboyId: string }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.motoboyId) throw new Error('ORDER_ALREADY_ASSIGNED');
    if (order.status === 'CANCELLED') throw new Error('ORDER_NOT_AVAILABLE');
    if (order.status !== 'READY_FOR_PICKUP')
      throw new Error('ORDER_NOT_READY_FOR_PICKUP');

    const next: Order = {
      ...order,
      motoboyId: input.motoboyId,
      status: 'OUT_FOR_DELIVERY',
    };
    this.orders.set(order.id, next);
    return next;
  }

  updateStatus(input: { orderId: string; status: Order['status'] }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    validateStatusUpdate({
      currentStatus: order.status,
      motoboyId: order.motoboyId ?? null,
      nextStatus: input.status,
    });

    if (input.status === order.status) return order;

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

  completeByMotoboy(input: { orderId: string; motoboyId: string }): Order {
    const order = this.orders.get(input.orderId);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (!order.motoboyId) throw new Error('ORDER_NOT_ASSIGNED');
    if (order.motoboyId !== input.motoboyId) throw new Error('FORBIDDEN');
    if (order.status !== 'OUT_FOR_DELIVERY')
      throw new Error('ORDER_NOT_COMPLETABLE');

    const next: Order = { ...order, status: 'COMPLETED' };
    this.orders.set(order.id, next);
    return next;
  }
}
