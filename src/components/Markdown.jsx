import { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { slugify } from '../utils.js';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Markdown kaynağını güvenli HTML'e çevirir ve içindekiler tablosunu çıkarır.
 *
 * Adımlar:
 *  1. marked ile HTML'e dönüştür
 *  2. DOMPurify ile zararlı içerikten arındır (XSS koruması)
 *  3. DOMParser ile başlıklara benzersiz `id` ekle, dış bağlantıları işaretle
 *  4. h2/h3 başlıklarından TOC listesi üret
 */
export function renderMarkdown(source) {
  const rawHtml = marked.parse(String(source ?? ''));
  const cleanHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });

  const doc = new DOMParser().parseFromString(`<div id="__md_root">${cleanHtml}</div>`, 'text/html');
  const root = doc.getElementById('__md_root');

  const toc = [];
  const usedIds = new Set();

  root.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
    const depth = parseInt(h.tagName[1], 10);
    const text = h.textContent.trim();
    let id = slugify(text) || `bolum-${toc.length + 1}`;
    while (usedIds.has(id)) id = `${id}-1`;
    usedIds.add(id);
    h.setAttribute('id', id);
    if (depth === 2 || depth === 3) toc.push({ id, text, depth });
  });

  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    if (/^https?:\/\//i.test(href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return { html: root.innerHTML, toc };
}

/** Markdown içeriğini render eden bileşen (syntax highlighting dahil) */
export default function Markdown({ source, className = '' }) {
  const { html } = useMemo(() => renderMarkdown(source), [source]);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll('pre code:not([data-highlighted])').forEach((el) => {
      try {
        hljs.highlightElement(el);
      } catch {
        /* vurgulama başarısız olursa düz metin kalır */
      }
      el.setAttribute('data-highlighted', 'yes');
    });
  }, [html]);

  return <div ref={ref} className={`markdown-body ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
