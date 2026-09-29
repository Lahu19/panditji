/**
 * AdminBookings — full bookings listing with filters.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

const STATUS_MAP = {
  DRAFT: 'gray', PENDING: 'yellow', CONFIRMED: 'blue',
  IN_PROGRESS: 'purple', COMPLETED: 'green', CANCELLED: 'red', DISPUTED: 'orange',
};

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${STATUS_MAP[status] || 'gray'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function BookingPanel({ bookingId, onClose }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.booking(bookingId).then(setData).finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}>
      <div className="admin-loading" style={{ height: '100vh' }}><div className="admin-loading__spinner" /></div>
    </div>
  );

  const { booking, auditTrail = [] } = data || {};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 520, background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Booking Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Summary */}
          <div className="admin-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                  {booking?.serviceId?.name || '—'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 3 }}>
                  ID: {booking?._id}
                </div>
              </div>
              <StatusBadge status={booking?.status} />
            </div>
            {[
              ['Customer', booking?.customerId?.profile?.firstName + ' ' + (booking?.customerId?.profile?.lastName || '')],
              ['Provider', booking?.primaryProviderId?.displayName],
              ['Event Date', booking?.event?.date ? new Date(booking.event.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '—'],
              ['Location', [booking?.event?.location?.city, booking?.event?.location?.state].filter(Boolean).join(', ') || '—'],
              ['Phone', booking?.customerDetails?.phone || booking?.customerId?.contact?.phone || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.84rem' }}>
                <span style={{ color: '#888' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Pricing snapshot */}
          {booking?.pricingSnapshot && (
            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Pricing</div>
              {(booking.pricingSnapshot.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem' }}>
                  <span style={{ color: '#666' }}>{item.label}</span>
                  <span>₹{item.totalPrice?.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontWeight: 700, borderTop: '1px solid #f0f0f0', marginTop: 8 }}>
                <span>Total</span>
                <span>₹{booking.pricingSnapshot.total?.toLocaleString() || '—'}</span>
              </div>
            </div>
          )}

          {/* Audit trail */}
          {auditTrail.length > 0 && (
            <div className="admin-card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Audit Trail</div>
              {auditTrail.slice(0, 10).map(log => (
                <div key={log._id} style={{ padding: '7px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{log.action?.replace(/_/g, ' ')}</span>
                    <span style={{ color: '#aaa', fontSize: '0.72rem' }}>
                      {new Date(log.createdTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.note && <div style={{ color: '#888', marginTop: 2 }}>{log.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters,  setFilters]  = useState({ status: '', city: '', dateFrom: '', dateTo: '' });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.bookings({ ...filters, page, limit: 20 })
      .then(({ bookings: b, total: t, pages: pg }) => { setBookings(b); setTotal(t); setPages(pg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  const STATUSES = ['', 'DRAFT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED'];

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>📅 Bookings ({total})</div>

      <div className="admin-table-wrap">
        <div className="admin-filter-bar">
          <select className="admin-filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <input className="admin-filter-input" placeholder="City…" value={filters.city} onChange={e => setFilter('city', e.target.value)} style={{ width: 110 }} />
          <input className="admin-filter-input" type="date" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
          <input className="admin-filter-input" type="date" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄</button>
        </div>

        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : bookings.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">📅</div>No bookings found</div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Provider</th>
                    <th>Event Date</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {b.customerId?.profile?.firstName || '—'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#888' }}>{b.customerId?.contact?.phone}</div>
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{b.serviceId?.name || '—'}</td>
                      <td style={{ fontSize: '0.84rem' }}>{b.primaryProviderId?.displayName || '—'}</td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {b.event?.date ? new Date(b.event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#666' }}>
                        {b.primaryProviderId?.location?.city || b.event?.location?.city || '—'}
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                      <td style={{ fontSize: '0.78rem', color: '#aaa' }}>
                        {new Date(b.createdTime).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(b._id)}>
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
          <span>{total} bookings</span>
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
            <button className="admin-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>

      {selected && <BookingPanel bookingId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
