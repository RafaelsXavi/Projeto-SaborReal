import { z } from 'zod';

const optionalHttpUrl = z
  .string()
  .max(500)
  .refine(
    (v) => v === '' || v.startsWith('http://') || v.startsWith('https://'),
    'URL must start with http:// or https://',
  )
  .optional();

export const catalogItemSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0),
  categoryId: z.string().min(1).max(80),
  categoryName: z.string().min(1).max(150),
  imageUrl: optionalHttpUrl,
  available: z.boolean().optional(),
});

export type CatalogItem = {
  id: string;
  name: string;
  description?: string | undefined;
  priceCents: number;
  categoryId: string;
  categoryName: string;
  imageUrl?: string | undefined;
  available?: boolean | undefined;
};

export const createCatalogItemSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0),
  categoryId: z.string().min(1).max(80),
  imageUrl: optionalHttpUrl,
  available: z.boolean().default(true),
});

export const updateCatalogItemSchema = createCatalogItemSchema.partial();

export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder?: number | undefined;
};

export type CatalogResponse = {
  categories: CatalogCategory[];
  items: CatalogItem[];
};
