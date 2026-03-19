import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMotoboyOrders } from '../hooks/useMotoboyOrders';
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

describe('useMotoboyOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch available and assigned orders', async () => {
    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('available')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'avail-1' }],
        });
      }
      if (url.includes('assigned')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'ass-1' }],
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const { result } = renderHook(() => useMotoboyOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.availableOrders).toHaveLength(1);
      expect(result.current.assignedOrders).toHaveLength(1);
    });
  });

  it('should accept an order', async () => {
    (api.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useMotoboyOrders(), {
      wrapper: createWrapper(),
    });

    await result.current.acceptOrder.mutateAsync('order-123');

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/v1/orders/order-123/accept',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
