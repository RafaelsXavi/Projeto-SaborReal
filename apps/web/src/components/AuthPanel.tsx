import { useMemo, useState } from 'react';
import { userFriendlyError } from '../api';
import { useAuth } from '../hooks/useAuth';

export function AuthPanel() {
  const { user, loading, login, logout, register } = useAuth();
  const [identifier, setIdentifier] = useState('dev@example.com');
  const [password, setPassword] = useState('dev-password-123');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const badge = useMemo(() => {
    if (loading) return '...';
    if (!user) return 'anonimo';
    return user.role;
  }, [loading, user]);

  async function onSubmit() {
    setError(null);
    try {
      if (mode === 'register') {
        await register({ identifier, password });
      }
      await login({ identifier, password });
    } catch (e: unknown) {
      setError(userFriendlyError(e));
    }
  }

  async function onLogout() {
    setError(null);
    try {
      await logout();
    } catch (e: unknown) {
      setError(userFriendlyError(e));
    }
  }

  return (
    <div className="notice">
      <div className="row flex items-center justify-between gap-3">
        <div>
          <span className="small">Sessao:</span>{' '}
          <span className="badge">{badge}</span>
          {user ? (
            <span className="small">
              {' '}
              - <span className="code">{user.userId}</span>
            </span>
          ) : null}
        </div>
        {user ? (
          <button className="btn" type="button" onClick={onLogout}>
            Sair
          </button>
        ) : null}
      </div>

      {!user ? (
        <div className="mt-2">
          <div className="row flex items-center justify-start gap-2">
            <button
              className="btn"
              type="button"
              onClick={() => setMode('login')}
              disabled={mode === 'login'}
            >
              Entrar
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setMode('register')}
              disabled={mode === 'register'}
            >
              Cadastrar
            </button>
          </div>

          <div className="row mt-2">
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input"
              placeholder="e-mail ou telefone"
            />
          </div>
          <div className="row mt-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              type="password"
              placeholder="senha"
            />
          </div>

          <button
            className="btn btnPrimary mt-2.5 w-full"
            type="button"
            onClick={onSubmit}
          >
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mt-2">
          <div className="small">Erro:</div>
          <div className="code">{error}</div>
        </div>
      ) : null}
    </div>
  );
}
