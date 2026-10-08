import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatDate, formatNumber } from '../utils.js';
import { Spinner, ErrorAlert, EmptyState, usePageTitle } from '../components/common.jsx';

/** Yazı listesi ve yönetimi (düzenle / yayınla / sil) */
export default function PostsAdminPage() {
  usePageTitle('Yazılar — Panel');

  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts((await api.adminPosts()).posts);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(text) {
    setNotice(text);
    setTimeout(() => setNotice(null), 2500);
  }

  async function togglePublish(post) {
    try {
      await api.updatePost(post.id, { published: !post.published });
      flash(post.published ? `"${post.title}" taslağa alındı 📄` : `"${post.title}" yayınlandı 🎉`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleFeatured(post) {
    try {
      await api.updatePost(post.id, { featured: !post.featured });
      flash(post.featured ? 'Öne çıkarma kaldırıldı' : 'Yazı öne çıkarıldı ⭐');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(post) {
    if (!window.confirm(`"${post.title}" kalıcı olarak silinsin mi?\nBu işlem yorumlarını da siler.`)) return;
    try {
      await api.deletePost(post.id);
      flash('Yazı silindi 🗑️');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!posts && !error) return <Spinner label="Yazılar yükleniyor..." />;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>📝 Yazılar</h1>
          <p>{posts ? `${posts.length} yazı (taslaklar dahil)` : ''}</p>
        </div>
        <Link to="/admin/yazi/yeni" className="btn btn-primary">➕ Yeni Yazı</Link>
      </div>

      <ErrorAlert error={error} onRetry={load} />
      {notice && <div className="inline-msg ok">{notice}</div>}

      <div className="admin-card">
        <div className="admin-card-body flush table-scroll">
          {!posts?.length ? (
            <EmptyState icon="📝" title="Henüz yazı yok" text="İlk yazınızı oluşturmak için düğmeye tıklayın." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Başlık</th>
                  <th>Kategori</th>
                  <th>Durum</th>
                  <th>👁️</th>
                  <th>❤️</th>
                  <th>Güncelleme</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-title">
                        <Link to={`/admin/yazi/${p.id}`}>{p.title}</Link>
                        {p.featured && ' ⭐'}
                      </div>
                      <div className="cell-sub">/{p.slug}</div>
                    </td>
                    <td>
                      <span className="badge cat-slate">{p.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.published ? 'badge-status-published' : 'badge-status-draft'}`}>
                        {p.published ? '● Yayında' : '○ Taslak'}
                      </span>
                    </td>
                    <td>{formatNumber(p.views)}</td>
                    <td>{formatNumber(p.likes)}</td>
                    <td className="muted small">{formatDate(p.updatedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div className="row-actions">
                        {p.published && (
                          <Link to={`/yazilar/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" title="Görüntüle">
                            👁️
                          </Link>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => togglePublish(p)} title={p.published ? 'Taslağa al' : 'Yayınla'}>
                          {p.published ? '📄' : '🚀'}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => toggleFeatured(p)} title={p.featured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}>
                          ⭐
                        </button>
                        <Link to={`/admin/yazi/${p.id}`} className="btn btn-sm btn-primary" title="Düzenle">
                          ✏️
                        </Link>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(p)} title="Sil">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
