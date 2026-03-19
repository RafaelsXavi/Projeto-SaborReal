import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiFetch, userFriendlyError } from '../api';

export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder?: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  priceCents: number;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  imageUrl?: string;
  available?: boolean;
};

type CatalogResponse = { items: unknown; categories?: unknown };

function isCatalogCategory(value: unknown): value is CatalogCategory {
  if (!value || typeof value !== 'object') return false;
  const v = value as { id?: unknown; name?: unknown; sortOrder?: unknown };
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    v.name.length > 0 &&
    (v.sortOrder === undefined ||
      (typeof v.sortOrder === 'number' && Number.isFinite(v.sortOrder)))
  );
}

function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as {
    id?: unknown;
    name?: unknown;
    priceCents?: unknown;
    description?: unknown;
    categoryId?: unknown;
    categoryName?: unknown;
    imageUrl?: unknown;
    available?: unknown;
  };
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    v.name.length > 0 &&
    typeof v.priceCents === 'number' &&
    Number.isFinite(v.priceCents) &&
    (v.description === undefined || typeof v.description === 'string') &&
    (v.categoryId === undefined || typeof v.categoryId === 'string') &&
    (v.categoryName === undefined || typeof v.categoryName === 'string') &&
    (v.imageUrl === undefined || typeof v.imageUrl === 'string') &&
    (v.available === undefined || typeof v.available === 'boolean')
  );
}

const seedCatalog: CatalogItem[] = [
  {
    id: 'tapioca-salgada-frango-com-requeijao',
    name: 'Frango com Requeijao',
    priceCents: 1500,
    description: 'Tapioca salgada de frango com requeijao.',
    categoryId: 'tapiocas-salgadas',
    categoryName: 'Tapiocas Salgadas',
    imageUrl: '/images/tapiocafrango.jpeg',
    available: true,
  },
  {
    id: 'pastel-salgado-carne-com-queijo',
    name: 'Pastel Carne com Queijo',
    priceCents: 1100,
    description: 'Pastel salgado de carne com queijo.',
    categoryId: 'pasteis-salgados',
    categoryName: 'Pasteis Salgados',
    imageUrl: '/images/pastel.jpeg',
    available: true,
  },
  {
    id: 'pudim-fatia',
    name: 'Fatia do Pudim',
    priceCents: 1000,
    description: 'Nossa famosa fatia de pudim de leite.',
    categoryId: 'sobremesas',
    categoryName: 'Sobremesas',
    imageUrl: '/images/pudimPedaco.jpeg',
    available: true,
  },
  {
    id: 'refri-200ml',
    name: 'Refri 200ml',
    priceCents: 300,
    description: 'Refrigerante 200ml geladinho.',
    categoryId: 'bebidas',
    categoryName: 'Bebidas',
    imageUrl: '/images/Logo_Sabor_Real-removebg-preview.png',
    available: true,
  },
];

const seedCategories: CatalogCategory[] = [
  { id: 'tapiocas-salgadas', name: 'Tapiocas', sortOrder: 1 },
  { id: 'pasteis-salgados', name: 'Pasteis', sortOrder: 2 },
  { id: 'sobremesas', name: 'Sobremesas', sortOrder: 3 },
  { id: 'bebidas', name: 'Bebidas', sortOrder: 4 },
];

async function fetchCatalog(): Promise<{
  items: CatalogItem[];
  categories: CatalogCategory[];
}> {
  const res = await apiFetch('/v1/catalog');
  const data = (await res.json()) as CatalogResponse;

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.filter(isCatalogItem);

  const categoriesRaw = Array.isArray(data.categories) ? data.categories : [];
  let categories = categoriesRaw.filter(isCatalogCategory);

  if (categories.length > 0) {
    categories = categories.slice().sort((a: CatalogCategory, b: CatalogCategory) => {
      const sa = a.sortOrder ?? 9999;
      const sb = b.sortOrder ?? 9999;
      if (sa !== sb) return sa - sb;
      return a.name.localeCompare(b.name);
    });
  } else if (items.length > 0) {
    const byName = new Map<string, CatalogCategory>();
    for (const it of items) {
      const name = it.categoryName;
      const id = it.categoryId;
      if (!name || !id) continue;
      if (!byName.has(id)) byName.set(id, { id, name });
    }
    categories = Array.from(byName.values());
  } else {
    categories = seedCategories;
  }

  return { items: items.length > 0 ? items : seedCatalog, categories };
}

export function useCatalog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,
    placeholderData: { items: seedCatalog, categories: seedCategories },
  });

  const catalog = data?.items ?? seedCatalog;
  const categories = data?.categories ?? seedCategories;

  const availableCount = useMemo(
    () => catalog.filter((it: CatalogItem) => it.available ?? true).length,
    [catalog],
  );

  return {
    catalog,
    categories,
    availableCount,
    loading: isLoading,
    error: error ? userFriendlyError(error) : null,
  };
}
