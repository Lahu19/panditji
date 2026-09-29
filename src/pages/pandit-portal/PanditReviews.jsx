/**
 * PanditReviews — view received reviews with breakdown and pagination.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { usePanditPortal } from '../../context/PanditPortalContext.jsx';
import { panditPortalApi } from '../../api/panditPortal.js';

function Stars({ value, size = '1rem' }) {
  const full  = Math.round(value || 0);
  const empty = 5 - full;
  return (
    <span style={{ color: '#f59e0b', fontSize: size }}>
      {'★'.repeat(full)}
      <span style={{ color: '#e5e7eb' }}>{'★'.repeat(empty)}</span>
    </span>
  );
}

function RatingBar({ label, value }) {
  const pct = ((value || 0) / 5) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ width: 130, fontSize: '0.8rem', color: '#666', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: '#f0ebe0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--gold), var(--saffron))', borderRadius: 4 }} />
      </div>
      <span style={{ width: 32, fontSize: '0.8rem', color: '#888', textAlign: 'right', flexShrink: 0 }}>
        {(value || 0).toFixed(1)}
      </span>
    </div>
  );
}

function DistributionBar({ label, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ width: 20, fontSize: '0.78rem', color: '#f59e0b' }}>{label}★</span>
      <div style={{ flex: 1, height: 8, background: '#f0ebe0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 4 }} />
      </div>
      <span style={{ width: 28, fontSize: '0.75rem', color: '#aaa', textAlign: 'right' }}>{count}</span>
    </div>
  );
}

export default function PanditReviews() {
  const { provider } = usePanditPortal();
  const [reviews, setReviews]   = useState([]);
  const [total,   setTotal]     = useState(0);
  const [pages,   setPages]     = useState(1);
  const [page,    setPage]      = useState(1);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    panditPortalApi.reviews({ page, limit: 10 })
      .then(d => {
        setReviews(d.reviews || []);
        setTotal(d.total || 0);
        setPages(d.pages || 1);
        setSummary(d.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const overall = provider?.ratingSummary?.overall || 0;
  const count   = provider?.ratingSummary?.count   || 0;

  return (
    <div className="pp-content">
      <div className="pp-page-title">⭐ Reviews</div>
      <div className="pp-page-sub">What customers say about you</div>

      {/* Summary */}
      <div className="pp-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 24, alignItems: 'start' }}>
          {/* Overall */}
          <div style={{ textAlign: 'center', paddingRight: 24, borderRight: '1px solid #f0ebe0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem', color: 'var(--text-dark)', lineHeight: 1 }}>
              {overall.toFixed(1)}
            </div>
            <Stars value={overall} size="1.2rem" />
            <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 4 }}>{count} reviews</div>
          </div>

          {/* Attribute breakdown */}
          {summary && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10, fontSize: '0.88rem' }}>Breakdown</div>
              <RatingBar label="Punctuality"      value={summary.avgPunctuality} />
              <RatingBar label="Communication"    value={summary.avgCommunication} />
              <RatingBar label="Service Quality"  value={summary.avgQuality} />
              <RatingBar label="Professionalism"  value={summary.avgProfessionalism} />
            </div>
          )}

          {/* Star distribution */}
          {summary && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10, fontSize: '0.88rem' }}>Distribution</div>
              {[5, 4, 3, 2, 1].map(s => (
                <DistributionBar key={s} label={s} count={summary[`r${s}`] || 0} total={count} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review list */}
      {loading && <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>Loading…</div>}

      {!loading && reviews.length === 0 && (
        <div className="pp-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⭐</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>No reviews yet</div>
          <div style={{ fontSize: '0.88rem', color: '#aaa' }}>
            Complete bookings to start receiving reviews from customers
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {reviews.map(r => {
          const avgRating = ((r.ratings?.punctuality || 0) + (r.ratings?.communication || 0) + (r.ratings?.serviceQuality || 0) + (r.ratings?.professionalism || 0)) / 4;
          return (
            <div key={r._id} className="pp-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>
                    {(r.customerId?.profile?.displayName || r.customerId?.profile?.firstName || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {r.customerId?.profile?.displayName || r.customerId?.profile?.firstName || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: 1 }}>
                      {r.createdTime ? new Date(r.createdTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </div>
                  </div>
                </div>
                <Stars value={avgRating} />
              </div>

              {/* Attribute ratings */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {[
                  ['Punctuality',    r.ratings?.punctuality],
                  ['Communication',  r.ratings?.communication],
                  ['Quality',        r.ratings?.serviceQuality],
                  ['Professional',   r.ratings?.professionalism],
                ].map(([label, val]) => val && (
                  <div key={label} style={{ background: '#faf8f4', borderRadius: 8, padding: '4px 10px', fontSize: '0.74rem', color: '#666' }}>
                    {label}: <strong style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(val))}</strong>
                  </div>
                ))}
              </div>

              {r.comment && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-mid)', lineHeight: 1.6, margin: 0, borderTop: '1px solid #f5f0e8', paddingTop: 10 }}>
                  "{r.comment}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button className="pp-btn pp-btn--ghost pp-btn--sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
          <span style={{ padding: '7px 14px', fontSize: '0.82rem', color: '#888' }}>{page} / {pages}</span>
          <button className="pp-btn pp-btn--ghost pp-btn--sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
        </div>
      )}
    </div>
  );
}
