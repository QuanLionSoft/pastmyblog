import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { formatNumber } from '../utils.js';

/* -------------------------------------------------------------------------- */
/* Beğeni düğmesi — IP + localStorage ile çift beğenme engellenir              */
/* -------------------------------------------------------------------------- */

const LIKED_KEY = 'pastmyblog-liked-posts';

function getLikedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function LikeButton({ post, onLiked }) {
  const likedBefore = getLikedSet().has(post.id) || post.likedByMe;
  const [liked, setLiked] = useState(likedBefore);
  const [count, setCount] = useState(post.likes ?? 0);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (liked || busy) return;
    setBusy(true);
    try {
      const res = await api.likePost(post.slug);
      setCount(res.likes);
      setLiked(true);
      const s = getLikedSet();
      s.add(post.id);
      localStorage.setItem(LIKED_KEY, JSON.stringify([...s]));
      onLiked?.(res.likes);
    } catch {
      /* sessizce yoksay — sayaç zaten görünür */
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={`like-btn ${liked ? 'liked' : ''}`}
      onClick={onClick}
      disabled={liked || busy}
      aria-pressed={liked}
      title={liked ? 'Bu yazıyı beğendiniz!' : 'Yazıyı beğen'}
    >
      <span className="heart">{liked ? '❤️' : '🤍'}</span>
      {liked ? 'Beğendin' : 'Beğen'} · {formatNumber(count)}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Paylaşım düğmeleri                                                          */
/* -------------------------------------------------------------------------- */

export function ShareButtons({ post }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = post.title;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // pano API'si yoksa eski yöntem
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const targets = [
    {
      label: 'X (Twitter)',
      icon: '𝕏',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      label: 'LinkedIn',
      icon: 'in',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      label: 'WhatsApp',
      icon: '💬',
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    },
  ];

  return (
    <div className="share-row">
      <span className="share-label">Paylaş:</span>
      {targets.map((t) => (
        <a
          key={t.label}
          className="share-btn"
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          title={t.label}
          aria-label={`${t.label} üzerinde paylaş`}
        >
          {t.icon}
        </a>
      ))}
      <button className="share-btn" onClick={copyLink} title="Bağlantıyı kopyala" aria-label="Bağlantıyı kopyala">
        {copied ? '✅' : '🔗'}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Okuma ilerleme çubuğu                                                       */
/* -------------------------------------------------------------------------- */

export function ReadProgress() {
  const [pct, setPct] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    function update() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    }
    function onScroll() {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return <div className="read-progress" style={{ width: `${pct}%` }} aria-hidden="true" />;
}

/* -------------------------------------------------------------------------- */
/* Yukarı dön düğmesi                                                          */
/* -------------------------------------------------------------------------- */

export function ToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      className={`to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Sayfa başına dön"
      title="Başa dön"
    >
      ↑
    </button>
  );
}
