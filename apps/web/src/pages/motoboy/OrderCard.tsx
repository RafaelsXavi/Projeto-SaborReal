import { memo, useMemo } from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { MotoboyOrder } from '../../hooks/useMotoboyOrders';

interface OrderCardProps {
  order: MotoboyOrder;
  actionLabel: string;
  onAction: (id: string) => void;
  isProcessing: boolean;
  type: 'available' | 'assigned';
}

/** Memoized to avoid re-renders when sibling cards change state */
export const OrderCard = memo(function OrderCard({
  order,
  actionLabel,
  onAction,
  isProcessing,
  type,
}: OrderCardProps) {
  const totalItems = useMemo(
    () => order.lines.reduce((s, l) => s + l.qty, 0),
    [order.lines],
  );

  const timeLabel = useMemo(
    () =>
      new Date(order.createdAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [order.createdAt],
  );

  const isAvailable = type === 'available';

  return (
    <div className="group overflow-hidden rounded-2xl border border-primary/5 bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.99] dark:bg-background-dark/40">
      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div
              className={`flex shrink-0 rounded-lg p-1.5 sm:rounded-xl sm:p-2 ${
                isAvailable
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
              }`}
            >
              <MaterialIcon
                name={isAvailable ? 'shopping_bag' : 'local_shipping'}
                className="text-lg sm:text-xl"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:text-xs">
                Pedido #{order.id.slice(0, 8)}
              </p>
              <h4 className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100 sm:text-lg">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </h4>
            </div>
          </div>
          <p className="shrink-0 text-[10px] text-slate-400 sm:text-xs">{timeLabel}</p>
        </div>

        {/* Items list */}
        <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900/30 sm:mb-4 sm:rounded-xl sm:p-3">
          <p className="mb-1.5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 sm:mb-2 sm:gap-1.5">
            <MaterialIcon name="inventory_2" className="text-xs text-primary sm:text-sm" />
            Itens do pedido
          </p>
          <ul className="space-y-1 sm:space-y-1.5">
            {order.lines.map((line, idx) => (
              <li
                key={`${line.id}-${idx}`}
                className="flex items-center justify-between text-xs sm:text-sm"
              >
                <span className="truncate pr-2 font-medium text-slate-700 dark:text-slate-300">
                  {line.name}
                </span>
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary sm:px-2 sm:text-xs">
                  x{line.qty}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Call customer button */}
        {order.customerPhone && (
          <a
            href={`tel:${order.customerPhone}`}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/40 sm:mb-4 sm:rounded-xl sm:py-3 sm:text-sm"
          >
            <MaterialIcon name="call" className="text-base sm:text-lg" />
            Ligar ({order.customerPhone})
          </a>
        )}

        {/* Address placeholder */}
        <div className="mb-3 flex items-center gap-2.5 text-slate-600 dark:text-slate-400 sm:mb-4 sm:gap-3">
          <MaterialIcon name="location_on" className="text-base text-primary sm:text-lg" />
          <p className="text-xs font-medium sm:text-sm">Endereco de entrega simulado</p>
        </div>

        {/* Action button */}
        <button
          onClick={() => onAction(order.id)}
          disabled={isProcessing}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all disabled:opacity-60 disabled:shadow-none sm:rounded-xl sm:py-4 sm:text-sm ${
            isAvailable
              ? 'bg-primary shadow-primary/20 hover:brightness-110'
              : 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600'
          }`}
        >
          {isProcessing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white sm:h-5 sm:w-5" />
          ) : (
            <>
              <MaterialIcon
                name={isAvailable ? 'add_circle' : 'check_circle'}
                className="text-base sm:text-xl"
              />
              {actionLabel}
            </>
          )}
        </button>
      </div>
    </div>
  );
});
