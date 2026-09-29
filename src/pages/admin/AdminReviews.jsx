/**
 * AdminReviews — list, moderate (flag / hide / restore) reviews.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

const STATUS_MAP = { PENDING: 'yellow', PUBLISHED: 'green', FLAGGED: 'orange', REMOVED: 'red' };

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${STATUS_MAP[status] || 'gray'}`}>
      {status}
    </span>
  );
}

function Stars({ value }) {
  return (
    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
      {'★'.repeat(Math.round(value || 0))}{'☆'.repeat(5 - Math.round(value || 0))}
      <span style={{ color: '#888', fontWeight: 400, fontSize: '0.78rem', marginLeft: 4 }}>{(value || 0).toFixed(1)}</span>
    </span>
  );
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [moderating,   setModerating]   = useState(null); // review being actioned

  const load = useCallback(() => {
    setLoading(true);
    adminApi.reviews({ status: statusFilter, page, limit: 20 })
      .then(({ reviews: r, total: t, pages: pg }) => { setReviews(r); setTotal(t); setPages(pg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const moderate = async (reviewId, action) => {
    setModerating(reviewId);
    try {
      await adminApi.moderateReview(reviewId, action, '');
      load();
    } catch (e) { alert(e.message); }
    finally { setModerating(null); }
  };

  const STATUSES = ['', 'PUBLISHED', 'PENDING', 'FLAGGED', 'REMOVED'];

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>⭐ Reviews ({total})</div>

      <div className="admin-table-wrap">
        <div className="admin-filter-bar">
          <select className="admin-filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄</button>
        </div>

        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : reviews.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">⭐</div>No reviews found</div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Provider</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                        {r.customerId?.profile?.displayName || r.customerId?.profile?.firstName || '—'}
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{r.providerId?.displayName || '—'}</td>
                      <td>
                        <Stars value={
                          ((r.ratings?.punctuality || 0) + (r.ratings?.communication || 0) +
                           (r.ratings?.serviceQuality || 0) + (r.ratings?.professionalism || 0)) / 4
                        } />
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-mid)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {r.comment || '—'}
                        </div>
                      </td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ fontSize: '0.78rem', color: '#aaa' }}>
                        {new Date(r.createdTime).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {r.status !== 'FLAGGED' && (
                            <button
                              className="admin-btn admin-btn--ghost admin-btn--sm"
                              disabled={moderating === r._id}
                              onClick={() => moderate(r._id, 'FLAG')}
                              title="Flag review"
                            >🚩</button>
                          )}
                          {r.status !== 'REMOVED' && (
                            <button
                              className="admin-btn admin-btn--danger admin-btn--sm"
                              disabled={moderating === r._id}
                              onClick={() => moderate(r._id, 'HIDE')}
                              title="Hide review"
                            >🗑</button>
                          )}
                          {(r.status === 'FLAGGED' || r.status === 'REMOVED') && (
                            <button
                              className="admin-btn admin-btn--ghost admin-btn--sm"
                              disabled={moderating === r._id}
                              onClick={() => moderate(r._id, 'RESTORE')}
                              title="Restore review"
                            >↩</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }

        <div className="admin-table-footer">
          <span>{total} reviews</span>
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
            <button className="admin-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>
    </>
  );
}
