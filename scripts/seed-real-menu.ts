import 'dotenv/config';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolClient } from 'pg';

type CatalogCategorySeed = {
  id: string;
  name: string;
  sortOrder: number;
};

type CatalogAddonSeed = {
  id: string;
  name: string;
  price: number; // BRL
};

type CatalogItemSeed = {
  id: string;
  name: string;
  description: string;
  price: number; // BRL
  categoryId: string;
  category: string;
  imageUrl: string;
  available: true;
  addonIds?: string[];
};

function toCents(brl: number) {
  return Math.round(brl * 100);
}

function slugify(input: string) {
  return input
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');
}

function brlNumeric(brl: number) {
  // Pass as string to preserve 2 decimals in Postgres NUMERIC.
  return brl.toFixed(2);
}

const categories: CatalogCategorySeed[] = [
  { id: 'tapiocas-doces', name: 'Tapiocas Doces', sortOrder: 1 },
  { id: 'tapiocas-salgadas', name: 'Tapiocas Salgadas', sortOrder: 2 },
  { id: 'pasteis-doces', name: 'Pastéis Doces', sortOrder: 3 },
  { id: 'pasteis-salgados', name: 'Pastéis Salgados', sortOrder: 4 },
  { id: 'batata-recheada', name: 'Batata Recheada', sortOrder: 5 },
  { id: 'porcoes', name: 'Porções', sortOrder: 6 },
  { id: 'bolos-e-sobremesas', name: 'Bolos e Sobremesas', sortOrder: 7 },
  { id: 'bebidas', name: 'Bebidas', sortOrder: 8 },
];

// Extra ingredient price = 3.00 BRL
const addons: CatalogAddonSeed[] = [
  { id: 'queijo', name: 'queijo', price: 3.0 },
  { id: 'bacon', name: 'bacon', price: 3.0 },
  { id: 'catupiry', name: 'catupiry', price: 3.0 },
  { id: 'cheddar', name: 'cheddar', price: 3.0 },
];

const ALL_SAVORY_ADDONS = addons.map((a) => a.id);

