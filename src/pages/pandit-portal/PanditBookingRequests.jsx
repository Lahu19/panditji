/**
 * PanditBookingRequests — pending bookings the provider must accept or decline.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { panditPortalApi } from '../../api/panditPortal.js';

function BookingCard({ booking, onRespond }) {
  const [declining,  setDeclining]  = useState(false);
  const [reason,     setReason]     = useState('');
  const [busy,       setBusy]       = useState(false);

  const respond = async (action) => {
    setBusy(true);
    try {
      await panditPortalApi.respondBooking(booking._id, action, action === 'DECLINE' ? reason : '');
      onRespond();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
      setDeclining(false);
    }
  };

  const er = booking.requirementsSnapshot || {};
  const date = booking.event?.date ? new Date(booking.event.date) : null;

  return (
    <div className="pp-card" style={{ borderLeft: '4px solid var(--gold)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
            {booking.serviceId?.name || 'Service Request'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 3, display: 'flex', gap: 12 }}>
            {date && (
              <span>📅 {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            )}
            {booking.event?.startTime && <span>🕒 {booking.event.startTime}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {booking.pricingSnapshot?.total && (
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--saffron)' }}>
              ₹{booking.pricingSnapshot.total.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
        {[
          ['Customer',  booking.customerId?.profile?.firstName || '—'],
          ['Location',  booking.event?.location?.city || '—'],
          ['Duration',  er.duration || er.time || '—'],
          ['Pandits',   er.providerCount || '1'],
          ['Samagri',   booking.pricingSnapshot?.items?.find(i => i.itemType === 'SAMAGRI') ? 'Required' : 'Not required'],
        ].map(([label, value]) => (
          <div key={label} style={{ background: '#faf8f4', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: '0.68rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--text-dark)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Pricing breakdown */}
      {booking.pricingSnapshot?.items?.length > 0 && (
        <div style={{ background: '#fffbee', border: '1px solid #f0e8c8', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7a5c1e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Pricing Breakdown
          </div>
          {booking.pricingSnapshot.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#555', padding: '2px 0' }}>
              <span>{item.label}</span>
              <span>₹{item.totalPrice?.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #f0e8c8', marginTop: 6, paddingTop: 6, fontSize: '0.9rem' }}>
            <span>Your earnings</span>
            <span style={{ color: '#22c55e' }}>
              ₹{((booking.pricingSnapshot.total || 0) - (booking.pricingSnapshot.items.find(i => i.itemType === 'PLATFORM_FEE')?.totalPrice || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Decline reason */}
      {declining && (
        <div style={{ marginBottom: 14 }}>
          <label className="pp-label">Reason for declining (optional)</label>
          <select className="pp-select" value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Select reason…</option>
            <option value="Not available on this date">Not available on this date</option>
            <option value="Location not serviceable">Location not serviceable</option>
            <option value="Service not available">Service not available</option>
            <option value="Prior commitment">Prior commitment</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!declining ? (
          <>
            <button
              className="pp-btn pp-btn--primary"
              disabled={busy}
              onClick={() => respond('ACCEPT')}
              style={{ flex: 1 }}
            >
              ✓ Accept Booking
            </button>
            <button
              className="pp-btn pp-btn--ghost"
              disabled={busy}
              onClick={() => setDeclining(true)}
            >
              ✕ Decline
            </button>
          </>
        ) : (
          <>
            <button className="pp-btn pp-btn--danger" disabled={busy} onClick={() => respond('DECLINE')} style={{ flex: 1 }}>
              Confirm Decline
            </button>
            <button className="pp-btn pp-btn--ghost" disabled={busy} onClick={() => setDeclining(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PanditBookingRequests() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    panditPortalApi.bookings({ tab: 'requests', limit: 30 })
      .then(d => setBookings(d.bookings || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="pp-content">
      <div className="pp-page-title">📬 Booking Requests</div>
      <div className="pp-page-sub">Review and respond to incoming booking requests</div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          Loading requests…
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="pp-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 14 }}>📭</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
            No pending requests
          </div>
          <div style={{ fontSize: '0.88rem', color: '#aaa' }}>
            New booking requests will appear here. Make sure your profile is complete and verified to start receiving requests.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {bookings.map(b => (
          <BookingCard key={b._id} booking={b} onRespond={load} />
        ))}
      </div>
    </div>
  );
}
