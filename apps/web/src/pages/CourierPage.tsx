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

type ApiOrder = {
  id: string;
  userId: string;
  status: OrderStatus;
  lines: { id: string; qty: number }[];
  createdAt: string;
  courierId?: string;
};

const covers = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDL9klbGoZv5GrfxK_OVWir27P4mhh2lhFJex3XmO02gRa2zdJ3UAJvrppPHOcJRufCFbXzpfawhwqZIXEulhy-Y8jzyIdVILXyDA8Ze9-bFRYG6UCAL3pLOnH6S4Dfa_mM2S4FAEC_2Pb3RdCBwCEpywBQTsJXSslb-xqt2DFztoGgj5xf4h3Jv4UH8eCtVC9iI2GG6_iHI1H_7twHDM3o2jiCzWP0UG_v2RuyTrThH_BF1seeO30yDV-uDA7oS_dYc_Wjo8uhVrrT',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTRFlbVWlUupcSNUHT7RiOMh_wLlQKybkt3-vCh45_xL90Wb1qxJ1R9gcA-rbK_nvRU7eYdjixgUexl2MN5JeSyQNKn8ODeV0vOGcwAPwz5yQJav8vA8eUUOBhfnBOU-1mI9TTLY84Mncpk4Rjgkd9iqYyrsrb7oIUXK0mFdrDMXqQqiAIR32w_nat43yYKKGqKfY1YZPNygxOqvG7xKh2x_MLx5wSwBGTLhfewFK_YBM2_FGIuqDIbtib5hA2c50NshM7e3faO1n',
];

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'PLACED':
      return 'Novo';
    case 'PREPARING':
      return 'Em preparo';
    case 'READY_FOR_PICKUP':
      return 'Pronto';
    case 'OUT_FOR_DELIVERY':
      return 'Em rota';
    case 'COMPLETED':
      return 'Concluído';
    case 'CANCELLED':
      return 'Cancelado';
  }
}

