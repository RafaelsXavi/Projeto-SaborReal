import { z } from 'zod';
import { ORDER_STATUSES, type OrderStatus } from './orderStatus.js';

export const orderLineSchema = z.object({
  id: z.string().min(1).max(80),
  qty: z.number().int().min(1).max(99),
});

export const placeOrderSchema = z.object({
  lines: z.array(orderLineSchema).min(1).max(50),
  distanceKm: z.number().min(0).max(500).optional(),
  delivery: z
    .object({
      cep: z
        .string()
        .trim()
        .transform((v) => v.replaceAll(/\D/g, ''))
        .refine((v) => /^\d{8}$/.test(v), { message: 'invalid cep' }),
      number: z.string().trim().min(1).max(20),
      notes: z.string().trim().max(300).optional(),
    })
    .optional(),
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
  deliveryCep?: string | undefined;
  deliveryNumber?: string | undefined;
  deliveryNotes?: string | undefined;
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
