import { MaterialIcon } from '../../components/MaterialIcon';
import { navigate } from '../../router';

export function CartHeader() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        type="button"
        onClick={() => navigate('menu')}
        className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
        aria-label="Voltar"
      >
        <MaterialIcon name="arrow_back" />
      </button>
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Carrinho
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none mt-1">
          Confira seus itens
        </p>
      </div>
    </div>
  );
}
