import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { useAdminOrders } from '../hooks/useAdminOrders';

vi.mock('../api', () => ({
  apiFetch: vi.fn(),
  userFriendlyError: vi.fn((e) => e.message || 'Error'),
}));

const apiFetchMock = api.apiFetch as unknown as ReturnType<typeof vi.fn>;

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
    const mockOrders = [
      {
        id: 'order-1',
        userId: 'user-1',
        status: 'PLACED',
        lines: [],
        createdAt: new Date().toISOString(),
      },
    ];
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, orders: mockOrders }),
    });

    const { result } = renderHook(() => useAdminOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.orders).toEqual(mockOrders);
  });

  it('should update order status via mutation', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useAdminOrders(), {
      wrapper: createWrapper(),
    });

    await result.current.updateStatus({
      orderId: 'order-1',
      status: 'PREPARING',
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/v1/admin/orders/order-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'PREPARING' }),
      }),
    );
  });
});
