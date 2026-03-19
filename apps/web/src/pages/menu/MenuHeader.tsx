import { MaterialIcon } from '../../components/MaterialIcon';

interface MenuHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onCartClick: () => void;
}

export function MenuHeader({
  searchQuery,
  onSearchChange,
  cartCount,
  onCartClick,
}: MenuHeaderProps) {
  return (
    <div className="mb-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-400 text-white shadow-xl shadow-primary/20 rotate-3">
            <MaterialIcon name="restaurant" className="text-3xl" />
          </div>
          <div className="min-w-0">
            <h1 className="mt-1 text-2xl font-black leading-none tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              SABOR<span className="text-primary italic">REAL</span>
            </h1>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Gastronomia autentica
            </p>
          </div>
        </div>
        <button
          onClick={onCartClick}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600 shadow-lg shadow-slate-200/50 transition-all hover:scale-105 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:shadow-none"
          aria-label="Abrir carrinho"
        >
          <MaterialIcon name="shopping_cart" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] font-black text-white animate-bounce dark:border-slate-800">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="relative">
        <MaterialIcon
          name="search"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="O que voce quer comer hoje?"
          className="w-full rounded-2xl border border-slate-100 bg-white py-4 pl-12 pr-4 text-sm font-medium shadow-lg shadow-slate-200/50 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none"
        />
      </div>
    </div>
  );
}
