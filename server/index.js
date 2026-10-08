import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { store } from './lib/store.js';
import { verifyPassword } from './lib/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

/** Türkçe karakterlere uygun slug üretici */
function slugify(text) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
  return String(text)
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (ch) => map[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 80);
}

/** Türkçe duyarlı küçük harfe çevirme (arama için) */
const trLower = (s) => String(s ?? '').toLocaleLowerCase('tr');

/** Okuma süresi (dakika) — ~200 kelime/dk */
function readingTime(content) {
  const words = String(content ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Listeleme için post özeti (içerik hariç) */
function toSummary(p) {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    category: p.category,
    tags: p.tags,
    author: p.author,
    cover: p.cover,
    featured: p.featured,
    published: p.published,
    createdAt: p.createdAt,
    views: p.views,
    likes: p.likes,
    readingTime: readingTime(p.content),
    commentCount: store.comments.filter((c) => c.postId === p.id && c.approved).length,
  };
}

function publishedPosts() {
  return store.posts.filter((p) => p.published);
}

function findPost(slugOrId) {
  return store.posts.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

const clientIp = (req) => req.ip || req.socket.remoteAddress || 'bilinmeyen';

// ---------------------------------------------------------------------------
// Yönetici kimlik doğrulama (bellek içi oturum belirteçleri)
// ---------------------------------------------------------------------------

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat
const sessions = new Map(); // token -> { username, expiresAt }

function createSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const session = token ? sessions.get(token) : null;
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Oturum geçersiz veya süresi dolmuş. Yeniden giriş yapın.' });
  }
  session.expiresAt = Date.now() + TOKEN_TTL_MS; // kayan süre
  req.admin = session;
  next();
}

// ---------------------------------------------------------------------------
// Genel API
// ---------------------------------------------------------------------------

/** Site bilgileri (başlık, slogan) */
app.get('/api/site', (req, res) => {
  const { siteName, tagline } = store.settings;
  res.json({ siteName, tagline });
});

/** Kategori ve etiket listeleri (yayınlanmış yazı sayılarıyla) */
app.get('/api/meta', (req, res) => {
  const posts = publishedPosts();
  const catCount = {};
  const tagCount = {};
  for (const p of posts) {
    catCount[p.category] = (catCount[p.category] ?? 0) + 1;
    for (const t of p.tags ?? []) tagCount[t] = (tagCount[t] ?? 0) + 1;
  }
  res.json({
    categories: Object.entries(catCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr')),
    tags: Object.entries(tagCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr')),
  });
});

/** Yazı listesi: arama, filtre, sıralama, sayfalama */
app.get('/api/posts', (req, res) => {
  const {
    q, category, tag, featured,
    sort = 'new',
    page = 1,
    limit = 6,
  } = req.query;

  let posts = publishedPosts();

  if (featured === '1' || featured === 'true') posts = posts.filter((p) => p.featured);
  if (category) posts = posts.filter((p) => p.category === category);
  if (tag) posts = posts.filter((p) => (p.tags ?? []).includes(tag));
  if (q) {
    const needle = trLower(q);
    posts = posts.filter((p) =>
      [p.title, p.excerpt, ...(p.tags ?? [])].some((f) => trLower(f).includes(needle))
    );
  }

  if (sort === 'popular') {
    posts = [...posts].sort((a, b) => b.views + b.likes * 3 - (a.views + a.likes * 3));
  } else {
    posts = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = posts.length;
  const perPage = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 48);
  const pages = Math.max(1, Math.ceil(total / perPage));
  const pageNum = Math.min(Math.max(parseInt(page, 10) || 1, 1), pages);
  const start = (pageNum - 1) * perPage;

  res.json({
    posts: posts.slice(start, start + perPage).map(toSummary),
    total,
    page: pageNum,
    pages,
    limit: perPage,
  });
});

/** Tek yazı (slug veya id ile) — görüntülenme sayacını artırır */
app.get('/api/posts/:slug', (req, res) => {
  const post = findPost(req.params.slug);
  if (!post || !post.published) {
    return res.status(404).json({ error: 'Yazı bulunamadı.' });
  }
  const viewKey = `${clientIp(req)}:${post.id}`;
  if (!viewTracker.has(viewKey)) {
    viewTracker.add(viewKey);
    post.views += 1;
    store.save();
  }
  res.json({
    ...toSummary(post),
    content: post.content,
    updatedAt: post.updatedAt,
    likedByMe: likeTracker.has(viewKey),
  });
});

/** Benzer yazılar (aynı kategori veya ortak etiket) */
app.get('/api/posts/:slug/related', (req, res) => {
  const post = findPost(req.params.slug);
  if (!post || !post.published) return res.status(404).json({ error: 'Yazı bulunamadı.' });

  const scored = publishedPosts()
    .filter((p) => p.id !== post.id)
    .map((p) => {
      let score = 0;
      if (p.category === post.category) score += 3;
      score += (p.tags ?? []).filter((t) => (post.tags ?? []).includes(t)).length;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.p.createdAt) - new Date(a.p.createdAt))
    .slice(0, 3);

  res.json({ posts: scored.map((x) => toSummary(x.p)) });
});

// Görüntülenme / beğeni tekrarını engelleyen bellek içi kayıtlar
const viewTracker = new Set();
const likeTracker = new Set();

/** Yazıyı beğen (IP başına bir kez) */
app.post('/api/posts/:slug/like', (req, res) => {
  const post = findPost(req.params.slug);
  if (!post || !post.published) return res.status(404).json({ error: 'Yazı bulunamadı.' });

  const key = `${clientIp(req)}:${post.id}`;
  if (!likeTracker.has(key)) {
    likeTracker.add(key);
    post.likes += 1;
    store.save();
  }
  res.json({ likes: post.likes, likedByMe: true });
});

/** Bir yazının onaylı yorumları */
app.get('/api/posts/:slug/comments', (req, res) => {
  const post = findPost(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Yazı bulunamadı.' });
  const comments = store.comments
    .filter((c) => c.postId === post.id && c.approved)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ id, name, content, createdAt }) => ({ id, name, content, createdAt }));
  res.json({ comments });
});

