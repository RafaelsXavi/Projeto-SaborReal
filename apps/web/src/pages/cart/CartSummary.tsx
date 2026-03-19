import { MaterialIcon } from '../../components/MaterialIcon';
import { formatPrice } from '../../utils/format';

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  onCheckout: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

export function CartSummary({
  subtotal,
  deliveryFee,
  onCheckout,
  isProcessing,
  disabled,
}: CartSummaryProps) {
  const total = subtotal + deliveryFee;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-t-[3rem] p-8 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.15)] dark:shadow-none border-t border-slate-100 dark:border-slate-800">
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            Subtotal
          </span>
          <span className="font-extrabold text-slate-900 dark:text-slate-100 italic">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">
            Entrega
          </span>
          {deliveryFee > 0 ? (
            <span className="font-extrabold text-primary italic">
              {formatPrice(deliveryFee)}
            </span>
          ) : (
            <span className="text-emerald-500 font-black text-xs uppercase tracking-tighter bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
              Grátis
            </span>
          )}
        </div>
        <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-slate-900 dark:text-slate-100 font-black text-lg">
            Total
          </span>
          <span className="text-3xl font-black text-primary italic">
            {formatPrice(total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={disabled || isProcessing}
        className="w-full py-5 bg-primary text-white font-black text-sm uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-primary/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100"
      >
        {isProcessing ? (
          <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Finalizar Pedido
            <MaterialIcon name="arrow_forward" className="text-xl" />
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
        <MaterialIcon name="lock" className="text-xs" />
        Pagamento Seguro & Criptografado
      </p>
    </div>
  );
}
