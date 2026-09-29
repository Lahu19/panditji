/**
 * AdminDashboard — KPI cards, booking trend bar chart, top services,
 * city breakdown, and recent bookings activity feed.
 */
import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';

/* ── Helpers ── */
function fmt(n) {
  if (n == null) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString()}`;
}
function num(n) { return (n ?? 0).toLocaleString(); }

function StatusBadge({ status }) {
  const map = {
    CONFIRMED: 'green', COMPLETED: 'green',
    PENDING: 'yellow', IN_PROGRESS: 'blue',
    CANCELLED: 'red', DISPUTED: 'orange',
    DRAFT: 'gray',
  };
  return (
    <span className={`status-badge status-badge--${map[status] || 'gray'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function KpiCard({ label, value, sub, variant = '' }) {
  return (
    <div className={`admin-kpi-card admin-kpi-card--${variant}`}>
      <div className="admin-kpi-card__label">{label}</div>
      <div className="admin-kpi-card__value">{value}</div>
      {sub && <div className="admin-kpi-card__sub">{sub}</div>}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, title }) {
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1);
  return (
    <div className="admin-card">
      <div className="admin-section-title" style={{ marginBottom: 16 }}>{title}</div>
      {data.length === 0 && <div className="admin-empty"><div className="admin-empty__icon">📊</div>No data yet</div>}
      <div className="admin-bar-chart">
        {data.map((d, i) => (
          <div key={i} className="admin-bar-row">
            <div className="admin-bar-label">{d[labelKey] || 'Unknown'}</div>
            <div className="admin-bar-track">
              <div
                className="admin-bar-fill"
                style={{ width: `${Math.round((d[valueKey] / max) * 100)}%` }}
              />
            </div>
            <div className="admin-bar-count">{d[valueKey]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    adminApi.dashboard()
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-loading">
      <div className="admin-loading__spinner" /> Loading dashboard…
    </div>
  );

  if (error) return (
    <div className="admin-card" style={{ color: '#dc2626' }}>
      ⚠️ {error}
    </div>
  );

  const { kpis = {}, recentBookings = [], serviceBreakdown = [], cityBreakdown = [], bookingTrend = [] } = data || {};

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div className="admin-section-title" style={{ fontSize: '1.3rem' }}>Dashboard</div>
        <div style={{ fontSize: '0.82rem', color: '#888' }}>
          Platform overview · Updated just now
        </div>
      </div>

      {/* KPIs */}
      <div className="admin-kpi-grid">
        <KpiCard label="Total Customers"     value={num(kpis.totalUsers)}        variant="blue"   />
        <KpiCard label="Total Providers"     value={num(kpis.totalProviders)}     variant="gold"   />
        <KpiCard label="Active Providers"    value={num(kpis.activeProviders)}    variant="green"  />
        <KpiCard label="Pending Verification" value={num(kpis.pendingVerification)} variant="yellow" sub="Need attention" />
        <KpiCard label="Today's Bookings"    value={num(kpis.todayBookings)}      variant="accent" />
        <KpiCard label="Pending Requests"    value={num(kpis.pendingRequests)}    variant="purple" sub="Awaiting matching" />
        <KpiCard label="Total Bookings"      value={num(kpis.totalBookings)}      variant="blue"   />
        <KpiCard label="Platform Revenue"    value={fmt(kpis.revenue)}            variant="green"  sub="All paid bookings" />
        <KpiCard label="Cancellations"       value={num(kpis.cancelledBookings)}  variant="red"    />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <BarChart
          data={serviceBreakdown}
          labelKey="name"
          valueKey="count"
          title="📊 Top Services by Bookings"
        />
        <BarChart
          data={cityBreakdown.map(c => ({ ...c, city: c._id || 'Unknown' }))}
          labelKey="city"
          valueKey="count"
          title="🗺️ Bookings by City"
        />
      </div>

      {/* Booking trend (last 30 days as horizontal bars) */}
      {bookingTrend.length > 0 && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-section-title">📈 Booking Trend — Last 30 Days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, marginTop: 12 }}>
            {(() => {
              const maxVal = Math.max(...bookingTrend.map(t => t.count), 1);
              return bookingTrend.map((t, i) => (
                <div
                  key={i}
                  title={`${t._id}: ${t.count} bookings`}
                  style={{
                    flex: 1, minWidth: 4,
                    height: `${Math.max(4, Math.round((t.count / maxVal) * 100))}%`,
                    background: 'linear-gradient(180deg, var(--saffron), var(--gold))',
                    borderRadius: '3px 3px 0 0',
                    cursor: 'default',
                  }}
                />
              ));
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: '#bbb' }}>
            <span>{bookingTrend[0]?._id}</span>
            <span>{bookingTrend[bookingTrend.length - 1]?._id}</span>
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <span className="admin-table-header__title">🕐 Recent Bookings</span>
        </div>
        {recentBookings.length === 0 ? (
          <div className="admin-empty"><div className="admin-empty__icon">📅</div>No bookings yet</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    {b.customerId?.profile?.displayName ||
                     b.customerId?.profile?.firstName ||
                     '—'}
                  </td>
                  <td>{b.serviceId?.name || '—'}</td>
                  <td>{b.primaryProviderId?.displayName || '—'}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td style={{ color: '#888', fontSize: '0.78rem' }}>
                    {b.createdTime ? new Date(b.createdTime).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