/** Yeni yorum gönder (yönetici onayına düşer) */
app.post('/api/posts/:slug/comments', (req, res) => {
  const post = findPost(req.params.slug);
  if (!post || !post.published) return res.status(404).json({ error: 'Yazı bulunamadı.' });

  const name = String(req.body?.name ?? '').trim();
  const content = String(req.body?.content ?? '').trim();
  const email = String(req.body?.email ?? '').trim();

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ error: 'İsim 2-60 karakter arasında olmalı.' });
  }
  if (content.length < 5 || content.length > 2000) {
    return res.status(400).json({ error: 'Yorum 5-2000 karakter arasında olmalı.' });
  }

  const comment = {
    id: store.nextId('c', store.comments),
    postId: post.id,
    name,
    email: email.slice(0, 120),
    content: content.slice(0, 2000),
    createdAt: new Date().toISOString(),
    approved: false, // yönetici onayı bekler
  };
  store.comments.push(comment);
  store.save();
  res.status(201).json({ message: 'Yorumunuz gönderildi ve onay bekliyor. Teşekkürler! 🙌' });
});

/** İletişim formu */
app.post('/api/contact', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim();
  const message = String(req.body?.message ?? '').trim();

  if (name.length < 2) return res.status(400).json({ error: 'Lütfen adınızı girin.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
  if (message.length < 10) return res.status(400).json({ error: 'Mesaj en az 10 karakter olmalı.' });

  store.messages.push({
    id: store.nextId('m', store.messages),
    name: name.slice(0, 80),
    email: email.slice(0, 120),
    message: message.slice(0, 4000),
    createdAt: new Date().toISOString(),
    read: false,
  });
  store.save();
  res.status(201).json({ message: 'Mesajınız iletildi! En kısa sürede dönüş yapacağız. ✉️' });
});

/** Bülten aboneliği */
app.post('/api/subscribe', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi girin.' });
  }
  if (store.subscribers.some((s) => s.email === email)) {
    return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı. 😊' });
  }
  store.subscribers.push({
    id: store.nextId('s', store.subscribers),
    email,
    createdAt: new Date().toISOString(),
  });
  store.save();
  res.status(201).json({ message: 'Aboneliğiniz onaylandı! Hoş geldiniz. 🎉' });
});

