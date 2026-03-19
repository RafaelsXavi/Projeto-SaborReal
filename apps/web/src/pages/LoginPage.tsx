import { useMemo, useState } from 'react';
import { userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';

export function LoginPage() {
  const {
    user,
    loading,
    login,
    logout,
    refreshSession,
    register,
    devCreateUser,
  } = useAuth();
  const { toggle } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('dev@example.com');
  const [password, setPassword] = useState('dev-password-123');
  const [role, setRole] = useState<'customer' | 'admin' | 'motoboy'>(
    'customer',
  );
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionLabel = useMemo(() => {
    if (loading) return '...';
    if (!user) return 'Anonimo';
    return user.role;
  }, [loading, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        if (role === 'customer') {
          await register({ identifier, password });
        } else {
          await devCreateUser({ identifier, password, role });
        }
      }
      await login({ identifier, password });
      navigate('menu');
    } catch (err: unknown) {
      setError(userFriendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    setError(null);
    try {
      await logout();
      await refreshSession();
    } catch (err: unknown) {
      setError(userFriendlyError(err));
    }
  }

  return (
    <div className="min-h-screen bg-background-light font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <button
            className="flex size-12 shrink-0 items-center text-primary"
            type="button"
            onClick={() => navigate('menu')}
            aria-label="Voltar"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-slate-900 dark:text-slate-100">
            SaborReal
          </h2>
          <button
            className="flex size-12 shrink-0 items-center justify-end text-primary"
            type="button"
            onClick={toggle}
            aria-label="Alternar tema"
            title="Alternar tema"
          >
            <MaterialIcon name="dark_mode" />
          </button>
        </div>

        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 pb-8 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-center lg:px-8">
          <div className="order-2 lg:order-1">
            <div
              className="flex min-h-[240px] w-full flex-col justify-end overflow-hidden rounded-[2rem] bg-primary/10 bg-cover bg-center bg-no-repeat sm:min-h-[320px] lg:min-h-[560px]"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAzh9XYGDKcxe8f4C2Xcqf2872mynJjwQ0ndN5hOH7Nj69qYRUYxJeJV-CER9RXs3lWkZnzLUTZ1gmPicaFvHQ649AjePVVAlICes48ptbaX9A8W47qZCQ9geJX8mf_lu5a3GgoHdMqZyGsxe8e5OaU3Lwcqopa57lvBeXrLX2BzZo1H6K4_KdQEPGCiC7202tMHiqtXCJdewCxYNWVaIV4wcMMWJK0OLGe4aV0s5Q2dwBlgAZLG63rAYRQwkpK4CGKvrIBY_04LDKq")',
              }}
            />
          </div>

          <div className="order-1 px-2 py-4 lg:order-2 lg:px-0">
            <div className="rounded-[2rem] border border-primary/10 bg-white/80 p-5 shadow-xl backdrop-blur-sm dark:bg-slate-900/40 sm:p-8">
              <h1 className="pb-2 text-center text-[32px] font-bold leading-tight tracking-light text-slate-900 dark:text-slate-100 sm:text-[36px] lg:text-left">
                Bem-vindo ao SaborReal
              </h1>
              <p className="pb-8 text-center text-base font-normal leading-normal text-slate-600 dark:text-slate-400 lg:text-left">
                Sabores autenticos na sua porta
              </p>

              <div className="pb-8">
                <div className="flex justify-between border-b border-primary/20 px-2 sm:px-4">
                  <button
                    className={[
                      'flex flex-1 flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4',
                      mode === 'login'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 dark:text-slate-400',
                    ].join(' ')}
                    type="button"
                    onClick={() => setMode('login')}
                  >
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                      Entrar
                    </p>
                  </button>
                  <button
                    className={[
                      'flex flex-1 flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4',
                      mode === 'register'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 dark:text-slate-400',
                    ].join(' ')}
                    type="button"
                    onClick={() => setMode('register')}
                  >
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">
                      Criar conta
                    </p>
                  </button>
                </div>
              </div>

              {user ? (
                <div className="rounded-xl border border-primary/10 bg-white/70 p-4 dark:bg-slate-900/30">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold">Sessao</p>
                      <p className="break-all text-xs text-slate-500 dark:text-slate-400">
                        {sessionLabel}
                        {user.userId ? ` - ${user.userId}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 font-bold transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                        onClick={() => navigate('menu')}
                      >
                        Ir ao cardapio
                      </button>
                      <button
                        type="button"
                        className="h-11 rounded-xl bg-primary px-4 font-bold text-white transition-all hover:brightness-110"
                        onClick={onLogout}
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={onSubmit}>
                  <div className="space-y-1">
                    <label
                      className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300"
                      htmlFor="identifier"
                    >
                      E-mail ou telefone
                    </label>
                    <div className="relative">
                      <input
                        className="h-12 w-full rounded-lg border-slate-200 bg-white px-4 text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        id="identifier"
                        placeholder="exemplo@email.com ou (11) 99999-9999"
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300"
                      htmlFor="password"
                    >
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        className="h-12 w-full rounded-lg border-slate-200 bg-white px-4 pr-12 text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        id="password"
                        placeholder="Minimo 8 caracteres"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={
                          mode === 'register'
                            ? 'new-password'
                            : 'current-password'
                        }
                        required
                        minLength={8}
                      />
                      <button
                        className="absolute right-3 top-3 text-slate-400"
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                      >
                        <MaterialIcon
                          name={showPassword ? 'visibility' : 'visibility_off'}
                        />
                      </button>
                    </div>
                    <p className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                      Use pelo menos 8 caracteres com letras e numeros.
                    </p>
                  </div>

                  {mode === 'register' ? (
                    <div className="space-y-1">
                      <label
                        className="ml-1 text-sm font-semibold text-slate-700 dark:text-slate-300"
                        htmlFor="role"
                      >
                        Tipo de conta (dev)
                      </label>
                      <select
                        id="role"
                        className="h-12 w-full rounded-lg border-slate-200 bg-white px-4 text-slate-900 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        value={role}
                        onChange={(e) =>
                          setRole(
                            e.target.value as 'customer' | 'admin' | 'motoboy',
                          )
                        }
                      >
                        <option value="customer">Cliente</option>
                        <option value="admin">Administrador</option>
                        <option value="motoboy">Entregador</option>
                      </select>
                      <p className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                        Para <span className="font-bold">admin/motoboy</span>{' '}
                        usamos{' '}
                        <span className="font-bold">
                          /v1/auth/dev-create-user
                        </span>
                        .
                      </p>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="text-xs font-semibold text-primary">
                      Sessao: {sessionLabel}
                    </div>
                    <button
                      className="text-right text-xs font-semibold text-primary hover:underline"
                      type="button"
                      onClick={() => navigate('menu')}
                    >
                      Continuar sem login
                    </button>
                  </div>

                  {error ? (
                    <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-500 dark:border-red-900/50 dark:bg-red-950/20">
                      <MaterialIcon name="error" className="text-base" />
                      <p>{error}</p>
                    </div>
                  ) : null}

                  <button
                    className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-70"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Aguarde...'
                      : mode === 'login'
                        ? 'Acessar minha conta'
                        : 'Criar conta'}
                  </button>
                </form>
              )}

              <div className="mt-8 flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
                <span className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                  ou entre com
                </span>
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  className="flex h-12 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  type="button"
                  onClick={() =>
                    setError(
                      'Login social nao implementado (so UI por enquanto).',
                    )
                  }
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="text-sm font-semibold">Google</span>
                </button>

                <button
                  className="flex h-12 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  type="button"
                  onClick={() =>
                    setError(
                      'Login social nao implementado (so UI por enquanto).',
                    )
                  }
                >
                  <svg className="mr-2 h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="text-sm font-semibold">Facebook</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 p-4">
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#">Termos de uso</a>
            <a href="#">Privacidade</a>
            <a href="#">Suporte</a>
          </div>
          <p className="text-[10px] text-slate-400">
            (c) 2026 SaborReal. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
