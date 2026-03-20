import { z } from 'zod';
import { ORDER_STATUSES, type OrderStatus } from './orderStatus.js';

export const orderLineSchema = z.object({
  id: z.string().min(1).max(80),
  qty: z.number().int().min(1).max(99),
});

export const placeOrderSchema = z.object({
  lines: z.array(orderLineSchema).min(1).max(50),
  distanceKm: z.number().min(0).max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type OrderLine = z.infer<typeof orderLineSchema>;

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
  motoboyId?: string | undefined;
  distanceKm?: number | undefined;
  deliveryFee?: number | undefined;
};

/** Enriched line with product name for the Motoboy view. */
export type EnrichedOrderLine = OrderLine & {
  name: string;
};

/** Order enriched with item names and customer phone for the Motoboy. */
export type EnrichedOrder = Omit<Order, 'lines'> & {
  lines: EnrichedOrderLine[];
  customerPhone: string | null;
};
