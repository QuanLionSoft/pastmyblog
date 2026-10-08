import { Link } from 'react-router-dom';
import { usePageTitle } from '../components/common.jsx';

export default function NotFoundPage() {
  usePageTitle('Sayfa Bulunamadı');
  return (
    <div className="container notfound">
      <div className="nf-emoji">🧭</div>
      <h1>404</h1>
      <p>
        Aradığınız sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir.
        Neyse ki blogun geri kalanı yerli yerinde!
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary btn-lg">🏠 Ana Sayfa</Link>
        <Link to="/yazilar" className="btn btn-ghost btn-lg">📚 Yazılara Göz At</Link>
      </div>
    </div>
  );
}
