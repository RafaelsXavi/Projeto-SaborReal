import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../api';
import { useCatalog } from '../hooks/useCatalog';

// Mock the API module
vi.mock('../api', () => ({
  apiFetch: vi.fn(),
  userFriendlyError: vi.fn((e) => e.message || 'Error'),
}));

const apiFetchMock = api.apiFetch as unknown as ReturnType<typeof vi.fn>;

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
      items: [
        {
          id: '1',
          name: 'Product 1',
          priceCents: 1000,
          categoryId: 'cat1',
          categoryName: 'Cat 1',
          available: true,
        },
      ],
      categories: [{ id: 'cat1', name: 'Cat 1' }],
    };

    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.catalog).toEqual(mockData.items));
    expect(result.current.categories).toEqual(mockData.categories);
    expect(result.current.error).toBeNull();
  });

  it('should return seed data on API failure in DEV mode', async () => {
    apiFetchMock.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // It should fallback to seedCatalog (which has Pastel, Tapioca, etc.)
    expect(result.current.catalog.length).toBeGreaterThan(0);
    expect(result.current.catalog[0].id).toBe(
      'tapioca-salgada-frango-com-requeijao',
    );
    await waitFor(() => expect(result.current.error).toBeTruthy());
  });
});
