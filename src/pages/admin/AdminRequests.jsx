/**
 * AdminRequests — service requests + match details side panel.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

const STATUS_MAP = {
  DRAFT: 'gray', COLLECTING_REQUIREMENTS: 'yellow', READY_FOR_MATCHING: 'blue',
  MATCHING: 'purple', MATCHED: 'green', BOOKED: 'green', EXPIRED: 'gray', CANCELLED: 'red',
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${STATUS_MAP[status] || 'gray'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function RequestPanel({ request, onClose }) {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (!request?._id) return;
    setLoadingMatches(true);
    adminApi.matches({ requestId: request._id })
      .then(d => setMatches(d.matches || []))
      .catch(console.error)
      .finally(() => setLoadingMatches(false));
  }, [request?._id]);

  const er = request?.extractedRequirements || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 520, background: 'white', height: '100%',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Request Detail</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                  {request?.serviceId?.name || 'Service not identified'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 3 }}>
                  {request?.customerId?.profile?.firstName} · {new Date(request?.createdTime).toLocaleDateString('en-IN')}
                </div>
              </div>
              <StatusBadge status={request?.status} />
            </div>
            {request?.rawInput && (
              <div style={{ background: '#fafafa', borderRadius: 8, padding: '10px 12px', fontSize: '0.84rem', color: 'var(--text-mid)', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{request.rawInput}"
              </div>
            )}
          </div>

          {/* Extracted requirements */}
          {Object.keys(er).length > 0 && (
            <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Extracted Requirements</div>
              {Object.entries(er).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.82rem' }}>
                  <span style={{ color: '#888', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                  <span style={{ color: 'var(--text-dark)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Matches */}
          <div className="admin-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>
              Matches ({matches.length})
            </div>
            {loadingMatches && <div className="admin-loading" style={{ padding: '16px 0' }}><div className="admin-loading__spinner" /></div>}
            {!loadingMatches && matches.length === 0 && (
              <div style={{ color: '#bbb', fontSize: '0.82rem' }}>No matches yet</div>
            )}
            {matches.map(m => (
              <div key={m._id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.providerId?.displayName}</span>
                  <span style={{ background: '#fff7ed', color: '#ea580c', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                    Score: {m.score}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#888' }}>
                  {m.providerId?.location?.city} · ★ {(m.providerId?.ratingSummary?.overall || 0).toFixed(1)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {(m.matchReasons || []).map((r, i) => (
                    <span key={i} style={{ background: '#dcfce7', color: '#16a34a', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem' }}>
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    adminApi.serviceRequests({ status: statusFilter, page, limit: 20 })
      .then(({ requests: r, total: t, pages: pg }) => { setRequests(r); setTotal(t); setPages(pg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const STATUSES = ['', 'DRAFT', 'READY_FOR_MATCHING', 'MATCHING', 'MATCHED', 'BOOKED', 'EXPIRED', 'CANCELLED'];

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>📋 Service Requests ({total})</div>

      <div className="admin-table-wrap">
        <div className="admin-filter-bar">
          <select className="admin-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄</button>
        </div>

        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : requests.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">📋</div>No requests found</div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Location</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.customerId?.profile?.firstName || '—'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#888' }}>{r.customerId?.contact?.phone}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{r.serviceId?.name || r.categoryId?.name || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#666' }}>
                        {r.extractedRequirements?.location
                          ? (typeof r.extractedRequirements.location === 'string'
                            ? r.extractedRequirements.location
                            : r.extractedRequirements.location.formattedAddress || '—')
                          : '—'
                        }
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#888' }}>{r.source}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ fontSize: '0.78rem', color: '#aaa' }}>
                        {new Date(r.createdTime).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(r)}>
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }

        <div className="admin-table-footer">
          <span>{total} requests</span>
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
            <button className="admin-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>

      {selected && <RequestPanel request={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
