import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatNumber } from '../utils.js';
import { usePageTitle } from '../components/common.jsx';

export default function AboutPage() {
  usePageTitle('Hakkımda');
  const [stats, setStats] = useState({ posts: 0, categories: 0, views: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [meta, popular, all] = await Promise.all([
          api.getMeta(),
          api.getPosts({ limit: 48, sort: 'popular' }),
          api.getPosts({ limit: 1 }),
        ]);
        setStats({
          posts: all.total,
          categories: meta.categories.length,
          views: popular.posts.reduce((s, p) => s + (p.views ?? 0), 0),
        });
      } catch {
        /* istatistikler kritik değil */
      }
    })();
  }, []);

  return (
    <div className="container page">
      <header className="page-header">
        <h1 className="page-title">Hakkımda 👋</h1>
        <p className="page-subtitle">
          Bu blogun arkasındaki kişi, amaç ve biraz da hikaye.
        </p>
      </header>

      <div className="about-grid">
        <div className="prose">
          <h2>Merhaba, ben PastMyBlog'un yazarı</h2>
          <p>
            Yazılımla profesyonel olarak ilgilenen, öğrendiklerini yazarak pekiştirmeyi
            seven bir geliştiriciyim. <strong>PastMyBlog</strong>, 2026'nın başında "notlarım
            sadece bende kalmasın" diyerek açtığım kişisel bir alan olarak başladı; bugün
            teknoloji, yazılım, yapay zeka ve üretkenlik üzerine düzenli yazılar
            yayınladığım bir bloga dönüştü.
          </p>

          <h2>Neden yazıyorum?</h2>
          <p>
            Bir konuyu gerçekten öğrenip öğrenmediğinizi, onu başkasına anlatmaya
            çalıştığınızda anlarsınız. Yazmak benim için en etkili öğrenme yöntemi —
            bu blog da bu yöntemin halka açık defteri. Ayrıca yıllar önce benim
            aradığım ama bulamadığım Türkçe kaynakları üretmeye çalışıyorum.
          </p>

          <h2>Bu blogda neler bulacaksınız?</h2>
          <ul>
            <li>
              <strong>Yazılım rehberleri:</strong> React, JavaScript, Node.js ve modern web
              geliştirme üzerine pratik, çalışan kodlu anlatımlar
            </li>
            <li>
              <strong>Yapay zeka yazıları:</strong> Geliştirici gözüyle yapay zeka araçları,
              trendler ve iş akışları
            </li>
            <li>
              <strong>Üretkenlik ve kariyer:</strong> Derin çalışma, uzaktan çalışma düzeni,
              öğrenme stratejileri
            </li>
            <li>
              <strong>Yaşam notları:</strong> Teknolojinin hayatla kesiştiği yerden
              deneyimler
            </li>
          </ul>

          <h2>Site nasıl yapıldı?</h2>
          <p>
            Merak edenler için teknik detaylar: Bu site <strong>React 18 + Vite</strong> ile
            geliştirildi, <strong>Express</strong> tabanlı bir API ve JSON dosya veritabanı
            kullanıyor. Yazılar Markdown olarak saklanıyor; içerikler XSS'e karşı
            temizlenip (DOMPurify) sözdizimi vurgulamalı (highlight.js) olarak render
            ediliyor. Yorumlar, beğeniler ve bülten aboneliği de tamamen kendi
            altyapısında çalışıyor. Koyu/açık tema, sayfa içindekiler tablosu ve okuma
            ilerleme çubuğu gibi detaylar da cabası. 🛠️
          </p>

          <h2>İletişim</h2>
          <p>
            Bir yazı hakkında sorunuz mu var? İş birliği önerisi ya da sadece merhaba
            demek mi istiyorsunuz? <Link to="/iletisim">İletişim sayfasından</Link> yazın —
            her mesaja dönüş yapmaya çalışıyorum.
          </p>
        </div>

        <aside className="about-card">
          <div className="about-avatar">👨‍💻</div>
          <h3>PastMyBlog</h3>
          <div className="about-role">Geliştirici · Yazar</div>
          <p>
            "Öğrenmenin en iyi yolu, öğrendiğini anlatmaktır."
          </p>
          <div className="about-stats">
            <div>
              <div className="stat-num">{stats.posts}</div>
              <div className="stat-label">Yazı</div>
            </div>
            <div>
              <div className="stat-num">{stats.categories}</div>
              <div className="stat-label">Kategori</div>
            </div>
            <div>
              <div className="stat-num">{formatNumber(stats.views)}</div>
              <div className="stat-label">Okuma</div>
            </div>
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/iletisim" className="btn btn-primary">✉️ İletişime Geç</Link>
            <Link to="/yazilar" className="btn btn-ghost">📚 Yazılar</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
