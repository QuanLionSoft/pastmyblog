import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { formatNumber, timeAgo } from '../utils.js';
import { Spinner, ErrorAlert, usePageTitle } from '../components/common.jsx';

/** Panel ana sayfası: istatistikler, son yorumlar ve en çok okunanlar */
export default function DashboardPage() {
  usePageTitle('Yönetim Paneli');
  const { refreshBadges } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      setStats(await api.stats());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function moderate(id, approved, name) {
    try {
      await api.moderateComment(id, approved);
      setNotice(approved ? `"${name}" onaylandı ✅` : `"${name}" onayı kaldırıldı`);
      setTimeout(() => setNotice(null), 2500);
      await Promise.all([load(), refreshBadges?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeComment(id) {
    if (!window.confirm('Bu yorum kalıcı olarak silinsin mi?')) return;
    try {
      await api.deleteComment(id);
      await Promise.all([load(), refreshBadges?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !stats) return <ErrorAlert error={error} onRetry={load} />;
  if (!stats) return <Spinner label="Panel verileri yükleniyor..." />;

  const cards = [
    { icon: '📝', cls: 'si-blue', num: stats.publishedPosts, label: `Yayında (${stats.totalPosts} toplam)` },
    { icon: '👁️', cls: 'si-purple', num: formatNumber(stats.totalViews), label: 'Toplam Görüntülenme' },
    { icon: '❤️', cls: 'si-pink', num: formatNumber(stats.totalLikes), label: 'Toplam Beğeni' },
    { icon: '💬', cls: 'si-teal', num: stats.totalComments, label: 'Toplam Yorum' },
    { icon: '⏳', cls: 'si-amber', num: stats.pendingComments, label: 'Onay Bekleyen Yorum' },
    { icon: '✉️', cls: 'si-green', num: stats.unreadMessages, label: 'Okunmamış Mesaj' },
    { icon: '📬', cls: 'si-blue', num: stats.totalSubscribers, label: 'Bülten Abonesi' },
    { icon: '📄', cls: 'si-slate', num: stats.draftPosts, label: 'Taslak Yazı' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>📊 Genel Bakış</h1>
          <p>Blogunuzun sağlığı bir bakışta.</p>
        </div>
        <Link to="/admin/yazi/yeni" className="btn btn-primary">➕ Yeni Yazı</Link>
      </div>

      <ErrorAlert error={error} />
      {notice && <div className="inline-msg ok">{notice}</div>}

      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.label}>
            <div className={`stat-icon ${c.cls}`}>{c.icon}</div>
            <div>
              <div className="sc-num">{c.num}</div>
              <div className="sc-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-head">
            <h2>🕐 Son Yorumlar</h2>
            <Link to="/admin/yorumlar" className="btn btn-ghost btn-sm">Tümünü yönet →</Link>
          </div>
          <div className="admin-card-body flush">
            {stats.recentComments.length === 0 && (
              <div style={{ padding: '30px 22px' }} className="muted small center">Henüz yorum yok.</div>
            )}
            {stats.recentComments.map((c) => (
              <div className="mod-item" key={c.id}>
                <div className="mod-avatar" style={{ background: '#6366f1' }}>
                  {c.name.charAt(0).toLocaleUpperCase('tr')}
                </div>
                <div className="mod-body">
                  <div className="mod-head">
                    <span className="mod-name">{c.name}</span>
                    <span className="mod-where">
                      {c.approved ? '✅ onaylı' : '⏳ bekliyor'} · {timeAgo(c.createdAt)}
                      {c.postSlug && (
                        <>
                          {' · '}
                          <Link to={`/yazilar/${c.postSlug}`}>{c.postTitle}</Link>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="mod-text">{c.content}</p>
                  <div className="mod-actions">
                    {c.approved ? (
                      <button className="btn btn-sm btn-ghost" onClick={() => moderate(c.id, false, c.name)}>
                        Onayı kaldır
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => moderate(c.id, true, c.name)}>
                        ✓ Onayla
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => removeComment(c.id)}>
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h2>🏆 En Çok Okunanlar</h2>
          </div>
          <div className="admin-card-body flush">
            {stats.topPosts.map((p, i) => (
              <div className="mod-item" key={p.id} style={{ alignItems: 'center' }}>
                <div
                  className="mod-avatar"
                  style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--bg-soft)', color: i < 3 ? '#fff' : 'var(--text-faint)' }}
                >
                  {i + 1}
                </div>
                <div className="mod-body">
                  <Link to={`/yazilar/${p.slug}`} style={{ fontWeight: 650, fontSize: '0.92rem', color: 'var(--text)' }}>
                    {p.title}
                  </Link>
                  <div className="mod-where" style={{ marginTop: 3 }}>
                    👁️ {formatNumber(p.views)} · ❤️ {formatNumber(p.likes)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
