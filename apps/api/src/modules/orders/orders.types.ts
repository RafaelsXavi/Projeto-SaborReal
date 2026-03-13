import type { OrderStatus } from '@saborreal/shared';

export type OrderLine = { id: string; qty: number };

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
  courierId?: string;
};
