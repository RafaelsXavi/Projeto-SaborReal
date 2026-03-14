import type { CatalogResponse } from './catalog.types.js';

export const seedCatalog: CatalogResponse = {
  categories: [
    { id: 'entradas', name: 'Entradas', sortOrder: 1 },
    { id: 'pratos', name: 'Pratos Principais', sortOrder: 2 },
    { id: 'bebidas', name: 'Bebidas', sortOrder: 3 },
    { id: 'sobremesas', name: 'Sobremesas', sortOrder: 4 },
  ],
  items: [
    {
      id: 'x-burger',
      name: 'X-Burger',
      description: 'Hambúrguer artesanal com queijo e molho da casa.',
      priceCents: 2490,
      categoryId: 'pratos',
      categoryName: 'Pratos Principais',
      imageUrl: 'https://placehold.co/600x600?text=X-Burger',
      available: true,
    },
    {
      id: 'batata',
      name: 'Batata Frita',
      description: 'Porção crocante para compartilhar.',
      priceCents: 1590,
      categoryId: 'entradas',
      categoryName: 'Entradas',
      imageUrl: 'https://placehold.co/600x600?text=Batata',
      available: true,
    },
    {
      id: 'refri',
      name: 'Refrigerante Lata',
      description: 'Bem gelado.',
      priceCents: 790,
      categoryId: 'bebidas',
      categoryName: 'Bebidas',
      imageUrl: 'https://placehold.co/600x600?text=Refrigerante',
      available: true,
    },
  ],
};

