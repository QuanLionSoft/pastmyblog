import crypto from 'node:crypto';

// Yönetici parolasını tuz + scrypt ile hash'ler
export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

const P = (
  id,
  title,
  slug,
  category,
  tags,
  excerpt,
  content,
  cover,
  createdAt,
  extra = {}
) => ({
  id,
  title,
  slug,
  category,
  tags,
  excerpt,
  content,
  cover, // { gradient, emoji }
  author: 'PastMyBlog',
  featured: extra.featured ?? false,
  published: extra.published ?? true,
  createdAt,
  updatedAt: createdAt,
  views: extra.views ?? 0,
  likes: extra.likes ?? 0,
});

/** Örnek içeriklerle veritabanını oluşturur (ilk açılışta bir kez çalışır). */
export function createSeedData() {
  const admin = hashPassword('admin123');

  const posts = [
    P(
      'p1',
      'Yapay Zeka ile Kod Yazmak: 2026’da Geliştirici Olmak',
      'yapay-zeka-ile-kod-yazmak',
      'Yapay Zeka',
      ['yapay-zeka', 'kariyer', 'verimlilik'],
      'Kod asistanları artık her geliştiricinin yanında. Peki bu durumda geliştiricinin rolü nasıl değişiyor? Hangi beceriler değer kazanıyor, hangileri otomatikleşiyor?',
`Yapay zeka destekli kod asistanları birkaç yıl içinde "olsa iyi olur" konumundan "olmazsa olmaz" konumuna geçti. Bugün yeni bir projeye başlarken editörümde bir yapay zeka asistanı açık değilse, kendimi eksik hissediyorum. Peki tüm bunlar geliştiricilik mesleğini nereye götürüyor?

## Asistanlar Ne Yapabiliyor, Ne Yapamıyor?

Modern kod asistanları şu konularda gerçekten çok başarılı:

- **Tekrarlayan kod üretimi:** CRUD uçları, veri doğrulama şemaları, test iskeletleri
- **Bağlam tamamlama:** Yarım bıraktığınız fonksiyonun amacını sezip devamını getirme
- **Refaktör önerileri:** Uzun fonksiyonları bölme, isimlendirme iyileştirmeleri
- **Hata ayıklama:** Stack trace'i yapıştırıp kök nedeni dakikalar içinde bulma

Ancak madalyonun öbür yüzü de var:

> Yapay zeka, *ne* yazdığınızı çok iyi bilir ama *neden* yazdığınızı sizin kadar iyi bilemez. İş gereksinimleri, ekip dinamikleri ve uzun vadeli bakım maliyeti hâlâ insanın alanı.

## Değer Kazanan Beceriler

Deneyimlerime göre şu beceriler eskisinden bile önemli hale geldi:

1. **Sistem tasarımı:** Asistanlar parçaları üretiyor ama parçaların nasıl birleşeceğine karar vermek mimarın işi.
2. **Kod okuma ve eleştirme:** Üretilen kodu saniyeler içinde değerlendirebilmek, onu yazabilmek kadar kritik.
3. **İyi soru sorma (prompt mühendisliği):** Belirsiz bir isteği net bir probleme çevirmek, aslında on yıllardır "iyi mühendislik" dediğimiz şeyin ta kendisi.
4. **Alan bilgisi:** Finans, sağlık, lojistik... Domain'i derinlemesine bilen geliştiricinin yerini hiçbir model alamıyor.

## Günlük Akışımda Yapay Zeka

Kendi iş akışımı kabaca şöyle özetleyebilirim:

\`\`\`text
1. Gereksinimi anla ve küçük parçalara böl        -> insan
2. Arayüzleri ve veri modellerini tasarla          -> insan (+ asistan ile tartış)
3. İlk taslak implementasyonu üret                 -> asistan
4. Kodu gözden geçir, testleri yaz                 -> insan + asistan
5. Kenar durumlarını düşün ve sertleştir           -> insan
\`\`\`

Bu akışta dikkat edin: asistan hiçbir adımda *tek başına* sorumlu değil. Sorumluluk her zaman insanda kalıyor.

## Sonuç

Yapay zeka geliştiricileri ortadan kaldırmıyor; **geliştiricinin kaldıracını büyütüyor**. Bir kişi, doğru asistan araçlarıyla eskiden beş kişinin yaptığı işi yapabiliyor. Bu da şu anlama geliyor: vasat kod yazanların rekabet gücü düşerken, düşünen, tasarlayan ve eleştiren geliştiricilerin değeri artıyor.

Siz kod asistanlarını günlük işinizde nasıl kullanıyorsunuz? Yorumlarda tartışalım.`,
      { gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)', emoji: '🤖' },
      '2026-09-28T09:30:00.000Z',
      { featured: true, views: 1284, likes: 96 }
    ),
    P(
      'p2',
      'React 19 ile Gelen Yenilikler ve İlk İzlenimler',
      'react-19-yenilikler',
      'Yazılım',
      ['react', 'javascript', 'frontend'],
      'Actions, useOptimistic, use() API\'si ve çok daha fazlası... React 19\'u gerçek bir projede kullandıktan sonra edindiğim izlenimleri ve geçiş ipuçlarını paylaşıyordum.',
`React 19, topluluğun uzun süredir beklediği "zihinsel modeli sadeleştirme" sürümü olarak geldi. Bu yazıda sürümü gerçek bir projede kullandıktan sonraki izlenimlerimi paylaşacağım.

## Actions: Form Yönetiminde Yeni Dönem

Eskiden bir form gönderimi için \`loading\`, \`error\`, \`success\` durumlarını elle yönetirdik. React 19 ile \`useActionState\` ve \`useFormStatus\` bu işi büyük ölçüde üstleniyor:

\`\`\`jsx
import { useActionState } from "react";

async function kaydet(oncekiDurum, formData) {
  const sonuc = await fetch("/api/yazilar", {
    method: "POST",
    body: JSON.stringify(Object.fromEntries(formData)),
  });
  return sonuc.ok ? { basarili: true } : { hata: "Kayıt başarısız" };
}

function YazıFormu() {
  const [durum, aksiyon, bekleniyor] = useActionState(kaydet, null);
  return (
    <form action={aksiyon}>
      <input name="baslik" required />
      <button disabled={bekleniyor}>
        {bekleniyor ? "Kaydediliyor..." : "Kaydet"}
      </button>
      {durum?.hata && <p className="hata">{durum.hata}</p>}
    </form>
  );
}
\`\`\`

Dikkat edin: ne \`useState\` ile loading takibi var ne de try/catch yığınları. Hook, geçiş durumunu kendisi yönetiyor.

## use() API\'si ile Koşullu Veri Okuma

\`use()\`, promise'leri ve context'i render içinde **koşullu olarak** okuyabilmenizi sağlıyor:

\`\`\`jsx
function Yorumlar({ yorumPromise }) {
  const yorumlar = use(yorumPromise); // Suspense ile birlikte çalışır
  return yorumlar.map((y) => <li key={y.id}>{y.metin}</li>);
}
\`\`\`

Bu, veri çekme mantığını bileşen ağacında çok daha esnek yerleştirmenize olanak tanıyor.

## useOptimistic: Anında Geri Bildirim

Kullanıcı "Beğen" düğmesine bastığında sunucu yanıtını beklemek yerine arayüzü anında güncellemek artık tek hook'luk iş:

\`\`\`jsx
const [gorunenBegeni, begeniyiEkle] = useOptimistic(begeniSayisi);

async function begen() {
  begeniyiEkle((sayi) => sayi + 1); // anında güncelle
  await fetch("/api/begeni", { method: "POST" });
}
\`\`\`

## Geçiş Yaparken Nelere Dikkat Etmeli?

| Konu | Durum |
|------|-------|
| PropTypes | Kaldırıldı, TypeScript tercih edin |
| String ref'ler | Kaldırıldı |
| \`forwardRef\` | Artık gereksiz, doğrudan \`ref\` prop'u geçiliyor |
| JSX dönüşümü | Yeni transform zorunlu |

## Sonuç

React 19, gösterişli yeni özelliklerden çok **gündelik sürtünmeleri azaltan** bir sürüm. Actions modeli özellikle form ağırlıklı uygulamalarda yüzlerce satır durum yönetimi kodunu siliyor. Ben yeni projelerimde doğrudan 19 ile başlamayı, mevcut projelerde ise kademeli geçişi öneriyorum.`,
      { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', emoji: '⚛️' },
      '2026-09-14T14:00:00.000Z',
      { featured: true, views: 943, likes: 71 }
    ),
    P(
      'p3',
      'JavaScript’te Async/Await’i Gerçekten Anlamak',
      'async-await-gercekten-anlamak',
      'Yazılım',
      ['javascript', 'async', 'eğitim'],
      'Event loop, microtask kuyruğu, Promise zincirleri ve sık yapılan hatalar... Async/await\'i ezberlemek yerine anlamak isteyenler için kapsamlı bir rehber.',
`Async/await, JavaScript'in en sevdiğim özelliklerinden biri — ama aynı zamanda hakkında en çok yanılgı barındıranı. Bu yazıda "çalışıyor işte" seviyesinden "nasıl çalıştığını biliyorum" seviyesine geçmeye çalışacağız.

## Promise: Bir Sözün Temsili

Her şey Promise ile başlıyor. Bir Promise, *gelecekte* bir değere dönüşecek olan bir işlemi temsil eder ve üç durumdan birindedir: **pending**, **fulfilled** veya **rejected**.

\`\`\`js
const soz = new Promise((resolve, reject) => {
  setTimeout(() => resolve("veri geldi"), 1000);
});

soz.then((veri) => console.log(veri));
\`\`\`

## Await Aslında Ne Yapıyor?

\`await\`, sihirli bir "bekle" komutu **değildir**. Fonksiyonun \`await\`'ten sonrasını bir microtask olarak kuyruğa alıp fonksiyondan çıkar. Yani JavaScript asla bloklanmaz:

\`\`\`js
async function ornek() {
  console.log("1: başlangıç");
  await null; // sadece bir microtask sınırı!
  console.log("3: await sonrası");
}

console.log("0: çağrıdan önce");
ornek();
console.log("2: çağrıdan sonra");
// Çıktı: 0, 1, 2, 3
\`\`\`

Bu çıktıyı açıklayabiliyorsanız event loop'u anlamışsınız demektir. 🎉

## Sık Yapılan Hata: Gereksiz Serileştirme

En yaygın performans hatası, *bağımsız* işlemleri sırayla beklemektir:

\`\`\`js
// ❌ Kötü: toplam süre = a + b
const kullanicilar = await fetchKullanicilar();
const urunler = await fetchUrunler();

// ✅ İyi: toplam süre = max(a, b)
const [kullanicilar, urunler] = await Promise.all([
  fetchKullanicilar(),
  fetchUrunler(),
]);
\`\`\`

İki istek birbirine bağlı değilse \`Promise.all\` ile paralel çalıştırın. Gerçek dünyada bu tek değişiklik, sayfa yükleme sürelerini yarıya indirebiliyor.

## Hata Yönetimi

\`try/catch\` async dünyada da çalışır; ancak döngü içinde dikkatli olun:

\`\`\`js
async function hepsiniIsle(liste) {
  const sonuclar = await Promise.allSettled(
    liste.map((item) => isle(item))
  );
  for (const s of sonuclar) {
    if (s.status === "rejected") {
      console.error("Bir işlem başarısız:", s.reason);
    }
  }
}
\`\`\`

\`Promise.all\` ilk hatada tüm zinciri düşürürken, \`Promise.allSettled\` her işlemin sonucunu ayrı ayrı raporlar. Toplu işlerde genelde ikincisini isteriz.

## Özet

- \`await\` bloklamaz; fonksiyonun devamını microtask kuyruğuna taşır.
- Bağımsız işleri \`Promise.all\` ile paralelleştirin.
- Kısmi hatalara tolerans gerekiyorsa \`Promise.allSettled\` kullanın.
- \`async\` fonksiyon **her zaman** Promise döndürür — \`return 42\` bile.

Bir sonraki yazıda Node.js tarafında stream'lerle async desenlere bakacağız. Takipte kalın!`,
      { gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', emoji: '⏳' },
      '2026-08-30T11:15:00.000Z',
      { views: 1567, likes: 122 }
    ),
    P(
      'p4',
      'Node.js ve Express ile Sıfırdan REST API Rehberi',
      'nodejs-express-rest-api-rehberi',
      'Yazılım',
      ['nodejs', 'express', 'api', 'backend'],
      'Bu blogun altyapısında da kullandığım yaklaşım: Node.js + Express ile temiz, katmanlı ve bakımı kolay bir REST API\'yi adım adım kuruyoruz.',
`Bu yazıda sıfırdan, üretimde kullanılabilecek sadelikte bir REST API kuracağız. Adımları bilinçli olarak küçük tuttum; her bölümün sonunda çalışan bir kodunuz olacak.

## 1. Proje Kurulumu

\`\`\`bash
mkdir api-ornek && cd api-ornek
npm init -y
npm install express
\`\`\`

\`package.json\` dosyasına \`"type": "module"\` ekleyerek ES module sözdizimini açıyoruz.

## 2. Merhaba Dünya Sunucusu

\`\`\`js
import express from "express";

const app = express();
app.use(express.json()); // JSON gövdeyi ayrıştır

app.get("/api/saglik", (req, res) => {
  res.json({ durum: "ayakta", zaman: new Date().toISOString() });
});

app.listen(4000, () => console.log("API: http://localhost:4000"));
\`\`\`

İlk kuralımız: **her API'ye bir sağlık (health) ucu koyun.** Dağıtım sonrası "çalışıyor mu?" sorusunun cevabı tek istekle gelir.

## 3. Kaynak Modeli ve Rotalar

Bir "görev" kaynağı için tipik REST uçları:

| Metot | Yol | Açıklama |
|-------|-----|----------|
| GET | /api/gorevler | Listele (sayfalama + filtre) |
| POST | /api/gorevler | Yeni görev oluştur |
| GET | /api/gorevler/:id | Tek görevi getir |
| PATCH | /api/gorevler/:id | Kısmi güncelle |
| DELETE | /api/gorevler/:id | Sil |

Rotaları ayrı bir modüle almak projeyi büyüdükçe kurtarır:

\`\`\`js
// routes/gorevler.js
import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  const { durum, sayfa = 1, limit = 10 } = req.query;
  // filtrele + sayfalama uygula
  res.json({ veri: gorevler, sayfa: Number(sayfa) });
});

export default router;
\`\`\`

## 4. Doğrulama ve Hata Yönetimi

Girdi doğrulamayı **asla** es geçmeyin. Basit bir elle doğrulama bile başlangıç için yeter:

\`\`\`js
function gorevDogrula(body) {
  const hatalar = [];
  if (!body.baslik?.trim()) hatalar.push("baslik zorunlu");
  if (body.baslik?.length > 120) hatalar.push("baslik en fazla 120 karakter");
  return hatalar;
}

router.post("/", (req, res) => {
  const hatalar = gorevDogrula(req.body);
  if (hatalar.length) {
    return res.status(400).json({ hatalar });
  }
  // kaydet...
  res.status(201).json({ veri: yeniGorev });
});
\`\`\`

Merkezi hata yakalayıcıyı en sona ekleyin:

\`\`\`js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status ?? 500).json({ hata: err.message ?? "Beklenmeyen hata" });
});
\`\`\`

## 5. Test Etmek

\`curl\` ile hızlıca deneyin:

\`\`\`bash
curl -X POST http://localhost:4000/api/gorevler \\
  -H "Content-Type: application/json" \\
  -d '{"baslik": "İlk görevim"}'
\`\`\`

## Sonuç

Küçük ama disiplinli bir Express API'si kurduk: katmanlı rotalar, doğrulama, merkezi hata yönetimi ve sağlık ucu. Bu blog da benzer bir mimariyle çalışıyor — kaynağı inceleyerek gerçek bir örneğini görebilirsiniz. Bir sonraki adım olarak kimlik doğrulama (JWT) ve veritabanı katmanını ekleyeceğiz.`,
      { gradient: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)', emoji: '🛠️' },
      '2026-08-12T08:45:00.000Z',
      { views: 2103, likes: 154 }
    ),
    P(
      'p5',
      'CSS Grid ile Modern Sayfa Yerleşimleri',
      'css-grid-modern-yerlesimler',
      'Tasarım',
      ['css', 'grid', 'tasarım', 'frontend'],
      'Flexbox mu Grid mi tartışmasını bir kenara bırakın: Grid\'in iki boyutlu gücüyle karmaşık yerleşimleri nasıl zahmetsizce kuracağınızı örneklerle anlatıyorum.',
`CSS Grid, tarayıcıya yerleşimi *bildirmek* için var: "burada 3 sütun olsun, ortadaki iki kat genişliğinde olsun, ekran daralınca teke düşsün." Bu kadarını söylemeniz çoğu zaman yeterli.

## Temel: Satır ve Sütun Rayları

\`\`\`css
.kapsayici {
  display: grid;
  grid-template-columns: 2fr 1fr; /* içerik + kenar çubuğu */
  gap: 24px;
}
\`\`\`

Sadece bu üç satır, yıllarca float ve flexbox taklalarıyla kurduğumuz "içerik + sidebar" düzenini veriyor.

## auto-fit + minmax: Medya Sorgusuz Duyarlılık

En sevdiğim Grid numarası:

\`\`\`css
.kart-izgara {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}
\`\`\`

Tek bir medya sorgusu yazmadan, kartlar ekrana sığdığı kadar sütuna dağılır. Bu blogdaki yazı listesi de tam olarak bu deseni kullanıyor.

## İsimli Alanlar: Yerleşimi Çizerek Tanımlamak

\`\`\`css
.sayfa {
  display: grid;
  grid-template-areas:
    "ust    ust"
    "icerik yan"
    "alt    alt";
  grid-template-columns: 1fr 320px;
}
.ust    { grid-area: ust; }
.icerik { grid-area: icerik; }
.yan    { grid-area: yan; }
.alt    { grid-area: alt; }
\`\`\`

\`grid-template-areas\` adeta ASCII art ile tasarım yapmak gibi. Mobilde alanları yeniden dizmek tek satır:

\`\`\`css
@media (max-width: 768px) {
  .sayfa {
    grid-template-areas:
      "ust"
      "icerik"
      "yan"
      "alt";
    grid-template-columns: 1fr;
  }
}
\`\`\`

## Flexbox Nerede Kalıyor?

Grid iki boyutlu (satır **ve** sütun), Flexbox tek boyutludur. Kuralım basit:

- Sayfa/ bölüm yerleşimi -> **Grid**
- Bir satır içindeki öğeler (menü, etiketler, düğme grupları) -> **Flexbox**

İkisi rakip değil, farklı ölçeklerin araçları.

## Sonuç

Grid'i öğrendikten sonra yerleşim yazmak, bulmaca çözmekten plan çizmeye dönüşüyor. Henüz kullanmadıysanız \`auto-fit + minmax\` deseniyle bugün başlayın; ilk denemenizde bile farkı hissedeceksiniz.`,
      { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)', emoji: '🎨' },
      '2026-07-21T16:20:00.000Z',
      { views: 1189, likes: 88 }
    ),
    P(
      'p6',
      'Derin Çalışma: Dikkat Dağıtıcıların Çağında Odaklanma Sanatı',
      'derin-calisma-odaklanma-sanati',
      'Üretkenlik',
      ['üretkenlik', 'odaklanma', 'kitap'],
      'Cal Newport\'un "Derin Çalışma" kitabından öğrendiklerimi, bir yazılım geliştiricinin günlük rutinine nasıl uyarladığımı anlatıyorum. Bildirimler sizi de mi esir aldı?',
`Cal Newport'un *Derin Çalışma (Deep Work)* kitabını okuduktan sonra çalışma biçimimi kökten değiştirdim. Bu yazıda kitaptaki temel fikirleri ve kendi uyguladığım pratikleri özetliyorum.

## Derin Çalışma Nedir?

Newport'un tanımıyla derin çalışma, **dikkatinizi bölmeden, bilişisel sınırlarınızı zorlayarak** yürüttüğünüz odaklanmış çalışma halidir. Yeni değer üretir, taklit edilmesi zordur ve nadir olduğu için değerlidir.

Buna karşılık **yüzeysel çalışma** — e-postalar, toplantılar, Slack bildirimleri — kolaydır, her yerdedir ve maalesef çoğu insanın gününün %70'ini yutar.

## Neden Bu Kadar Zor?

Beynimiz yeniliğe programlıdır; her bildirim küçük bir dopamin ödülü sunar. Sorun şu:

> Dikkatinizi her böldüğünüzde, tam odağa dönmeniz ortalama 20+ dakika sürer. Günde 10 kez bölünmek, neredeyse tüm derin çalışma kapasitenizi sıfırlar.

## Uyguladığım 5 Pratik

1. **Zaman bloklama:** Takvimime 09:00–11:30 arasını "derin blok" olarak işliyorum. Bu saatlerde toplantı yok, Slack kapalı, telefon başka odada.
2. **Kapatma ritüeli:** 18:00'de günü resmen kapatıyorum — açık görevleri yazıp "yarın ilk iş" listesi oluşturuyorum. Zihnim, kapanışı görünce dinlenmeye izin veriyor.
3. **Dikkat dağıtıcıları görünmez yapma:** Bildirimlerin %95'i kapalı. E-posta günde 3 sabit saatte kontrol ediliyor.
4. **2 dakikalık başlangıç kuralı:** Başlamakta zorlandığımda kendime "sadece 2 dakika çalışacağım" diyorum. Devamı neredeyse her zaman kendiliğinden geliyor.
5. **Skor tutma:** Her derin blok sonrası kaç dakika odaklandığımı yazıyorum. Ölçülen şey gelişiyor.

## Geliştiriciler İçin Özel Not

Kod yazarken "akışa girmek" derin çalışmanın en saf hali. Akışı korumak için:

- Bağlam değiştirmeyi en aza indirin (PR incelemelerini tek seferde yapın)
- Kulaklık takmak, etrafa "rahatsız etmeyin" sinyali verir
- Zor problemi günün ilk derin bloğuna koyun — irade sabah en yüksek seviyede

## Sonuç

Derin çalışma bir yetenek değil, **antrenmanla gelişen bir alışkanlık**. Yarın sabah tek bir 90 dakikalık blokla başlayın. Bir ay sonra ürettiğiniz işin kalitesindeki fark sizi şaşırtacak.`,
      { gradient: 'linear-gradient(135deg, #f97316 0%, #facc15 100%)', emoji: '🎯' },
      '2026-06-18T07:00:00.000Z',
      { views: 1721, likes: 143 }
    ),
    P(
      'p7',
      '2026’da Öğrenmeye Değer 7 Programlama Dili',
      '2026-ogrenmeye-deger-programlama-dilleri',
      'Teknoloji',
      ['programlama', 'kariyer', 'diller'],
      'Python\'dan Rust\'a, TypeScript\'ten Zig\'e... Hangi dil hangi kapıyı açıyor? İş ilanları, topluluk büyümesi ve kişisel deneyimlerime göre 2026\'nın dil haritası.',
`"Hangi dili öğrenmeliyim?" sorusu her yıl sorulur ama cevaplar sürekli değişir. İşte 2026 itibarıyla benim listem — her dili *neden* önerdiğimle birlikte.

## 1. Python — Yapay Zekanın Ana Dili

Veri bilimi, makine öğrenmesi ve otomasyon... Python'un yükselişi yapay zeka dalgasıyla daha da hızlandı. Başlangıç için hâlâ en yumuşak giriş rampası.

**Öğrenin, eğer:** Yapay zeka, veri analizi veya betikleme ilginizi çekiyorsa.

## 2. TypeScript — Frontend'in Vazgeçilmezi

JavaScript'in tür güvenliğiyle buluşmuş hali. Bugün ciddi bir frontend projesi TypeScript'siz başlamıyor; backend'de de (Node, Deno, Bun) hızla yaygınlaşıyor.

**Öğrenin, eğer:** Web geliştirme yapıyorsanız. Zaten JavaScript biliyorsanız bu bir "öğrenme" değil, "tamamlama" adımı.

## 3. Rust — Güvenlik ve Performans

Bellek güvenliği derleme zamanında garanti eden, C/C++'ın tahtına en ciddi aday. Sistem programlama, WebAssembly ve artık Linux çekirdeğinde bile var.

**Öğrenin, eğer:** Sistemler, performans kritik araçlar veya WebAssembly sizi heyecanlandırıyorsa. Öğrenme eğrisi dik ama ödülü büyük.

## 4. Go — Bulutun Altyapı Dili

Docker, Kubernetes, Terraform... Bulut ekosisteminin omurgası Go ile yazıldı. Sade sözdizimi, mükemmel eşzamanlılık modeli ve hızlı derlemesiyle backend için güvenli bir bahis.

**Öğrenin, eğer:** Mikroservisler, DevOps veya yüksek trafikli backend sistemler hedefliyorsanız.

## 5. SQL — Sessiz Ama Ölümsüz

Her "en iyi diller" listesinin atlanan kahramanı. Veri var olduğu sürece SQL var olacak. LLM çağında bile veriye soru sormanın en keskin yolu.

**Öğrenin, eğer:** Hangi alanı seçerseniz seçin. Bu bir seçenek değil, zorunluluk. 😄

## 6. Swift veya Kotlin — Mobilin Yerli Dilleri

iOS için Swift, Android için Kotlin. Cross-platform araçlar (Flutter, React Native) güçlense de yerel geliştirme hâlâ en iyi deneyimi sunuyor.

**Öğrenin, eğer:** Milyonların cebindeki uygulamaları yazmak istiyorsanız.

## 7. Zig — İzlenmesi Gereken Bahis

Henüz erken ama C'nin yerini almaya aday, sade ve öngörülebilir bir sistem dili. Bun'un altında Zig var. Riskli ama heyecan verici.

**Öğrenin, eğer:** Sistem programlamayı seviyor ve erken benimseyen olmak istiyorsanız.

## Nasıl Seçmeli?

| Hedef | Önerim |
|-------|--------|
| Yapay zeka / veri | Python + SQL |
| Web geliştirme | TypeScript |
| Sistem / performans | Rust (veya Go) |
| Bulut / backend | Go |
| Mobil | Swift / Kotlin |

Dil bir araçtır; asıl değerli olan **problem çözme becerisi** ve bir dili derinlemesine bilmektir. Üç dili yüzeysel bilmektense bir dili ustalıkla bilin.`,
      { gradient: 'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)', emoji: '🧭' },
      '2026-05-09T10:10:00.000Z',
      { views: 2456, likes: 187 }
    ),
    P(
      'p8',
      'Evden Çalışırken Motivasyonu Korumanın 10 Yolu',
      'evden-calisirken-motivasyon',
      'Yaşam',
      ['uzaktan-çalışma', 'yaşam', 'motivasyon'],
      'Dört yıllık uzaktan çalışma deneyimimden süzülen, pijamayla toplantıya girmenizi engelleyecek (veya en azından düşündürecek) pratik öneriler.',
`Dört yıldır tamamen uzaktan çalışıyorum. İlk yılın sonunda kendimi tükenmiş, düzensiz ve garip biçimde *daha yorgun* hissediyordum. Sonrasında öğrendiklerim, uzaktan çalışmayı bir hayatta kalma mücadelesinden keyifli bir düzene çevirdi.

## 1. Fiziksel Bir Çalışma Alanı Ayırın

Yatak odasının köşesi bile olsa, "çalışma köşesi" beyne güçlü bir sinyal gönderir: *burası iş yeri*. Mümkünse ayrı bir oda, değilse ayrı bir masa. Asla yatakta çalışmayın — ne işiniz düzelir ne uykunuz.

## 2. Sabah Rutini Oluşturun

Ofise giderken yapılan hazırlık (duş, yol, kahve) beyni iş moduna alırdı. Bu geçişi yapay olarak yeniden yaratın: kalkın, giyinin (evet, pantolon da dahil), kısa bir yürüyüş yapın.

> "Pijamayla çalışmak özgürlük gibi hissettirir, ta ki tüm gün hiç bitmemiş gibi gelene kadar."

## 3. Günün Sınırlarını Çizin

Uzaktan çalışmanın en büyük tuzağı, işin hayata sızmasıdır. Sabit bir bitiş saati belirleyin ve bilgisayarınızı gerçekten kapatın. Ben 18:30'da laptopu çekmeceye koyuyorum — gözden uzak, zihinden uzak.

## 4. Öğle Arasını Kutsal Sayın

Masada yemek yemek bir alışkanlık haline gelirse, günün ortasındaki tek nefes alanınızı da kaybedersiniz. Öğle arasını farklı bir odada, ekransız geçirin. 20 dakikalık bir dışarı çıkış, öğleden sonranın tamamını değiştirir.

## 5. Sosyal Temas Planlayın

Ofisin gizli faydası, plansız sosyal temastı. Bunu bilinçli olarak yeniden inşa edin: haftalık bir spor grubu, kafede çalışma günü, ekip içinde "sanal kahve" buluşmaları.

## 6. Küçük Zaferleri Görünür Yapın

Uzaktan çalıştığınızda kimse çabanızı alkışlamaz. Kendi skor tabelanızı tutun: günlük yapılacaklar listesi, biten işlerin çetelesi, haftalık kısa bir değerlendirme.

## 7. Hareketi Günün İçine Serpiştirin

Ofis yolu bile günde 2.000–3.000 adım demekti. Bunu yerine koymak şart: her 50 dakikada 5 dakika hareket, toplantıları yürüyerek yapma, akşam yürüyüşü.

## 8. Dikkat Dağıtıcıları Yönetin

Ev, dikkat dağıtıcılarla doludur: bulaşık, koltuk, buzdolabı... Çalışma saatlerinde ev işlerini "yok" sayın. Onlar için de bir zaman bloğu ayırın ki suçluluk duygusuyla ikisini de yarım yapmayın.

## 9. İletişimde Cömert Olun

Uzaktan çalışırken görünürlüğünüz, iletişim kalitenizle doğru orantılıdır. İlerlemeyi paylaşın, soru sormaktan çekinmeyin, kamerayı açın. Sessizlik, uzaktan çalışanı görünmez yapar.

## 10. Kendinize Karşı Nazik Olun

Bazı günler verimsiz geçecek. Bu, uzaktan çalışmanın değil, *insan olmanın* bir parçası. Önemli olan ortalamanız ve düzeniniz — tek bir kötü gün değil.

---

Sizin evden çalışma rutininiz nasıl? Yorumlarda kendi ipuçlarınızı paylaşın, listeyi birlikte büyütelim.`,
      { gradient: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)', emoji: '🏡' },
      '2026-04-02T13:40:00.000Z',
      { views: 1350, likes: 109 }
    ),
    P(
      'p9',
      'Yakında: WebAssembly ile Tarayıcıda Yüksek Performans',
      'webassembly-yakinda',
      'Teknoloji',
      ['webassembly', 'frontend'],
      'Taslak halinde olan bu yazıda WebAssembly\'nin web geliştirmeyi nasıl dönüştürdüğünü inceliyoruz.',
      `# WebAssembly\n\nBu yazı henüz taslak aşamasında...`,
      { gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', emoji: '🚧' },
      '2026-10-01T09:00:00.000Z',
      { published: false, views: 0, likes: 0 }
    ),
  ];

  const comments = [
    { id: 'c1', postId: 'p1', name: 'Mehmet Kaya', email: '', content: 'Harika bir yazı! "Asistan hiçbir adımda tek başına sorumlu değil" tespiti çok yerinde. Biz de ekipte benzer bir akış kullanıyoruz.', createdAt: '2026-09-29T10:12:00.000Z', approved: true },
    { id: 'c2', postId: 'p1', name: 'Elif Demir', email: '', content: 'Prompt mühendisliği aslında iyi mühendislik demişsiniz, katılıyorum. Belirsiz isteği net probleme çevirmek işin özü.', createdAt: '2026-09-30T15:45:00.000Z', approved: true },
    { id: 'c3', postId: 'p3', name: 'Can Yıldız', email: '', content: 'Promise.all vs await sıralaması hatasını ben de yeni projemde yaptım, sayfanız sayesinde düzelttim. Teşekkürler!', createdAt: '2026-09-02T08:30:00.000Z', approved: true },
    { id: 'c4', postId: 'p3', name: 'Ayşe Nur', email: '', content: 'Event loop açıklaması bugüne kadar okuduğum en net anlatım. "0,1,2,3" örneği taşları yerine oturttu.', createdAt: '2026-09-05T19:20:00.000Z', approved: true },
    { id: 'c5', postId: 'p7', name: 'Burak Şen', email: '', content: 'SQL için "bu bir seçenek değil, zorunluluk" kısmına katılmıyorum diyemem 😄 Listeye Kotlin yerine Flutter eklenebilir miydi acaba?', createdAt: '2026-05-11T12:00:00.000Z', approved: true },
    { id: 'c6', postId: 'p6', name: 'Zeynep A.', email: '', content: 'Kapatma ritüeli önerisini bir haftadır uyguluyorum, akşamları kafam çok daha rahat. Tavsiye ederim.', createdAt: '2026-06-25T21:10:00.000Z', approved: true },
    { id: 'c7', postId: 'p2', name: 'Deniz Kara', email: '', content: 'useOptimistic örneği çok işime yaradı, beğeni butonunda hemen denedim. React 19\'a geçiş sanılandan kolaymış.', createdAt: '2026-10-02T09:40:00.000Z', approved: false },
    { id: 'c8', postId: 'p4', name: 'Ali Vural', email: '', content: 'Bu rehberle ilk API\'mi yazdım! Merkezi hata yakalayıcı bölümü olmasa saatlerce debug ederdim. Devamını bekliyoruz.', createdAt: '2026-10-05T16:55:00.000Z', approved: false },
  ];

  const messages = [
    { id: 'm1', name: 'Selin Arslan', email: 'selin@example.com', message: 'Merhaba, blogunuzda misafir yazar olarak CSS konusunda bir yazı paylaşmak isterim. Nasıl ilerleyebiliriz?', createdAt: '2026-09-20T11:30:00.000Z', read: true },
    { id: 'm2', name: 'Kerem Doğan', email: 'kerem.d@example.com', message: 'Node.js rehberindeki sağlık ucu önerisi için teşekkürler! Prod\'a taşırken bir yazı da deployment konusunda yazar mısınız?', createdAt: '2026-10-04T18:12:00.000Z', read: false },
    { id: 'm3', name: 'Gizem T.', email: 'gizem@example.com', message: 'Reklam/iş birliği fırsatları hakkında görüşmek istiyorum. Uygun bir zamanda dönüş yapabilir misiniz?', createdAt: '2026-10-07T09:05:00.000Z', read: false },
  ];

  const subscribers = [
    { id: 's1', email: 'okur1@example.com', createdAt: '2026-08-15T10:00:00.000Z' },
    { id: 's2', email: 'okur2@example.com', createdAt: '2026-09-01T12:30:00.000Z' },
    { id: 's3', email: 'okur3@example.com', createdAt: '2026-09-28T08:45:00.000Z' },
  ];

  return {
    settings: {
      siteName: 'PastMyBlog',
      tagline: 'Teknoloji, yazılım ve yaşam üzerine düşünceler',
      admin: { username: 'admin', ...admin },
      startedAt: '2026-01-15T00:00:00.000Z',
    },
    posts,
    comments,
    messages,
    subscribers,
  };
}
