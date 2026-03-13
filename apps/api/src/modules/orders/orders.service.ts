import { env } from '../../config/env.js';
import { getPgPool } from '../../db/postgres.js';
import { PgOrdersRepo } from './orders.pg.repo.js';
import { InMemoryOrdersRepo } from './orders.repo.js';
import type { Order, OrderLine } from './orders.types.js';

type OrdersRepo = {
  placeOrder(input: {
    userId: string;
    lines: OrderLine[];
    idempotencyKey: string;
    body: unknown;
  }): Promise<{ order: Order; replay: boolean }>;
  listByUser(userId: string): Promise<Order[]>;
  listAll(): Promise<Order[]>;
  listAvailableForCourier(): Promise<Order[]>;
  acceptOrder(input: { orderId: string; courierId: string }): Promise<Order>;
  updateStatus(input: {
    orderId: string;
    status: Order['status'];
  }): Promise<Order>;
  cancelOrder(input: { orderId: string; userId: string }): Promise<Order>;
  completeByCourier(input: {
    orderId: string;
    courierId: string;
  }): Promise<Order>;
};

let cachedRepo: OrdersRepo | null = null;

function resolveRepo(): OrdersRepo {
  const pool = getPgPool();
  if (pool) return new PgOrdersRepo(pool);

  if (env.NODE_ENV === 'production') {
    throw new Error('DATABASE_NOT_CONFIGURED');
  }

  const mem = new InMemoryOrdersRepo();
  return {
    placeOrder: async (input) => mem.placeOrder(input),
    listByUser: async (userId) => mem.listByUser(userId),
    listAll: async () => mem.listAll(),
    listAvailableForCourier: async () => mem.listAvailableForCourier(),
    acceptOrder: async (input) => mem.acceptOrder(input),
    updateStatus: async (input) => mem.updateStatus(input),
    cancelOrder: async (input) => mem.cancelOrder(input),
    completeByCourier: async (input) => mem.completeByCourier(input),
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
}) {
  return await repo().placeOrder(input);
}

export async function listOrdersForUser(userId: string) {
  return await repo().listByUser(userId);
}

export async function listAllOrders() {
  return await repo().listAll();
}

export async function listAvailableOrders() {
  return await repo().listAvailableForCourier();
}

export async function acceptOrder(input: {
  orderId: string;
  courierId: string;
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

export async function completeByCourier(input: {
  orderId: string;
  courierId: string;
}) {
  return await repo().completeByCourier(input);
}
