/** Genel yardımcı fonksiyonlar */

const TR_MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', I: 'i', Ö: 'o', Ş: 's', Ü: 'u' };

export function slugify(text) {
  return String(text ?? '')
    .replace(/[çğıöşüÇĞİIÖŞÜ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 80);
}

export function formatDate(iso, opts = { day: 'numeric', month: 'long', year: 'numeric' }) {
  try {
    return new Intl.DateTimeFormat('tr-TR', opts).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateTime(iso) {
  return formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return formatDate(iso);
}

export function formatNumber(n) {
  return new Intl.NumberFormat('tr-TR').format(n ?? 0);
}

/** Kategori adından tutarlı bir renk sınıfı üretir */
const CATEGORY_CLASSES = ['cat-blue', 'cat-purple', 'cat-teal', 'cat-amber', 'cat-pink', 'cat-green', 'cat-slate'];
export function categoryClass(name) {
  let hash = 0;
  for (const ch of String(name ?? '')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_CLASSES[hash % CATEGORY_CLASSES.length];
}

/** İçerikten okuma süresi (dk) hesaplar — API zaten döndürür, yedek olarak burada */
export function readingTime(content) {
  const words = String(content ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
