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
    if (!user) return 'anônimo';
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
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <span className="small">Sessão:</span>{' '}
          <span className="badge">{badge}</span>
          {user ? (
            <span className="small">
              {' '}
              • <span className="code">{user.userId}</span>
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
        <div style={{ marginTop: 8 }}>
          <div className="row" style={{ justifyContent: 'flex-start' }}>
            <button
              className="btn"
              type="button"
              onClick={() => setMode('login')}
              disabled={mode === 'login'}
            >
              Login
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => setMode('register')}
              disabled={mode === 'register'}
            >
              Registrar
            </button>
          </div>

          <div className="row" style={{ marginTop: 8 }}>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input"
              placeholder="email ou telefone"
            />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              type="password"
              placeholder="senha"
            />
          </div>

          <button
            className="btn btnPrimary"
            type="button"
            onClick={onSubmit}
            style={{ width: '100%', marginTop: 10 }}
          >
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>
      ) : null}

      {error ? (
        <div style={{ marginTop: 8 }}>
          <div className="small">Erro:</div>
          <div className="code">{error}</div>
        </div>
      ) : null}
    </div>
  );
}
