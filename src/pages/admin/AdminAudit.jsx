/**
 * AdminAudit — immutable audit log browser with filters.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

const ACTION_COLORS = {
  CREATED: 'green', UPDATED: 'blue', DELETED: 'red',
  STATUS_CHANGED: 'yellow', PAYMENT_CONFIRMED: 'green', PAYMENT_FAILED: 'red',
  BOOKING_CONFIRMED: 'green', BOOKING_CANCELLED: 'red', BOOKING_COMPLETED: 'green',
  VERIFICATION_PASSED: 'green', VERIFICATION_FAILED: 'red',
  REVIEW_FLAGGED: 'orange', MATCH_RUN: 'purple',
  LOGIN: 'blue', LOGOUT: 'gray',
};

function ActionBadge({ action }) {
  const color = ACTION_COLORS[action] || 'gray';
  return (
    <span className={`status-badge status-badge--${color}`}>
      {action?.replace(/_/g, ' ')}
    </span>
  );
}

export default function AdminAudit() {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded,setExpanded]= useState(null);

  const [filters, setFilters] = useState({
    entityType: '', action: '', dateFrom: '', dateTo: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.auditLogs({ ...filters, page, limit: 30 })
      .then(({ logs: l, total: t, pages: pg }) => { setLogs(l); setTotal(t); setPages(pg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const ENTITY_TYPES = ['', 'Booking', 'Payment', 'ServiceRequest', 'Provider', 'User', 'Review', 'Match', 'Organization'];
  const ACTIONS = [
    '', 'CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED',
    'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'REFUND_INITIATED',
    'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_COMPLETED',
    'VERIFICATION_PASSED', 'VERIFICATION_FAILED',
    'REVIEW_FLAGGED', 'MATCH_RUN', 'LOGIN', 'LOGOUT',
  ];

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>🔍 Audit Logs ({total})</div>

      <div className="admin-table-wrap">
        <div className="admin-filter-bar">
          <select className="admin-filter-select" value={filters.entityType} onChange={e => setFilter('entityType', e.target.value)}>
            {ENTITY_TYPES.map(t => <option key={t} value={t}>{t || 'All Entities'}</option>)}
          </select>
          <select className="admin-filter-select" value={filters.action} onChange={e => setFilter('action', e.target.value)}>
            {ACTIONS.map(a => <option key={a} value={a}>{a || 'All Actions'}</option>)}
          </select>
          <input className="admin-filter-input" type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
          <input className="admin-filter-input" type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄</button>
        </div>

        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : logs.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">🔍</div>No audit logs found</div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Note</th>
                    <th>IP</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <React.Fragment key={log._id}>
                      <tr>
                        <td style={{ fontSize: '0.76rem', color: '#888', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdTime).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          <div style={{ fontWeight: 600 }}>
                            {log.actorId?.profile?.firstName || 'System'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#888' }}>{log.actorType}</div>
                        </td>
                        <td><ActionBadge action={log.action} /></td>
                        <td style={{ fontSize: '0.8rem', color: '#666' }}>
                          <div>{log.entityType}</div>
                          <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#aaa' }}>
                            {log.entityId?.toString().slice(-8)}…
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-mid)', maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.note || '—'}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#bbb' }}>{log.ip || '—'}</td>
                        <td>
                          {(log.before || log.after) && (
                            <button
                              className="admin-btn admin-btn--ghost admin-btn--sm"
                              onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                            >
                              {expanded === log._id ? '▲ Less' : '▼ Diff'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === log._id && (log.before || log.after) && (
                        <tr>
                          <td colSpan={7} style={{ padding: '0 16px 14px', background: '#fafafa' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
                              {log.before && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before</div>
                                  <pre style={{ fontSize: '0.75rem', background: '#fee2e2', borderRadius: 8, padding: 12, overflow: 'auto', margin: 0, color: '#7f1d1d' }}>
                                    {JSON.stringify(log.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after && (
                                <div>
                                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>After</div>
                                  <pre style={{ fontSize: '0.75rem', background: '#dcfce7', borderRadius: 8, padding: 12, overflow: 'auto', margin: 0, color: '#14532d' }}>
                                    {JSON.stringify(log.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )
        }

        <div className="admin-table-footer">
          <span>{total} log entries (append-only)</span>
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
