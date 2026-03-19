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
  motoboyId?: string;
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
    <div className="flex min-h-screen flex-col bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/80 px-4 py-4 backdrop-blur-md dark:bg-background-dark/80">
        <button
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-primary/10"
          type="button"
          onClick={() => navigate('menu')}
          aria-label="Voltar"
        >
          <MaterialIcon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="text-lg font-bold">Meus pedidos</h1>
        <button
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-primary/10"
          type="button"
          onClick={toggle}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          <MaterialIcon name="dark_mode" className="text-primary" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6">
        {!user ? (
          <div className="rounded-xl border border-primary/5 bg-white p-6 dark:bg-slate-800/50">
            <h2 className="text-xl font-extrabold">
              Entre para ver seus pedidos
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Voce precisa estar autenticado para acompanhar o status e cancelar
              pedidos.
            </p>
            <button
              className="mt-4 w-full rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90"
              type="button"
              onClick={() => navigate('login')}
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-500 dark:border-red-900/50 dark:bg-red-950/20">
                <MaterialIcon name="error" className="text-base" />
                <p>{error}</p>
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-xl border border-primary/5 bg-white p-6 animate-pulse dark:bg-slate-800/50">
                <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-4 h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ) : null}

            {!loading && orders.length === 0 ? (
              <div className="rounded-xl border border-primary/5 bg-white p-6 text-center dark:bg-slate-800/50">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <MaterialIcon
                    name="receipt_long"
                    className="text-3xl text-primary"
                  />
                </div>
                <h3 className="mt-4 text-lg font-extrabold">
                  Nenhum pedido ainda
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Volte ao cardapio e faca seu primeiro pedido.
                </p>
                <button
                  className="mt-4 rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110"
                  type="button"
                  onClick={() => navigate('menu')}
                >
                  Ver cardapio
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
                        className="rounded-xl border border-primary/5 bg-white p-4 dark:bg-slate-800/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Pedido #{o.id.slice(0, 8)}
                            </p>
                            <p className="mt-1 text-lg font-extrabold">
                              {statusLabel(o.status)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {new Date(o.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
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
                            className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                            onClick={() => navigate('menu')}
                          >
                            Pedir novamente
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded-lg bg-rose-500/10 py-2 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
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

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white pb-safe-area-inset-bottom dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
          <a
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500"
            href="#/menu"
          >
            <MaterialIcon name="home" />
            <span className="text-[10px] font-medium">Inicio</span>
          </a>
          <a
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500"
            href="#/menu"
          >
            <MaterialIcon name="restaurant_menu" />
            <span className="text-[10px] font-medium">Cardapio</span>
          </a>
          <a
            className="flex flex-col items-center gap-0.5 text-primary"
            href="#/orders"
          >
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
