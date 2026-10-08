import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { getToken } from '../api.js';
import { toggleTheme } from '../theme.js';

/** Üst gezinme çubuğu: logo, bağlantılar, tema değiştirici, mobil menü */
export default function Navbar({ theme, setTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Rota değişince mobil menüyü kapat
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand" aria-label="PastMyBlog ana sayfa">
          <span className="brand-logo">P</span>
          <span className="brand-name">
            Past<em>My</em>Blog
          </span>
        </Link>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Ana menü">
          <NavLink to="/" end>
            Ana Sayfa
          </NavLink>
          <NavLink to="/yazilar">Yazılar</NavLink>
          <NavLink to="/hakkinda">Hakkımda</NavLink>
          <NavLink to="/iletisim">İletişim</NavLink>
          {getToken() && <NavLink to="/admin/panel">🔐 Panel</NavLink>}
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setTheme(toggleTheme(theme))}
            aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menüyü aç/kapat"
            aria-expanded={menuOpen}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
}