// ---------------------------------------------------------------------------
// Yönetici API
// ---------------------------------------------------------------------------

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const adminCfg = store.settings.admin;
  if (
    username === adminCfg.username &&
    typeof password === 'string' &&
    verifyPassword(password, adminCfg.salt, adminCfg.hash)
  ) {
    const token = createSession(username);
    return res.json({ token, username });
  }
  res.status(401).json({ error: 'Kullanıcı adı veya parola hatalı.' });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ username: req.admin.username, expiresAt: req.admin.expiresAt });
});

/** Panel istatistikleri */
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const posts = store.posts;
  res.json({
    totalPosts: posts.length,
    publishedPosts: posts.filter((p) => p.published).length,
    draftPosts: posts.filter((p) => !p.published).length,
    totalViews: posts.reduce((s, p) => s + (p.views ?? 0), 0),
    totalLikes: posts.reduce((s, p) => s + (p.likes ?? 0), 0),
    totalComments: store.comments.length,
    pendingComments: store.comments.filter((c) => !c.approved).length,
    totalMessages: store.messages.length,
    unreadMessages: store.messages.filter((m) => !m.read).length,
    totalSubscribers: store.subscribers.length,
    recentComments: [...store.comments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((c) => ({
        ...c,
        postTitle: posts.find((p) => p.id === c.postId)?.title ?? '?',
        postSlug: posts.find((p) => p.id === c.postId)?.slug ?? null,
      })),
    topPosts: [...posts]
      .filter((p) => p.published)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((p) => ({ id: p.id, title: p.title, slug: p.slug, views: p.views, likes: p.likes })),
  });
});

/** Tüm yazılar (taslaklar dahil) */
app.get('/api/admin/posts', requireAdmin, (req, res) => {
  const posts = [...store.posts]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((p) => ({
      ...toSummary(p),
      updatedAt: p.updatedAt,
      contentLength: p.content?.length ?? 0,
    }));
  res.json({ posts });
});

/** Tek yazı (düzenleme için, içerik dahil) */
app.get('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const post = store.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Yazı bulunamadı.' });
  res.json({ post });
});

/** Yeni yazı oluştur */
app.post('/api/admin/posts', requireAdmin, (req, res) => {
  const b = req.body ?? {};
  if (!String(b.title ?? '').trim()) return res.status(400).json({ error: 'Başlık zorunlu.' });

  const now = new Date().toISOString();
  let slug = String(b.slug ?? '').trim() || slugify(b.title);
  if (store.posts.some((p) => p.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;

  const post = {
    id: store.nextId('p', store.posts),
    title: String(b.title).trim().slice(0, 160),
    slug,
    excerpt: String(b.excerpt ?? '').trim().slice(0, 400),
    content: String(b.content ?? ''),
    category: String(b.category ?? 'Genel').trim().slice(0, 40),
    tags: Array.isArray(b.tags)
      ? b.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : [],
    author: String(b.author ?? 'PastMyBlog').trim().slice(0, 60),
    cover: {
      gradient: String(b.cover?.gradient ?? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'),
      emoji: String(b.cover?.emoji ?? '📝').slice(0, 8),
    },
    featured: Boolean(b.featured),
    published: Boolean(b.published),
    createdAt: now,
    updatedAt: now,
    views: 0,
    likes: 0,
  };
  store.posts.push(post);
  store.save();
  res.status(201).json({ post, message: 'Yazı oluşturuldu. ✅' });
});

/** Yazıyı güncelle */
app.patch('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const post = store.posts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Yazı bulunamadı.' });

  const b = req.body ?? {};
  const titleChanged = b.title !== undefined && String(b.title).trim() !== post.title;

  if (titleChanged) post.title = String(b.title).trim().slice(0, 160);
  if (b.slug !== undefined) {
    const newSlug = String(b.slug).trim() || slugify(post.title);
    if (newSlug !== post.slug && store.posts.some((p) => p.slug === newSlug && p.id !== post.id)) {
      return res.status(409).json({ error: 'Bu slug başka bir yazıda kullanılıyor.' });
    }
    post.slug = newSlug;
  } else if (titleChanged) {
    const autoSlug = slugify(post.title);
    if (!store.posts.some((p) => p.slug === autoSlug && p.id !== post.id)) post.slug = autoSlug;
  }
  if (b.excerpt !== undefined) post.excerpt = String(b.excerpt).trim().slice(0, 400);
  if (b.content !== undefined) post.content = String(b.content);
  if (b.category !== undefined) post.category = String(b.category).trim().slice(0, 40) || post.category;
  if (b.tags !== undefined && Array.isArray(b.tags)) {
    post.tags = b.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 10);
  }
  if (b.author !== undefined) post.author = String(b.author).trim().slice(0, 60) || post.author;
  if (b.cover !== undefined) {
    post.cover = {
      gradient: String(b.cover?.gradient ?? post.cover.gradient),
      emoji: String(b.cover?.emoji ?? post.cover.emoji).slice(0, 8),
    };
  }
  if (b.featured !== undefined) post.featured = Boolean(b.featured);
  if (b.published !== undefined) post.published = Boolean(b.published);

  post.updatedAt = new Date().toISOString();
  store.save();
  res.json({ post, message: 'Yazı güncellendi. ✅' });
});

