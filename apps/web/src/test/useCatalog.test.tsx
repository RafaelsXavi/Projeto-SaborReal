import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCatalog } from '../hooks/useCatalog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '../api';
import React from 'react';

// Mock the API module
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
  userFriendlyError: vi.fn((e) => e.message || 'Error'),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return catalog data on success', async () => {
    const mockData = {
      items: [{ id: '1', name: 'Product 1' }],
      categories: [{ id: 'cat1', name: 'Cat 1' }],
    };

    (api.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.catalog).toEqual(mockData.items);
    expect(result.current.categories).toEqual(mockData.categories);
    expect(result.current.error).toBeNull();
  });

  it('should return seed data on API failure in DEV mode', async () => {
    (api.apiFetch as any).mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // It should fallback to seedCatalog (which has Pastel, Tapioca, etc.)
    expect(result.current.catalog.length).toBeGreaterThan(0);
    expect(result.current.catalog[0].id).toBe(
      'tapioca-salgada-frango-com-requeijao',
    );
    expect(result.current.error).toBeNull(); // Error is suppressed in DEV for fallback
  });
});
