import { Link } from 'react-router-dom';

/** Alt bilgi: hakkında, hızlı bağlantılar, kategoriler ve telif satırı */
export default function Footer({ categories = [] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-about">
          <Link to="/" className="brand">
            <span className="brand-logo">P</span>
            <span className="brand-name">
              Past<em>My</em>Blog
            </span>
          </Link>
          <p>
            Teknoloji, yazılım, yapay zeka ve üretkenlik üzerine Türkçe yazılar.
            Deneyimlerimi, öğrendiklerimi ve işe yarayan pratikleri paylaşıyorum.
          </p>
        </div>

        <div>
          <h4>Keşfet</h4>
          <ul className="footer-links">
            <li><Link to="/">Ana Sayfa</Link></li>
            <li><Link to="/yazilar">Tüm Yazılar</Link></li>
            <li><Link to="/yazilar?sort=popular">Popüler Yazılar</Link></li>
            <li><Link to="/hakkinda">Hakkımda</Link></li>
            <li><Link to="/iletisim">İletişim</Link></li>
          </ul>
        </div>

        <div>
          <h4>Kategoriler</h4>
          <ul className="footer-links">
            {categories.slice(0, 6).map((c) => (
              <li key={c.name}>
                <Link to={`/yazilar?kategori=${encodeURIComponent(c.name)}`}>{c.name}</Link>
              </li>
            ))}
            {categories.length === 0 && <li><Link to="/yazilar">Yazılara göz at</Link></li>}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        © {year} PastMyBlog · React + Express ile ❤️ ile yapıldı · <Link to="/admin">Yönetici Girişi</Link>
      </div>
    </footer>
  );
}
