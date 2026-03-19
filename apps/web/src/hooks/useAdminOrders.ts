import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';

export type OrderStatus =
  | 'PLACED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

export type ApiOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: { id: string; qty: number }[];
  createdAt: string;
  motoboyId?: string;
};

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
