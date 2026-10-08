# 📝 PastMyBlog

**Teknoloji, yazılım ve yaşam üzerine tam donanımlı, modern bir blog platformu.**
Sıfırdan, uçtan uca tasarlandı: React tabanlı bir okuyucu arayüzü, Express tabanlı bir API ve yönetim paneli — hepsi tek depoda.

![Stack](https://img.shields.io/badge/React-18-61dafb) ![Vite](https://img.shields.io/badge/Vite-5-646cff) ![Express](https://img.shields.io/badge/Express-4-22c55e) ![Node](https://img.shields.io/badge/Node-18%2B-3c873a)

---

## ✨ Özellikler

### Okuyucu tarafı
- 🏠 **Ana sayfa** — kahraman bölümü, öne çıkan yazılar, son yazılar ızgarası, kenar çubuğu (kategoriler, popüler yazılar, etiket bulutu, bülten)
- 📚 **Yazı arşivi** — canlı arama (debounce'lu), kategori/etiket filtreleri, sıralama (en yeni / en popüler), akıllı sayfalama
- 📖 **Yazı okuma deneyimi** — Markdown render (XSS korumalı), sözdizimi vurgulama (highlight.js), yapışkan **içindekiler tablosu** (scroll-spy'lı), **okuma ilerleme çubuğu**, okuma süresi, görüntülenme sayacı
- ❤️ **Etkileşim** — beğeni (IP + localStorage ile tekilleştirilmiş), paylaşım (X, LinkedIn, WhatsApp, bağlantı kopyalama), onay akışlı yorum sistemi
- 🔗 **Benzer yazılar** — kategori + etiket skorlamasıyla otomatik öneri
- 🌗 **Koyu/açık tema** — sistem tercihi algılama + kalıcı seçim
- 📱 **Tam duyarlı tasarım** — mobil menü, akıcı ızgaralar, dokunma dostu arayüz
- ✉️ **İletişim formu** ve **bülten aboneliği** (sunucuda saklanır)
- 🧭 Türkçe rotalar: `/yazilar`, `/hakkinda`, `/iletisim` + eğlenceli 404 sayfası

### Yönetim paneli (`/admin`)
- 🔐 **Giriş** — scrypt ile hash'lenmiş parola, 24 saatlik kayan oturum belirteci (Bearer token)
- 📊 **Genel bakış** — 8 istatistik kartı, son yorumlar (hızlı onaylama), en çok okunan yazılar
- ✏️ **Yazı editörü** — Markdown araç çubuğu (kalın, başlık, kod bloğu, tablo...), canlı önizleme sekmesi, otomatik Türkçe slug üretimi, kapak seçici (10 gradyan × 16 emoji + serbest emoji), öne çıkarma, taslak/yayın durumu, `Ctrl+S` ile hızlı kayıt
- 📝 **Yazı yönetimi** — tablo görünümü, tek tıkla yayınla/taslak/öne çıkar/sil
- 💬 **Yorum moderasyonu** — bekleyen/onaylı/tümü sekmeleri, rozet sayaçları
- ✉️ **Mesaj kutusu** — okundu işaretleme, mailto ile yanıtlama
- 👥 **Abone listesi** — bülten kayıtlarını görüntüleme/silme

### Altyapı
- **JSON dosya veritabanı** — harici kurulum gerektirmez; ilk açılışta 8 örnek Türkçe yazı, yorumlar, mesajlar ve abonelerle otomatik tohumlanır (debounce'lu atomik yazma)
- **REST API** — 25+ uç, Türkçe duyarlı arama/slug, sayfalama, doğrulama ve merkezi hata yönetimi
- **Güvenlik** — DOMPurify ile HTML arındırma, zamanlama-güvenli parola karşılaştırma, girdi doğrulama ve uzunluk sınırları
- **Üretim modu** — `npm run build` + `npm start` ile API ve derlenmiş frontend tek süreçte (SPA fallback dahil)

---

## 🚀 Hızlı Başlangıç

Gereksinim: **Node.js 18+**

```bash
# 1. Bağımlılıkları kur
npm install

# 2. Geliştirme modunu başlat (API :4000 + Vite :5173 birlikte)
npm run dev

# 3. Tarayıcıda aç
# http://localhost:5173
```

> Veritabanı ilk açılışta `server/data/db.json` olarak otomatik oluşturulur ve
> örnek içerikle doldurulur. Sıfırlamak için bu dosyayı silip sunucuyu yeniden başlatın.

### Yönetim paneli

| Alan | Değer |
|------|-------|
| Adres | `http://localhost:5173/admin` |
| Kullanıcı adı | `admin` |
| Parola | `admin123` |

> ⚠️ Gerçek dağıtımda parolayı mutlaka değiştirin: `server/data/db.json` dosyasını
> silin, `server/lib/seed.js` içindeki `hashPassword('admin123')` çağrısını yeni
> parolanızla güncelleyin ve sunucuyu yeniden başlatın.

### Üretim dağıtımı

```bash
npm run build   # frontend'i dist/ klasörüne derler
npm start       # API + statik frontend tek süreçte (PORT varsayılan 4000)
```

---

## 📁 Proje Yapısı

```
pastmyblog/
├── index.html                  # Vite giriş HTML'i
├── vite.config.js              # Vite + /api proxy yapılandırması
├── package.json
├── public/                     # favicon, robots.txt
├── server/                     # ---- BACKEND (Express) ----
│   ├── index.js                # API uçları, auth, statik sunum
│   ├── lib/
│   │   ├── store.js            # JSON dosya veritabanı katmanı
│   │   └── seed.js             # Örnek içerik + parola hash'leme
│   └── data/
│       └── db.json             # (çalışma zamanında oluşur, git dışında)
└── src/                        # ---- FRONTEND (React) ----
    ├── main.jsx                # Giriş noktası
    ├── App.jsx                 # Rotalar + yerleşim
    ├── api.js                  # API istemcisi (token yönetimi dahil)
    ├── theme.js                # Koyu/açık tema yardımcıları
    ├── utils.js                # Tarih, slug, sayı biçimlendirme
    ├── styles/
    │   ├── global.css          # Tema değişkenleri, tipografi, markdown
    │   ├── components.css      # Navbar, kartlar, formlar, yorumlar...
    │   └── admin.css           # Yönetim paneli stilleri
    ├── components/             # Navbar, Footer, PostCard, Markdown,
    │                           # TOC, yorumlar, beğeni/paylaşım, ...
    ├── pages/                  # Ana sayfa, arşiv, yazı, hakkında,
    │                           # iletişim, 404
    └── admin/                  # Giriş, panel, yazı editörü, yorum
                                # moderasyonu, mesajlar, aboneler
```

---

## 🔌 API Referansı

### Genel uçlar

| Metot | Uç | Açıklama |
|-------|----|----------|
| GET | `/api/site` | Site adı ve sloganı |
| GET | `/api/meta` | Kategori ve etiketler (yazı sayılarıyla) |
| GET | `/api/posts` | Yazı listesi — `q`, `category`, `tag`, `featured`, `sort=new\|popular`, `page`, `limit` |
| GET | `/api/posts/:slug` | Yazı detayı (görüntülenme +1) |
| GET | `/api/posts/:slug/related` | Benzer yazılar (kategori/etiket skoru) |
| POST | `/api/posts/:slug/like` | Beğen (IP başına 1 kez) |
| GET | `/api/posts/:slug/comments` | Onaylı yorumlar |
| POST | `/api/posts/:slug/comments` | Yorum gönder → onay kuyruğuna düşer |
| POST | `/api/contact` | İletişim mesajı `{name, email, message}` |
| POST | `/api/subscribe` | Bülten aboneliği `{email}` |

### Yönetici uçları (`Authorization: Bearer <token>` gerekir)

| Metot | Uç | Açıklama |
|-------|----|----------|
| POST | `/api/admin/login` | Giriş `{username, password}` → `{token}` |
| POST | `/api/admin/logout` | Oturumu kapat |
| GET | `/api/admin/me` | Oturum bilgisi |
| GET | `/api/admin/stats` | Panel istatistikleri |
| GET/POST | `/api/admin/posts` | Yazıları listele / yeni yazı oluştur |
| GET/PATCH/DELETE | `/api/admin/posts/:id` | Yazıyı getir / güncelle / sil |
| GET | `/api/admin/comments?status=pending\|approved` | Yorumları listele |
| PATCH/DELETE | `/api/admin/comments/:id` | Onayla (`{approved}`) / sil |
| GET | `/api/admin/messages` | Mesajları listele |
| PATCH/DELETE | `/api/admin/messages/:id` | Okundu işaretle / sil |
| GET | `/api/admin/subscribers` | Aboneleri listele |
| DELETE | `/api/admin/subscribers/:id` | Aboneyi sil |

---

## 🛠️ Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18, React Router 6, Vite 5 |
| Markdown | marked + DOMPurify (XSS koruması) + highlight.js |
| Backend | Node.js, Express 4 |
| Veri | JSON dosya veritabanı (atomik yazma, otomatik tohumlama) |
| Auth | scrypt parola hash'i + bellek içi Bearer token oturumları |
| Stil | Saf CSS (değişken tabanlı tema sistemi), Google Fonts (Inter, Source Serif 4, JetBrains Mono) |

## 📜 Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | API + Vite geliştirme sunucularını birlikte başlatır |
| `npm run dev:server` | Yalnızca API'yi başlatır (:4000) |
| `npm run dev:client` | Yalnızca Vite'ı başlatır (:5173, /api proxy'li) |
| `npm run build` | Frontend'i `dist/` klasörüne derler |
| `npm start` | Üretim modu: API + derlenmiş site tek süreçte |

---

## 🗺️ Yol Haritası Fikirleri

- [ ] SQLite/PostgreSQL'e geçiş ve tam metin arama
- [ ] Gerçek e-posta gönderimi (bülten + yorum bildirimleri)
- [ ] Görsel yükleme (kapak olarak fotoğraf desteği)
- [ ] Yorumlarda iç içe yanıtlar
- [ ] RSS beslemesi ve sitemap.xml
- [ ] Rol tabanlı yetkilendirme (editör / yönetici)

---

❤️ ile React + Express kullanılarak yapıldı.
