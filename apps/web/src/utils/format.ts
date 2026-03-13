const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatPrice(priceCents: number) {
  return currency.format(priceCents / 100);
}
