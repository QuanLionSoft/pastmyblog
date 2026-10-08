import { useState } from 'react';
import { api } from '../api.js';
import { usePageTitle } from '../components/common.jsx';

export default function ContactPage() {
  usePageTitle('İletişim');

  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // {type:'ok'|'err', text}

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await api.contact(form);
      setResult({ type: 'ok', text: res.message });
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setResult({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container page">
      <header className="page-header">
        <h1 className="page-title">İletişim 💬</h1>
        <p className="page-subtitle">
          Soru, öneri, iş birliği ya da sadece merhaba demek için buradayım.
          Genellikle 1-2 gün içinde dönüş yapıyorum.
        </p>
      </header>

      <div className="contact-grid">
        <form className="contact-form-card" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="ct-name">Adınız Soyadınız *</label>
            <input
              id="ct-name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              placeholder="örn. Ahmet Yılmaz"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="ct-email">E-posta Adresiniz *</label>
            <input
              id="ct-email"
              type="email"
              required
              maxLength={120}
              placeholder="ornek@eposta.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="field">
            <label htmlFor="ct-message">Mesajınız *</label>
            <textarea
              id="ct-message"
              required
              minLength={10}
              maxLength={4000}
              rows={7}
              placeholder="Ne hakkında yazmak istersiniz?"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
            <span className="hint">{form.message.length}/4000 karakter</span>
          </div>

          {result && (
            <div className={`inline-msg ${result.type === 'ok' ? 'ok' : 'err'}`} role="status">
              {result.text}
            </div>
          )}

          <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Gönderiliyor...' : '📨 Mesajı Gönder'}
          </button>
        </form>

        <aside className="contact-info-card">
          <h3>Diğer Kanallar</h3>
          <p>Mesaj formu dışında da ulaşabilirsiniz:</p>

          <div className="contact-info-item">
            <span className="ci-icon">✉️</span>
            <div>
              <strong>E-posta</strong>
              <span>merhaba@pastmyblog.dev</span>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="ci-icon">🐙</span>
            <div>
              <strong>GitHub</strong>
              <span>github.com/pastmyblog</span>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="ci-icon">𝕏</span>
            <div>
              <strong>X (Twitter)</strong>
              <span>@pastmyblog</span>
            </div>
          </div>

          <div className="contact-info-item">
            <span className="ci-icon">⏰</span>
            <div>
              <strong>Yanıt Süresi</strong>
              <span>Genellikle 24-48 saat içinde</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
