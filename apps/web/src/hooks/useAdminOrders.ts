import type { Order, OrderStatus } from '@saborreal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';

export type ApiOrder = Order;
export type { OrderStatus };

async function fetchAdminOrders(): Promise<ApiOrder[]> {
  const res = await apiFetch('/v1/admin/orders');
  const data = (await res.json()) as { ok: boolean; orders: ApiOrder[] };
  return Array.isArray(data.orders) ? data.orders : [];
}

export function useAdminOrders() {
  const queryClient = useQueryClient();

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: fetchAdminOrders,
    refetchInterval: 15_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: OrderStatus;
    }) => {
      await apiFetch(`/v1/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  return {
    orders,
    loading: isLoading,
    error,
    refresh: refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdating: updateStatusMutation.isPending,
  };
}
