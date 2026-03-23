import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';

function roleLabel(role: string) {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'motoboy':
      return 'Motoboy';
    case 'customer':
      return 'Cliente';
    default:
      return role;
  }
}

export function ProfilePage() {
  const { user, loading, logout, refreshSession } = useAuth();
  const { toggle } = useTheme();

  async function onLogout() {
    try {
      await logout();
      await refreshSession();
      navigate('menu');
    } catch {
      // ignore (UI can be improved later)
    }
  }

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/80 px-4 py-4 backdrop-blur-md dark:bg-background-dark/80">
        <button
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-primary/10"
          type="button"
          onClick={() => navigate('menu')}
          aria-label="Voltar"
        >
          <MaterialIcon name="arrow_back" className="text-primary" />
        </button>
        <h1 className="text-lg font-bold">Perfil</h1>
        <button
          className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-primary/10"
          type="button"
          onClick={toggle}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          <MaterialIcon name="dark_mode" className="text-primary" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 sm:px-6">
        {loading ? (
          <div className="rounded-xl border border-primary/5 bg-white p-6 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Carregando…
            </p>
          </div>
        ) : !user ? (
          <div className="rounded-xl border border-primary/5 bg-white p-6 dark:bg-slate-800/50">
            <h2 className="text-xl font-extrabold">Você não está logado</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Entre para ver seus pedidos e acessar áreas restritas (ADM/Motoboy).
            </p>
            <button
              className="mt-4 w-full rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary/90"
              type="button"
              onClick={() => navigate('login')}
            >
              Ir para o login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/5 bg-white p-6 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usuário
              </p>
              <p className="mt-1 text-lg font-extrabold">
                {roleLabel(user.role)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                ID: {user.userId}
              </p>
            </div>

            {user.role === 'admin' ? (
              <button
                type="button"
                className="w-full rounded-lg bg-slate-900 py-3 font-bold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                onClick={() => navigate('admin')}
              >
                Abrir painel ADM
              </button>
            ) : null}

            {user.role === 'motoboy' ? (
              <button
                type="button"
                className="w-full rounded-lg bg-slate-900 py-3 font-bold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                onClick={() => navigate('motoboy')}
              >
                Abrir área do motoboy
              </button>
            ) : null}

            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white py-3 font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={onLogout}
            >
              Sair
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

