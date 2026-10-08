import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatNumber } from '../utils.js';
import PostCard from '../components/PostCard.jsx';
import {
  CategoriesWidget,
  PopularWidget,
  TagsWidget,
  NewsletterWidget,
} from '../components/Sidebar.jsx';
import { NewsletterForm, Spinner, ErrorAlert, usePageTitle } from '../components/common.jsx';

export default function HomePage() {
  usePageTitle(null);

  const [state, setState] = useState({
    loading: true,
    error: null,
    latest: [],
    featured: [],
    popular: [],
    categories: [],
    tags: [],
    totalPosts: 0,
    totalViews: 0,
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [meta, latest, featured, popular] = await Promise.all([
          api.getMeta(),
          api.getPosts({ limit: 6, sort: 'new' }),
          api.getPosts({ featured: 1, limit: 2 }),
          api.getPosts({ limit: 20, sort: 'popular' }),
        ]);
        if (!alive) return;

        // Kahraman bölümü istatistikleri için toplam görüntülenmeyi hesapla
        const totalViews = popular.posts.reduce((s, p) => s + (p.views ?? 0), 0);

        setState({
          loading: false,
          error: null,
          latest: latest.posts,
          featured: featured.posts,
          popular: popular.posts,
          categories: meta.categories,
          tags: meta.tags,
          totalPosts: latest.total,
          totalViews,
        });
      } catch (err) {
        if (alive) setState((s) => ({ ...s, loading: false, error: err.message }));
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) return <Spinner label="Blog yükleniyor..." />;

  return (
    <>
      {/* ---------- Kahraman bölümü ---------- */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="hero-eyebrow">✨ Teknoloji · Yazılım · Yaşam</span>
            <h1>
              Kod, kariyer ve yaşam üzerine <span className="gradient-text">samimi yazılar</span>
            </h1>
            <p className="lead">
              Yapay zekadan React'e, derin çalışmadan evden çalışma düzenine kadar
              deneyimlerimi ve işe yarayan pratikleri paylaşıyorum. Kahveni al, okumaya başla. ☕
            </p>
            <div className="hero-cta">
              <Link to="/yazilar" className="btn btn-primary btn-lg">
                📚 Yazıları Keşfet
              </Link>
              <Link to="/hakkinda" className="btn btn-ghost btn-lg">
                Beni Tanı
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-chip">
                <div className="stat-num">{state.totalPosts}</div>
                <div className="stat-label">Yazı</div>
              </div>
              <div className="stat-chip">
                <div className="stat-num">{state.categories.length}</div>
                <div className="stat-label">Kategori</div>
              </div>
              <div className="stat-chip">
                <div className="stat-num">{formatNumber(state.totalViews)}+</div>
                <div className="stat-label">Görüntülenme</div>
              </div>
              <div className="stat-chip">
                <div className="stat-num">{state.tags.length}</div>
                <div className="stat-label">Etiket</div>
              </div>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-card">📝</div>
          </div>
        </div>
      </section>

      <div className="container page" style={{ paddingTop: 12 }}>
        <ErrorAlert error={state.error} />

        {/* ---------- Öne çıkanlar ---------- */}
        {state.featured.length > 0 && (
          <section style={{ marginBottom: 44 }}>
            <div className="section-head">
              <h2 className="section-title">Öne Çıkanlar</h2>
              <Link to="/yazilar" className="section-link">Tümünü gör →</Link>
            </div>
            <div style={{ display: 'grid', gap: 22 }}>
              {state.featured.map((p) => (
                <PostCard key={p.id} post={p} variant="wide" />
              ))}
            </div>
          </section>
        )}

        {/* ---------- Son yazılar + kenar çubuğu ---------- */}
        <div className="grid-2">
          <section>
            <div className="section-head">
              <h2 className="section-title">Son Yazılar</h2>
              <Link to="/yazilar" className="section-link">Arşive git →</Link>
            </div>
            <div className="posts-grid">
              {state.latest.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </section>

          <div className="sidebar">
            <CategoriesWidget categories={state.categories} />
            <PopularWidget posts={state.popular} />
            <TagsWidget tags={state.tags} />
            <NewsletterWidget />
          </div>
        </div>

        {/* ---------- Alt bülten bandı ---------- */}
        <section className="newsletter-band">
          <div>
            <h3>📬 Haftalık bültene katıl</h3>
            <p>
              Yeni yazılar, keşfettiğim araçlar ve işe yarayan ipuçları — doğrudan
              gelen kutunda. Ayda en fazla 2 e-posta.
            </p>
          </div>
          <NewsletterForm />
        </section>
      </div>
    </>
  );
}