const items: CatalogItemSeed[] = [
  // Tapiocas Doces (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'tapioca-doce-creme-de-avela',
    name: 'Creme de Avelã',
    description: 'Tapioca doce com creme de avelã (puro).',
    price: 12.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-creme-de-avela-com-coco-ralado',
    name: 'Creme de Avelã com Coco Ralado',
    description: 'Tapioca doce com creme de avelã e coco ralado.',
    price: 13.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-creme-de-avela-com-banana',
    name: 'Creme de Avelã com Banana',
    description: 'Tapioca doce com creme de avelã e banana fatiada.',
    price: 14.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-creme-de-avela-com-morango',
    name: 'Creme de Avelã com Morango',
    description: 'Tapioca doce com creme de avelã e morango.',
    price: 15.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-morango-com-leite-condensado',
    name: 'Morango com Leite Condensado',
    description: 'Tapioca doce com morango e leite condensado.',
    price: 15.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-banana-com-leite-condensado',
    name: 'Banana com Leite Condensado',
    description: 'Tapioca doce com banana e leite condensado.',
    price: 14.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-leite-condensado-com-coco-ralado',
    name: 'Leite Condensado com Coco Ralado',
    description: 'Tapioca doce com leite condensado e coco ralado.',
    price: 12.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-romeu-e-julieta',
    name: 'Romeu e Julieta',
    description: 'Tapioca doce com queijo e goiabada.',
    price: 13.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-banana-com-canela',
    name: 'Banana com Canela',
    description: 'Tapioca doce com banana e canela.',
    price: 12.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },
  {
    id: 'tapioca-doce-doce-de-leite',
    name: 'Doce de Leite',
    description: 'Tapioca doce com doce de leite.',
    price: 12.0,
    categoryId: 'tapiocas-doces',
    category: 'Tapiocas Doces',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Doce',
    available: true,
  },

  // Tapiocas Salgadas (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'tapioca-salgada-frango-com-requeijao',
    name: 'Frango com Requeijão ou Cheddar',
    description: 'Tapioca salgada de frango com opção de requeijão ou cheddar.',
    price: 15.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'tapioca-salgada-calabresa-com-queijo',
    name: 'Calabresa com Queijo ou Requeijão',
    description: 'Tapioca salgada de calabresa com opção de queijo ou requeijão.',
    price: 13.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'tapioca-salgada-presunto-e-queijo',
    name: 'Presunto e Queijo',
    description: 'Tapioca salgada com presunto e queijo.',
    price: 12.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'tapioca-salgada-bacon-e-queijo',
    name: 'Bacon e Queijo',
    description: 'Tapioca salgada com bacon e queijo.',
    price: 12.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'tapioca-salgada-dois-queijos-catupiry-e-mussarela',
    name: 'Dois Queijos (Catupiry e Mussarela)',
    description: 'Tapioca salgada com catupiry e mussarela.',
    price: 12.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'tapioca-salgada-carne-seca-com-requeijao',
    name: 'Carne Seca com Requeijão',
    description: 'Tapioca salgada com carne seca e requeijão.',
    price: 16.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'tapioca-salgada-brocolis-com-queijo-e-bacon',
    name: 'Brócolis com Queijo e Bacon',
    description: 'Tapioca salgada de brócolis com queijo e bacon.',
    price: 13.0,
    categoryId: 'tapiocas-salgadas',
    category: 'Tapiocas Salgadas',
    imageUrl: 'https://placehold.co/600x400?text=Tapioca%20Salgada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },

  // Pastéis Doces (CARDÁPIO ATUALIZADO.pdf) — R$ 11,00 cada
  {
    id: 'pastel-doce-creme-de-avela-puro',
    name: 'Creme de Avelã',
    description: 'Pastel doce com creme de avelã (puro).',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-creme-de-avela-com-coco-ralado',
    name: 'Creme de Avelã com Coco Ralado',
    description: 'Pastel doce com creme de avelã e coco ralado.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-creme-de-avela-com-banana',
    name: 'Creme de Avelã com Banana',
    description: 'Pastel doce com creme de avelã e banana.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-creme-de-avela-com-morango',
    name: 'Creme de Avelã com Morango',
    description: 'Pastel doce com creme de avelã e morango.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-morango-com-leite-condensado',
    name: 'Morango com Leite Condensado',
    description: 'Pastel doce com morango e leite condensado.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-banana-com-leite-condensado',
    name: 'Banana com Leite Condensado',
    description: 'Pastel doce com banana e leite condensado.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-leite-condensado-com-coco-ralado',
    name: 'Leite Condensado com Coco Ralado',
    description: 'Pastel doce com leite condensado e coco ralado.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-romeu-e-julieta',
    name: 'Romeu e Julieta',
    description: 'Pastel doce com queijo e goiabada.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-banana-com-canela',
    name: 'Banana com Canela',
    description: 'Pastel doce com banana e canela.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },
  {
    id: 'pastel-doce-doce-de-leite',
    name: 'Doce de Leite',
    description: 'Pastel doce com doce de leite.',
    price: 11.0,
    categoryId: 'pasteis-doces',
    category: 'Pastéis Doces',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Doce',
    available: true,
  },

  // Pastéis Salgados (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'pastel-salgado-frango-com-requeijao',
    name: 'Frango com Requeijão ou Cheddar',
    description: 'Pastel salgado de frango com opção de requeijão ou cheddar.',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-calabresa-com-queijo',
    name: 'Calabresa com Queijo ou Requeijão',
    description: 'Pastel salgado de calabresa com opção de queijo ou requeijão.',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-pizza',
    name: 'Pizza',
    description: 'Pastel salgado sabor pizza (presunto, queijo, tomate e orégano).',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-carne-com-queijo',
    name: 'Carne com Queijo ou Requeijão',
    description: 'Pastel salgado de carne com opção de queijo ou requeijão.',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-especial-carne',
    name: 'Especial Carne',
    description: 'Pastel especial de carne (recheio caprichado).',
    price: 20.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-especial-frango',
    name: 'Especial Frango',
    description: 'Pastel especial de frango (recheio caprichado).',
    price: 20.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-bacon-e-queijo',
    name: 'Bacon e Queijo',
    description: 'Pastel salgado com bacon e queijo.',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-dois-queijos-catupiry-e-mussarela',
    name: 'Dois Queijos (Catupiry e Mussarela)',
    description: 'Pastel salgado com catupiry e mussarela.',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-carne-seca-com-requeijao',
    name: 'Carne Seca com Requeijão',
    description: 'Pastel salgado com carne seca e requeijão.',
    price: 12.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'pastel-salgado-brocolis-com-queijo-e-bacon',
    name: 'Brócolis com Queijo e Bacon',
    description: 'Pastel salgado de brócolis com queijo e bacon.',
    price: 11.0,
    categoryId: 'pasteis-salgados',
    category: 'Pastéis Salgados',
    imageUrl: 'https://placehold.co/600x400?text=Pastel%20Salgado',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },

  // Batata Recheada (no pote) (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'batata-recheada-frango-com-requeijao',
    name: 'Frango com Requeijão ou Cheddar',
    description: 'Batata recheada no pote com frango e opção de requeijão ou cheddar.',
    price: 18.0,
    categoryId: 'batata-recheada',
    category: 'Batata Recheada',
    imageUrl: 'https://placehold.co/600x400?text=Batata%20Recheada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'batata-recheada-calabresa-com-queijo',
    name: 'Calabresa com Queijo ou Requeijão',
    description: 'Batata recheada no pote com calabresa e opção de queijo ou requeijão.',
    price: 18.0,
    categoryId: 'batata-recheada',
    category: 'Batata Recheada',
    imageUrl: 'https://placehold.co/600x400?text=Batata%20Recheada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'batata-recheada-carne-seca-com-requeijao',
    name: 'Carne Seca com Requeijão',
    description: 'Batata recheada no pote com carne seca e requeijão.',
    price: 20.0,
    categoryId: 'batata-recheada',
    category: 'Batata Recheada',
    imageUrl: 'https://placehold.co/600x400?text=Batata%20Recheada',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },

  // Porções (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'porcao-batata-com-cheddar-e-bacon',
    name: 'Batata com Cheddar e Bacon',
    description: 'Porção de batata com cheddar e bacon.',
    price: 15.0,
    categoryId: 'porcoes',
    category: 'Porções',
    imageUrl: 'https://placehold.co/600x400?text=Porcoes',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },
  {
    id: 'porcao-calabresa-acebolada',
    name: 'Calabresa Acebolada',
    description: 'Porção de calabresa acebolada.',
    price: 12.0,
    categoryId: 'porcoes',
    category: 'Porções',
    imageUrl: 'https://placehold.co/600x400?text=Porcoes',
    available: true,
    addonIds: ALL_SAVORY_ADDONS,
  },

  // Bolos e Sobremesas (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'sobremesa-bolo-de-cenoura',
    name: 'Bolo de Cenoura com Cobertura',
    description: 'Bolo de cenoura com cobertura (sob encomenda).',
    price: 60.0,
    categoryId: 'bolos-e-sobremesas',
    category: 'Bolos e Sobremesas',
    imageUrl: 'https://placehold.co/600x400?text=Sobremesa',
    available: true,
  },
  {
    id: 'sobremesa-bolo-de-limao',
    name: 'Bolo de Limão',
    description: 'Bolo de limão (sob encomenda).',
    price: 60.0,
    categoryId: 'bolos-e-sobremesas',
    category: 'Bolos e Sobremesas',
    imageUrl: 'https://placehold.co/600x400?text=Sobremesa',
    available: true,
  },
  {
    id: 'sobremesa-pudim-grande',
    name: 'Pudim Grande',
    description: 'Pudim grande.',
    price: 45.0,
    categoryId: 'bolos-e-sobremesas',
    category: 'Bolos e Sobremesas',
    imageUrl: 'https://placehold.co/600x400?text=Pudim',
    available: true,
  },
  {
    id: 'sobremesa-pudim-pequeno',
    name: 'Pudim Pequeno',
    description: 'Pudim pequeno.',
    price: 35.0,
    categoryId: 'bolos-e-sobremesas',
    category: 'Bolos e Sobremesas',
    imageUrl: 'https://placehold.co/600x400?text=Pudim',
    available: true,
  },
  {
    id: 'sobremesa-fatia-de-pudim',
    name: 'Fatia do Pudim',
    description: 'Fatia do pudim (consultar disponibilidade).',
    price: 10.0,
    categoryId: 'bolos-e-sobremesas',
    category: 'Bolos e Sobremesas',
    imageUrl: 'https://placehold.co/600x400?text=Pudim',
    available: true,
  },
  {
    id: 'sobremesa-bolos-caseiros-de-vo',
    name: 'Bolos Caseiros de Vó (Fubá, Milho e Laranja)',
    description: 'Bolos caseiros de vó (sabores: fubá, milho e laranja).',
    price: 55.0,
    categoryId: 'bolos-e-sobremesas',
    category: 'Bolos e Sobremesas',
    imageUrl: 'https://placehold.co/600x400?text=Sobremesa',
    available: true,
  },

  // Bebidas (CARDÁPIO ATUALIZADO.pdf)
  {
    id: 'bebida-refrigerante-200ml',
    name: 'Refri de 200ml',
    description: 'Refri de 200ml (favor consultar sabores).',
    price: 3.0,
    categoryId: 'bebidas',
    category: 'Bebidas',
    imageUrl: 'https://placehold.co/600x400?text=Bebida',
    available: true,
  },
];

