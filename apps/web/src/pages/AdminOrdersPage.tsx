import { useCallback, useMemo, useState } from 'react';
import {
  type ApiOrder,
  type OrderStatus,
  useAdminOrders,
} from '../hooks/useAdminOrders';
import { useCatalog } from '../hooks/useCatalog';
import { MotoboysManager } from './admin/MotoboysManager';
import { AdminHeader } from './admin-orders/AdminHeader';
import { OrderDetail } from './admin-orders/OrderDetail';
import { OrderFilters } from './admin-orders/OrderFilters';
import { OrderList } from './admin-orders/OrderList';

type FilterType = 'all' | OrderStatus;
type AdminTab = 'orders' | 'motoboys';

export function AdminOrdersPage() {
  const { catalog, loading: loadingCatalog } = useCatalog();
  const {
    orders,
    loading: loadingOrders,
    updateStatus,
    isUpdating,
  } = useAdminOrders();

  const [filter, setFilter] = useState<FilterType>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  const itemById = useMemo(() => {
    const m = new Map<string, { name: string; priceCents: number }>();
    for (const it of catalog) {
      m.set(it.id, { name: it.name, priceCents: it.priceCents });
    }
    return m;
  }, [catalog]);

  const calculateSubtotal = useMemo(
    () => (o: ApiOrder) => {
      return o.lines.reduce((acc, line) => {
        const it = itemById.get(line.id);
        return acc + (it?.priceCents ?? 0) * line.qty;
      }, 0);
    },
    [itemById],
  );

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (filter !== 'all') {
      list = list.filter((o: ApiOrder) => o.status === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (o: ApiOrder) =>
          o.id.toLowerCase().includes(q) ||
          o.userId.toLowerCase().includes(q) ||
          Boolean(o.motoboyId?.toLowerCase().includes(q)),
      );
    }
    return list
      .slice()
      .sort(
        (a: ApiOrder, b: ApiOrder) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, filter, query]);

  const selectedOrder = useMemo(
    () => orders.find((o: ApiOrder) => o.id === selectedId) || null,
    [orders, selectedId],
  );

  const handleUpdateStatus = useCallback(
    async (id: string, s: OrderStatus) => {
      try {
        await updateStatus({ orderId: id, status: s });
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    },
    [updateStatus],
  );

  const handleSetFilter = useCallback((f: FilterType) => setFilter(f), []);
  const handleSetQuery = useCallback((q: string) => setQuery(q), []);
  const handleSetSelectedId = useCallback(
    (id: string) => setSelectedId(id),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/30">
      <AdminHeader />

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tab Navigation */}
        <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Pedidos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('motoboys')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'motoboys'
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Motoboys
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            <OrderFilters
              query={query}
              onQueryChange={handleSetQuery}
              filter={filter}
              onFilterChange={handleSetFilter}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full" />
                  Fluxo de Pedidos
                  <span className="ml-2 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md text-xs font-bold text-slate-500">
                    {filteredOrders.length}
                  </span>
                </h3>
                <OrderList
                  orders={filteredOrders}
                  selectedId={selectedId}
                  onSelect={handleSetSelectedId}
                  loading={loadingOrders || loadingCatalog}
                  calculateSubtotal={calculateSubtotal}
                />
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary rounded-full" />
                    Detalhes
                  </h3>
                  <OrderDetail
                    order={selectedOrder}
                    itemById={itemById}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={isUpdating}
                    calculateSubtotal={calculateSubtotal}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <MotoboysManager />
        )}
      </main>
    </div>
  );
}
