/**
 * PanditEarnings — revenue dashboard with KPIs and payment history.
 */
import React, { useEffect, useState } from 'react';
import { panditPortalApi } from '../../api/panditPortal.js';

const PAYOUT_MAP = { PENDING: 'yellow', SCHEDULED: 'blue', PAID: 'green', FAILED: 'red' };
const PAY_STATUS = { PENDING: 'yellow', INITIATED: 'blue', PAID: 'green', FAILED: 'red', REFUNDED: 'orange', PARTIALLY_REFUNDED: 'orange' };

function KpiCard({ label, value, sub, variant = 'gold' }) {
  return (
    <div className={`pp-kpi-card pp-kpi-card--${variant}`}>
      <div className="pp-kpi-card__label">{label}</div>
      <div className="pp-kpi-card__value">{value ?? '—'}</div>
      {sub && <div className="pp-kpi-card__sub">{sub}</div>}
    </div>
  );
}

export default function PanditEarnings() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    panditPortalApi.earnings()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pp-content" style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading earnings…</div>;

  const { kpis = {}, recentPayments = [] } = data || {};

  return (
    <div className="pp-content">
      <div className="pp-page-title">💰 Earnings</div>
      <div className="pp-page-sub">Track your revenue and payout history</div>

      {/* KPIs */}
      <div className="pp-kpi-grid">
        <KpiCard label="Total Earnings"      value={`₹${(kpis.totalEarnings || 0).toLocaleString()}`}   variant="green"  />
        <KpiCard label="This Month"          value={`₹${(kpis.monthEarnings || 0).toLocaleString()}`}   variant="saffron" />
        <KpiCard label="Pending Payout"      value={`₹${(kpis.pendingPayout || 0).toLocaleString()}`}   variant="yellow" />
        <KpiCard label="Completed Bookings"  value={kpis.completedBookings ?? 0}                        variant="blue"   />
        <KpiCard label="Avg Booking Value"   value={kpis.avgBookingValue ? `₹${kpis.avgBookingValue.toLocaleString()}` : '—'} variant="purple" />
      </div>

      {/* Platform fee note */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', marginBottom: 24, fontSize: '0.84rem', color: '#15803d' }}>
        💡 Platform fee is automatically deducted. Your net earnings are shown after deduction.
      </div>

      {/* Payment history */}
      <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ebe0' }}>
          <div className="pp-card__title" style={{ marginBottom: 0 }}>Payment History</div>
        </div>

        {recentPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>💸</div>
            No payments yet
          </div>
        ) : (
          <table className="pp-table">
            <thead>
              <tr>
                <th>Booking</th>
                <th>Date</th>
                <th>Gross</th>
                <th>Platform Fee</th>
                <th>Net Earnings</th>
                <th>Payment Status</th>
                <th>Payout</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#888' }}>
                    {p.bookingId?._id?.toString().slice(-8) || '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#666' }}>
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{p.amount?.toLocaleString() || '—'}</td>
                  <td style={{ color: '#888', fontSize: '0.82rem' }}>
                    ₹{(p.breakdown?.platformFee || 0).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 700, color: '#22c55e' }}>
                    ₹{(p.netAmount || p.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`pp-badge pp-badge--${PAY_STATUS[p.status] || 'gray'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <span className={`pp-badge pp-badge--${PAYOUT_MAP[p.payout?.status] || 'gray'}`}>
                      {p.payout?.status || 'PENDING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