function assertUniqueIds() {
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.id)) throw new Error(`Duplicate item id: ${it.id}`);
    seen.add(it.id);
  }
  const seenCat = new Set<string>();
  for (const c of categories) {
    if (seenCat.has(c.id)) throw new Error(`Duplicate category id: ${c.id}`);
    seenCat.add(c.id);
  }
  const seenAddon = new Set<string>();
  for (const a of addons) {
    if (seenAddon.has(a.id)) throw new Error(`Duplicate addon id: ${a.id}`);
    seenAddon.add(a.id);
  }
}

async function ensureCatalogTables(client: PoolClient) {
  await client.query(`
    create table if not exists catalog_categories (
      id text primary key,
      name text not null unique,
      sort_order int not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists catalog_items (
      id text primary key,
      name text not null,
      description text not null,
      price_brl numeric(10,2) not null,
      price_cents int not null,
      category_id text not null references catalog_categories(id) on delete restrict,
      image_url text not null,
      available boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists catalog_items_category_idx on catalog_items (category_id);

    create table if not exists catalog_addons (
      id text primary key,
      name text not null unique,
      price_brl numeric(10,2) not null,
      price_cents int not null,
      available boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists catalog_item_addons (
      item_id text not null references catalog_items(id) on delete cascade,
      addon_id text not null references catalog_addons(id) on delete cascade,
      primary key (item_id, addon_id)
    );
  `);
}

