/**
 * Sayfalama bileşeni.
 * Sayfa numaralarını akıllıca kısaltır: 1 … 4 5 [6] 7 8 … 12
 */
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const nums = [];
  const push = (n) => nums.push(n);
  const window_ = new Set([1, pages, page, page - 1, page + 1, page - 2, page + 2]);

  for (let i = 1; i <= pages; i++) {
    if (window_.has(i)) push(i);
    else if (nums[nums.length - 1] !== '…') push('…');
  }

  return (
    <nav className="pagination" aria-label="Sayfalama">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Önceki sayfa">
        ←
      </button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span className="dots" key={`d${i}`}>…</span>
        ) : (
          <button
            key={n}
            className={n === page ? 'active' : ''}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Sonraki sayfa">
        →
      </button>
    </nav>
  );
}
