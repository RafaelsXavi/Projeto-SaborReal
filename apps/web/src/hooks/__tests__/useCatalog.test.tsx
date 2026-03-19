import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalog } from '../useCatalog';
import { apiFetch } from '../../api';

// Mock api.ts
vi.mock('../../../api', () => ({
  apiFetch: vi.fn(),
  userFriendlyError: vi.fn((e: unknown) => String(e)),
}));

const mockApiFetch = vi.fn();

describe('useCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as any).mockImplementation(mockApiFetch);
  });

  it('falls back to seed data on API failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(result.current.error).toBeTruthy();
    expect(result.current.catalog).toHaveLength(4);
    expect(result.current.catalog[0]?.id).toBe('x-burger');
  });

  it('loads real data on API success', async () => {
    const mockData = {
      items: [{ id: 'test-item', name: 'Test', priceCents: 1000 }],
      categories: [{ id: 'test-cat', name: 'Test Cat' }],
    };
    mockApiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as any);

    const { result } = renderHook(() => useCatalog());

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 2000,
    });
    expect(result.current.catalog).toHaveLength(1);
    expect(result.current.catalog[0]?.id).toBe('test-item');
  });
});
