/**
 * AdminServices — browse services and view requirement field configuration.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

function ServicePanel({ serviceId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.service(serviceId).then(setData).finally(() => setLoading(false));
  }, [serviceId]);

  const { service, providerCount = 0, bookingCount = 0 } = data || {};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Service Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>
        {loading && <div className="admin-loading"><div className="admin-loading__spinner" /></div>}
        {!loading && service && (
          <div style={{ padding: 24 }}>
            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 6 }}>{service.name}</div>
              <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: 12 }}>{service.description}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ background: '#f0e8d8', color: '#7a4f00', borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem' }}>{service.serviceType}</span>
                <span style={{ background: service.isActive ? '#dcfce7' : '#f3f4f6', color: service.isActive ? '#16a34a' : '#888', borderRadius: 6, padding: '3px 9px', fontSize: '0.75rem' }}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Providers', value: providerCount },
                { label: 'Bookings',  value: bookingCount  },
                { label: 'From',      value: service.pricing?.startingFrom ? `₹${service.pricing.startingFrom.toLocaleString()}` : '—' },
                { label: 'Type',      value: service.pricing?.model || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="admin-kpi-card" style={{ padding: '12px 16px' }}>
                  <div className="admin-kpi-card__label">{label}</div>
                  <div className="admin-kpi-card__value" style={{ fontSize: '1.3rem' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Requirement fields */}
            {service.requirementFields?.length > 0 && (
              <div className="admin-card">
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 12 }}>
                  Requirement Fields ({service.requirementFields.length})
                </div>
                {service.requirementFields.map((f, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.label}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ background: '#e8f4fd', color: '#0369a1', borderRadius: 6, padding: '2px 7px', fontSize: '0.7rem' }}>{f.type}</span>
                        {f.required && <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 6, padding: '2px 7px', fontSize: '0.7rem' }}>Required</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa' }}>key: {f.key}</div>
                    {f.options?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>
                        Options: {f.options.join(', ')}
                      </div>
                    )}
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

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters,  setFilters]  = useState({ q: '', isActive: '' });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.services({ ...filters, page, limit: 30 })
      .then(({ services: s, total: t, pages: pg }) => { setServices(s); setTotal(t); setPages(pg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>🛕 Services ({total})</div>

      <div className="admin-table-wrap">
        <div className="admin-filter-bar">
          <input
            className="admin-filter-input"
            placeholder="Search services…"
            value={filters.q}
            onChange={e => setFilter('q', e.target.value)}
            style={{ minWidth: 200 }}
          />
          <select className="admin-filter-select" value={filters.isActive} onChange={e => setFilter('isActive', e.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄</button>
        </div>

        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : services.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">🛕</div>No services found</div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Starting From</th>
                    <th>Req. Fields</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ fontSize: '0.82rem', color: '#666' }}>{s.categoryId?.name || '—'}</td>
                      <td style={{ fontSize: '0.78rem' }}>
                        <span style={{ background: '#f0e8d8', color: '#7a4f00', borderRadius: 6, padding: '2px 7px', fontSize: '0.72rem' }}>
                          {s.serviceType}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>
                        {s.pricing?.startingFrom ? `₹${s.pricing.startingFrom.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#666' }}>
                        {s.requirementFields?.length || 0} fields
                      </td>
                      <td>
                        <span className={`status-badge status-badge--${s.isActive ? 'green' : 'gray'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(s._id)}>
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
          <span>{total} services</span>
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
            <button className="admin-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>

      {selected && <ServicePanel serviceId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
