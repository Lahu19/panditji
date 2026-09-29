/**
 * AdminUsers — list, filter, and manage all platform users.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/admin.js';

const STATUS_MAP = { ACTIVE: 'green', INACTIVE: 'gray', SUSPENDED: 'red' };
const TYPE_MAP   = { CUSTOMER: 'blue', PROVIDER: 'gold', ADMIN: 'purple' };

function StatusBadge({ status, map = STATUS_MAP }) {
  return (
    <span className={`status-badge status-badge--${map[status] || 'gray'}`}>
      {status}
    </span>
  );
}

function UserPanel({ userId, onClose, onRefresh }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    adminApi.user(userId).then(setData).finally(() => setLoading(false));
  }, [userId]);

  const handleUpdate = async (field, value) => {
    setSaving(true);
    try {
      await adminApi.updateUser(userId, { [field]: value });
      const fresh = await adminApi.user(userId);
      setData(fresh);
      onRefresh();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="admin-loading__spinner" />
    </div>
  );

  const { user, bookings = [], requests = [] } = data || {};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>User Details</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Profile */}
          <div className="admin-card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>👤</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <StatusBadge status={user?.userType} map={TYPE_MAP} />
                  <StatusBadge status={user?.status} />
                </div>
              </div>
            </div>
            {[
              ['Email',  user?.contact?.email],
              ['Phone',  user?.contact?.phone],
              ['Joined', user?.createdTime ? new Date(user.createdTime).toLocaleDateString('en-IN') : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.83rem' }}>
                <span style={{ color: '#888' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="admin-card" style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Status Actions</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button disabled={saving} onClick={() => handleUpdate('status', 'ACTIVE')}    className="admin-btn admin-btn--ghost admin-btn--sm">✅ Activate</button>
              <button disabled={saving} onClick={() => handleUpdate('status', 'INACTIVE')}  className="admin-btn admin-btn--ghost admin-btn--sm">⏸ Deactivate</button>
              <button disabled={saving} onClick={() => handleUpdate('status', 'SUSPENDED')} className="admin-btn admin-btn--danger admin-btn--sm">🚫 Suspend</button>
            </div>
          </div>

          {/* Recent bookings */}
          {bookings.length > 0 && (
            <div className="admin-card" style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Recent Bookings ({bookings.length})</div>
              {bookings.slice(0, 5).map(b => (
                <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.82rem' }}>
                  <span>{b.serviceId?.name || '—'}</span>
                  <span className={`status-badge status-badge--gray`} style={{ fontSize: '0.68rem' }}>{b.status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent requests */}
          {requests.length > 0 && (
            <div className="admin-card">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 10 }}>Recent Requests ({requests.length})</div>
              {requests.map(r => (
                <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.82rem' }}>
                  <span>{r.rawInput?.slice(0, 48) || r.serviceId || '—'}…</span>
                  <span style={{ color: '#888', fontSize: '0.72rem' }}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(null);
  const [filters, setFilters] = useState({ q: '', userType: '', status: '' });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.users({ ...filters, page, limit: 20 })
      .then(({ users: u, total: t, pages: pg }) => { setUsers(u); setTotal(t); setPages(pg); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>👥 Users ({total})</div>

      <div className="admin-table-wrap">
        <div className="admin-filter-bar">
          <input
            className="admin-filter-input"
            placeholder="Search name / email / phone…"
            value={filters.q}
            onChange={e => setFilter('q', e.target.value)}
            style={{ minWidth: 220 }}
          />
          <select className="admin-filter-select" value={filters.userType} onChange={e => setFilter('userType', e.target.value)}>
            <option value="">All Types</option>
            {['CUSTOMER','PROVIDER','ADMIN'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="admin-filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All Statuses</option>
            {['ACTIVE','INACTIVE','SUSPENDED'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={load}>🔄</button>
        </div>

        {loading
          ? <div className="admin-loading"><div className="admin-loading__spinner" /></div>
          : users.length === 0
            ? <div className="admin-empty"><div className="admin-empty__icon">👥</div>No users found</div>
            : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 600 }}>
                        {[u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#555' }}>{u.contact?.email || '—'}</td>
                      <td style={{ fontSize: '0.82rem', color: '#555' }}>{u.contact?.phone || '—'}</td>
                      <td><StatusBadge status={u.userType} map={TYPE_MAP} /></td>
                      <td><StatusBadge status={u.status} /></td>
                      <td style={{ fontSize: '0.78rem', color: '#aaa' }}>
                        {new Date(u.createdTime).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSelected(u._id)}>
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
          <span>{total} users</span>
          <div className="admin-pagination">
            <button className="admin-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span style={{ padding: '5px 10px', fontSize: '0.8rem' }}>{page} / {pages}</span>
            <button className="admin-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>

      {selected && <UserPanel userId={selected} onClose={() => setSelected(null)} onRefresh={load} />}
    </>
  );
}
