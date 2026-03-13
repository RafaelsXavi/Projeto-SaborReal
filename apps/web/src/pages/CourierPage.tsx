import { useState } from 'react';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';

type CourierOrder = {
  id: string;
  earnings: string;
  urgent?: boolean;
  eta: string;
  itemsSummary: string;
  distance: string;
  coverUrl: string;
};

const availableSeed: CourierOrder[] = [
  {
    id: '8842',
    earnings: 'R$ 12,50',
    urgent: true,
    eta: '15-20 min',
    itemsSummary: '2 Itens • R$ 45,90',
    distance: '2.4km',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDL9klbGoZv5GrfxK_OVWir27P4mhh2lhFJex3XmO02gRa2zdJ3UAJvrppPHOcJRufCFbXzpfawhwqZIXEulhy-Y8jzyIdVILXyDA8Ze9-bFRYG6UCAL3pLOnH6S4Dfa_mM2S4FAEC_2Pb3RdCBwCEpywBQTsJXSslb-xqt2DFztoGgj5xf4h3Jv4UH8eCtVC9iI2GG6_iHI1H_7twHDM3o2jiCzWP0UG_v2RuyTrThH_BF1seeO30yDV-uDA7oS_dYc_Wjo8uhVrrT',
  },
  {
    id: '8845',
    earnings: 'R$ 8,20',
    eta: '25-30 min',
    itemsSummary: '1 Item • R$ 22,00',
    distance: '4.1km',
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTRFlbVWlUupcSNUHT7RiOMh_wLlQKybkt3-vCh45_xL90Wb1qxJ1R9gcA-rbK_nvRU7eYdjixgUexl2MN5JeSyQNKn8ODeV0vOGcwAPwz5yQJav8vA8eUUOBhfnBOU-1mI9TTLY84Mncpk4Rjgkd9iqYyrsrb7oIUXK0mFdrDMXqQqiAIR32w_nat43yYKKGqKfY1YZPNygxOqvG7xKh2x_MLx5wSwBGTLhfewFK_YBM2_FGIuqDIbtib5hA2c50NshM7e3faO1n',
  },
];

export function CourierPage() {
  const { user } = useAuth();
  const { toggle } = useTheme();
  const [tab, setTab] = useState<'available' | 'mine'>('available');

  // UI-only: uma notificação de exemplo (conflito)
  const [banner, setBanner] = useState<string | null>(
    'Pedido #8841: Já atribuído a outro entregador.',
  );

  const forbidden = user && user.role !== 'courier';

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
          {tab === 'available'
            ? availableSeed.map((o) => (
                <div
                  className="flex flex-col rounded-xl shadow-sm border border-primary/10 bg-white dark:bg-slate-900 overflow-hidden"
                  key={o.id}
                >
                  <div
                    className="w-full h-32 bg-center bg-no-repeat bg-cover"
                    style={{ backgroundImage: `url("${o.coverUrl}")` }}
                  />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">
                          Pedido #{o.id}
                        </p>
                        <p className="text-primary text-sm font-semibold mt-1">
                          Ganhos: {o.earnings}
                        </p>
                      </div>
                      {o.urgent ? (
                        <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold uppercase">
                          Urgente
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MaterialIcon name="schedule" className="text-sm" />
                        <p className="text-sm">Tempo estimado: {o.eta}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MaterialIcon name="shopping_bag" className="text-sm" />
                        <p className="text-sm">{o.itemsSummary}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <MaterialIcon name="near_me" className="text-sm" />
                        <p className="text-sm">Entrega em {o.distance}</p>
                      </div>
                    </div>

                    <button
                      className="w-full mt-3 flex cursor-pointer items-center justify-center rounded-xl h-12 bg-primary text-white text-base font-bold transition-all active:scale-95 disabled:opacity-60"
                      type="button"
                      disabled={forbidden || !user}
                      onClick={() =>
                        setBanner('Aceite de pedido ainda não implementado (UI).')
                      }
                    >
                      <span>Aceitar Pedido</span>
                    </button>
                  </div>
                </div>
              ))
            : (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary rounded-xl p-4">
                  <div className="flex justify-between mb-4">
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                      COLETA EM ANDAMENTO
                    </span>
                    <span className="text-slate-900 dark:text-slate-100 font-bold">
                      #8839
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <MaterialIcon name="restaurant" className="text-primary" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">
                          Origem
                        </p>
                        <p className="text-sm font-semibold">
                          Restaurante Sabor Real - Centro
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MaterialIcon name="location_on" className="text-primary" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">
                          Destino
                        </p>
                        <p className="text-sm font-semibold">
                          Rua das Flores, 123 - Apt 402
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary/10 flex gap-2">
                    <button
                      className="flex-1 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm"
                      type="button"
                      onClick={() => setBanner('Detalhes ainda não implementado.')}
                    >
                      Detalhes
                    </button>
                    <button
                      className="flex-[2] h-10 rounded-lg bg-primary text-white font-bold text-sm"
                      type="button"
                      onClick={() => setBanner('Ação ainda não implementada.')}
                    >
                      Cheguei no Local
                    </button>
                  </div>
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

