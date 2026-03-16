import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';
import { formatPrice } from '../utils/format';

type OrderStatus =
  | 'PLACED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED';

type ApiOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: { id: string; qty: number }[];
  createdAt: string;
  courierId?: string;
};

const statusFlow: OrderStatus[] = [
  'PLACED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'COMPLETED',
];

function statusLabel(s: OrderStatus) {
  switch (s) {
    case 'PLACED':
      return 'Pendente';
    case 'PREPARING':
      return 'Em preparo';
    case 'READY_FOR_PICKUP':
      return 'Pronto';
    case 'OUT_FOR_DELIVERY':
      return 'Em rota';
    case 'COMPLETED':
      return 'Entregue';
    case 'CANCELLED':
      return 'Cancelado';
  }
}

function statusPillClass(s: OrderStatus) {
  switch (s) {
    case 'PLACED':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20';
    case 'PREPARING':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20';
    case 'READY_FOR_PICKUP':
      return 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20';
    case 'OUT_FOR_DELIVERY':
      return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20';
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20';
    case 'CANCELLED':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20';
  }
}

function nextStatus(s: OrderStatus): OrderStatus {
  if (s === 'CANCELLED' || s === 'COMPLETED') return s;
  const idx = statusFlow.indexOf(s);
  if (idx < 0) return s;
  return statusFlow[Math.min(idx + 1, statusFlow.length - 1)] ?? s;
}

