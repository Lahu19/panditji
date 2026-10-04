/**
 * MyBookings — customer-facing bookings page.
 * Shows all bookings for the logged-in customer with live status from the server.
 * Tabs: Upcoming (PENDING / CONFIRMED / IN_PROGRESS) · Past (COMPLETED / CANCELLED / DISPUTED)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { bookingsApi } from '../api/bookings.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor.jsx';

/* ── Status colours (mirrors admin + pandit portal) ── */
const STATUS_COLOR = {
  DRAFT:       { bg: '#f0f0f0', text: '#888',    label: 'Draft'       },
  PENDING:     { bg: '#fff8e1', text: '#b45309',  label: 'Pending'     },
  CONFIRMED:   { bg: '#eff6ff', text: '#1d4ed8',  label: 'Confirmed ✓' },
  IN_PROGRESS: { bg: '#f3e8ff', text: '#7c3aed',  label: 'In Progress' },
  COMPLETED:   { bg: '#f0fdf4', text: '#15803d',  label: 'Completed'   },
  CANCELLED:   { bg: '#fff1f2', text: '#be123c',  label: 'Cancelled'   },
  DISPUTED:    { bg: '#fff7ed', text: '#c2410c',  label: 'Disputed'    },
};

function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || { bg: '#f0f0f0', text: '#888', label: status };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: '0.72rem',
      fontWeight: 700,
      fontFamily: 'var(--font-ui)',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.text,
    }}>
      {c.label}
    </span>
  );
}

