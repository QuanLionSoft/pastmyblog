import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { timeAgo } from '../utils.js';
import { Spinner, ErrorAlert, EmptyState, usePageTitle } from '../components/common.jsx';

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
function avatarColor(name) {
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Yorum yönetimi: onayla / onayı kaldır / sil */
export default function CommentsAdminPage() {
  usePageTitle('Yorumlar — Panel');
  const { refreshBadges } = useOutletContext();

  const [filter, setFilter] = useState('pending'); // pending | approved | all
  const [comments, setComments] = useState(null);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, all: 0 });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [all, pending, approved] = await Promise.all([
        api.adminComments(),
        api.adminComments('pending'),
        api.adminComments('approved'),
      ]);
      setCounts({ all: all.comments.length, pending: pending.comments.length, approved: approved.comments.length });
      const map = { all: all.comments, pending: pending.comments, approved: approved.comments };
      setComments(map[filter]);
    } catch (err) {
      setError(err.message);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function flash(text) {
    setNotice(text);
    setTimeout(() => setNotice(null), 2500);
  }

  async function moderate(c, approved) {
    try {
      await api.moderateComment(c.id, approved);
      flash(approved ? 'Yorum onaylandı ✅' : 'Yorum onayı kaldırıldı');
      await Promise.all([load(), refreshBadges?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(c) {
    if (!window.confirm(`${c.name} adlı kullanıcının yorumu silinsin mi?`)) return;
    try {
      await api.deleteComment(c.id);
      flash('Yorum silindi 🗑️');
      await Promise.all([load(), refreshBadges?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>💬 Yorumlar</h1>
          <p>Okuyucu yorumlarını onaylayın, düzenleyin veya silin.</p>
        </div>
        <div className="filter-tabs" role="tablist" aria-label="Yorum filtresi">
          <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
            ⏳ Bekleyen{counts.pending > 0 && <span className="tab-count">{counts.pending}</span>}
          </button>
          <button className={filter === 'approved' ? 'active' : ''} onClick={() => setFilter('approved')}>
            ✅ Onaylı ({counts.approved})
          </button>
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            Tümü ({counts.all})
          </button>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={load} />
      {notice && <div className="inline-msg ok">{notice}</div>}

      <div className="admin-card">
        <div className="admin-card-body flush">
          {comments === null && !error ? (
            <Spinner label="Yorumlar yükleniyor..." />
          ) : comments.length === 0 ? (
            <EmptyState
              icon={filter === 'pending' ? '🎉' : '💬'}
              title={filter === 'pending' ? 'Bekleyen yorum yok!' : 'Bu filtrede yorum yok'}
              text={filter === 'pending' ? 'Tüm yorumlar güncel. Harika iş!' : undefined}
            />
          ) : (
            comments.map((c) => (
              <div className={`mod-item ${!c.approved ? 'unread' : ''}`} key={c.id}>
                <div className="mod-avatar" style={{ background: avatarColor(c.name) }}>
                  {c.name.charAt(0).toLocaleUpperCase('tr')}
                </div>
                <div className="mod-body">
                  <div className="mod-head">
                    <span className="mod-name">{c.name}</span>
                    <span className="mod-where">
                      {timeAgo(c.createdAt)} ·{' '}
                      {c.postSlug ? <Link to={`/yazilar/${c.postSlug}`}>{c.postTitle}</Link> : c.postTitle}
                      {c.email ? ` · ${c.email}` : ''}
                    </span>
                  </div>
                  <p className="mod-text">{c.content}</p>
                  <div className="mod-actions">
                    {c.approved ? (
                      <button className="btn btn-sm btn-ghost" onClick={() => moderate(c, false)}>
                        ⏸️ Onayı kaldır
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => moderate(c, true)}>
                        ✓ Onayla
                      </button>
                    )}
                    <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
