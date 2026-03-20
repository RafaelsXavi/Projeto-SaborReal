import type { CatalogCategory, CatalogItem } from '@saborreal/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';

export function useAdminCatalog() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await apiFetch('/v1/catalog');
      return (await res.json()) as {
        items: CatalogItem[];
        categories: CatalogCategory[];
      };
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: Omit<CatalogItem, 'id' | 'categoryName'>) => {
      await apiFetch('/v1/admin/catalog', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CatalogItem>;
    }) => {
      await apiFetch(`/v1/admin/catalog/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/v1/admin/catalog/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });

  return {
    items: data?.items ?? [],
    categories: data?.categories ?? [],
    loading: isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isProcessing:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
