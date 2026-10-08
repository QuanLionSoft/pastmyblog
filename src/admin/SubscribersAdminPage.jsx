import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate } from '../utils.js';
import { Spinner, ErrorAlert, EmptyState, usePageTitle } from '../components/common.jsx';

/** Bülten aboneleri listesi */
export default function SubscribersAdminPage() {
  usePageTitle('Aboneler — Panel');

  const [subs, setSubs] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSubs((await api.adminSubscribers()).subscribers);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(s) {
    if (!window.confirm(`${s.email} abonelikten çıkarılsın mı?`)) return;
    try {
      await api.deleteSubscriber(s.id);
      setNotice('Abone silindi 🗑️');
      setTimeout(() => setNotice(null), 2500);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>👥 Bülten Aboneleri</h1>
          <p>{subs ? `${subs.length} kayıtlı e-posta` : ''}</p>
        </div>
      </div>

      <ErrorAlert error={error} onRetry={load} />
      {notice && <div className="inline-msg ok">{notice}</div>}

      <div className="admin-card">
        <div className="admin-card-body flush table-scroll">
          {subs === null && !error ? (
            <Spinner label="Aboneler yükleniyor..." />
          ) : subs.length === 0 ? (
            <EmptyState icon="👥" title="Henüz abone yok" text="Bülten formunu paylaşarak ilk abonelerinizi toplayın." />
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>E-posta</th>
                  <th>Kayıt Tarihi</th>
                  <th style={{ textAlign: 'right' }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => (
                  <tr key={s.id}>
                    <td className="muted">{i + 1}</td>
                    <td>
                      <div className="cell-title">{s.email}</div>
                    </td>
                    <td className="muted small">{formatDate(s.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <a className="btn btn-sm btn-ghost" href={`mailto:${s.email}`}>✉️ E-posta</a>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(s)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
