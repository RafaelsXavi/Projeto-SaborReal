import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../components/Skeleton';
import type { ApiOrder, OrderStatus } from '../../hooks/useAdminOrders';
import { formatPrice } from '../../utils/format';

interface OrderListProps {
  orders: ApiOrder[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading: boolean;
  calculateSubtotal: (o: ApiOrder) => number;
}

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

export function OrderList({
  orders,
  selectedId,
  onSelect,
  loading,
  calculateSubtotal,
}: OrderListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-primary/5 bg-white p-4 shadow-sm dark:bg-background-dark/40"
          >
            <div className="flex justify-between">
              <Skeleton className="w-[40%] h-3" />
              <Skeleton className="w-[20%] h-3" />
            </div>
            <Skeleton className="w-[60%] h-6" />
            <div className="flex items-end justify-between">
              <Skeleton className="w-[30%] h-4" />
              <Skeleton className="w-[25%] h-5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="rounded-xl border border-primary/5 bg-white p-6 text-center text-slate-500 dark:bg-background-dark/40 dark:text-slate-400"
      >
        Nenhum pedido encontrado.
      </motion.div>
    );
  }

  return (
    <motion.div layout className="space-y-4">
      <AnimatePresence>
        {orders.map((o) => (
          <motion.div
            key={o.id}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <button
              type="button"
              onClick={() => onSelect(o.id)}
              className={[
                'w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:bg-background-dark/40',
                selectedId === o.id
                  ? 'border-primary/30 ring-2 ring-primary/10'
                  : 'border-primary/5',
              ].join(' ')}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pedido #{o.id.slice(0, 8)} -{' '}
                    {new Date(o.createdAt).toLocaleString('pt-BR')}
                  </p>
                  <p className="mt-1 text-lg font-extrabold">
                    Cliente: {o.userId.slice(0, 8)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Itens: {o.lines.reduce((s, l) => s + l.qty, 0)}
                    {o.motoboyId ? ` - Entregador: ${o.motoboyId.slice(0, 8)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <motion.span
                    layout
                    className={[
                      'rounded-full px-3 py-1 text-xs font-bold',
                      statusPillClass(o.status),
                    ].join(' ')}
                  >
                    {statusLabel(o.status)}
                  </motion.span>
                  <span className="font-extrabold text-primary">
                    {formatPrice(calculateSubtotal(o))}
                  </span>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
