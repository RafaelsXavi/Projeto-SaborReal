import React from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export const AdminHeader = React.memo(() => {
  const { user } = useAuth();
  const { toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/80 backdrop-blur-md dark:bg-background-dark/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary p-2 text-white">
            <MaterialIcon name="restaurant_menu" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            SaborReal <span className="text-primary">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-primary/10 dark:text-slate-300"
            type="button"
            onClick={toggle}
            aria-label="Alternar tema"
          >
            <MaterialIcon name="dark_mode" />
          </button>
          <button
            className="rounded-full p-2 text-slate-600 transition-colors hover:bg-primary/10 dark:text-slate-300"
            type="button"
            aria-label="Notificacoes"
          >
            <MaterialIcon name="notifications" />
          </button>
          <div className="flex items-center gap-2 border-l border-primary/10 pl-4">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold">Admin</p>
              <p className="text-[10px] text-slate-500">
                {user ? user.userId.slice(0, 8) : 'anonimo'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary/50 bg-primary/20">
              <MaterialIcon name="person" className="text-primary" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