export function AdminOrdersPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();
  const { catalog } = useCatalog();

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const forbidden = user ? user.role !== 'admin' : true;
  const adminId = user?.role === 'admin' ? user.userId : null;

  const itemById = useMemo(() => {
    const m = new Map<string, { name: string; priceCents: number }>();
    for (const it of catalog) {
      m.set(it.id, { name: it.name, priceCents: it.priceCents });
    }
    return m;
  }, [catalog]);

  const refresh = useCallback(async () => {
    if (!adminId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/v1/admin/orders');
      const data = (await res.json()) as { ok: boolean; orders: ApiOrder[] };
      const list = Array.isArray(data.orders) ? data.orders : [];
      setOrders(list);
      setSelectedId((prev) => prev || list[0]?.id || '');
    } catch (e: unknown) {
      setError(userFriendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const okStatus = filter === 'all' || o.status === filter;
      const okQuery =
        q.length === 0 ||
        o.id.toLowerCase().includes(q) ||
        o.userId.toLowerCase().includes(q) ||
        (o.courierId ?? '').toLowerCase().includes(q);
      return okStatus && okQuery;
    });
  }, [orders, query, filter]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  function orderSubtotalCents(o: ApiOrder) {
    return o.lines.reduce((sum, l) => {
      const it = itemById.get(l.id);
      const price = it?.priceCents ?? 0;
      return sum + price * l.qty;
    }, 0);
  }

  async function setStatus(orderId: string, status: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/v1/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await refresh();
    } catch (e: unknown) {
      setError(userFriendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white p-2 rounded-lg flex items-center justify-center">
              <MaterialIcon name="restaurant_menu" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              SaborReal <span className="text-primary">Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
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
              className="p-2 rounded-full hover:bg-primary/10 text-slate-600 dark:text-slate-300 transition-colors"
              type="button"
              aria-label="Notificações"
              title="Notificações"
            >
              <MaterialIcon name="notifications" />
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-primary/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold">Admin</p>
                <p className="text-[10px] text-slate-500">
                  {user ? user.userId.slice(0, 8) : 'anônimo'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/50">
                <MaterialIcon name="person" className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              Painel de Pedidos
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Acompanhe pedidos do sistema (via API).
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              type="button"
              onClick={refresh}
              disabled={loading}
            >
              <MaterialIcon name="refresh" />
              Atualizar
            </button>
            <button
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              type="button"
              onClick={() => navigate('menu')}
            >
              <MaterialIcon name="arrow_back" />
              Voltar
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl p-3 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}

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
                  placeholder="Buscar por ID, cliente (userId) ou courierId..."
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  ['all', 'Todos'],
                  ['PLACED', 'Pendentes'],
                  ['PREPARING', 'Em preparo'],
                  ['READY_FOR_PICKUP', 'Prontos'],
                  ['OUT_FOR_DELIVERY', 'Em rota'],
                  ['COMPLETED', 'Entregues'],
                  ['CANCELLED', 'Cancelados'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="space-y-4">
            {loading ? (
              <div className="bg-white dark:bg-background-dark/40 rounded-xl p-6 border border-primary/5 text-slate-500 dark:text-slate-400">
                Carregando...
              </div>
            ) : null}

            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedId(o.id)}
                className={[
                  'w-full text-left bg-white dark:bg-background-dark/40 rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow',
                  selectedId === o.id
                    ? 'border-primary/30 ring-2 ring-primary/10'
                    : 'border-primary/5',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pedido #{o.id.slice(0, 8)} •{' '}
                      {new Date(o.createdAt).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-lg font-extrabold mt-1">
                      Cliente: {o.userId.slice(0, 8)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Itens: {o.lines.reduce((s, l) => s + l.qty, 0)}
                      {o.courierId
                        ? ` • Courier: ${o.courierId.slice(0, 8)}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={[
                        'px-3 py-1 rounded-full text-xs font-bold',
                        statusPillClass(o.status),
                      ].join(' ')}
                    >
                      {statusLabel(o.status)}
                    </span>
                    <span className="text-primary font-extrabold">
                      {formatPrice(orderSubtotalCents(o))}
                    </span>
                  </div>
                </div>
              </button>
            ))}

            {!loading && filtered.length === 0 ? (
              <div className="bg-white dark:bg-background-dark/40 rounded-xl p-6 border border-primary/5 text-center text-slate-500 dark:text-slate-400">
                Nenhum pedido encontrado.
              </div>
            ) : null}
          </section>

          <aside className="bg-white dark:bg-background-dark/40 rounded-xl border border-primary/5 shadow-sm overflow-hidden">
            {selected ? (
              <div>
                <div className="p-6 border-b border-primary/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pedido #{selected.id}
                      </p>
                      <p className="text-lg font-extrabold mt-1">
                        Cliente: {selected.userId}
                      </p>
                      <div className="mt-3">
                        <span
                          className={[
                            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold',
                            statusPillClass(selected.status),
                          ].join(' ')}
                        >
                          <MaterialIcon
                            name="receipt_long"
                            className="text-sm"
                          />
                          {statusLabel(selected.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total (estimado)
                      </p>
                      <p className="text-2xl font-extrabold text-primary">
                        {formatPrice(orderSubtotalCents(selected))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <section>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">
                      Itens do Pedido
                    </h4>
                    <div className="space-y-4">
                      {selected.lines.map((l) => {
                        const it = itemById.get(l.id);
                        const name = it?.name ?? l.id;
                        const price = it?.priceCents ?? 0;
                        return (
                          <div
                            className="flex items-center justify-between"
                            key={l.id}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-lg text-xs">
                                {l.qty}x
                              </span>
                              <div>
                                <p className="text-sm font-bold">{name}</p>
                                <p className="text-[10px] text-slate-500">
                                  id: {l.id}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-bold">
                              {price ? formatPrice(price) : '—'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="border-t border-primary/10 pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal (estimado)</span>
                        <span>{formatPrice(orderSubtotalCents(selected))}</span>
                      </div>
                      <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-slate-50 dark:border-slate-800">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatPrice(orderSubtotalCents(selected))}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-primary/10 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                  <button
                    className="flex-1 py-3 bg-rose-500/10 text-rose-600 rounded-xl font-bold hover:bg-rose-500/20 transition-colors disabled:opacity-60"
                    type="button"
                    onClick={() => setStatus(selected.id, 'CANCELLED')}
                    disabled={
                      busy ||
                      selected.status === 'COMPLETED' ||
                      selected.status === 'CANCELLED'
                    }
                  >
                    Cancelar
                  </button>
                  <button
                    className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                    type="button"
                    onClick={() =>
                      setStatus(selected.id, nextStatus(selected.status))
                    }
                    disabled={
                      busy ||
                      selected.status === 'COMPLETED' ||
                      selected.status === 'CANCELLED' ||
                      selected.status === 'READY_FOR_PICKUP' ||
                      selected.status === 'OUT_FOR_DELIVERY'
                    }
                  >
                    {busy
                      ? 'Atualizando...'
                      : selected.status === 'READY_FOR_PICKUP'
                        ? 'Aguardando motoboy'
                        : selected.status === 'OUT_FOR_DELIVERY'
                          ? 'Em entrega'
                          : 'Avançar Status'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-slate-500 dark:text-slate-400">
                Selecione um pedido.
              </div>
            )}
          </aside>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-primary/10 flex justify-around p-2 md:hidden z-50">
        <a
          className="flex flex-col items-center p-2 text-primary"
          href="#/admin"
        >
          <MaterialIcon name="receipt_long" />
          <span className="text-[10px] font-bold">Pedidos</span>
        </a>
        <a
          className="flex flex-col items-center p-2 text-slate-400"
          href="#/menu"
        >
          <MaterialIcon name="restaurant_menu" />
          <span className="text-[10px] font-bold">Cardápio</span>
        </a>
        <a
          className="flex flex-col items-center p-2 text-slate-400"
          href="#/courier"
        >
          <MaterialIcon name="two_wheeler" />
          <span className="text-[10px] font-bold">Motoboy</span>
        </a>
        <a
          className="flex flex-col items-center p-2 text-slate-400"
          href="#/login"
        >
          <MaterialIcon name="person" />
          <span className="text-[10px] font-bold">Conta</span>
        </a>
      </nav>

      {forbidden ? (
        <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <MaterialIcon name="lock" className="text-5xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
            Você não tem permissão para acessar esta área do painel
            administrativo.
          </p>
          <button
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
            type="button"
            onClick={() => navigate('login')}
          >
            Ir para Login
          </button>
        </div>
      ) : null}
    </div>
  );
}
