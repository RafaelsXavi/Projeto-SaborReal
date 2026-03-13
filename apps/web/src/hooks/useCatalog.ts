import { useEffect, useState } from 'react';
import { apiFetch, userFriendlyError } from '../api';

export type CatalogItem = {
  id: string;
  name: string;
  priceCents: number;
};

type CatalogResponse = { items: unknown };

function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as { id?: unknown; name?: unknown; priceCents?: unknown };
  return (
    typeof v.id === 'string' &&
    v.id.length > 0 &&
    typeof v.name === 'string' &&
    v.name.length > 0 &&
    typeof v.priceCents === 'number' &&
    Number.isFinite(v.priceCents)
  );
}

const seedCatalog: CatalogItem[] = [
  { id: 'x-burger', name: 'X-Burger', priceCents: 2490 },
  { id: 'x-salada', name: 'X-Salada', priceCents: 2890 },
  { id: 'batata', name: 'Batata Frita', priceCents: 1590 },
  { id: 'refri', name: 'Refrigerante Lata', priceCents: 790 },
];

export function useCatalog() {
  const [catalog, setCatalog] = useState<CatalogItem[]>(seedCatalog);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch('/v1/catalog')
      .then((res) => res.json() as Promise<CatalogResponse>)
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        const normalized = items.filter(isCatalogItem);
        if (normalized.length > 0) setCatalog(normalized);
      })
      .catch((e: unknown) => setError(userFriendlyError(e)))
      .finally(() => setLoading(false));
  }, []);

  return { catalog, loading, error };
}
