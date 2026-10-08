import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { timeAgo } from '../utils.js';
import { ErrorAlert, Spinner } from './common.jsx';

/** Yorum yazarı için tutarlı renkli avatar üretir */
const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
function avatarColor(name) {
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** Yorum listesi + yeni yorum formu */
export default function CommentsSection({ post }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null); // {type, text}

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getComments(post.slug);
      setComments(res.comments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [post.slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await api.addComment(post.slug, form);
      setFormMsg({ type: 'ok', text: res.message });
      setForm({ name: '', email: '', content: '' });
    } catch (err) {
      setFormMsg({ type: 'err', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="comments-section" id="yorumlar">
      <h2 className="comments-head">
        💬 Yorumlar
        {comments.length > 0 && <span className="comments-count-pill">{comments.length}</span>}
      </h2>

      {loading && <Spinner label="Yorumlar yükleniyor..." />}
      <ErrorAlert error={error} onRetry={load} />

      {!loading && !error && comments.length === 0 && (
        <p className="muted small" style={{ padding: '8px 0 4px' }}>
          Henüz onaylı yorum yok. İlk yorumu sen yaz! 👇
        </p>
      )}

      {comments.map((c) => (
        <div className="comment" key={c.id}>
          <div className="comment-avatar" style={{ background: avatarColor(c.name) }}>
            {c.name.charAt(0).toLocaleUpperCase('tr')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="comment-head">
              <span className="comment-name">{c.name}</span>
              <span className="comment-date" title={new Date(c.createdAt).toLocaleString('tr-TR')}>
                {timeAgo(c.createdAt)}
              </span>
            </div>
            <p className="comment-text">{c.content}</p>
          </div>
        </div>
      ))}

      <form className="comment-form" onSubmit={onSubmit}>
        <h3>Yorum Yap</h3>
        <div className="form-grid-2">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="c-name">Adınız *</label>
            <input
              id="c-name"
              type="text"
              required
              maxLength={60}
              placeholder="örn. Ayşe Yılmaz"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="c-email">E-posta (yayınlanmaz)</label>
            <input
              id="c-email"
              type="email"
              maxLength={120}
              placeholder="ornek@eposta.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="c-content">Yorumunuz *</label>
          <textarea
            id="c-content"
            required
            minLength={5}
            maxLength={2000}
            rows={4}
            placeholder="Düşüncelerinizi paylaşın..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>

        {formMsg && (
          <div className={`inline-msg ${formMsg.type === 'ok' ? 'ok' : 'err'}`} role="status">
            {formMsg.text}
          </div>
        )}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Gönderiliyor...' : '📨 Yorumu Gönder'}
        </button>
        <span className="hint faint small" style={{ marginLeft: 12 }}>
          Yorumunuz yönetici onayından sonra görünür.
        </span>
      </form>
    </section>
  );
}
