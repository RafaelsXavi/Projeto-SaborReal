import { useCallback, useMemo, useState } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { Navigation } from '../components/Navigation';
import { Skeleton } from '../components/Skeleton';
import { useCart } from '../hooks/useCart';
import { useCatalog, type CatalogCategory, type CatalogItem } from '../hooks/useCatalog';
import { navigate } from '../router';
import { CategoryFilter } from './menu/CategoryFilter';
import { MenuHeader } from './menu/MenuHeader';
import { ProductCard } from './menu/ProductCard';

export function MenuPage() {
  const { catalog, categories, loading, error } = useCatalog();
  const { add, totalQty } = useCart();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCatalog = useMemo(() => {
    let list = catalog;
    if (selectedCategory !== 'all') {
      list = list.filter((it: CatalogItem) => it.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (it: CatalogItem) =>
          it.name.toLowerCase().includes(q) ||
          it.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [catalog, selectedCategory, searchQuery]);

  const handleAddToCart = useCallback(
    (item: CatalogItem) => {
      add(item);
    },
    [add],
  );

  const handleSelectCategory = useCallback((id: string) => {
    setSelectedCategory(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-32 font-sans text-slate-900 selection:bg-primary/30 dark:bg-background-dark dark:text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <MenuHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          cartCount={totalQty}
          onCartClick={() => navigate('cart')}
        />

        <CategoryFilter
          categories={categories}
          selectedId={selectedCategory}
          onSelect={handleSelectCategory}
        />

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-500 dark:border-red-900/20 dark:bg-red-900/10">
            <MaterialIcon name="error_outline" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="mb-6 flex items-center gap-2 text-xl font-black">
            Cardapio
            <span className="font-normal text-slate-300 dark:text-slate-700">
              /
            </span>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {selectedCategory === 'all'
                ? 'Ver tudo'
                : categories.find((c: CatalogCategory) => c.id === selectedCategory)?.name}
            </span>
          </h3>

          {loading && catalog.length === 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex gap-4">
                    <Skeleton className="size-24 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="40%" height={16} />
                      <Skeleton variant="text" width="30%" height={20} />
                    </div>
                  </div>
                  <Skeleton className="mt-4 h-10 w-full rounded-2xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCatalog.map((item: CatalogItem) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={handleAddToCart}
                />
              ))}
              {filteredCatalog.length === 0 && !loading && (
                <div className="rounded-3xl border border-slate-100 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800 md:col-span-2 sm:p-20 xl:col-span-3">
                  <MaterialIcon
                    name="search_off"
                    className="mb-2 text-5xl text-slate-200"
                  />
                  <p className="font-bold italic text-slate-500">
                    Nenhum prato encontrado...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Navigation />
    </div>
  );
}
