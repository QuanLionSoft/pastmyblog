import { Link } from 'react-router-dom';
import { formatNumber } from '../utils.js';
import { NewsletterForm } from './common.jsx';

/** Kategoriler listesi */
export function CategoriesWidget({ categories = [], activeCategory }) {
  if (!categories.length) return null;
  return (
    <aside className="widget">
      <h3 className="widget-title">📂 Kategoriler</h3>
      <ul className="category-list">
        <li>
          <Link
            to="/yazilar"
            style={!activeCategory ? { background: 'var(--primary-soft)', color: 'var(--primary)' } : undefined}
          >
            <span>Tüm Yazılar</span>
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.name}>
            <Link
              to={`/yazilar?kategori=${encodeURIComponent(c.name)}`}
              style={activeCategory === c.name ? { background: 'var(--primary-soft)', color: 'var(--primary)' } : undefined}
            >
              <span>{c.name}</span>
              <span className="count-pill">{c.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Popüler yazılar (görüntülenmeye göre) */
export function PopularWidget({ posts = [] }) {
  if (!posts.length) return null;
  return (
    <aside className="widget">
      <h3 className="widget-title">🔥 Popüler Yazılar</h3>
      {posts.slice(0, 4).map((p, i) => (
        <div className="popular-item" key={p.id}>
          <span className="popular-rank">0{i + 1}</span>
          <div>
            <Link to={`/yazilar/${p.slug}`}>{p.title}</Link>
            <div className="popular-meta">
              👁️ {formatNumber(p.views)} görüntülenme · ❤️ {formatNumber(p.likes)}
            </div>
          </div>
        </div>
      ))}
    </aside>
  );
}

/** Etiket bulutu */
export function TagsWidget({ tags = [], activeTag }) {
  if (!tags.length) return null;
  return (
    <aside className="widget">
      <h3 className="widget-title">🏷️ Etiketler</h3>
      <div className="tag-cloud">
        {tags.slice(0, 14).map((t) => (
          <Link
            key={t.name}
            to={`/yazilar?etiket=${encodeURIComponent(t.name)}`}
            className={`tag-pill ${activeTag === t.name ? 'active' : ''}`}
          >
            #{t.name}
            <span className="tag-count">{t.count}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

/** Bülten aboneliği kutusu */
export function NewsletterWidget() {
  return (
    <aside className="widget newsletter-widget">
      <h3 className="widget-title">✉️ Bülten</h3>
      <p>Yeni yazılar e-postana gelsin. Spam yok, istediğin an çık.</p>
      <NewsletterForm />
    </aside>
  );
}
