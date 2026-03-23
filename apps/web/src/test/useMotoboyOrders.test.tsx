import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { useMotoboyOrders } from '../hooks/useMotoboyOrders';

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

describe('useMotoboyOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch available and assigned orders', async () => {
    apiFetchMock.mockImplementation((url: string) => {
      if (url.includes('available')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            orders: [
              { id: 'avail-1', lines: [], createdAt: new Date().toISOString() },
            ],
          }),
        });
      }
      if (url.includes('mine')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            orders: [
              { id: 'ass-1', lines: [], createdAt: new Date().toISOString() },
            ],
          }),
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    const { result } = renderHook(() => useMotoboyOrders(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.available).toHaveLength(1);
      expect(result.current.assigned).toHaveLength(1);
    });
  });

  it('should accept an order', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { result } = renderHook(() => useMotoboyOrders(), {
      wrapper: createWrapper(),
    });

    await result.current.accept('order-123');

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/v1/motoboy/orders/order-123/accept',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should complete an order', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    const { result } = renderHook(() => useMotoboyOrders(), {
      wrapper: createWrapper(),
    });

    await result.current.complete('order-123');

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/v1/motoboy/orders/order-123/complete',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
