import { MaterialIcon } from '../../components/MaterialIcon';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export function MotoboyHeader() {
  const { logout } = useAuth();
  const { toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/80 backdrop-blur-md dark:bg-background-dark/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary p-2 text-white shadow-lg shadow-primary/20">
            <MaterialIcon name="delivery_dining" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tight text-slate-900 dark:text-slate-100">
              SABOR<span className="tracking-normal text-primary">REAL</span>
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none">
              Central do entregador
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-600 transition-all active:scale-95 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={toggle}
            aria-label="Alternar tema"
          >
            <MaterialIcon name="dark_mode" />
          </button>
          <div className="mx-1 h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => logout()}
            className="flex items-center gap-2 rounded-xl px-3 py-2 font-bold text-rose-500 transition-all active:scale-95 hover:bg-rose-500/10"
          >
            <MaterialIcon name="logout" className="text-lg" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
