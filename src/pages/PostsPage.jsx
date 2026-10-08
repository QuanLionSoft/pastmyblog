import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import PostCard from '../components/PostCard.jsx';
import Pagination from '../components/Pagination.jsx';
import { Spinner, EmptyState, ErrorAlert, usePageTitle } from '../components/common.jsx';

const PER_PAGE = 6;

/** Tüm yazılar: arama, kategori/etiket filtresi, sıralama ve sayfalama */
export default function PostsPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const category = params.get('kategori') ?? '';
  const tag = params.get('etiket') ?? '';
  const sort = params.get('sort') ?? 'new';
  const page = parseInt(params.get('sayfa') ?? '1', 10) || 1;

  usePageTitle(
    category
      ? `${category} Yazıları`
      : tag
        ? `#${tag} Etiketi`
        : q
          ? `"${q}" Araması`
          : 'Tüm Yazılar'
  );

  const [searchText, setSearchText] = useState(q);
  const [state, setState] = useState({ loading: true, error: null, posts: [], total: 0, pages: 1 });
  const [meta, setMeta] = useState({ categories: [], tags: [] });

  // Arama kutusunu URL ile senkron tut (geri/ileri düğmeleri)
  useEffect(() => setSearchText(q), [q]);

  // Meta verisi (kategori + etiket çipleri)
  useEffect(() => {
    api.getMeta().then(setMeta).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await api.getPosts({ q, category, tag, sort, page, limit: PER_PAGE });
      setState({ loading: false, error: null, posts: res.posts, total: res.total, pages: res.pages });
    } catch (err) {
      setState({ loading: false, error: err.message, posts: [], total: 0, pages: 1 });
    }
  }, [q, category, tag, sort, page]);

  useEffect(() => {
    load();
    window.scrollTo({ top: 0 });
  }, [load]);

  // Aramada 400ms geciktirme (debounce)
  useEffect(() => {
    if (searchText === q) return undefined;
    const t = setTimeout(() => updateParams({ q: searchText, sayfa: null }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  function updateParams(changes) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '' || v === undefined) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  }

  const hasFilter = Boolean(q || category || tag);

  return (
    <div className="container page">
      <header className="page-header">
        <h1 className="page-title">
          {category ? `${category} Kategorisi` : tag ? `#${tag}` : 'Tüm Yazılar'}
        </h1>
        <p className="page-subtitle">
          {state.loading
            ? 'Yükleniyor...'
            : `${state.total} yazı listeleniyor${hasFilter ? ' — filtreye uygun' : ''}`}
        </p>
      </header>

      {/* ---------- Filtre çubuğu ---------- */}
      <div className="filter-bar">
        <div className="search-row">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              placeholder="Yazılarda ara... (başlık, özet, etiket)"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Yazılarda ara"
            />
          </div>
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value, sayfa: null })}
            aria-label="Sıralama"
          >
            <option value="new">En Yeni</option>
            <option value="popular">En Popüler</option>
          </select>
        </div>

        <div className="chip-row">
          <Link
            to="/yazilar"
            className={`tag-pill ${!category && !tag ? 'active' : ''}`}
            onClick={() => updateParams({ kategori: null, etiket: null, sayfa: null })}
          >
            Hepsi
          </Link>
          {meta.categories.map((c) => (
            <button
              key={c.name}
              className={`tag-pill ${category === c.name ? 'active' : ''}`}
              onClick={() => updateParams({ kategori: c.name, etiket: null, sayfa: null })}
            >
              {c.name} <span className="tag-count">{c.count}</span>
            </button>
          ))}
        </div>

        {tag && (
          <div className="active-filter-note">
            <span>
              Etiket filtresi: <span className="tag-pill active">#{tag}</span>
            </span>
            <button className="clear-link" onClick={() => updateParams({ etiket: null, sayfa: null })}>
              ✕ temizle
            </button>
          </div>
        )}
        {q && (
          <div className="active-filter-note">
            <span>
              "<strong>{q}</strong>" için sonuçlar
            </span>
            <button
              className="clear-link"
              onClick={() => {
                setSearchText('');
                updateParams({ q: null, sayfa: null });
              }}
            >
              ✕ aramayı temizle
            </button>
          </div>
        )}
      </div>

      {/* ---------- Sonuçlar ---------- */}
      {state.loading && <Spinner label="Yazılar getiriliyor..." />}
      <ErrorAlert error={state.error} onRetry={load} />

      {!state.loading && !state.error && state.posts.length === 0 && (
        <EmptyState
          icon="🕵️"
          title="Sonuç bulunamadı"
          text="Filtreleri temizlemeyi veya farklı bir arama yapmayı deneyin."
        />
      )}

      {!state.loading && state.posts.length > 0 && (
        <>
          <div className="posts-grid">
            {state.posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          <Pagination
            page={page}
            pages={state.pages}
            onChange={(n) => updateParams({ sayfa: n === 1 ? null : String(n) })}
          />
        </>
      )}
    </div>
  );
}
