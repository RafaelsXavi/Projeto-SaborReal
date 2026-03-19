import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../api';
import { useCatalog } from '../useCatalog';

// Mock api.ts
vi.mock('../../api', () => ({
  apiFetch: vi.fn(),
  userFriendlyError: vi.fn((e: unknown) => String(e)),
}));

const mockApiFetch = vi.fn();
const apiFetchMock = apiFetch as unknown as ReturnType<typeof vi.fn>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockImplementation(mockApiFetch);
  });

  it('falls back to seed data on API failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.error).toBeTruthy(), {
      timeout: 2000,
    });
    expect(result.current.catalog).toHaveLength(4);
    expect(result.current.catalog[0]?.id).toBe(
      'tapioca-salgada-frango-com-requeijao',
    );
  });

  it('loads real data on API success', async () => {
    const mockData = {
      items: [{ id: 'test-item', name: 'Test', priceCents: 1000 }],
      categories: [{ id: 'test-cat', name: 'Test Cat' }],
    };
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as unknown);

    const { result } = renderHook(() => useCatalog(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.catalog).toHaveLength(1), {
      timeout: 2000,
    });
    expect(result.current.catalog).toHaveLength(1);
    expect(result.current.catalog[0]?.id).toBe('test-item');
  });
});
