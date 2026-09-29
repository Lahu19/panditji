/**
 * PanditBookings — upcoming and past bookings with tab switching.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { panditPortalApi } from '../../api/panditPortal.js';

const STATUS_MAP = {
  PENDING: 'yellow', CONFIRMED: 'blue', IN_PROGRESS: 'purple',
  COMPLETED: 'green', CANCELLED: 'red', DISPUTED: 'orange',
};

function StatusBadge({ status }) {
  return (
    <span className={`pp-badge pp-badge--${STATUS_MAP[status] || 'gray'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function BookingDetail({ bookingId, onClose }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    panditPortalApi.booking(bookingId)
      .then(d => setBooking(d.booking))
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0ebe0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Booking Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        {loading
          ? <div style={{ padding: 32, textAlign: 'center', color: '#aaa' }}>Loading…</div>
          : booking && (
            <div style={{ padding: 24 }}>
              <div className="pp-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                    {booking.serviceId?.name || 'Ceremony'}
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                {[
                  ['Customer',    `${booking.customerId?.profile?.firstName || ''} ${booking.customerId?.profile?.lastName || ''}`.trim()],
                  ['Phone',       booking.customerId?.contact?.phone || '—'],
                  ['Date',        booking.event?.date ? new Date(booking.event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                  ['Time',        booking.event?.startTime || '—'],
                  ['Location',    [booking.event?.location?.addressLine1, booking.event?.location?.city].filter(Boolean).join(', ') || '—'],
                  ['Booking ID',  booking._id],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0e8', fontSize: '0.83rem' }}>
                    <span style={{ color: '#888' }}>{label}</span>
                    <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              {booking.pricingSnapshot && (
                <div className="pp-card" style={{ marginBottom: 16 }}>
                  <div className="pp-card__title">Pricing</div>
                  {(booking.pricingSnapshot.items || []).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', color: '#555' }}>
                      <span>{item.label}</span>
                      <span>₹{item.totalPrice?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #f0ebe0', marginTop: 8, paddingTop: 8 }}>
                    <span>Total</span>
                    <span>₹{booking.pricingSnapshot.total?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Requirements snapshot */}
              {booking.requirementsSnapshot && Object.keys(booking.requirementsSnapshot).length > 0 && (
                <div className="pp-card">
                  <div className="pp-card__title">Customer Requirements</div>
                  {Object.entries(booking.requirementsSnapshot).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f5f0e8', fontSize: '0.82rem' }}>
                      <span style={{ color: '#888', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span style={{ fontWeight: 500 }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }
      </div>
    </div>
  );
}

export default function PanditBookings() {
  const [tab,      setTab]      = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    panditPortalApi.bookings({ tab, page, limit: 15 })
      .then(d => { setBookings(d.bookings || []); setTotal(d.total || 0); setPages(d.pages || 1); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const switchTab = (t) => { setTab(t); setPage(1); };

  return (
    <div className="pp-content">
      <div className="pp-page-title">📋 My Bookings</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0ebe0', marginBottom: 20 }}>
        {[['upcoming','Upcoming'], ['past','Past Bookings']].map(([t, label]) => (
          <button key={t} onClick={() => switchTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: '0.86rem', fontWeight: tab === t ? 700 : 400,
            color: tab === t ? 'var(--saffron)' : '#888',
            borderBottom: tab === t ? '2px solid var(--saffron)' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading…</div>}

      {!loading && bookings.length === 0 && (
        <div className="pp-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</div>
          <div style={{ color: '#aaa', fontSize: '0.9rem' }}>No {tab} bookings</div>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="pp-table-wrap">
          <table className="pp-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Customer</th>
                <th>Event Date</th>
                <th>Location</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 600 }}>{b.serviceId?.name || '—'}</td>
                  <td>{b.customerId?.profile?.firstName || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: '#666' }}>
                    {b.event?.date
                      ? new Date(b.event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                    {b.event?.startTime && ` · ${b.event.startTime}`}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#666' }}>{b.event?.location?.city || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--saffron)' }}>
                    {b.pricingSnapshot?.total ? `₹${b.pricingSnapshot.total.toLocaleString()}` : '—'}
                  </td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={() => setSelected(b._id)}>
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #f0ebe0' }}>
              <span style={{ fontSize: '0.8rem', color: '#888' }}>{total} bookings</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="pp-btn pp-btn--ghost pp-btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                <span style={{ padding: '6px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
                <button className="pp-btn pp-btn--ghost pp-btn--sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && <BookingDetail bookingId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
