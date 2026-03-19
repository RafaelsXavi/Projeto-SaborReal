import { MaterialIcon } from '../../components/MaterialIcon';
import type { OrderStatus } from '../../hooks/useAdminOrders';

type FilterType = 'all' | OrderStatus;

interface OrderFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

const statusOptions: [FilterType, string][] = [
  ['all', 'Todos'],
  ['PLACED', 'Pendentes'],
  ['PREPARING', 'Em preparo'],
  ['READY_FOR_PICKUP', 'Prontos'],
  ['OUT_FOR_DELIVERY', 'Em rota'],
  ['COMPLETED', 'Entregues'],
  ['CANCELLED', 'Cancelados'],
];

export function OrderFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: OrderFiltersProps) {
  return (
    <div className="bg-white dark:bg-background-dark/40 rounded-xl p-4 mb-6 border border-primary/5 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[280px]">
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Buscar por ID, cliente (userId) ou motoboyId..."
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {statusOptions.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onFilterChange(key)}
              className={
                filter === key
                  ? 'whitespace-nowrap px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold'
                  : 'whitespace-nowrap px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
