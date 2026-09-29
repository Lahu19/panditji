/**
 * PanditDashboard — main home after login.
 * Shows KPIs, profile completion prompt, upcoming bookings, pending requests.
 */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePanditPortal } from '../../context/PanditPortalContext.jsx';
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

function KpiCard({ label, value, sub, variant = 'gold' }) {
  return (
    <div className={`pp-kpi-card pp-kpi-card--${variant}`}>
      <div className="pp-kpi-card__label">{label}</div>
      <div className="pp-kpi-card__value">{value ?? '—'}</div>
      {sub && <div className="pp-kpi-card__sub">{sub}</div>}
    </div>
  );
}

function CompletionPrompt({ completion }) {
  const { percent, missing = [] } = completion;
  if (percent >= 100) return null;

  const labelMap = {
    displayName: 'Add your name',
    about: 'Write your about section',
    experience: 'Add your experience',
    languages: 'Select your languages',
    traditions: 'Select your tradition',
    location: 'Set your base location',
    services: 'Add at least one service',
    serviceAreas: 'Define your service areas',
    pricing: 'Set your starting price',
    media: 'Upload a photo or video',
    verification: 'Start verification',
    capabilities: 'Configure capabilities',
  };

  return (
    <div className="pp-card" style={{ borderLeft: '4px solid var(--saffron)', marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-dark)' }}>
            Complete your profile
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>
            A complete profile gets 3× more bookings
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: percent >= 70 ? '#22c55e' : 'var(--saffron)' }}>
            {percent}%
          </div>
        </div>
      </div>
      <div style={{ height: 8, background: '#f0ebe0', borderRadius: 8, marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, var(--gold), var(--saffron))', borderRadius: 8, transition: 'width 0.5s' }} />
      </div>
      {missing.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {missing.slice(0, 4).map(m => (
            <span key={m} style={{ background: '#fff7ed', color: '#c2500a', borderRadius: 20, padding: '3px 10px', fontSize: '0.76rem' }}>
              ⚠ {labelMap[m] || m}
            </span>
          ))}
          {missing.length > 4 && (
            <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '3px 10px', fontSize: '0.76rem' }}>
              +{missing.length - 4} more
            </span>
          )}
        </div>
      )}
      <Link to="/pandit-portal/onboarding" className="pp-btn pp-btn--primary pp-btn--sm">
        Complete Profile →
      </Link>
    </div>
  );
}

export default function PanditDashboard() {
  const { provider, completion, authUser } = usePanditPortal();
  const [earnings,  setEarnings]  = useState(null);
  const [upcoming,  setUpcoming]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  const firstName = authUser?.profile?.firstName || provider?.displayName?.split(' ')[0] || 'Pandit';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const load = async () => {
      try {
        const [earningsData, upcomingData, requestsData] = await Promise.all([
          panditPortalApi.earnings(),
          panditPortalApi.bookings({ tab: 'upcoming', limit: 5 }),
          panditPortalApi.bookings({ tab: 'requests', limit: 5 }),
        ]);
        setEarnings(earningsData.kpis);
        setUpcoming(upcomingData.bookings || []);
        setRequests(requestsData.bookings || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="pp-content">
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div className="pp-page-title">
          {greeting}, {firstName} 🙏
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <span className={`pp-badge pp-badge--${
            provider?.verificationStatus === 'VERIFIED' ? 'green' :
            provider?.verificationStatus === 'PARTIAL'  ? 'yellow' : 'gray'
          }`}>
            {provider?.verificationStatus === 'VERIFIED' ? '✓ Verified' :
             provider?.verificationStatus === 'PARTIAL'  ? '⏳ Partially Verified' : 'Not Verified'}
          </span>
          <span className={`pp-badge pp-badge--${
            provider?.status === 'ACTIVE' ? 'green' :
            provider?.status === 'PENDING_VERIFICATION' ? 'yellow' : 'gray'
          }`}>
            {provider?.status?.replace(/_/g, ' ') || 'Draft'}
          </span>
        </div>
      </div>

      {/* Profile completion */}
      <CompletionPrompt completion={completion} />

      {/* KPIs */}
      <div className="pp-kpi-grid">
        <KpiCard label="Today's Bookings"   value={upcoming.filter(b => {
          const d = new Date(b.event?.date);
          const t = new Date();
          return d.toDateString() === t.toDateString();
        }).length} variant="saffron" />
        <KpiCard label="Upcoming"           value={upcoming.length}             variant="blue"   />
        <KpiCard label="Pending Requests"   value={requests.length}             variant="yellow" />
        <KpiCard label="This Month"         value={earnings ? `₹${(earnings.monthEarnings || 0).toLocaleString()}` : '—'} variant="green"  />
        <KpiCard label="Rating"
          value={provider?.ratingSummary?.overall ? `${provider.ratingSummary.overall.toFixed(1)} ⭐` : '—'}
          sub={provider?.ratingSummary?.count ? `${provider.ratingSummary.count} reviews` : ''}
          variant="gold"
        />
        <KpiCard label="Completed"          value={earnings?.completedBookings ?? '—'} variant="purple" />
      </div>

      {/* Pending requests callout */}
      {requests.length > 0 && (
        <div className="pp-card" style={{ borderLeft: '4px solid var(--gold)', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                📬 {requests.length} pending booking request{requests.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>
                Accept or decline before they expire
              </div>
            </div>
            <Link to="/pandit-portal/requests" className="pp-btn pp-btn--primary pp-btn--sm">
              View Requests
            </Link>
          </div>
        </div>
      )}

      {/* Upcoming bookings */}
      <div className="pp-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="pp-card__title" style={{ marginBottom: 0 }}>📅 Upcoming Bookings</div>
          <Link to="/pandit-portal/bookings" style={{ fontSize: '0.8rem', color: 'var(--saffron)', textDecoration: 'none', fontWeight: 600 }}>View all →</Link>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>Loading…</div>}

        {!loading && upcoming.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>📭</div>
            <div style={{ fontSize: '0.88rem', color: '#aaa' }}>No upcoming bookings yet</div>
            {provider?.status !== 'ACTIVE' && (
              <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: 8 }}>
                Complete your profile and verification to start receiving bookings
              </div>
            )}
          </div>
        )}

        {!loading && upcoming.map(b => (
          <div
            key={b._id}
            onClick={() => navigate(`/pandit-portal/bookings/${b._id}`)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid #f5f0e8', cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
                {b.serviceId?.name || 'Ceremony'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2, display: 'flex', gap: 10 }}>
                {b.event?.date && (
                  <span>📅 {new Date(b.event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                )}
                {b.event?.startTime && <span>🕒 {b.event.startTime}</span>}
                {b.event?.location?.city && <span>📍 {b.event.location.city}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                {b.customerId?.profile?.firstName && (
                  <div style={{ color: '#555' }}>{b.customerId.profile.firstName}</div>
                )}
              </div>
              <StatusBadge status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
