import { useMemo, useState } from 'react';
import { formatPrice } from '../utils/format';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useCatalog, type CatalogItem } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';

type Category =
  | 'Todos'
  | 'Entradas'
  | 'Pratos Principais'
  | 'Bebidas'
  | 'Sobremesas';

type CatalogUi = {
  id: string;
  name: string;
  priceCents: number;
  category: Exclude<Category, 'Todos'>;
  description: string;
  imageUrl: string;
};

const uiById: Record<string, Omit<CatalogUi, 'id' | 'name' | 'priceCents'>> = {
  'x-burger': {
    category: 'Pratos Principais',
    description: 'Hambúrguer artesanal suculento com queijo e molho da casa.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGLple5QS5wh2yOVI7MqEgp0UW1F0UklJgHABG0_cpvYzBbUk-WCPSPdoYbv3nRyQjMjGY58rVcZRzFoIXjfUh4rO905WBPoZb0PaimT7ewyQzGWnlrJx5o_HpPa0mXvBsnDyNsQqFh01Fel3f8tR1mnGDddEHbBoGKSp_OJ0l4Kmp4WBpFvDsRj1e_ZjcL_Z11qoKQfpLfekG17jjT6AkyBKgB_UvbVdCEXHh7hSRGWBpYYV0BzapWUpCXtRydy8jpgKijxl_0i4-',
  },
  'x-salada': {
    category: 'Pratos Principais',
    description: 'Clássico com alface, tomate, queijo e pão macio.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuABT91n0Tj6DkruXB1cK8oLJ0ir26bo22AFC7Re4qNMApGo973490e6d7O6q5puUZn5tC8ziWJ5cBSG1kouhDDUOdO88-yLOUpGrW4zR22IMNZIWWsh1x3JnT2Ruf4oUzi7tN8184ANxrybwNamv3J7-rNixJrxA7ZY1VbcZd6Ku8OyhouX_RyrMkkTMAQXsbDMDfF7gjLmip1ll-i0RizBQHFhFGOL41TtBDuf5-f7uTloflq1L_139vs7IkyK0G1sUvlNK43nWAz9',
  },
  batata: {
    category: 'Entradas',
    description: 'Batata frita crocante, ideal para compartilhar.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBYLpbSVi1_5hkLGhZMhUY3sN13d25xC5yEQxnHc-6qDxXLPh_gUuq2uqgwNMGCqXrQVZFLNNeDvQ3WS9XBr1c93-aExbkK58a4l7_VIGB5udhtXvdL5fA48lJWAjqkoz92oQVKfCn16HxSDKescSiIf1gM66bmT5UZgkHkf34B_NN6_JHh_z5Ve-yFFwxu9ppsdYmxSn19iehix-Lp3RQ6fU1asAxPPEWkdu3sCoJ-jNUBh1zRoJTQ166enDLHyn0TmKYo5v5UvrXP',
  },
  refri: {
    category: 'Bebidas',
    description: 'Refrigerante bem gelado para acompanhar seu pedido.',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBH3KJm860iAJvis_AazNqq_0832GQuRnvqm0UkbiRvcHiIPMRhGwC3_JUJKWfsdRIinH7NRNU2htCkTreL2HnvTQxcUMUoiEE-YfLY0ZI7aoWVxlrIUVipCMi92QaIfPJfi8ZvxcHiAeofXpxoBVlGxVX7jgB5HdpyiXdBO6PvXIMi4PJlRaZ-SprmgNMG8vz',
  },
};

function toUiItem(item: CatalogItem): CatalogUi {
  const ui = uiById[item.id];
  return {
    id: item.id,
    name: item.name,
    priceCents: item.priceCents,
    category: ui?.category ?? 'Pratos Principais',
    description:
      ui?.description ?? 'Uma opção deliciosa do nosso cardápio.',
    imageUrl:
      ui?.imageUrl ??
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCBxZwwzo1rONN9zdR2u-w7kAkmYQlshLSog1teBvvKcuci3mU4HWEuoOvnRZiMDDgCHLiX9R4QGpqs7oDm07GEsAnvuSYmL2rW4PmV-Lu2lAXoQttHvX5fo8cadNIQIREGZG4MszYPvQh4H73b_nxAW6PzUpqD3cvz7GLTAy4REWHSHhKsudoEniArXVrvfSrDqUN-xbcI7GkK4H-UA8ThDS0-DVwKFu2OFRB3lcF7391yjsDMYK6Z40NzEj7n9K_OWoLHz7wx1gMP',
  };
}

