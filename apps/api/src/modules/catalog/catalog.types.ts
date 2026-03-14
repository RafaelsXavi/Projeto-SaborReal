export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  available: boolean;
};

export type CatalogResponse = {
  categories: CatalogCategory[];
  items: CatalogItem[];
};