/** Yazıyı sil (yorumları da temizler) */
app.delete('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const idx = store.posts.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Yazı bulunamadı.' });
  const [removed] = store.posts.splice(idx, 1);
  store.data.comments = store.comments.filter((c) => c.postId !== removed.id);
  store.save();
  res.json({ ok: true, message: `"${removed.title}" silindi.` });
});

/** Tüm yorumlar (bekleyenler dahil) */
app.get('/api/admin/comments', requireAdmin, (req, res) => {
  const filter = req.query.status; // 'pending' | 'approved' | undefined (hepsi)
  let comments = [...store.comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (filter === 'pending') comments = comments.filter((c) => !c.approved);
  if (filter === 'approved') comments = comments.filter((c) => c.approved);
  res.json({
    comments: comments.map((c) => ({
      ...c,
      postTitle: store.posts.find((p) => p.id === c.postId)?.title ?? '(silinmiş yazı)',
      postSlug: store.posts.find((p) => p.id === c.postId)?.slug ?? null,
    })),
  });
});

/** Yorumu onayla / onayı kaldır */
app.patch('/api/admin/comments/:id', requireAdmin, (req, res) => {
  const comment = store.comments.find((c) => c.id === req.params.id);
  if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı.' });
  if (req.body?.approved !== undefined) comment.approved = Boolean(req.body.approved);
  store.save();
  res.json({ comment, message: comment.approved ? 'Yorum onaylandı. ✅' : 'Yorum onayı kaldırıldı.' });
});

/** Yorumu sil */
app.delete('/api/admin/comments/:id', requireAdmin, (req, res) => {
  const idx = store.comments.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Yorum bulunamadı.' });
  store.comments.splice(idx, 1);
  store.save();
  res.json({ ok: true, message: 'Yorum silindi.' });
});

/** Mesajlar */
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = [...store.messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ messages });
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const msg = store.messages.find((m) => m.id === req.params.id);
  if (!msg) return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  if (req.body?.read !== undefined) msg.read = Boolean(req.body.read);
  store.save();
  res.json({ message: 'Güncellendi.' , msg });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const idx = store.messages.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  store.messages.splice(idx, 1);
  store.save();
  res.json({ ok: true, message: 'Mesaj silindi.' });
});

/** Bülten aboneleri */
app.get('/api/admin/subscribers', requireAdmin, (req, res) => {
  res.json({
    subscribers: [...store.subscribers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  });
});

app.delete('/api/admin/subscribers/:id', requireAdmin, (req, res) => {
  const idx = store.subscribers.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Abone bulunamadı.' });
  store.subscribers.splice(idx, 1);
  store.save();
  res.json({ ok: true, message: 'Abone silindi.' });
});

// ---------------------------------------------------------------------------
// Üretim modu: derlenmiş frontend'i de bu sunucu sunar
// ---------------------------------------------------------------------------

const distDir = path.join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Bilinmeyen API yolları
app.use('/api', (req, res) => res.status(404).json({ error: 'Böyle bir API ucu yok.' }));

// Genel hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('[api] Beklenmeyen hata:', err);
  res.status(500).json({ error: 'Sunucu hatası oluştu.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PastMyBlog API sunucusu çalışıyor: http://localhost:${PORT}`);
});
