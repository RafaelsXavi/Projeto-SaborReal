import { useMemo, useState } from 'react';
import { userFriendlyError } from '../api';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../router';

export function LoginPage() {
  const { user, loading, login, logout, refreshSession, register } = useAuth();
  const { toggle } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('dev@example.com');
  const [password, setPassword] = useState('dev-password-123');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionLabel = useMemo(() => {
    if (loading) return '...';
    if (!user) return 'Anônimo';
    return user.role;
  }, [loading, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'register') await register({ identifier, password });
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
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button
            className="text-primary flex size-12 shrink-0 items-center cursor-pointer"
            type="button"
            onClick={() => navigate('menu')}
            aria-label="Voltar"
          >
            <MaterialIcon name="arrow_back" />
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            SaborReal
          </h2>
          <button
            className="text-primary flex size-12 shrink-0 items-center justify-end"
            type="button"
            onClick={toggle}
            aria-label="Alternar tema"
            title="Alternar tema"
          >
            <MaterialIcon name="dark_mode" />
          </button>
        </div>

        <div className="@container px-4">
          <div className="@[480px]:px-4 @[480px]:py-3">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-primary/10 @[480px]:rounded-xl min-h-[218px]"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAzh9XYGDKcxe8f4C2Xcqf2872mynJjwQ0ndN5hOH7Nj69qYRUYxJeJV-CER9RXs3lWkZnzLUTZ1gmPicaFvHQ649AjePVVAlICes48ptbaX9A8W47qZCQ9geJX8mf_lu5a3GgoHdMqZyGsxe8e5OaU3Lwcqopa57lvBeXrLX2BzZo1H6K4_KdQEPGCiC7202tMHiqtXCJdewCxYNWVaIV4wcMMWJK0OLGe4aV0s5Q2dwBlgAZLG63rAYRQwkpK4CGKvrIBY_04LDKq")',
              }}
            />
          </div>
        </div>

        <div className="px-6 py-8">
          <h1 className="text-slate-900 dark:text-slate-100 tracking-light text-[32px] font-bold leading-tight text-center pb-2">
            Bem-vindo ao SaborReal
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-8 text-center">
            Sabores autênticos à sua porta
          </p>

          <div className="pb-8">
            <div className="flex border-b border-primary/20 px-4 justify-between">
              <button
                className={[
                  'flex flex-col items-center justify-center pb-[13px] pt-4 flex-1 border-b-[3px]',
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
                  'flex flex-col items-center justify-center pb-[13px] pt-4 flex-1 border-b-[3px]',
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
            <div className="bg-white/70 dark:bg-slate-900/30 border border-primary/10 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">Sessão</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sessionLabel}
                    {user.userId ? ` • ${user.userId}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="h-11 px-4 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => navigate('menu')}
                  >
                    Ir ao cardápio
                  </button>
                  <button
                    type="button"
                    className="h-11 px-4 rounded-xl font-bold bg-primary text-white hover:brightness-110 transition-all"
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
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  htmlFor="identifier"
                >
                  E-mail ou Telefone
                </label>
                <div className="relative">
                  <input
                    className="w-full h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
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
                  className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  htmlFor="password"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    className="w-full h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 pr-12 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    id="password"
                    placeholder="Mínimo 8 caracteres"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    required
                    minLength={8}
                  />
                  <button
                    className="absolute right-3 top-3 text-slate-400"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <MaterialIcon
                      name={showPassword ? 'visibility' : 'visibility_off'}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  Use pelo menos 8 caracteres com letras e números.
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs font-semibold text-primary">
                  Sessão: {sessionLabel}
                </div>
                <button
                  className="text-xs font-semibold text-primary hover:underline"
                  type="button"
                  onClick={() => navigate('menu')}
                >
                  Continuar sem login
                </button>
              </div>

              {error ? (
                <div className="flex items-start gap-2 text-red-500 text-xs bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                  <MaterialIcon name="error" className="text-base" />
                  <p>{error}</p>
                </div>
              ) : null}

              <button
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
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
            <div className="h-[1px] bg-slate-200 dark:bg-slate-700 flex-1" />
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">
              ou entre com
            </span>
            <div className="h-[1px] bg-slate-200 dark:bg-slate-700 flex-1" />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              className="flex-1 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              type="button"
              onClick={() =>
                setError('Login social não implementado (só UI por enquanto).')
              }
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
              className="flex-1 h-12 flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              type="button"
              onClick={() =>
                setError('Login social não implementado (só UI por enquanto).')
              }
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-semibold">Facebook</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-4 flex flex-col items-center gap-2">
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#">Termos de Uso</a>
            <a href="#">Privacidade</a>
            <a href="#">Suporte</a>
          </div>
          <p className="text-[10px] text-slate-400">
            © 2026 SaborReal. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

