import { Link } from 'react-router-dom';
import { formatDate, formatNumber, categoryClass } from '../utils.js';

/**
 * Yazı kartı.
 * @param {'grid'|'wide'} variant — dikey (ızgara) veya yatay (öne çıkan) düzen
 */
export default function PostCard({ post, variant = 'grid' }) {
  const cover = post.cover ?? {};
  return (
    <article className={`post-card ${variant === 'wide' ? 'post-card-wide' : ''}`}>
      <Link
        to={`/yazilar/${post.slug}`}
        className="post-cover"
        style={{ background: cover.gradient || 'linear-gradient(135deg,#6366f1,#a855f7)' }}
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="cover-emoji">{cover.emoji || '📝'}</span>
        <span className={`badge ${categoryClass(post.category)}`}>{post.category}</span>
        {post.featured && <span className="featured-star" title="Öne çıkan yazı">⭐</span>}
      </Link>

      <div className="post-body">
        <h3 className="post-title">
          <Link to={`/yazilar/${post.slug}`}>{post.title}</Link>
        </h3>
        {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
        <div className="post-meta">
          <span className="meta-item" title="Yayın tarihi">📅 {formatDate(post.createdAt)}</span>
          <span className="meta-item" title="Okuma süresi">⏱️ {post.readingTime} dk</span>
          <span className="meta-item" title="Görüntülenme">👁️ {formatNumber(post.views)}</span>
          <span className="meta-item" title="Beğeni">❤️ {formatNumber(post.likes)}</span>
          {post.commentCount > 0 && (
            <span className="meta-item" title="Yorum sayısı">💬 {post.commentCount}</span>
          )}
        </div>
      </div>
    </article>
  );
}
