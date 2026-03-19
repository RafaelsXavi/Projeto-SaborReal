import type { OrderStatus } from '@saborreal/shared';

export type OrderLine = { id: string; qty: number };

export type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: string;
  motoboyId?: string;
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
