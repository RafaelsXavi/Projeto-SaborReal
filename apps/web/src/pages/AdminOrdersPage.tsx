import { useMemo, useState } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';
import { formatPrice } from '../utils/format';

type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'on_route'
  | 'delivered'
  | 'canceled';

type OrderItem = {
  qty: number;
  name: string;
  note?: string;
  priceCents: number;
};

type AdminOrder = {
  id: string;
  createdAtLabel: string;
  status: OrderStatus;
  customerName: string;
  addressLine1: string;
  addressLine2: string;
  courierName?: string;
  items: OrderItem[];
  deliveryFeeCents: number;
};

function statusLabel(s: OrderStatus) {
  switch (s) {
    case 'pending':
      return 'Pendente';
    case 'preparing':
      return 'Em preparo';
    case 'on_route':
      return 'Em rota';
    case 'delivered':
      return 'Entregue';
    case 'canceled':
      return 'Cancelado';
  }
}

function statusPillClass(s: OrderStatus) {
  switch (s) {
    case 'pending':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20';
    case 'preparing':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20';
    case 'on_route':
      return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20';
    case 'delivered':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20';
    case 'canceled':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20';
  }
}

function nextStatus(s: OrderStatus): OrderStatus {
  switch (s) {
    case 'pending':
      return 'preparing';
    case 'preparing':
      return 'on_route';
    case 'on_route':
      return 'delivered';
    case 'delivered':
    case 'canceled':
      return s;
  }
}

const seedOrders: AdminOrder[] = [
  {
    id: '8842',
    createdAtLabel: 'Hoje • 12:32',
    status: 'pending',
    customerName: 'Ricardo Mendes',
    addressLine1: 'Rua das Olimpíadas, 205, Apto 12B',
    addressLine2: 'Itaim Bibi, São Paulo - SP',
    courierName: 'João (Motoboy)',
    deliveryFeeCents: 0,
    items: [
      {
        qty: 1,
        name: 'Hambúrguer Gourmet Especial',
        note: 'Sem cebola, ponto bem passado',
        priceCents: 4890,
      },
      { qty: 1, name: 'Batata Rústica Grande', note: 'Com alecrim', priceCents: 2400 },
      { qty: 1, name: 'Suco de Laranja Natural', note: '500ml, sem açúcar', priceCents: 1200 },
    ],
  },
  {
    id: '8845',
    createdAtLabel: 'Hoje • 12:51',
    status: 'on_route',
    customerName: 'Ana Clara',
    addressLine1: 'Av. Paulista, 999',
    addressLine2: 'Bela Vista, São Paulo - SP',
    courierName: 'Marcos (Moto)',
    deliveryFeeCents: 700,
    items: [
      { qty: 2, name: 'X-Salada', priceCents: 2890 },
      { qty: 1, name: 'Refrigerante Lata', priceCents: 790 },
    ],
  },
  {
    id: '8839',
    createdAtLabel: 'Hoje • 11:40',
    status: 'delivered',
    customerName: 'Bruno Souza',
    addressLine1: 'Rua das Flores, 123',
    addressLine2: 'Centro, São Paulo - SP',
    deliveryFeeCents: 700,
    items: [{ qty: 1, name: 'Feijoada', priceCents: 5200 }],
  },
];

