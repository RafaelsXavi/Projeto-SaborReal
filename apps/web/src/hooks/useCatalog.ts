import type { CatalogCategory, CatalogItem } from '@saborreal/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiFetch, userFriendlyError } from '../api';

export type { CatalogItem, CatalogCategory };

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
    id: 'tapioca-doce-creme-de-avela',
    name: 'Creme de Avelã',
    description: 'Tapioca doce com creme de avelã (puro).',
    priceCents: 1200,
    categoryId: 'tapiocas-doces',
    categoryName: 'Tapiocas Doces',
    imageUrl: '/images/tapiocafrango.jpeg',
    available: true,
  },
  {
    id: 'tapioca-doce-morango-com-chocolate',
    name: 'Morango com Chocolate',
    description: 'Tapioca doce com morango e chocolate meio amargo.',
    priceCents: 1400,
    categoryId: 'tapiocas-doces',
    categoryName: 'Tapiocas Doces',
    imageUrl: '/images/tapiocafrango.jpeg',
    available: true,
  },
  {
    id: 'tapioca-salgada-frango-com-requeijao',
    name: 'Frango com Requeijão',
    description: 'Tapioca salgada de frango com requeijão cremoso.',
    priceCents: 1500,
    categoryId: 'tapiocas-salgadas',
    categoryName: 'Tapiocas Salgadas',
    imageUrl: '/images/tapiocafrango.jpeg',
    available: true,
  },
  {
    id: 'tapioca-salgada-carne-seca',
    name: 'Carne Seca com Queijo',
    description: 'Tapioca salgada de carne seca com queijo coalho.',
    priceCents: 1700,
    categoryId: 'tapiocas-salgadas',
    categoryName: 'Tapiocas Salgadas',
    imageUrl: '/images/tapiocafrango.jpeg',
    available: true,
  },
  {
    id: 'pastel-salgado-carne-com-queijo',
    name: 'Carne com Queijo',
    description: 'Pastel salgado de carne com queijo.',
    priceCents: 1100,
    categoryId: 'pasteis-salgados',
    categoryName: 'Pastéis Salgados',
    imageUrl: '/images/pastel.jpeg',
    available: true,
  },
  {
    id: 'pastel-salgado-frango-catupiry',
    name: 'Frango com Catupiry',
    description: 'Pastel salgado de frango com Catupiry original.',
    priceCents: 1100,
    categoryId: 'pasteis-salgados',
    categoryName: 'Pastéis Salgados',
    imageUrl: '/images/pastel.jpeg',
    available: true,
  },
  {
    id: 'pastel-doce-romeu-e-julieta',
    name: 'Romeu e Julieta',
    description: 'Pastel doce de queijo com goiabada.',
    priceCents: 1000,
    categoryId: 'pasteis-doces',
    categoryName: 'Pastéis Doces',
    imageUrl: '/images/pastel.jpeg',
    available: true,
  },
  {
    id: 'batata-recheada-frango',
    name: 'Frango com Requeijão (Batata)',
    description: 'Batata recheada com frango desfiado e requeijão.',
    priceCents: 1800,
    categoryId: 'batata-recheada',
    categoryName: 'Batata Recheada',
    imageUrl: '/images/Background2tapiocas.jpeg',
    available: true,
  },
  {
    id: 'batata-recheada-strogonoff',
    name: 'Strogonoff de Carne (Batata)',
    description: 'Batata recheada com strogonoff de carne suculento.',
    priceCents: 2200,
    categoryId: 'batata-recheada',
    categoryName: 'Batata Recheada',
    imageUrl: '/images/Background2tapiocas.jpeg',
    available: true,
  },
  {
    id: 'porcao-fritas-simples',
    name: 'Batata Frita (P)',
    description: 'Porção de batata frita crocante.',
    priceCents: 1500,
    categoryId: 'porcoes',
    categoryName: 'Porções',
    imageUrl: '/images/Logo_Sabor_Real-removebg-preview.png',
    available: true,
  },
  {
    id: 'sobremesa-fatia-de-pudim',
    name: 'Fatia de Pudim',
    description: 'Fatia de pudim de leite condensado caseiro.',
    priceCents: 1000,
    categoryId: 'bolos-e-sobremesas',
    categoryName: 'Bolos e Sobremesas',
    imageUrl: '/images/pudimPedaco.jpeg',
    available: true,
  },
  {
    id: 'bebida-refrigerante-lata',
    name: 'Refrigerante Lata',
    description: 'Coca-Cola, Guaraná, Fanta (especificar sabor).',
    priceCents: 600,
    categoryId: 'bebidas',
    categoryName: 'Bebidas',
    imageUrl: '/images/Logo_Sabor_Real-removebg-preview.png',
    available: true,
  },
  {
    id: 'bebida-suco-natural',
    name: 'Suco Natural',
    description: 'Suco de laranja ou limão (500ml).',
    priceCents: 800,
    categoryId: 'bebidas',
    categoryName: 'Bebidas',
    imageUrl: '/images/Logo_Sabor_Real-removebg-preview.png',
    available: true,
  },
];

const seedCategories: CatalogCategory[] = [
  { id: 'tapiocas-doces', name: 'Tapiocas Doces', sortOrder: 1 },
  { id: 'tapiocas-salgadas', name: 'Tapiocas Salgadas', sortOrder: 2 },
  { id: 'pasteis-doces', name: 'Pastéis Doces', sortOrder: 3 },
  { id: 'pasteis-salgados', name: 'Pastéis Salgados', sortOrder: 4 },
  { id: 'batata-recheada', name: 'Batata Recheada', sortOrder: 5 },
  { id: 'porcoes', name: 'Porções', sortOrder: 6 },
  { id: 'bolos-e-sobremesas', name: 'Bolos e Sobremesas', sortOrder: 7 },
  { id: 'bebidas', name: 'Bebidas', sortOrder: 8 },
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
    categories = categories
      .slice()
      .sort((a: CatalogCategory, b: CatalogCategory) => {
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
