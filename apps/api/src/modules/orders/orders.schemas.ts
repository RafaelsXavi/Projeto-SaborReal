import { ORDER_STATUSES } from '@saborreal/shared';
import { z } from 'zod';

export const orderLineSchema = z.object({
  id: z.string().min(1).max(80),
  qty: z.number().int().min(1).max(99),
});

export const placeOrderSchema = z.object({
  lines: z.array(orderLineSchema).min(1).max(50),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