export function CourierPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();
  const { catalog } = useCatalog();
  const [tab, setTab] = useState<'available' | 'mine'>('available');

  const [available, setAvailable] = useState<ApiOrder[]>([]);
  const [mine, setMine] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const forbidden = user && user.role !== 'courier';

  const itemNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of catalog) m.set(it.id, it.name);
    return m;
  }, [catalog]);

  async function refresh() {
    if (!user || user.role !== 'courier') return;
    setLoading(true);
    setBanner(null);
    try {
      const [aRes, mRes] = await Promise.all([
        apiFetch('/v1/courier/orders/available'),
        apiFetch('/v1/courier/orders/mine'),
      ]);
      const a = (await aRes.json()) as { ok: boolean; orders: ApiOrder[] };
      const m = (await mRes.json()) as { ok: boolean; orders: ApiOrder[] };
      setAvailable(Array.isArray(a.orders) ? a.orders : []);
      setMine(Array.isArray(m.orders) ? m.orders : []);
    } catch (e: unknown) {
      setBanner(userFriendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, user?.role]);

  async function accept(orderId: string) {
    setBanner(null);
    try {
      await apiFetch(`/v1/courier/orders/${encodeURIComponent(orderId)}/accept`, {
        method: 'POST',
      });
      await refresh();
      setTab('mine');
    } catch (e: unknown) {
      setBanner(userFriendlyError(e));
    }
  }

  async function complete(orderId: string) {
    setBanner(null);
    try {
      await apiFetch(
        `/v1/courier/orders/${encodeURIComponent(orderId)}/complete`,
        { method: 'POST' },
      );
      await refresh();
    } catch (e: unknown) {
      setBanner(userFriendlyError(e));
    }
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-background-dark shadow-xl overflow-x-hidden">
        <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between border-b border-primary/10">
          <div className="flex items-center gap-2">
            <button
              className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
              type="button"
              onClick={() => navigate('menu')}
              aria-label="Menu"
            >
              <MaterialIcon name="menu" />
            </button>
            <button
              className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
              type="button"
              onClick={toggle}
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              <MaterialIcon name="dark_mode" />
            </button>
          </div>

          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 px-3">
            SaborReal Entregas
          </h2>

          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
            <span className="text-xs font-medium text-slate-500">Online</span>
          </div>
        </div>

        <div className="bg-white dark:bg-background-dark">
          <div className="flex border-b border-primary/10 px-4 gap-8">
            <button
              className={[
                'flex flex-col items-center justify-center pb-3 pt-4 border-b-[3px]',
                tab === 'available'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500',
              ].join(' ')}
              type="button"
              onClick={() => setTab('available')}
            >
              <p className="text-sm font-bold leading-normal">Disponíveis</p>
            </button>
            <button
              className={[
                'flex flex-col items-center justify-center pb-3 pt-4 border-b-[3px]',
                tab === 'mine'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500',
              ].join(' ')}
              type="button"
              onClick={() => setTab('mine')}
            >
              <p className="text-sm font-bold leading-normal">Meus Pedidos</p>
            </button>
          </div>
        </div>

        {banner ? (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-center gap-3">
            <MaterialIcon name="error" className="text-red-500" />
            <p className="text-sm font-medium text-red-700 dark:text-red-400 flex-1">
              {banner}
            </p>
            <button
              type="button"
              className="text-red-700 dark:text-red-400"
              onClick={() => setBanner(null)}
              aria-label="Fechar aviso"
              title="Fechar"
            >
              <MaterialIcon name="close" />
            </button>
          </div>
        ) : null}

        <div className="px-4 pt-6 pb-2">
          <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">
            {tab === 'available' ? 'Pedidos Disponíveis' : 'Meus Pedidos'}
          </h3>
          <p className="text-slate-500 text-sm">
            {tab === 'available'
              ? 'Toque em aceitar para iniciar a rota'
              : 'Acompanhe seus pedidos em andamento'}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 p-4 text-sm text-slate-500 dark:text-slate-400">
              Carregando pedidos...
            </div>
          ) : null}

          {tab === 'available'
            ? available.map((o, idx) => (
                <div
                  className="flex flex-col rounded-xl shadow-sm border border-primary/10 bg-white dark:bg-slate-900 overflow-hidden"
                  key={o.id}
                >
                  <div
                    className="w-full h-32 bg-center bg-no-repeat bg-cover"
                    style={{
                      backgroundImage: `url("${covers[idx % covers.length]}")`,
                    }}
                  />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">
                          Pedido #{o.id.slice(0, 8)}
                        </p>
                        <p className="text-primary text-sm font-semibold mt-1">
                          Status: {statusLabel(o.status)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MaterialIcon name="schedule" className="text-sm" />
                        <p className="text-sm">
                          Criado em:{' '}
                          {new Date(o.createdAt).toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MaterialIcon name="shopping_bag" className="text-sm" />
                        <p className="text-sm">
                          {o.lines.reduce((s, l) => s + l.qty, 0)} itens
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MaterialIcon name="near_me" className="text-sm" />
                        <p className="text-sm">Cliente: {o.userId.slice(0, 8)}</p>
                      </div>
                    </div>

                    <button
                      className="w-full mt-3 flex cursor-pointer items-center justify-center rounded-xl h-12 bg-primary text-white text-base font-bold transition-all active:scale-95 disabled:opacity-60"
                      type="button"
                      disabled={forbidden || !user}
                      onClick={() => accept(o.id)}
                    >
                      <span>Aceitar Pedido</span>
                    </button>
                  </div>
                </div>
              ))
            : (
                <div className="space-y-4">
                  {mine.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-primary/10 p-4 text-sm text-slate-500 dark:text-slate-400">
                      Você ainda não aceitou nenhum pedido.
                    </div>
                  ) : null}
                  {mine.map((o, idx) => (
                    <div
                      className="bg-primary/5 dark:bg-primary/10 border border-primary rounded-xl p-4"
                      key={o.id}
                    >
                      <div className="flex justify-between mb-4">
                        <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                          {statusLabel(o.status).toUpperCase()}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-bold">
                          #{o.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <MaterialIcon
                            name="restaurant"
                            className="text-primary"
                          />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">
                              Itens
                            </p>
                            <p className="text-sm font-semibold">
                              {o.lines
                                .slice(0, 2)
                                .map(
                                  (l) =>
                                    `${l.qty}x ${itemNameById.get(l.id) ?? l.id}`,
                                )
                                .join(' • ')}
                              {o.lines.length > 2 ? ' • ...' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <MaterialIcon
                            name="location_on"
                            className="text-primary"
                          />
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">
                              Cliente
                            </p>
                            <p className="text-sm font-semibold">
                              {o.userId.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-primary/10 flex gap-2">
                        <button
                          className="flex-1 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm"
                          type="button"
                          onClick={() =>
                            setBanner('Detalhes completos ainda não implementados.')
                          }
                        >
                          Detalhes
                        </button>
                        <button
                          className="flex-[2] h-10 rounded-lg bg-primary text-white font-bold text-sm disabled:opacity-60"
                          type="button"
                          disabled={o.status !== 'OUT_FOR_DELIVERY'}
                          onClick={() => complete(o.id)}
                        >
                          Finalizar Entrega
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>

        <div className="h-24" />

        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-t border-primary/10 px-4 pb-6 pt-2 flex gap-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <a
              className="flex flex-1 flex-col items-center justify-center gap-1 text-primary"
              href="#/courier"
            >
              <MaterialIcon name="home" fill />
              <p className="text-xs font-bold">Início</p>
            </a>
            <a
              className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
              href="#"
            >
              <MaterialIcon name="history" />
              <p className="text-xs font-medium">Histórico</p>
            </a>
            <a
              className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
              href="#"
            >
              <MaterialIcon name="account_balance_wallet" />
              <p className="text-xs font-medium">Ganhos</p>
            </a>
            <a
              className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500"
              href="#/login"
            >
              <MaterialIcon name="person" />
              <p className="text-xs font-medium">Perfil</p>
            </a>
          </div>
        </div>

        {forbidden ? (
          <div className="absolute inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-6">
              <MaterialIcon name="lock" className="text-5xl" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
              Você não tem permissão para acessar esta área. Entre como courier.
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
    </div>
  );
}
