import type { MotoboyOrder } from '../../hooks/useMotoboyOrders';
import { OrderCard } from './OrderCard';

interface ListProps {
  orders: MotoboyOrder[];
  onAction: (id: string) => void;
  isProcessing: boolean;
}

export function AvailableOrdersList({
  orders,
  onAction,
  isProcessing,
}: ListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <p className="font-bold text-slate-500">
          Nenhum pedido disponivel no momento.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Aguarde novas notificacoes...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          type="available"
          actionLabel="Aceitar entrega"
          onAction={onAction}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
}

export function AssignedOrdersList({
  orders,
  onAction,
  isProcessing,
}: ListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <p className="font-bold text-slate-500">
          Voce nao tem entregas em andamento.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Aceite um pedido para comecar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          type="assigned"
          actionLabel="Finalizar entrega"
          onAction={onAction}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
}