async function clearCatalogTables(client: PoolClient) {
  // Clear existing catalog data (idempotent).
  await client.query(`
    truncate table
      catalog_item_addons,
      catalog_items,
      catalog_addons,
      catalog_categories
    restart identity;
  `);
}

export async function seedCatalog() {
  assertUniqueIds();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set. Cannot seed catalog.');
  }

  // Quick sanity check: make sure ids look slug-like.
  for (const it of items) {
    const expected = slugify(it.id);
    if (expected !== it.id) {
      throw new Error(
        `Item id must be slug-like: "${it.id}" (expected "${expected}")`,
      );
    }
  }

  const pool = new Pool({ connectionString, max: 1 });
  try {
    const client = await pool.connect();
    try {
      await client.query('begin');
      await ensureCatalogTables(client);
      await clearCatalogTables(client);

      for (const c of categories) {
        await client.query(
          `insert into catalog_categories (id, name, sort_order) values ($1, $2, $3)`,
          [c.id, c.name, c.sortOrder],
        );
      }

      for (const a of addons) {
        await client.query(
          `insert into catalog_addons (id, name, price_brl, price_cents, available)
           values ($1, $2, $3, $4, true)`,
          [a.id, a.name, brlNumeric(a.price), toCents(a.price)],
        );
      }

      for (const it of items) {
        await client.query(
          `insert into catalog_items
            (id, name, description, price_brl, price_cents, category_id, image_url, available)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            it.id,
            it.name,
            it.description,
            brlNumeric(it.price),
            toCents(it.price),
            it.categoryId,
            it.imageUrl,
            it.available,
          ],
        );

        const addonIds = it.addonIds ?? [];
        for (const addonId of addonIds) {
          await client.query(
            `insert into catalog_item_addons (item_id, addon_id) values ($1, $2)`,
            [it.id, addonId],
          );
        }
      }

      await client.query('commit');
    } catch (e) {
      try {
        await client.query('rollback');
      } catch {
        // ignore rollback failure
      }
      throw e;
    } finally {
      client.release();
    }

    // eslint-disable-next-line no-console
    console.log(
      `seeded catalog: ${categories.length} categories, ${items.length} items, ${addons.length} addons`,
    );
  } finally {
    await pool.end();
  }
}

const isEntrypoint =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isEntrypoint) {
  seedCatalog().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  });
}
