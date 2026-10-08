import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, getToken, clearToken } from '../api.js';
import { usePageTitle } from '../components/common.jsx';

/** Yönetici giriş sayfası */
export default function LoginPage() {
  usePageTitle('Yönetici Girişi');
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);

  // Zaten geçerli bir oturum varsa doğrudan panele git
  useEffect(() => {
    (async () => {
      if (!getToken()) {
        setChecking(false);
        return;
      }
      try {
        await api.me();
        navigate('/admin/panel', { replace: true });
      } catch {
        clearToken();
        setChecking(false);
      }
    })();
  }, [navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.login(username.trim(), password);
      setToken(res.token);
      navigate('/admin/panel', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (checking) return null;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🔐</div>
        <h1>Yönetici Girişi</h1>
        <p className="login-sub">Blogu yönetmek için oturum açın</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="lg-user">Kullanıcı Adı</label>
            <input
              id="lg-user"
              type="text"
              required
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="lg-pass">Parola</label>
            <input
              id="lg-pass"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="inline-msg err" role="alert">
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Demo bilgileri:</strong> kullanıcı adı <code>admin</code>, parola{' '}
          <code>admin123</code>. Gerçek dağıtımda parolayı <code>server/lib/seed.js</code>{' '}
          üzerinden değiştirmeyi unutmayın.
        </div>
      </div>
    </div>
  );
}
