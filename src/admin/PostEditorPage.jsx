import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { slugify, readingTime } from '../utils.js';
import Markdown from '../components/Markdown.jsx';
import { Spinner, ErrorAlert, usePageTitle } from '../components/common.jsx';

const GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)',
  'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f97316 0%, #facc15 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)',
  'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
  'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
];

const EMOJIS = ['📝', '🤖', '⚛️', '⏳', '🛠️', '🎨', '🎯', '🧭', '🏡', '🚀', '💡', '🔥', '📚', '🧠', '☕', '🚧'];

const EMPTY_DRAFT = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  author: 'PastMyBlog',
  cover: { gradient: GRADIENTS[0], emoji: '📝' },
  featured: false,
  published: false,
};

/**
 * Yazı editörü — hem yeni yazı (/admin/yazi/yeni) hem düzenleme (/admin/yazi/:id).
 * Markdown araç çubuğu, canlı önizleme, kapak (gradyan + emoji) seçici içerir.
 */
export default function PostEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'yeni';
  const navigate = useNavigate();
  usePageTitle(isNew ? 'Yeni Yazı — Panel' : 'Yazıyı Düzenle — Panel');

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(EMPTY_DRAFT);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tab, setTab] = useState('write'); // write | preview
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // {type, text}
  const [existingCategories, setExistingCategories] = useState([]);
  const contentRef = useRef(null);

  // Mevcut yazıyı yükle (düzenleme modu)
  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const { post } = await api.adminPost(id);
        setForm({
          title: post.title ?? '',
          slug: post.slug ?? '',
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          category: post.category ?? '',
          tags: (post.tags ?? []).join(', '),
          author: post.author ?? 'PastMyBlog',
          cover: post.cover ?? EMPTY_DRAFT.cover,
          featured: Boolean(post.featured),
          published: Boolean(post.published),
        });
        setSlugTouched(true);
        setLoading(false);
      } catch (err) {
        setLoadError(err.message);
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  // Kategori önerileri için mevcut kategorileri çek
  useEffect(() => {
    api.getMeta().then((m) => setExistingCategories(m.categories.map((c) => c.name))).catch(() => {});
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const effectiveSlug = useMemo(
    () => form.slug.trim() || slugify(form.title),
    [form.slug, form.title]
  );

  const words = useMemo(() => form.content.split(/\s+/).filter(Boolean).length, [form.content]);

  /* ---------- Markdown araç çubuğu ---------- */
  function applyMd(before, placeholder = '', after = '') {
    const ta = contentRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    set({ content: next });
    // İmleci eklenen metnin sonuna taşı
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + before.length + selected.length + after.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  const toolbar = [
    { label: 'B', title: 'Kalın', style: { fontWeight: 800 }, fn: () => applyMd('**', 'kalın metin', '**') },
    { label: 'I', title: 'İtalik', style: { fontStyle: 'italic' }, fn: () => applyMd('*', 'italik metin', '*') },
    { sep: true },
    { label: 'H2', title: 'Başlık 2', fn: () => applyMd('\n## ', 'Başlık') },
    { label: 'H3', title: 'Başlık 3', fn: () => applyMd('\n### ', 'Alt başlık') },
    { sep: true },
    { label: '🔗', title: 'Bağlantı', fn: () => applyMd('[', 'bağlantı metni', '](https://)') },
    { label: '❝', title: 'Alıntı', fn: () => applyMd('\n> ', 'Alıntı metni') },
    { label: '<>', title: 'Satır içi kod', fn: () => applyMd('`', 'kod', '`') },
    { label: '▦', title: 'Kod bloğu', fn: () => applyMd('\n```js\n', '// kodunuz', '\n```') },
    { sep: true },
    { label: '•', title: 'Madde listesi', fn: () => applyMd('\n- ', 'Liste öğesi') },
    { label: '1.', title: 'Numaralı liste', fn: () => applyMd('\n1. ', 'Liste öğesi') },
    { label: '▤', title: 'Tablo', fn: () => applyMd('\n| Başlık 1 | Başlık 2 |\n|----------|----------|\n| hücre | hücre |\n') },
    { label: '—', title: 'Yatay çizgi', fn: () => applyMd('\n---\n') },
  ];

  /* ---------- Kaydet ---------- */
  const payload = useMemo(() => {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return {
      title: form.title.trim(),
      slug: effectiveSlug,
      excerpt: form.excerpt.trim(),
      content: form.content,
      category: form.category.trim() || 'Genel',
      tags,
      author: form.author.trim() || 'PastMyBlog',
      cover: form.cover,
      featured: form.featured,
      published: form.published,
    };
  }, [form, effectiveSlug]);

  async function save() {
    if (!payload.title) {
      setSaveMsg({ type: 'err', text: 'Başlık zorunlu.' });
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      if (isNew) {
        const res = await api.createPost(payload);
        setSaveMsg({ type: 'ok', text: res.message });
        setTimeout(() => navigate('/admin/yazilar', { replace: true }), 700);
      } else {
        const res = await api.updatePost(id, payload);
        setSaveMsg({ type: 'ok', text: res.message });
        setForm((f) => ({ ...f, slug: res.post.slug }));
      }
    } catch (err) {
      setSaveMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  // Ctrl+S ile kaydet
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, isNew, id]);

  async function removePost() {
    if (!window.confirm('Bu yazı kalıcı olarak silinsin mi?')) return;
    try {
      await api.deletePost(id);
      navigate('/admin/yazilar', { replace: true });
    } catch (err) {
      setSaveMsg({ type: 'err', text: err.message });
    }
  }

  if (loading) return <Spinner label="Yazı yükleniyor..." />;
  if (loadError) return <ErrorAlert error={loadError} />;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{isNew ? '➕ Yeni Yazı' : '✏️ Yazıyı Düzenle'}</h1>
          <p>
            {words.toLocaleString('tr-TR')} kelime · ~{readingTime(form.content)} dk okuma
            {!isNew && form.slug && (
              <> · <Link to={`/yazilar/${form.slug}`} target="_blank" rel="noreferrer">yazıyı görüntüle ↗</Link></>
            )}
          </p>
        </div>
        <div className="save-bar">
          {saveMsg && <span className={`inline-msg ${saveMsg.type}`}>{saveMsg.text}</span>}
          <Link to="/admin/yazilar" className="btn btn-ghost">← Listeye dön</Link>
          {!isNew && (
            <button className="btn btn-danger" onClick={removePost}>🗑️ Sil</button>
          )}
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Kaydediliyor...' : isNew ? '💾 Oluştur' : '💾 Kaydet'}
          </button>
        </div>
      </div>

      <div className="editor-grid">
        {/* ---------- Ana editör ---------- */}
        <div className="editor-main">
          <input
            className="editor-title-input"
            type="text"
            placeholder="Yazı başlığı..."
            maxLength={160}
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            autoFocus={isNew}
          />
          <div className="slug-preview" title="Yazının adresi">
            pastmyblog.dev/yazilar/<strong>{effectiveSlug || 'baslik-bekleniyor'}</strong>
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="ed-excerpt">Özet (liste kartlarında görünür)</label>
            <textarea
              id="ed-excerpt"
              rows={2}
              maxLength={400}
              placeholder="Yazının 1-2 cümlelik özeti..."
              value={form.excerpt}
              onChange={(e) => set({ excerpt: e.target.value })}
            />
            <span className="hint">{form.excerpt.length}/400</span>
          </div>

          <div className="field">
            <label htmlFor="ed-content">İçerik (Markdown)</label>
            <div className="md-toolbar">
              {toolbar.map((t, i) =>
                t.sep ? (
                  <span className="tb-sep" key={`sep${i}`} />
                ) : (
                  <button key={i} type="button" title={t.title} style={t.style} onClick={t.fn}>
                    {t.label}
                  </button>
                )
              )}
              <span className="tb-spacer" />
              <div className="editor-tabs">
                <button type="button" className={tab === 'write' ? 'active' : ''} onClick={() => setTab('write')}>
                  ✍️ Yaz
                </button>
                <button type="button" className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>
                  👁️ Önizle
                </button>
              </div>
            </div>

            {tab === 'write' ? (
              <textarea
                id="ed-content"
                ref={contentRef}
                className="md-textarea"
                placeholder={'Markdown ile yazın...\n\n## Başlık\n\nParagraf metni, **kalın**, *italik*, `kod`.\n\n- liste öğesi\n\n```js\nconsole.log("merhaba");\n```'}
                value={form.content}
                onChange={(e) => set({ content: e.target.value })}
              />
            ) : (
              <div className="md-preview">
                {form.content.trim() ? (
                  <Markdown source={form.content} />
                ) : (
                  <p className="muted small">Önizlenecek içerik yok. "Yaz" sekmesinden bir şeyler yazın.</p>
                )}
              </div>
            )}
          </div>

          <p className="hint faint">
            İpucu: <span className="kbd">Ctrl</span> + <span className="kbd">S</span> ile hızlı kaydedin.
            Başlıklar otomatik olarak içindekiler tablosuna eklenir.
          </p>
        </div>

        {/* ---------- Yan ayarlar ---------- */}
        <div>
          <div className="editor-side-card">
            <h3>Yayınlama</h3>
            <label className="checkbox-row" style={{ marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set({ published: e.target.checked })}
              />
              Yayında {form.published ? '🟢' : '⚪ (taslak)'}
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set({ featured: e.target.checked })}
              />
              Öne çıkan yazı ⭐
            </label>
          </div>

          <div className="editor-side-card">
            <h3>Kapak Görünümü</h3>
            <div className="cover-preview" style={{ background: form.cover.gradient }}>
              <span>{form.cover.emoji}</span>
            </div>
            <div className="gradient-picker" style={{ marginBottom: 12 }}>
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`gradient-swatch ${form.cover.gradient === g ? 'selected' : ''}`}
                  style={{ background: g }}
                  title="Bu gradyanı seç"
                  onClick={() => set({ cover: { ...form.cover, gradient: g } })}
                />
              ))}
            </div>
            <div className="emoji-picker">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={`emoji-swatch ${form.cover.emoji === em ? 'selected' : ''}`}
                  onClick={() => set({ cover: { ...form.cover, emoji: em } })}
                >
                  {em}
                </button>
              ))}
              <input
                type="text"
                maxLength={4}
                style={{ width: 52, textAlign: 'center', borderRadius: 9, border: '2px solid var(--border)', background: 'var(--bg)' }}
                value={EMOJIS.includes(form.cover.emoji) ? '' : form.cover.emoji}
                placeholder="✏️"
                title="Serbest emoji"
                onChange={(e) => set({ cover: { ...form.cover, emoji: e.target.value || '📝' } })}
              />
            </div>
          </div>

          <div className="editor-side-card">
            <h3>Sınıflandırma</h3>
            <div className="field">
              <label htmlFor="ed-cat">Kategori</label>
              <input
                id="ed-cat"
                type="text"
                list="cat-list"
                maxLength={40}
                placeholder="örn. Yazılım"
                value={form.category}
                onChange={(e) => set({ category: e.target.value })}
              />
              <datalist id="cat-list">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label htmlFor="ed-tags">Etiketler (virgülle ayırın)</label>
              <input
                id="ed-tags"
                type="text"
                placeholder="react, javascript, frontend"
                value={form.tags}
                onChange={(e) => set({ tags: e.target.value })}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="ed-slug">Slug (adres) — boş bırakılırsa başlıktan üretilir</label>
              <input
                id="ed-slug"
                type="text"
                placeholder={slugify(form.title) || 'otomatik-slug'}
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: slugify(e.target.value) });
                }}
              />
              {!slugTouched && <span className="hint">Otomatik mod: başlığı değiştirdikçe slug güncellenir.</span>}
            </div>
          </div>

          <div className="editor-side-card">
            <h3>Yazar</h3>
            <div className="field" style={{ marginBottom: 0 }}>
              <input
                type="text"
                maxLength={60}
                value={form.author}
                onChange={(e) => set({ author: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