export function AdminOrdersPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();

  const [orders, setOrders] = useState<AdminOrder[]>(seedOrders);
  const [selectedId, setSelectedId] = useState<string>(seedOrders[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<
    'all' | OrderStatus
  >('all');

  const forbidden = user ? user.role !== 'admin' : true;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const okStatus = filter === 'all' || o.status === filter;
      const okQuery =
        q.length === 0 ||
        o.id.includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.courierName ?? '').toLowerCase().includes(q);
      return okStatus && okQuery;
    });
  }, [orders, query, filter]);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId],
  );

  function orderSubtotalCents(o: AdminOrder) {
    return o.items.reduce((sum, it) => sum + it.priceCents * it.qty, 0);
  }

  function orderTotalCents(o: AdminOrder) {
    return orderSubtotalCents(o) + o.deliveryFeeCents;
  }

  function cancelSelected() {
    if (!selected) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selected.id ? { ...o, status: 'canceled' } : o)),
    );
  }

  function advanceSelected() {
    if (!selected) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selected.id ? { ...o, status: nextStatus(o.status) } : o,
      ),
    );
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
                <p className="text-xs font-bold">Admin Sabor</p>
                <p className="text-[10px] text-slate-500">Gerente de Operações</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/50">
                <img
                  alt="Admin"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuClBvVqSid4CZ5x8xBujID_hlDs5qOpLQTq_cvRTq7XVVRccxqhJmkpbKb7zQvtebWASx75K2Z5DOzlfMV0DnGc1zbGFk1CCTpDsZzvraxjPDCl7ZyKPml5wSOifoRLlhpPOFhk-KUXcUkvvh7pcS2J7DYdrAVxH583Ld7k3Fp-ASIvsenA-smRl3DiSL1T3Lgrxp2Ha-7fZFtCQcq2RFDAGocvupppUmEfpfJMLMwy4j08HAiFB0Hxwqkw5mwPmha5Rhz0g_vFxwJB"
                  loading="lazy"
                />
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
              Gerencie e acompanhe todos os pedidos em tempo real.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              type="button"
              onClick={() => navigate('menu')}
            >
              <MaterialIcon name="arrow_back" />
              Voltar ao site
            </button>
          </div>
        </div>

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
                  placeholder="Buscar por ID, cliente ou entregador..."
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
                  ['pending', 'Pendentes'],
                  ['preparing', 'Em preparo'],
                  ['on_route', 'Em rota'],
                  ['delivered', 'Entregues'],
                  ['canceled', 'Cancelados'],
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
                      Pedido #{o.id} • {o.createdAtLabel}
                    </p>
                    <p className="text-lg font-extrabold mt-1">{o.customerName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {o.addressLine2}
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
                      {formatPrice(orderTotalCents(o))}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {o.courierName ? `Entregador: ${o.courierName}` : 'Sem entregador'}
                </div>
              </button>
            ))}

            {filtered.length === 0 ? (
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
                      <p className="text-2xl font-extrabold mt-1">
                        {selected.customerName}
                      </p>
                      <div className="mt-3">
                        <span
                          className={[
                            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold',
                            statusPillClass(selected.status),
                          ].join(' ')}
                        >
                          <MaterialIcon name="receipt_long" className="text-sm" />
                          {statusLabel(selected.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total
                      </p>
                      <p className="text-2xl font-extrabold text-primary">
                        {formatPrice(orderTotalCents(selected))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <section>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">
                      Informações do Cliente
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="font-bold">{selected.customerName}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {selected.addressLine1}
                      </p>
                      <p className="text-sm text-slate-500">{selected.addressLine2}</p>
                      <div className="mt-3 flex gap-2">
                        <button
                          className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                          type="button"
                        >
                          <MaterialIcon name="call" className="text-sm" /> Ligar
                        </button>
                        <button
                          className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                          type="button"
                        >
                          <MaterialIcon name="chat" className="text-sm" /> Chat
                        </button>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">
                      Itens do Pedido
                    </h4>
                    <div className="space-y-4">
                      {selected.items.map((it, idx) => (
                        <div className="flex items-center justify-between" key={idx}>
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-lg text-xs">
                              {it.qty}x
                            </span>
                            <div>
                              <p className="text-sm font-bold">{it.name}</p>
                              {it.note ? (
                                <p className="text-[10px] text-slate-500">{it.note}</p>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-sm font-bold">
                            {formatPrice(it.priceCents)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="border-t border-primary/10 pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>{formatPrice(orderSubtotalCents(selected))}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>Taxa de Entrega</span>
                        <span className="text-emerald-500 font-bold uppercase text-xs">
                          {selected.deliveryFeeCents === 0
                            ? 'Grátis'
                            : formatPrice(selected.deliveryFeeCents)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-slate-50 dark:border-slate-800">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatPrice(orderTotalCents(selected))}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-primary/10 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                  <button
                    className="flex-1 py-3 bg-rose-500/10 text-rose-600 rounded-xl font-bold hover:bg-rose-500/20 transition-colors disabled:opacity-60"
                    type="button"
                    onClick={cancelSelected}
                    disabled={selected.status === 'delivered' || selected.status === 'canceled'}
                  >
                    Cancelar
                  </button>
                  <button
                    className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                    type="button"
                    onClick={advanceSelected}
                    disabled={selected.status === 'delivered' || selected.status === 'canceled'}
                  >
                    Avançar Status
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
        <a className="flex flex-col items-center p-2 text-primary" href="#/admin">
          <MaterialIcon name="receipt_long" />
          <span className="text-[10px] font-bold">Pedidos</span>
        </a>
        <a className="flex flex-col items-center p-2 text-slate-400" href="#">
          <MaterialIcon name="inventory_2" />
          <span className="text-[10px] font-bold">Estoque</span>
        </a>
        <a className="flex flex-col items-center p-2 text-slate-400" href="#">
          <MaterialIcon name="monitoring" />
          <span className="text-[10px] font-bold">Relatórios</span>
        </a>
        <a className="flex flex-col items-center p-2 text-slate-400" href="#">
          <MaterialIcon name="settings" />
          <span className="text-[10px] font-bold">Ajustes</span>
        </a>
      </nav>

      {forbidden ? (
        <div className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
            <MaterialIcon name="lock" className="text-5xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
            Você não tem permissão para acessar esta área do painel administrativo.
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

