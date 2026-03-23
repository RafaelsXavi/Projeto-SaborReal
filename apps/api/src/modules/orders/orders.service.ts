import { env } from '../../config/env.js';
import { getPgPool } from '../../db/postgres.js';
import { PgOrdersRepo } from './orders.pg.repo.js';
import { InMemoryOrdersRepo } from './orders.repo.js';
import type { EnrichedOrder, Order, OrderLine } from './orders.types.js';
import { quoteDelivery } from '../delivery/delivery.service.js';

type OrdersRepo = {
  placeOrder(input: {
    userId: string;
    lines: OrderLine[];
    idempotencyKey: string;
    body: unknown;
    distanceKm?: number | undefined;
    deliveryFee?: number | undefined; // BRL
    delivery?: {
      cep: string;
      number: string;
      notes?: string | undefined;
    } | undefined;
  }): Promise<{ order: Order; replay: boolean }>;
  listByUser(userId: string): Promise<Order[]>;
  listAll(): Promise<Order[]>;
  listAvailableForMotoboy(): Promise<Order[]>;
  listByMotoboy(motoboyId: string): Promise<Order[]>;
  acceptOrder(input: { orderId: string; motoboyId: string }): Promise<Order>;
  updateStatus(input: {
    orderId: string;
    status: Order['status'];
  }): Promise<Order>;
  cancelOrder(input: { orderId: string; userId: string }): Promise<Order>;
  completeByMotoboy(input: {
    orderId: string;
    motoboyId: string;
  }): Promise<Order>;
};

let cachedRepo: OrdersRepo | null = null;

function isPgUnhealthyError(err: unknown) {
  const code = (err as { code?: unknown } | null)?.code;
  const errno = (err as { errno?: unknown } | null)?.errno;
  if (code === '42P01') return true; // undefined_table (migrations missing)
  if (code === 'ECONNREFUSED') return true;
  if (code === 'ETIMEDOUT') return true;
  if (code === 'ECONNRESET') return true;
  if (errno === -4078) return true; // Windows: connect ECONNREFUSED
  return false;
}

