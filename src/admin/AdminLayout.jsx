import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api, getToken, clearToken } from '../api.js';
import { Spinner } from '../components/common.jsx';

/**
 * Yönetim paneli yerleşimi.
 * - Geçerli oturum yoksa /admin giriş sayfasına yönlendirir.
 * - Kenar çubuğunda bekleyen yorum / okunmamış mesaj rozetlerini gösterir.
 */
export default function AdminLayout() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [badges, setBadges] = useState({ pendingComments: 0, unreadMessages: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const refreshBadges = useCallback(async () => {
    try {
      const s = await api.stats();
      setBadges({ pendingComments: s.pendingComments, unreadMessages: s.unreadMessages });
    } catch {
      /* rozetler kritik değil */
    }
  }, []);

  // Oturum kontrolü
  useEffect(() => {
    (async () => {
      if (!getToken()) {
        navigate('/admin', { replace: true });
        return;
      }
      try {
        const me = await api.me();
        setUser(me);
        setChecking(false);
        refreshBadges();
      } catch {
        clearToken();
        navigate('/admin', { replace: true });
      }
    })();
  }, [navigate, refreshBadges]);

  // Her rota değişiminde rozetleri tazele
  useEffect(() => {
    if (user) refreshBadges();
  }, [location.pathname, user, refreshBadges]);

  async function logout() {
    try {
      await api.logout();
    } catch {
      /* sunucuya ulaşılamasa da yerel oturumu temizle */
    }
    clearToken();
    navigate('/admin', { replace: true });
  }

  if (checking) return <Spinner label="Oturum doğrulanıyor..." />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-side-head">
          <div className="ash-title">🛠️ Yönetim Paneli</div>
          <div className="ash-sub">PastMyBlog</div>
        </div>

        <nav aria-label="Panel menüsü">
          <NavLink to="/admin/panel" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="a-icon">📊</span> Panel
          </NavLink>
          <NavLink to="/admin/yazilar" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="a-icon">📝</span> Yazılar
          </NavLink>
          <NavLink to="/admin/yazi/yeni" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="a-icon">➕</span> Yeni Yazı
          </NavLink>
          <NavLink to="/admin/yorumlar" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="a-icon">💬</span> Yorumlar
            {badges.pendingComments > 0 && <span className="a-badge">{badges.pendingComments}</span>}
          </NavLink>
          <NavLink to="/admin/mesajlar" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="a-icon">✉️</span> Mesajlar
            {badges.unreadMessages > 0 && <span className="a-badge">{badges.unreadMessages}</span>}
          </NavLink>
          <NavLink to="/admin/aboneler" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="a-icon">👥</span> Aboneler
          </NavLink>
        </nav>

        <div className="admin-side-foot">
          <div className="admin-user-chip">
            <span className="auc-avatar">{(user?.username ?? 'A').charAt(0).toLocaleUpperCase('tr')}</span>
            {user?.username ?? 'admin'}
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            🌐 Siteyi Aç
          </a>
          <button className="btn btn-danger btn-sm" onClick={logout}>
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet context={{ refreshBadges }} />
      </main>
    </div>
  );
}
