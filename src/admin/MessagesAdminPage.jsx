import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api.js';
import { formatDateTime, timeAgo } from '../utils.js';
import { Spinner, ErrorAlert, EmptyState, usePageTitle } from '../components/common.jsx';

/** İletişim mesajları yönetimi */
export default function MessagesAdminPage() {
  usePageTitle('Mesajlar — Panel');
  const { refreshBadges } = useOutletContext();

  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMessages((await api.adminMessages()).messages);
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

  async function toggleRead(m) {
    try {
      await api.markMessage(m.id, !m.read);
      await Promise.all([load(), refreshBadges?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(m) {
    if (!window.confirm(`${m.name} kişisinin mesajı silinsin mi?`)) return;
    try {
      await api.deleteMessage(m.id);
      flash('Mesaj silindi 🗑️');
      await Promise.all([load(), refreshBadges?.()]);
    } catch (err) {
      setError(err.message);
    }
  }

  const unread = messages?.filter((m) => !m.read).length ?? 0;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>✉️ Mesajlar</h1>
          <p>
            İletişim formundan gelen mesajlar.
            {unread > 0 && <strong style={{ color: 'var(--primary)' }}> ({unread} okunmamış)</strong>}
          </p>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={load} />
      {notice && <div className="inline-msg ok">{notice}</div>}

      <div className="admin-card">
        <div className="admin-card-body flush">
          {messages === null && !error ? (
            <Spinner label="Mesajlar yükleniyor..." />
          ) : messages.length === 0 ? (
            <EmptyState icon="📭" title="Gelen kutusu boş" text="Şimdilik bekleyen mesaj yok." />
          ) : (
            messages.map((m) => (
              <div className={`mod-item ${!m.read ? 'unread' : ''}`} key={m.id}>
                <div className="mod-avatar" style={{ background: m.read ? 'var(--bg-soft)' : '#4f46e5', color: m.read ? 'var(--text-faint)' : '#fff' }}>
                  {m.read ? '✓' : m.name.charAt(0).toLocaleUpperCase('tr')}
                </div>
                <div className="mod-body">
                  <div className="mod-head">
                    <span className="mod-name">
                      {m.name} {!m.read && <span className="badge cat-blue" style={{ marginLeft: 6 }}>yeni</span>}
                    </span>
                    <span className="mod-where" title={formatDateTime(m.createdAt)}>
                      {m.email} · {timeAgo(m.createdAt)}
                    </span>
                  </div>
                  <p className="mod-text">{m.message}</p>
                  <div className="mod-actions">
                    <a className="btn btn-sm btn-primary" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: PastMyBlog')}`}>
                      ↩️ Yanıtla
                    </a>
                    <button className="btn btn-sm btn-ghost" onClick={() => toggleRead(m)}>
                      {m.read ? '📩 Okunmadı işaretle' : '✓ Okundu işaretle'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(m)}>
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
