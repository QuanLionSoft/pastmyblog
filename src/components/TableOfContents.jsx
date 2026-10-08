import { useEffect, useState } from 'react';

/**
 * İçindekiler tablosu — kaydırma konumuna göre aktif bölümü izler (scroll spy).
 * @param {{id:string,text:string,depth:number}[]} toc
 */
export default function TableOfContents({ toc }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (!toc?.length) return;

    const headings = toc
      .map((t) => document.getElementById(t.id))
      .filter(Boolean);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Görünür başlıklardan sayfanın en üstünde olana öncelik ver
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: [0, 1] }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (!toc?.length) return null;

  return (
    <nav className="toc-box" aria-label="İçindekiler">
      <div className="toc-title">📑 İçindekiler</div>
      <ul className="toc-list">
        {toc.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className={`${t.depth === 3 ? 'toc-h3' : ''} ${activeId === t.id ? 'active' : ''}`}
            >
              {t.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
