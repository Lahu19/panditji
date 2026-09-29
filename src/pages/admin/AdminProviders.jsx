/**
 * AdminProviders — list, filter, verify, suspend providers.
 * Includes a detail slide-in panel for verification workflow.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

const STATUS_COLORS = {
  ACTIVE: 'green', INACTIVE: 'gray', SUSPENDED: 'red', PENDING_VERIFICATION: 'yellow',
};
const VERIFY_COLORS = {
  VERIFIED: 'green', PARTIAL: 'yellow', UNVERIFIED: 'gray',
};

function StatusBadge({ status, map = STATUS_COLORS }) {
  return (
    <span className={`status-badge status-badge--${map[status] || 'gray'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

/* ── Provider detail panel ── */
function ProviderPanel({ providerId, onClose, onRefresh }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [verType, setVerType] = useState('IDENTITY');
  const [verNote, setVerNote] = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!providerId) return;
    setLoading(true);
    adminApi.provider(providerId)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, [providerId]);

  const handleVerify = async (status) => {
    setSaving(true);
    try {
      await adminApi.verifyProvider(providerId, {
        verificationType: verType,
        status,
        remarks: verNote,
      });
      onRefresh();
      // Re-fetch panel data
      const d = await adminApi.provider(providerId);
      setData(d);
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!window.confirm(`Set provider status to ${status}?`)) return;
    try {
      await adminApi.setProviderStatus(providerId, status);
      onRefresh();
      const d = await adminApi.provider(providerId);
      setData(d);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
      display: 'flex', justifyContent: 'flex-end',
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 560, background: 'white', height: '100%',
        overflow: 'y-auto', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Provider Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        {loading && <div className="admin-loading"><div className="admin-loading__spinner" /></div>}

        {!loading && data && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {/* Profile */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🙏</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{data.provider?.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: 2 }}>
                  {data.provider?.location?.city} · {data.provider?.providerType}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <StatusBadge status={data.provider?.status} />
                  <StatusBadge status={data.provider?.verificationStatus} map={VERIFY_COLORS} />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dark)' }}>
                📧 {data.provider?.userId?.contact?.email || '—'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-dark)', marginTop: 4 }}>
                📞 {data.provider?.userId?.contact?.phone || '—'}
              </div>
            </div>

            {/* Services */}
            <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services ({data.provider?.serviceIds?.length || 0})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(data.provider?.serviceIds || []).map(s => (
                  <span key={s._id} style={{ background: '#f0e8d8', color: '#7a4f00', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem' }}>
                    {s.name}
                  </span>
                ))}
                {!data.provider?.serviceIds?.length && <span style={{ color: '#bbb', fontSize: '0.82rem' }}>No services linked</span>}
              </div>
            </div>

            {/* Service Areas */}
            {data.serviceAreas?.length > 0 && (
              <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Areas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.serviceAreas.map(a => (
                    <span key={a._id} style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 6, padding: '3px 8px', fontSize: '0.75rem' }}>
                      📍 {a.label || a.locationId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verification panel */}
            <div className="admin-card" style={{ padding: '18px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 12 }}>Verification</div>

              {/* Current status */}
              <div style={{ marginBottom: 12 }}>
                {(data.provider?.verifications || []).length === 0
                  ? <div style={{ color: '#bbb', fontSize: '0.82rem' }}>No verifications on record</div>
                  : (data.provider.verifications.map((v, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-mid)' }}>{v.type}</span>
                      <StatusBadge status={v.status} map={{ VERIFIED: 'green', FAILED: 'red', PENDING: 'yellow' }} />
                    </div>
                  )))
                }
              </div>

              {/* Verify action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select
                  value={verType}
                  onChange={e => setVerType(e.target.value)}
                  className="admin-filter-select"
                >
                  {['IDENTITY','PHONE','ADDRESS','CREDENTIAL','PROFILE','BACKGROUND'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  className="admin-filter-input"
                  placeholder="Remarks (optional)"
                  value={verNote}
                  onChange={e => setVerNote(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleVerify('VERIFIED')}
                    disabled={saving}
                    className="admin-btn admin-btn--gold"
                  >
                    ✓ Mark Verified
                  </button>
                  <button
                    onClick={() => handleVerify('FAILED')}
                    disabled={saving}
                    className="admin-btn admin-btn--danger"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>

            {/* Status actions */}
            <div className="admin-card" style={{ padding: '14px 18px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Status Actions</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => handleStatusChange('ACTIVE')}    className="admin-btn admin-btn--ghost admin-btn--sm">✅ Activate</button>
                <button onClick={() => handleStatusChange('INACTIVE')}  className="admin-btn admin-btn--ghost admin-btn--sm">⏸ Deactivate</button>
                <button onClick={() => handleStatusChange('SUSPENDED')} className="admin-btn admin-btn--danger admin-btn--sm">🚫 Suspend</button>
              </div>
            </div>

            {/* Recent bookings */}
            {data.bookings?.length > 0 && (
              <div className="admin-card" style={{ padding: '14px 18px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Recent Bookings</div>
                {data.bookings.slice(0, 5).map(b => (
                  <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.82rem' }}>
                    <span>{b.serviceId?.name} — {b.customerId?.profile?.firstName}</span>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function AdminProviders() {
  const [providers, setProviders] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);

  const [filters, setFilters] = useState({
    q: '', status: '', verificationStatus: '', city: '',
  });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.providers({ ...filters, page, limit: 20 })
      .then(({ providers: p, total: t, pages: pg }) => {
        setProviders(p); setTotal(t); setPages(pg);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilter = (k, v) => {
    setFilters(f => ({ ...f, [k]: v }));
    setPage(1);
  };

  return (
    <>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-section-title">🙏 Providers ({total})</div>
      </div>

      <div className="admin-table-wrap">
        {/* Filters */}
        <div className="admin-filter-bar">
          <input
            className="admin-filter-input"
            placeholder="Search name / city…"
            value={filters.q}
            onChange={e => handleFilter('q', e.target.value)}
            style={{ minWidth: 200 }}
          />
          <select className="admin-filter-select" value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {['ACTIVE','INACTIVE','SUSPENDED','PENDING_VERIFICATION'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="admin-filter-select" value={filters.verificationStatus} onChange={e => handleFilter('verificationStatus', e.target.value)}>
            <option value="">All Verification</option>
            {['VERIFIED','PARTIAL','UNVERIFIED'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input
            className="admin-filter-input"
            placeholder="City…"
            value={filters.city}
            onChange={e => handleFilter('city', e.target.value)}
            style={{ width: 120 }}
          />
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄 Refresh</button>
        </div>

        {/* Table */}
        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : providers.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">🙏</div>No providers found<br/><small>Try clearing filters</small></div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Type</th>
                    <th>City</th>
                    <th>Rating</th>
                    <th>Bookings</th>
                    <th>Verification</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.displayName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#888' }}>{p.userId?.contact?.email}</div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#666' }}>{p.providerType}</td>
                      <td style={{ fontSize: '0.82rem' }}>{p.location?.city || '—'}</td>
                      <td>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                          ★ {(p.ratingSummary?.overall || 0).toFixed(1)}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#aaa', marginLeft: 4 }}>
                          ({p.ratingSummary?.count || 0})
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{p.bookingSummary?.completed || 0}</td>
                      <td><StatusBadge status={p.verificationStatus} map={VERIFY_COLORS} /></td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        <button
                          className="admin-btn admin-btn--ghost admin-btn--sm"
                          onClick={() => setSelected(p._id)}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }

        {/* Pagination */}
        <div className="admin-table-footer">
          <span>{total} providers</span>
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
            <button className="admin-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <ProviderPanel
          providerId={selected}
          onClose={() => setSelected(null)}
          onRefresh={load}
        />
      )}
    </>
  );
}
