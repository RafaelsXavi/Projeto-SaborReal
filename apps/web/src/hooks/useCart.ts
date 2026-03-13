import { useEffect, useMemo, useState } from 'react';
import type { CatalogItem } from './useCatalog';

export type CartLine = {
  item: CatalogItem;
  qty: number;
};

const STORAGE_KEY = 'sr_cart_v1';

function safeParseCart(value: string | null): Record<string, CartLine> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, CartLine>;
  } catch {
    return {};
  }
}

export function useCart() {
  const [cart, setCart] = useState<Record<string, CartLine>>(() => {
    if (typeof window === 'undefined') return {};
    return safeParseCart(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore quota/privacy errors
    }
  }, [cart]);

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const totalQty = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.qty, 0),
    [cartLines],
  );
  const totalCents = useMemo(
    () => cartLines.reduce((sum, l) => sum + l.item.priceCents * l.qty, 0),
    [cartLines],
  );

  function add(item: CatalogItem) {
    setCart((prev) => {
      const existing = prev[item.id];
      const nextQty = (existing?.qty ?? 0) + 1;
      return { ...prev, [item.id]: { item, qty: nextQty } };
    });
  }

  function dec(itemId: string) {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const nextQty = existing.qty - 1;
      if (nextQty <= 0) {
        const { [itemId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { item: existing.item, qty: nextQty } };
    });
  }

  function remove(itemId: string) {
    setCart((prev) => {
      if (!prev[itemId]) return prev;
      const { [itemId]: _removed, ...rest } = prev;
      return rest;
    });
  }

  function clear() {
    setCart({});
  }

  return { cartLines, totalCents, totalQty, add, dec, remove, clear };
}