function resolveRepo(): OrdersRepo {
  const pool = getPgPool();
  if (pool) {
    const pg = new PgOrdersRepo(pool);
    if (env.NODE_ENV === 'production') return pg;

    // Dev/test: if Postgres is configured but unavailable, fall back to in-memory
    // so the app remains usable without a local DB.
    const mem = new InMemoryOrdersRepo();
    const fallback: OrdersRepo = {
      placeOrder: async (input) => mem.placeOrder(input),
      listByUser: async (userId) => mem.listByUser(userId),
      listAll: async () => mem.listAll(),
      listAvailableForMotoboy: async () => mem.listAvailableForMotoboy(),
      listByMotoboy: async (motoboyId) => mem.listByMotoboy(motoboyId),
      acceptOrder: async (input) => mem.acceptOrder(input),
      updateStatus: async (input) => mem.updateStatus(input),
      cancelOrder: async (input) => mem.cancelOrder(input),
      completeByMotoboy: async (input) => mem.completeByMotoboy(input),
    };

    const wrap =
      <T>(pgFn: () => Promise<T>, memFn: () => Promise<T>) =>
      async () => {
        try {
          return await pgFn();
        } catch (err) {
          if (isPgUnhealthyError(err)) {
            cachedRepo = fallback;
            return await memFn();
          }
          throw err;
        }
      };

    return {
      placeOrder: async (input) =>
        wrap(
          () => pg.placeOrder(input),
          () => fallback.placeOrder(input),
        )(),
      listByUser: async (userId) =>
        wrap(
          () => pg.listByUser(userId),
          () => fallback.listByUser(userId),
        )(),
      listAll: async () =>
        wrap(
          () => pg.listAll(),
          () => fallback.listAll(),
        )(),
      listAvailableForMotoboy: async () =>
        wrap(
          () => pg.listAvailableForMotoboy(),
          () => fallback.listAvailableForMotoboy(),
        )(),
      listByMotoboy: async (motoboyId) =>
        wrap(
          () => pg.listByMotoboy(motoboyId),
          () => fallback.listByMotoboy(motoboyId),
        )(),
      acceptOrder: async (input) =>
        wrap(
          () => pg.acceptOrder(input),
          () => fallback.acceptOrder(input),
        )(),
      updateStatus: async (input) =>
        wrap(
          () => pg.updateStatus(input),
          () => fallback.updateStatus(input),
        )(),
      cancelOrder: async (input) =>
        wrap(
          () => pg.cancelOrder(input),
          () => fallback.cancelOrder(input),
        )(),
      completeByMotoboy: async (input) =>
        wrap(
          () => pg.completeByMotoboy(input),
          () => fallback.completeByMotoboy(input),
        )(),
    };
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  const mem = new InMemoryOrdersRepo();
  return {
    placeOrder: async (input) => mem.placeOrder(input),
    listByUser: async (userId) => mem.listByUser(userId),
    listAll: async () => mem.listAll(),
    listAvailableForMotoboy: async () => mem.listAvailableForMotoboy(),
    listByMotoboy: async (motoboyId) => mem.listByMotoboy(motoboyId),
    acceptOrder: async (input) => mem.acceptOrder(input),
    updateStatus: async (input) => mem.updateStatus(input),
    cancelOrder: async (input) => mem.cancelOrder(input),
    completeByMotoboy: async (input) => mem.completeByMotoboy(input),
  };
}

function repo(): OrdersRepo {
  if (cachedRepo) return cachedRepo;
  cachedRepo = resolveRepo();
  return cachedRepo;
}

export async function placeOrder(input: {
  userId: string;
  lines: OrderLine[];
  idempotencyKey: string;
  body: unknown;
  distanceKm?: number | undefined;
  delivery?: {
    cep: string;
    number: string;
    notes?: string | undefined;
  } | undefined;
}) {
  if (input.delivery) {
    const q = await quoteDelivery({
      cep: input.delivery.cep,
      number: input.delivery.number,
    });
    return await repo().placeOrder({
      ...input,
      distanceKm: q.distanceKm,
      deliveryFee: q.fee,
      delivery: {
        cep: input.delivery.cep.replaceAll(/\D/g, ''),
        number: input.delivery.number,
        notes: input.delivery.notes,
      },
    });
  }

  const distanceKm = input.distanceKm ?? 0;
  const deliveryFee = Number((distanceKm * env.DELIVERY_FEE_PER_KM).toFixed(2));

  return await repo().placeOrder({
    ...input,
    distanceKm,
    deliveryFee,
  });
}

export async function listOrdersForUser(userId: string) {
  return await repo().listByUser(userId);
}

export async function listAllOrders() {
  return await repo().listAll();
}

export async function listAvailableOrders() {
  return await repo().listAvailableForMotoboy();
}

export async function listOrdersForMotoboy(motoboyId: string) {
  return await repo().listByMotoboy(motoboyId);
}

export async function acceptOrder(input: {
  orderId: string;
  motoboyId: string;
}) {
  return await repo().acceptOrder(input);
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: Order['status'];
}) {
  return await repo().updateStatus(input);
}

export async function cancelOrder(input: { orderId: string; userId: string }) {
  return await repo().cancelOrder(input);
}

export async function completeByMotoboy(input: {
  orderId: string;
  motoboyId: string;
}) {
  return await repo().completeByMotoboy(input);
}

// ── Enriched queries for the Motoboy view ────────────────────────────

export async function listAvailableOrdersEnriched(): Promise<EnrichedOrder[]> {
  const pool = getPgPool();
  const memFallback = async () => {
    const orders = await repo().listAvailableForMotoboy();
    return orders.map((o) => ({
      ...o,
      lines: o.lines.map((l) => ({ ...l, name: l.id })),
      customerPhone: null,
    }));
  };

  if (pool) {
    try {
      const pgRepo = new PgOrdersRepo(pool);
      return await pgRepo.listAvailableForMotoboyEnriched();
    } catch (err) {
      if (isPgUnhealthyError(err) && env.NODE_ENV !== 'production') {
        return await memFallback();
      }
      throw err;
    }
  }
  return await memFallback();
}

export async function listOrdersForMotoboyEnriched(
  motoboyId: string,
): Promise<EnrichedOrder[]> {
  const pool = getPgPool();
  const memFallback = async () => {
    const orders = await repo().listByMotoboy(motoboyId);
    return orders.map((o) => ({
      ...o,
      lines: o.lines.map((l) => ({ ...l, name: l.id })),
      customerPhone: null,
    }));
  };

  if (pool) {
    try {
      const pgRepo = new PgOrdersRepo(pool);
      return await pgRepo.listByMotoboyEnriched(motoboyId);
    } catch (err) {
      if (isPgUnhealthyError(err) && env.NODE_ENV !== 'production') {
        return await memFallback();
      }
      throw err;
    }
  }
  return await memFallback();
}
