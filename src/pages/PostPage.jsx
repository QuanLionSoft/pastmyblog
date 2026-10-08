import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { formatDate, formatNumber } from '../utils.js';
import Markdown, { renderMarkdown } from '../components/Markdown.jsx';
import TableOfContents from '../components/TableOfContents.jsx';
import PostCard from '../components/PostCard.jsx';
import CommentsSection from '../components/CommentsSection.jsx';
import { LikeButton, ShareButtons, ReadProgress } from '../components/Interactions.jsx';
import { Spinner, EmptyState, ErrorAlert, usePageTitle } from '../components/common.jsx';

export default function PostPage() {
  const { slug } = useParams();

  const [state, setState] = useState({
    loading: true,
    error: null,
    post: null,
    related: [],
  });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, post: null, related: [] });

    async function load() {
      try {
        const post = await api.getPost(slug);
        let related = [];
        try {
          related = (await api.getRelated(slug)).posts;
        } catch {
          /* benzer yazılar kritik değil */
        }
        if (alive) setState({ loading: false, error: null, post, related });
      } catch (err) {
        if (alive) setState({ loading: false, error: err.message, post: null, related: [] });
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [slug]);

  const { post } = state;
  usePageTitle(post ? post.title : null);

  // TOC yalnızca bir kez hesaplanır
  const toc = useMemo(() => (post ? renderMarkdown(post.content).toc : []), [post]);

  if (state.loading) return <Spinner label="Yazı yükleniyor..." />;

  if (state.error || !post) {
    return (
      <div className="container page">
        {state.error?.includes('bulunamadı') ? (
          <EmptyState
            icon="📭"
            title="Yazı bulunamadı"
            text="Aradığınız yazı kaldırılmış veya adresi değiştirilmiş olabilir."
          />
        ) : (
          <ErrorAlert error={state.error} />
        )}
        <div className="center" style={{ marginTop: 18 }}>
          <Link to="/yazilar" className="btn btn-primary">← Tüm yazılara dön</Link>
        </div>
      </div>
    );
  }

  const cover = post.cover ?? {};

  return (
    <>
      <ReadProgress />
      <article className="container page">
        {/* Kırıntı navigasyonu */}
        <nav className="breadcrumb" aria-label="Kırıntı">
          <Link to="/">Ana Sayfa</Link> <span>/</span>
          <Link to="/yazilar">Yazılar</Link> <span>/</span>
          <Link to={`/yazilar?kategori=${encodeURIComponent(post.category)}`}>{post.category}</Link>
        </nav>

        {/* Kapak görseli (gradyan + emoji) */}
        <div
          className="article-hero-cover"
          style={{ background: cover.gradient || 'linear-gradient(135deg,#6366f1,#a855f7)' }}
          aria-hidden="true"
        >
          <span className="cover-emoji">{cover.emoji || '📝'}</span>
        </div>

        {/* Başlık ve meta bilgiler */}
        <header className="article-head">
          <Link
            to={`/yazilar?kategori=${encodeURIComponent(post.category)}`}
            className="badge"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            {post.category}
          </Link>
          <h1>{post.title}</h1>

          <div className="article-meta">
            <span className="author-chip">
              <span className="author-avatar">{(post.author ?? 'P').charAt(0)}</span>
              {post.author ?? 'PastMyBlog'}
            </span>
            <span className="meta-item">📅 {formatDate(post.createdAt)}</span>
            <span className="meta-item">⏱️ {post.readingTime} dk okuma</span>
            <span className="meta-item">👁️ {formatNumber(post.views)} görüntülenme</span>
          </div>

          {post.excerpt && <p className="article-excerpt-lead">{post.excerpt}</p>}
        </header>

        {/* İçerik + içindekiler */}
        <div className="article-layout">
          <div style={{ minWidth: 0 }}>
            <Markdown source={post.content} />

            {/* Etiketler */}
            {post.tags?.length > 0 && (
              <div className="article-tags">
                {post.tags.map((t) => (
                  <Link key={t} to={`/yazilar?etiket=${encodeURIComponent(t)}`} className="tag-pill">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* Beğen + paylaş */}
            <div className="article-actions">
              <LikeButton post={post} />
              <ShareButtons post={post} />
            </div>

            {/* Yorumlar */}
            <CommentsSection post={post} />
          </div>

          <aside className="toc-aside">
            <TableOfContents toc={toc} />
          </aside>
        </div>

        {/* Benzer yazılar */}
        {state.related.length > 0 && (
          <section style={{ marginTop: 64 }}>
            <div className="section-head">
              <h2 className="section-title">Benzer Yazılar</h2>
              <Link to="/yazilar" className="section-link">Tümünü gör →</Link>
            </div>
            <div className="posts-grid">
              {state.related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
