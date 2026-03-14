import { useEffect, useMemo, useState } from 'react';
import { apiFetch, userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';

type OrderStatus =
  | 'PLACED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

type Order = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: { id: string; qty: number }[];
  createdAt: string;
  courierId?: string;
};

function statusLabel(s: OrderStatus) {
  switch (s) {
    case 'PLACED':
      return 'Pedido realizado';
    case 'PREPARING':
      return 'Em preparo';
    case 'READY_FOR_PICKUP':
      return 'Pronto para retirada';
    case 'OUT_FOR_DELIVERY':
      return 'Saiu para entrega';
    case 'COMPLETED':
      return 'Entregue';
    case 'CANCELLED':
      return 'Cancelado';
  }
}

export function OrdersPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();
  const { catalog } = useCatalog();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const byItemId = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of catalog) m.set(it.id, it.name);
    return m;
  }, [catalog]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    apiFetch('/v1/me/orders')
      .then((res) => res.json() as Promise<{ ok: boolean; orders: Order[] }>)
      .then((data) => setOrders(Array.isArray(data.orders) ? data.orders : []))
      .catch((e: unknown) => setError(userFriendlyError(e)))
      .finally(() => setLoading(false));
  }, [user]);

  async function cancelOrder(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/v1/me/orders/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
      });
      const res = await apiFetch('/v1/me/orders');
      const data = (await res.json()) as { ok: boolean; orders: Order[] };
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (e: unknown) {
      setError(userFriendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-4 flex items-center justify-between">
        <button
          className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-colors"
          type="button"
          onClick={() => navigate('menu')}
          aria-label="Voltar"
        >
          <MaterialIcon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="text-lg font-bold">Meus Pedidos</h1>
        <button
          className="flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-colors"
          type="button"
          onClick={toggle}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          <MaterialIcon name="dark_mode" className="text-primary" />
        </button>
      </header>

      <main className="max-w-3xl w-full mx-auto px-4 py-6 pb-28">
        {!user ? (
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/5">
            <h2 className="text-xl font-extrabold">Entre para ver seus pedidos</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Você precisa estar autenticado para acompanhar o status e cancelar pedidos.
            </p>
            <button
              className="mt-4 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors"
              type="button"
              onClick={() => navigate('login')}
            >
              Ir para Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                <MaterialIcon name="error" className="text-base" />
                <p>{error}</p>
              </div>
            ) : null}

            {loading ? (
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/5 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="mt-4 h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="mt-2 h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ) : null}

            {!loading && orders.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl border border-primary/5 text-center">
                <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MaterialIcon name="receipt_long" className="text-3xl text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-extrabold">Nenhum pedido ainda</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Volte ao cardápio e faça seu primeiro pedido.
                </p>
                <button
                  className="mt-4 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                  type="button"
                  onClick={() => navigate('menu')}
                >
                  Ver cardápio
                </button>
              </div>
            ) : null}

            {!loading
              ? orders
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((o) => {
                    const cancellable =
                      o.status !== 'COMPLETED' && o.status !== 'CANCELLED';
                    return (
                      <div
                        key={o.id}
                        className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-primary/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Pedido #{o.id.slice(0, 8)}
                            </p>
                            <p className="text-lg font-extrabold mt-1">
                              {statusLabel(o.status)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(o.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {o.status}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {o.lines.map((l) => (
                            <div
                              className="flex items-center justify-between text-sm"
                              key={`${o.id}:${l.id}`}
                            >
                              <span className="text-slate-700 dark:text-slate-200">
                                {l.qty}x {byItemId.get(l.id) ?? l.id}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            onClick={() => navigate('menu')}
                          >
                            Pedir novamente
                          </button>
                          <button
                            type="button"
                            className="flex-1 py-2 rounded-lg bg-rose-500/10 text-rose-600 text-sm font-bold hover:bg-rose-500/20 transition-colors disabled:opacity-60"
                            disabled={!cancellable || busyId === o.id}
                            onClick={() => cancelOrder(o.id)}
                          >
                            {busyId === o.id ? 'Cancelando...' : 'Cancelar'}
                          </button>
                        </div>
                      </div>
                    );
                  })
              : null}
          </div>
        )}
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
          <a className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500" href="#/menu">
            <MaterialIcon name="restaurant_menu" />
            <span className="text-[10px] font-medium">Cardápio</span>
          </a>
          <a className="flex flex-col items-center gap-0.5 text-primary" href="#/orders">
            <MaterialIcon name="receipt_long" fill />
            <span className="text-[10px] font-bold">Pedidos</span>
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

