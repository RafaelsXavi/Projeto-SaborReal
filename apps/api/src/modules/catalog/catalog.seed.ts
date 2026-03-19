import type { CatalogResponse } from './catalog.types.js';

export const seedCatalog: CatalogResponse = {
  categories: [
    { id: 'tapiocas-doces', name: 'Tapiocas Doces', sortOrder: 1 },
    { id: 'tapiocas-salgadas', name: 'Tapiocas Salgadas', sortOrder: 2 },
    { id: 'pasteis-doces', name: 'Pastéis Doces', sortOrder: 3 },
    { id: 'pasteis-salgados', name: 'Pastéis Salgados', sortOrder: 4 },
    { id: 'batata-recheada', name: 'Batata Recheada', sortOrder: 5 },
    { id: 'porcoes', name: 'Porções', sortOrder: 6 },
    { id: 'bolos-e-sobremesas', name: 'Bolos e Sobremesas', sortOrder: 7 },
    { id: 'bebidas', name: 'Bebidas', sortOrder: 8 },
  ],
  items: [
    {
      id: 'tapioca-doce-creme-de-avela',
      name: 'Creme de Avelã',
      description: 'Tapioca doce com creme de avelã (puro).',
      priceCents: 1200,
      categoryId: 'tapiocas-doces',
      categoryName: 'Tapiocas Doces',
      imageUrl: '/images/tapiocafrango.jpeg', // Using existing local image as placeholder
      available: true,
    },
    {
      id: 'tapioca-salgada-frango-com-requeijao',
      name: 'Frango com Requeijão ou Cheddar',
      description:
        'Tapioca salgada de frango com opção de requeijão ou cheddar.',
      priceCents: 1500,
      categoryId: 'tapiocas-salgadas',
      categoryName: 'Tapiocas Salgadas',
      imageUrl: '/images/tapiocafrango.jpeg',
      available: true,
    },
    {
      id: 'pastel-salgado-carne-com-queijo',
      name: 'Carne com Queijo ou Requeijão',
      description: 'Pastel salgado de carne com opção de queijo ou requeijão.',
      priceCents: 1100,
      categoryId: 'pasteis-salgados',
      categoryName: 'Pastéis Salgados',
      imageUrl: '/images/pastel.jpeg',
      available: true,
    },
    {
      id: 'sobremesa-fatia-de-pudim',
      name: 'Fatia do Pudim',
      description: 'Fatia do pudim (consultar disponibilidade).',
      priceCents: 1000,
      categoryId: 'bolos-e-sobremesas',
      categoryName: 'Bolos e Sobremesas',
      imageUrl: '/images/pudimPedaco.jpeg',
      available: true,
    },
    {
      id: 'bebida-refrigerante-200ml',
      name: 'Refri de 200ml',
      description: 'Refri de 200ml (favor consultar sabores).',
      priceCents: 300,
      categoryId: 'bebidas',
      categoryName: 'Bebidas',
      imageUrl: '/images/Logo_Sabor_Real-removebg-preview.png',
      available: true,
    },
    // ... adding a few more key items to represent the variety
    {
      id: 'batata-recheada-frango-com-requeijao',
      name: 'Frango com Requeijão (Batata)',
      description: 'Batata recheada no pote com frango.',
      priceCents: 1800,
      categoryId: 'batata-recheada',
      categoryName: 'Batata Recheada',
      imageUrl: '/images/Background2tapiocas.jpeg',
      available: true,
    },
  ],
};