export function MenuPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();
  const { catalog, loading } = useCatalog();
  const { add, totalQty } = useCart();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Todos');

  const uiItems = useMemo(() => catalog.map(toUiItem), [catalog]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return uiItems.filter((it) => {
      const okCategory = category === 'Todos' || it.category === category;
      const okQuery =
        q.length === 0 ||
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q);
      return okCategory && okQuery;
    });
  }, [uiItems, query, category]);

  const userLabel = user ? user.role : 'Anônimo';

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary rounded-lg flex items-center justify-center text-white">
              <MaterialIcon name="restaurant" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">
              SaborReal
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="relative p-2 rounded-full hover:bg-primary/10 text-slate-600 dark:text-slate-300 transition-colors"
              type="button"
              onClick={() => navigate('cart')}
              aria-label="Abrir carrinho"
              title="Carrinho"
            >
              <MaterialIcon name="shopping_cart" fill />
              {totalQty > 0 ? (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-2 border-background-light dark:border-background-dark">
                  {totalQty}
                </span>
              ) : null}
            </button>

            <button
              className="p-2 rounded-full hover:bg-primary/10 text-slate-600 dark:text-slate-300 transition-colors"
              type="button"
              onClick={toggle}
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              <MaterialIcon name="dark_mode" />
            </button>

            <button
              className="flex items-center gap-2 bg-primary/5 dark:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/10"
              type="button"
              onClick={() => navigate(user ? 'login' : 'login')}
              title="Sessão"
            >
              <MaterialIcon name="person" className="text-sm text-primary" />
              <span className="text-sm font-semibold text-primary">
                {userLabel}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pb-24">
        <div className="px-4 py-6 space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <MaterialIcon
                name="search"
                className="text-slate-400 group-focus-within:text-primary transition-colors"
              />
            </div>
            <input
              className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-800 border-none rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-primary transition-all text-base placeholder:text-slate-400"
              placeholder="Buscar pratos ou bebidas..."
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <nav className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
            {(
              [
                'Todos',
                'Entradas',
                'Pratos Principais',
                'Bebidas',
                'Sobremesas',
              ] as Category[]
            ).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={
                  c === category
                    ? 'whitespace-nowrap px-6 py-2 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20'
                    : 'whitespace-nowrap px-6 py-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors'
                }
              >
                {c}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
                  key={idx}
                  className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse"
                >
                  <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full mt-2" />
                  </div>
                </div>
              ))
            : filtered.map((it) => (
                <div
                  key={it.id}
                  className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="relative aspect-square">
                    <img
                      alt={it.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={it.imageUrl}
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-primary font-bold text-sm">
                      {formatPrice(it.priceCents)}
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">
                        {it.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {it.description}
                      </p>
                    </div>
                    <button
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      type="button"
                      onClick={() => add({ id: it.id, name: it.name, priceCents: it.priceCents })}
                    >
                      <MaterialIcon name="add_shopping_cart" className="text-lg" />
                      Adicionar
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MaterialIcon name="search_off" className="text-4xl text-primary" />
            </div>
            <h3 className="text-xl font-bold">Nenhum resultado encontrado</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Tente buscar por termos diferentes ou explore as categorias.
            </p>
            <button
              className="mt-6 text-primary font-bold border-b-2 border-primary"
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('Todos');
              }}
            >
              Limpar filtros
            </button>
          </div>
        ) : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
          <a
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500"
            href="#/menu"
          >
            <MaterialIcon name="home" />
            <span className="text-[10px] font-medium">Início</span>
          </a>
          <a className="flex flex-col items-center gap-0.5 text-primary" href="#/menu">
            <MaterialIcon name="restaurant_menu" fill />
            <span className="text-[10px] font-bold">Cardápio</span>
          </a>
          <a
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500"
            href="#/cart"
          >
            <MaterialIcon name="shopping_cart" />
            <span className="text-[10px] font-medium">Carrinho</span>
          </a>
          <a
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500"
            href="#/login"
          >
            <MaterialIcon name="person" />
            <span className="text-[10px] font-medium">Perfil</span>
          </a>
        </div>
      </nav>
    </div>
  );
}

