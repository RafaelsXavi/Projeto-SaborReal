import { useEffect, useMemo, useState } from 'react';
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
    id: 'x-burger',
    name: 'X-Burger',
    priceCents: 2490,
    description: 'Hambúrguer artesanal com queijo e molho da casa.',
    categoryId: 'pratos',
    categoryName: 'Pratos Principais',
  },
  {
    id: 'x-salada',
    name: 'X-Salada',
    priceCents: 2890,
    description: 'Clássico com salada.',
    categoryId: 'pratos',
    categoryName: 'Pratos Principais',
  },
  {
    id: 'batata',
    name: 'Batata Frita',
    priceCents: 1590,
    description: 'Porção crocante.',
    categoryId: 'entradas',
    categoryName: 'Entradas',
  },
  {
    id: 'refri',
    name: 'Refrigerante Lata',
    priceCents: 790,
    description: 'Bem gelado.',
    categoryId: 'bebidas',
    categoryName: 'Bebidas',
  },
];

const seedCategories: CatalogCategory[] = [
  { id: 'entradas', name: 'Entradas', sortOrder: 1 },
  { id: 'pratos', name: 'Pratos Principais', sortOrder: 2 },
  { id: 'bebidas', name: 'Bebidas', sortOrder: 3 },
  { id: 'sobremesas', name: 'Sobremesas', sortOrder: 4 },
];

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(seedCatalog);
  const [categories, setCategories] =
    useState<CatalogCategory[]>(seedCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch('/v1/catalog')
      .then((res) => res.json() as Promise<CatalogResponse>)
      .then((data) => {
        const itemsRaw = Array.isArray(data.items) ? data.items : [];
        const normalized = itemsRaw.filter(isCatalogItem);
        if (normalized.length > 0) setCatalog(normalized);

        const categoriesRaw = Array.isArray(data.categories)
          ? data.categories
          : [];
        const normalizedCategories = categoriesRaw.filter(isCatalogCategory);
        if (normalizedCategories.length > 0) {
          // Stable ordering if sortOrder exists.
          setCategories(
            normalizedCategories.slice().sort((a, b) => {
              const sa = a.sortOrder ?? 9999;
              const sb = b.sortOrder ?? 9999;
              if (sa !== sb) return sa - sb;
              return a.name.localeCompare(b.name);
            }),
          );
        } else if (normalized.length > 0) {
          // Derive from items if API didn't send categories.
          const byName = new Map<string, CatalogCategory>();
          for (const it of normalized) {
            const name = it.categoryName;
            const id = it.categoryId;
            if (!name || !id) continue;
            if (!byName.has(id)) byName.set(id, { id, name });
          }
          if (byName.size > 0) setCategories(Array.from(byName.values()));
        }
      })
      .catch((e: unknown) => setError(userFriendlyError(e)))
      .finally(() => setLoading(false));
  }, []);

  const availableCount = useMemo(
    () => catalog.filter((it) => it.available ?? true).length,
    [catalog],
  );

  return { catalog, categories, availableCount, loading, error };
}