/* ── Booking detail side-drawer ── */
function BookingDrawer({ booking, onClose }) {
  if (!booking) return null;
  const sc = STATUS_COLOR[booking.status] || STATUS_COLOR.DRAFT;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 480, background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0ebe0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--grad-hero)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: '1rem' }}>Booking Details</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'white', fontSize: '1rem' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Status banner */}
          <div style={{ background: sc.bg, border: `1px solid ${sc.text}33`, borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>
              {booking.status === 'CONFIRMED' ? '✅' : booking.status === 'PENDING' ? '⏳' : booking.status === 'COMPLETED' ? '🙏' : booking.status === 'CANCELLED' ? '❌' : '📋'}
            </span>
            <div>
              <div style={{ fontWeight: 700, color: sc.text, fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>
                {sc.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                {booking.status === 'CONFIRMED'   && 'Your pandit has confirmed this booking.'}
                {booking.status === 'PENDING'     && 'Waiting for the pandit to confirm.'}
                {booking.status === 'IN_PROGRESS' && 'Your ceremony is currently underway.'}
                {booking.status === 'COMPLETED'   && 'This booking has been completed.'}
                {booking.status === 'CANCELLED'   && 'This booking was cancelled.'}
                {booking.status === 'DISPUTED'    && 'This booking is under review.'}
              </div>
            </div>
          </div>

          {/* Core details */}
          <div style={{ background: '#faf8f4', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)', marginBottom: 12 }}>
              {booking.serviceId?.name || 'Religious Service'}
            </div>
            {[
              ['Pandit',    booking.primaryProviderId?.displayName || '—'],
              ['Event Date', booking.event?.date
                ? new Date(booking.event.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : '—'],
              ['Time',      booking.event?.startTime || '—'],
              ['Location',  [booking.event?.location?.addressLine1, booking.event?.location?.city, booking.event?.location?.state].filter(Boolean).join(', ') || '—'],
              ['Booking ID', `PJ-${String(booking._id).slice(-6).toUpperCase()}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0ebe0', fontSize: '0.83rem' }}>
                <span style={{ color: '#999' }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          {booking.pricingSnapshot?.items?.length > 0 && (
            <div style={{ background: '#fffbee', border: '1px solid #f0e8c8', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 10, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                Pricing Breakdown
              </div>
              {booking.pricingSnapshot.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.82rem', color: '#555' }}>
                  <span>{item.label}</span>
                  <span>₹{item.totalPrice?.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #f0e8c8', marginTop: 8, paddingTop: 8, fontSize: '0.9rem' }}>
                <span>Total Paid</span>
                <span style={{ color: 'var(--saffron)' }}>₹{booking.pricingSnapshot.total?.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Cancellation info */}
          {booking.cancellation?.reason && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#be123c', marginBottom: 4 }}>CANCELLATION REASON</div>
              <div style={{ fontSize: '0.84rem', color: '#555' }}>{booking.cancellation.reason}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function MyBookings() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [tab,      setTab]      = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);   // full booking object
  const [showAuth, setShowAuth] = useState(false);

  const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];
  const PAST_STATUSES     = ['COMPLETED', 'CANCELLED', 'DISPUTED'];

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await bookingsApi.list();
      const all  = data.bookings || [];
      const filter = tab === 'upcoming' ? UPCOMING_STATUSES : PAST_STATUSES;
      setBookings(all.filter(b => filter.includes(b.status)));
    } catch (e) {
      setError('Could not load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  useEffect(() => { load(); }, [load]);

  /* Redirect / prompt sign-in */
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
        <div style={{ fontSize: '3rem' }}>🕉️</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-dark)' }}>Sign in to view your bookings</div>
        <div style={{ fontSize: '0.9rem', color: '#888' }}>Your booking history will appear here after you sign in.</div>
        <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ padding: '12px 32px' }}>Sign In</button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }} />
      <MandalaDecor size={380} opacity={0.04} style={{ top: 0, right: -80, animation: 'spin-slow 60s linear infinite' }} />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', marginBottom: 24 }}
        >
          <ArrowLeft size={15} /> Home
        </button>

        <RangoliDivider label="Bookings" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-dark)', margin: '12px 0 6px' }}>
          My Bookings
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.88rem', color: '#888', marginBottom: 28 }}>
          Track your ceremony bookings and their status
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #ede9de', marginBottom: 24 }}>
          {[['upcoming', '📅 Upcoming'], ['past', '🗂️ Past Bookings']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '10px 22px', border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: '0.88rem',
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? 'var(--saffron)' : '#999',
                borderBottom: tab === t ? '2px solid var(--saffron)' : '2px solid transparent',
                marginBottom: -2, transition: 'color 0.2s',
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={load}
            title="Refresh"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '1rem', padding: '8px 10px' }}
          >
            🔄
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
            Loading your bookings…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10, padding: '14px 18px', color: '#be123c', fontSize: '0.88rem', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && bookings.length === 0 && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #ede9de', padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📭</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
              No {tab === 'upcoming' ? 'upcoming' : 'past'} bookings
            </div>
            <div style={{ fontSize: '0.88rem', color: '#aaa', marginBottom: 24 }}>
              {tab === 'upcoming'
                ? 'Book a pandit to get started.'
                : 'Your completed and cancelled bookings will appear here.'}
            </div>
            {tab === 'upcoming' && (
              <Link to="/browse" className="btn-primary" style={{ display: 'inline-block', padding: '12px 28px', textDecoration: 'none' }}>
                🛕 Browse Services
              </Link>
            )}
          </div>
        )}

        {/* Booking cards */}
        {!loading && !error && bookings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {bookings.map(b => {
              const sc = STATUS_COLOR[b.status] || STATUS_COLOR.DRAFT;
              const eventDate = b.event?.date ? new Date(b.event.date) : null;
              return (
                <div
                  key={b._id}
                  style={{
                    background: 'white',
                    borderRadius: 14,
                    border: `1px solid #ede9de`,
                    borderLeft: `4px solid ${sc.text}`,
                    padding: '18px 20px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }}
                  onClick={() => setSelected(b)}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-dark)', marginBottom: 4 }}>
                        {b.serviceId?.name || 'Religious Service'}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.78rem', color: '#888', fontFamily: 'var(--font-ui)' }}>
                        {b.primaryProviderId?.displayName && (
                          <span>🙏 {b.primaryProviderId.displayName}</span>
                        )}
                        {eventDate && (
                          <span>📅 {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                        {b.event?.startTime && (
                          <span>🕒 {b.event.startTime}</span>
                        )}
                        {b.event?.location?.city && (
                          <span>📍 {b.event.location.city}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <StatusBadge status={b.status} />
                      {b.pricingSnapshot?.total > 0 && (
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--saffron)' }}>
                          ₹{b.pricingSnapshot.total.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Confirmed notice */}
                  {b.status === 'CONFIRMED' && (
                    <div style={{ marginTop: 10, background: '#eff6ff', borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem', color: '#1d4ed8', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                      ✅ Your pandit has confirmed this booking. See you on the day!
                    </div>
                  )}
                  {b.status === 'PENDING' && (
                    <div style={{ marginTop: 10, background: '#fffbeb', borderRadius: 8, padding: '7px 12px', fontSize: '0.78rem', color: '#b45309', fontFamily: 'var(--font-ui)', fontWeight: 500 }}>
                      ⏳ Waiting for pandit confirmation…
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && <BookingDrawer booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
