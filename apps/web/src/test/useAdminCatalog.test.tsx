import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { useAdminCatalog } from '../hooks/useAdminCatalog';

vi.mock('../api', () => ({
  apiFetch: vi.fn(),
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

describe('useAdminCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockData = {
    items: [{ id: '1', name: 'Product 1', priceCents: 1000, categoryId: 'cat1', categoryName: 'Cat 1', available: true }],
    categories: [{ id: 'cat1', name: 'Cat 1' }],
  };

  it('should format catalog data properly on load', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAdminCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(mockData.items);
    expect(result.current.categories).toEqual(mockData.categories);
  });

  it('should call apiFetch correctly on item creation', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAdminCatalog(), { wrapper: createWrapper() });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await result.current.create({ name: 'New Item', priceCents: 500, categoryId: 'cat1', available: true } as any);

    expect(apiFetchMock).toHaveBeenCalledWith('/v1/admin/catalog', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Item', priceCents: 500, categoryId: 'cat1', available: true }),
    });
  });

  it('should call apiFetch correctly on item update', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAdminCatalog(), { wrapper: createWrapper() });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await result.current.update({ id: '1', data: { priceCents: 1500 } });

    expect(apiFetchMock).toHaveBeenCalledWith('/v1/admin/catalog/1', {
      method: 'PATCH',
      body: JSON.stringify({ priceCents: 1500 }),
    });
  });

  it('should call apiFetch correctly on item deletion', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useAdminCatalog(), { wrapper: createWrapper() });
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await result.current.remove('1');

    expect(apiFetchMock).toHaveBeenCalledWith('/v1/admin/catalog/1', {
      method: 'DELETE',
    });
  });
});
