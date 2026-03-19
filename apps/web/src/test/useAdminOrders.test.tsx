import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '../api';
import React from 'react';

vi.mock('../api', () => ({
  apiFetch: vi.fn(),
  userFriendlyError: vi.fn((e) => e.message || 'Error'),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAdminOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch orders on mount', async () => {
    const mockOrders = [{ id: 'order-1', status: 'pending' }];
    (api.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockOrders,
    });

    const { result } = renderHook(() => useAdminOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.orders).toEqual(mockOrders);
  });

  it('should update order status via mutation', async () => {
    (api.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useAdminOrders(), {
      wrapper: createWrapper(),
    });

    await result.current.updateStatus.mutateAsync({
      orderId: 'order-1',
      status: 'preparing',
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/v1/orders/order-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'preparing' }),
      }),
    );
  });
});
