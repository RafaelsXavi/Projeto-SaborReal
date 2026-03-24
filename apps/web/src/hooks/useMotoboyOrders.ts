import type { EnrichedOrder } from '@saborreal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';

export type MotoboyOrder = EnrichedOrder;

async function fetchAvailableOrders(): Promise<MotoboyOrder[]> {
  const res = await apiFetch('/v1/motoboy/orders/available');
  const data = (await res.json()) as { ok: boolean; orders: MotoboyOrder[] };
  return Array.isArray(data.orders) ? data.orders : [];
}

async function fetchAssignedOrders(): Promise<MotoboyOrder[]> {
  const res = await apiFetch('/v1/motoboy/orders/mine');
  const data = (await res.json()) as { ok: boolean; orders: MotoboyOrder[] };
  return Array.isArray(data.orders) ? data.orders : [];
}

export function useMotoboyOrders() {
  const queryClient = useQueryClient();

  const availableQuery = useQuery({
    queryKey: ['motoboy', 'available'],
    queryFn: fetchAvailableOrders,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const assignedQuery = useQuery({
    queryKey: ['motoboy', 'assigned'],
    queryFn: fetchAssignedOrders,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiFetch(
        `/v1/motoboy/orders/${encodeURIComponent(orderId)}/accept`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoboy'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiFetch(
        `/v1/motoboy/orders/${encodeURIComponent(orderId)}/complete`,
        {
          method: 'POST',
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motoboy'] });
    },
  });

  return {
    available: availableQuery.data || [],
    assigned: assignedQuery.data || [],
    loading: availableQuery.isLoading || assignedQuery.isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['motoboy'] }),
    accept: acceptMutation.mutateAsync,
    complete: completeMutation.mutateAsync,
    isProcessing: acceptMutation.isPending || completeMutation.isPending,
    error:
      availableQuery.error ||
      assignedQuery.error ||
      acceptMutation.error ||
      completeMutation.error,
  };
}
export function useMotoboyStats() {
  const statsQuery = useQuery({
    queryKey: ['motoboy', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/v1/motoboy/stats');
      const data = (await res.json()) as {
        ok: boolean;
        stats: { completedToday: number; earningsTodayCents: number };
      };
      return data.stats;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    stats: statsQuery.data,
    loading: statsQuery.isLoading,
    error: statsQuery.error,
  };
}
