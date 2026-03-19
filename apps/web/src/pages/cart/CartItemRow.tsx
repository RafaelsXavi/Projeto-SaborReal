import React from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import { formatPrice } from '../../utils/format';

interface CartItemRowProps {
  item: {
    id: string;
    name: string;
    priceCents: number;
    qty: number;
    imageUrl?: string;
  };
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export const CartItemRow = React.memo(
  ({ item, onUpdateQty, onRemove }: CartItemRowProps) => {
  return (
    <div className="flex gap-4 items-center bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="size-20 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MaterialIcon
              name="restaurant"
              className="text-slate-300 text-2xl"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
          {item.name}
        </h4>
        <p className="text-primary font-black text-sm mt-0.5">
          {formatPrice(item.priceCents)}
        </p>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-1 border border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onUpdateQty(item.id, -1)}
              className="size-7 flex items-center justify-center text-slate-400 hover:text-primary transition-colors hover:bg-white dark:hover:bg-slate-800 rounded-lg"
            >
              <MaterialIcon name="remove" className="text-sm" />
            </button>
            <span className="w-8 text-center text-xs font-black text-slate-900 dark:text-slate-100">
              {item.qty}
            </span>
            <button
              onClick={() => onUpdateQty(item.id, 1)}
              className="size-7 flex items-center justify-center text-slate-400 hover:text-primary transition-colors hover:bg-white dark:hover:bg-slate-800 rounded-lg"
            >
              <MaterialIcon name="add" className="text-sm" />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="size-9 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
          >
            <MaterialIcon name="delete_outline" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
});
