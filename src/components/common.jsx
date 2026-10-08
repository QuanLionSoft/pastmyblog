import { useEffect, useState } from 'react';
import { api } from '../api.js';

/** Sayfa başlığını günceller (hook) */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — PastMyBlog` : 'PastMyBlog — Teknoloji & Yaşam Blogu';
  }, [title]);
}

/** Yükleme göstergesi */
export function Spinner({ label = 'Yükleniyor...' }) {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <p style={{ marginTop: 14 }}>{label}</p>
    </div>
  );
}

/** Boş durum */
export function EmptyState({ icon = '🔍', title = 'Burada henüz bir şey yok', text }) {
  return (
    <div className="empty-wrap">
      <div className="empty-icon">{icon}</div>
      <h3 style={{ fontWeight: 750, marginBottom: 6 }}>{title}</h3>
      {text && <p style={{ maxWidth: 420, margin: '0 auto' }}>{text}</p>}
    </div>
  );
}

/** Hata uyarısı */
export function ErrorAlert({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert" style={{ margin: '16px 0' }}>
      {error}
      {onRetry && (
        <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={onRetry}>
          Tekrar dene
        </button>
      )}
    </div>
  );
}

/** Bülten abonelik formu (kenar çubuğu ve alt bant ortak) */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // { type: 'ok' | 'err', text }
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await api.subscribe(email.trim());
      setStatus({ type: 'ok', text: res.message });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="newsletter-form" onSubmit={onSubmit}>
      <input
        type="email"
        required
        placeholder="E-posta adresiniz"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="E-posta adresiniz"
      />
      <button className="btn" type="submit" disabled={busy}>
        {busy ? 'Gönderiliyor...' : 'Abone Ol'}
      </button>
      {status && (
        <div className="newsletter-result" role="status">
          {status.text}
        </div>
      )}
    </form>
  );
}
