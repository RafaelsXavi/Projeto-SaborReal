import React from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { ApiOrder, OrderStatus } from '../../hooks/useAdminOrders';
import { formatPrice } from '../../utils/format';

interface OrderDetailProps {
  order: ApiOrder | null;
  itemById: Map<string, { name: string; priceCents: number }>;
  onUpdateStatus: (id: string, s: OrderStatus) => void;
  isUpdating: boolean;
  calculateSubtotal: (o: ApiOrder) => number;
}

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
    default:
      return s;
  }
}

function statusPillClass(s: OrderStatus) {
  switch (s) {
    case 'PLACED':
      return 'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300';
    case 'PREPARING':
      return 'border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300';
    case 'READY_FOR_PICKUP':
      return 'border border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300';
    case 'OUT_FOR_DELIVERY':
      return 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300';
    case 'COMPLETED':
      return 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    case 'CANCELLED':
      return 'border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300';
    default:
      return '';
  }
}

function nextStatus(s: OrderStatus): OrderStatus {
  if (s === 'CANCELLED' || s === 'COMPLETED') return s;
  const idx = statusFlow.indexOf(s);
  if (idx < 0) return s;
  return statusFlow[Math.min(idx + 1, statusFlow.length - 1)] ?? s;
}

export const OrderDetail = React.memo(
  ({
    order,
    itemById,
    onUpdateStatus,
    isUpdating,
    calculateSubtotal,
  }: OrderDetailProps) => {
    if (!order) {
      return (
        <aside className="rounded-xl border border-primary/5 bg-white p-6 text-slate-500 shadow-sm dark:bg-background-dark/40 dark:text-slate-400">
          Selecione um pedido.
        </aside>
      );
    }

    const subtotal = calculateSubtotal(order);

    return (
      <aside className="overflow-hidden rounded-xl border border-primary/5 bg-white shadow-sm dark:bg-background-dark/40">
        <div className="border-b border-primary/10 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pedido #{order.id}
              </p>
              <p className="mt-1 break-all text-lg font-extrabold">
                Cliente: {order.userId}
              </p>
              <div className="mt-3">
                <span
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
                    statusPillClass(order.status),
                  ].join(' ')}
                >
                  <MaterialIcon name="receipt_long" className="text-sm" />
                  {statusLabel(order.status)}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total (estimado)
              </p>
              <p className="text-2xl font-extrabold text-primary">
                {formatPrice(subtotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <section>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              Itens do pedido
            </h4>
            <div className="space-y-4">
              {order.lines.map((l) => {
                const it = itemById.get(l.id);
                const name = it?.name ?? l.id;
                const price = it?.priceCents ?? 0;

                return (
                  <div
                    className="flex items-center justify-between gap-3"
                    key={`${order.id}:${l.id}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {l.qty}x
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{name}</p>
                        <p className="truncate text-[10px] text-slate-500">
                          id: {l.id}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold">
                      {price ? formatPrice(price) : '--'}
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
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-2 text-lg font-extrabold dark:border-slate-800">
                <span>Total</span>
                <span className="text-primary">{formatPrice(subtotal)}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-primary/10 bg-slate-50 p-6 dark:bg-slate-800/50 sm:flex-row">
          <button
            className="flex-1 rounded-xl bg-rose-500/10 py-3 font-bold text-rose-600 transition-colors hover:bg-rose-500/20 disabled:opacity-60"
            type="button"
            onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
            disabled={
              isUpdating ||
              order.status === 'COMPLETED' ||
              order.status === 'CANCELLED'
            }
          >
            Cancelar
          </button>
          <button
            className="flex-[2] rounded-xl bg-primary py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-60"
            type="button"
            onClick={() => onUpdateStatus(order.id, nextStatus(order.status))}
            disabled={
              isUpdating ||
              order.status === 'COMPLETED' ||
              order.status === 'CANCELLED' ||
              order.status === 'READY_FOR_PICKUP' ||
              order.status === 'OUT_FOR_DELIVERY'
            }
          >
            {isUpdating
              ? 'Atualizando...'
              : order.status === 'READY_FOR_PICKUP'
                ? 'Aguardando motoboy'
                : order.status === 'OUT_FOR_DELIVERY'
                  ? 'Em entrega'
                  : 'Avancar status'}
          </button>
        </div>
      </aside>
    );
  },
);
