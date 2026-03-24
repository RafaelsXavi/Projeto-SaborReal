import { useCallback, useState } from 'react';
import { userFriendlyError } from '../api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { MaterialIcon } from '../components/MaterialIcon';
import { ListSkeleton } from '../components/Skeleton';
import { useMotoboyOrders, useMotoboyStats } from '../hooks/useMotoboyOrders';
import { MotoboyHeader } from './motoboy/MotoboyHeader';
import {
  AssignedOrdersList,
  AvailableOrdersList,
} from './motoboy/MotoboyLists';

export function MotoboyPage() {
  const { available, assigned, loading, accept, complete, isProcessing } =
    useMotoboyOrders();
  const { stats, loading: statsLoading } = useMotoboyStats();
  const [actionError, setActionError] = useState<string | null>(null);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const handleAccept = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await accept(id);
      } catch (err: unknown) {
        setActionError(userFriendlyError(err));
      }
    },
    [accept],
  );

  const handleComplete = useCallback(
    async (id: string) => {
      setActionError(null);
      try {
        await complete(id);
      } catch (err: unknown) {
        setActionError(userFriendlyError(err));
      }
    },
    [complete],
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <MotoboyHeader />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {actionError && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-500 dark:border-red-900/20 dark:bg-red-900/10">
            <MaterialIcon name="error_outline" />
            <p className="text-sm font-bold">{actionError}</p>
            <button type="button" onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <MaterialIcon name="close" className="text-base" />
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <section>
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6 sm:gap-4">
              <h3 className="flex items-center gap-2 text-lg font-black sm:gap-3 sm:text-xl">
                <span className="h-7 w-1.5 rounded-full bg-amber-500 sm:h-8 sm:w-2" />
                Disponiveis agora
                <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-600 dark:bg-amber-900/30">
                  {available.length}
                </span>
              </h3>
              <button
                type="button"
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline sm:text-xs"
                onClick={() => window.location.reload()}
              >
                Atualizar
              </button>
            </div>

            <ErrorBoundary>
              {loading && available.length === 0 ? (
                <ListSkeleton count={2} />
              ) : (
                <AvailableOrdersList
                  orders={available}
                  onAction={handleAccept}
                  isProcessing={isProcessing}
                />
              )}
            </ErrorBoundary>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6 sm:gap-4">
              <h3 className="flex items-center gap-2 text-lg font-black sm:gap-3 sm:text-xl">
                <span className="h-7 w-1.5 rounded-full bg-emerald-500 sm:h-8 sm:w-2" />
                Minhas entregas
                <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-600 dark:bg-emerald-900/30">
                  {assigned.length}
                </span>
              </h3>
              {assigned.length > 0 && (
                <div className="flex animate-pulse items-center gap-1 text-emerald-600">
                  <MaterialIcon name="bolt" className="text-base sm:text-lg" />
                  <span className="text-[9px] font-black uppercase tracking-tighter sm:text-[10px]">
                    Ativo
                  </span>
                </div>
              )}
            </div>

            <ErrorBoundary>
              {loading && assigned.length === 0 ? (
                <ListSkeleton count={1} />
              ) : (
                <AssignedOrdersList
                  orders={assigned}
                  onAction={handleComplete}
                  isProcessing={isProcessing}
                />
              )}
            </ErrorBoundary>
          </section>
        </div>
      </main>

      {/* Mobile bottom earnings bar */}
      <div className="fixed bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-3 text-white shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-6 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary sm:h-10 sm:w-10 sm:rounded-xl">
            <MaterialIcon name="payments" className="text-lg" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
              Ganhos de hoje
            </p>
            <p className="text-base font-extrabold sm:text-lg">
              {statsLoading ? '...' : formatPrice(stats?.earningsTodayCents ?? 0)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-l border-white/10 pl-3 sm:pl-4">
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:text-[10px]">
              Entregas
            </p>
            <p className="text-base font-extrabold sm:text-lg">
              {statsLoading ? '..' : stats?.completedToday ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
