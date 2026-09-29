/**
 * AdminLocations — manage geo hierarchy + view location stats.
 * Tabs: Cities | Areas | Coverage | Stats
 */
import React, { useState, useEffect, useCallback } from 'react';
import { geoApi }   from '../../api/geo.js';
import { adminApi } from '../../api/admin.js';

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 20 }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-ui)', fontSize: '0.85rem', fontWeight: active === t ? 700 : 400,
            color: active === t ? 'var(--saffron)' : '#888',
            borderBottom: active === t ? '2px solid var(--saffron)' : '2px solid transparent',
            marginBottom: -2,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ── Form modal ── */
function FormModal({ title, fields, initial = {}, onSave, onClose }) {
  const [vals, setVals] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(vals); onClose(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 440, padding: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{title}</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#888', marginBottom: 4 }}>{f.label}</label>
              <input
                className="admin-filter-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={vals[f.key] || ''}
                onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                required={f.required}
                placeholder={f.placeholder || ''}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Cities tab ── */
function CitiesTab() {
  const [cities,  setCities]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'add' | {city}

  const load = () => {
    setLoading(true);
    geoApi.cities('').then(r => {
      // API called without stateId filter
      fetch('/api/geo/cities').then(r => r.json()).then(d => setCities(d.cities || []));
    }).catch(() => {
      fetch('/api/geo/cities').then(r => r.json()).then(d => setCities(d.cities || []));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (vals) => {
    await geoApi.createCity(vals);
    load();
  };

  const handleToggle = async (city) => {
    await geoApi.updateCity(city._id, { isActive: !city.isActive });
    load();
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading__spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="admin-btn admin-btn--primary" onClick={() => setModal('add')}>+ Add City</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>City ID</th><th>Name</th><th>State</th><th>Country</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {cities.length === 0 && (
              <tr><td colSpan={6}><div className="admin-empty"><div className="admin-empty__icon">🏙️</div>No cities yet</div></td></tr>
            )}
            {cities.map(c => (
              <tr key={c._id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#888' }}>{c._id}</td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ fontSize: '0.82rem', color: '#666' }}>{c.stateId}</td>
                <td style={{ fontSize: '0.82rem', color: '#666' }}>{c.countryId}</td>
                <td>
                  <span className={`status-badge status-badge--${c.isActive ? 'green' : 'gray'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => handleToggle(c)}>
                    {c.isActive ? '⏸ Deactivate' : '✅ Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'add' && (
        <FormModal
          title="Add City"
          fields={[
            { key: '_id',       label: 'City ID (e.g. IN_MP_INDORE)',  required: true },
            { key: 'name',      label: 'City Name',                   required: true },
            { key: 'stateId',   label: 'State ID (e.g. IN_MP)',       required: true },
            { key: 'countryId', label: 'Country ID (e.g. IN)',        required: true },
          ]}
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ── Areas tab ── */
function AreasTab() {
  const [areas,   setAreas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [cityFilter, setCityFilter] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`/api/geo/areas${cityFilter ? `?cityId=${cityFilter}` : ''}`)
      .then(r => r.json())
      .then(d => setAreas(d.areas || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [cityFilter]);

  const handleAdd = async (vals) => {
    await geoApi.createArea({
      ...vals,
      coordinates: vals.lat && vals.lng
        ? { latitude: parseFloat(vals.lat), longitude: parseFloat(vals.lng) }
        : undefined,
    });
    load();
  };

  const handleToggle = async (area) => {
    await geoApi.updateArea(area._id, { isActive: !area.isActive });
    load();
  };

  if (loading) return <div className="admin-loading"><div className="admin-loading__spinner" /></div>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <input
          className="admin-filter-input"
          placeholder="Filter by City ID…"
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          style={{ width: 220 }}
        />
        <button className="admin-btn admin-btn--primary" onClick={() => setModal('add')}>+ Add Area</button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Area ID</th><th>Name</th><th>City</th><th>Postal Code</th><th>Coordinates</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {areas.length === 0 && (
              <tr><td colSpan={7}><div className="admin-empty"><div className="admin-empty__icon">📍</div>No areas yet</div></td></tr>
            )}
            {areas.map(a => (
              <tr key={a._id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>{a._id}</td>
                <td style={{ fontWeight: 600 }}>{a.name}</td>
                <td style={{ fontSize: '0.8rem', color: '#666' }}>{a.cityId}</td>
                <td style={{ fontSize: '0.8rem' }}>{a.postalCode || '—'}</td>
                <td style={{ fontSize: '0.78rem', color: '#aaa' }}>
                  {a.coordinates?.latitude ? `${a.coordinates.latitude.toFixed(4)}, ${a.coordinates.longitude.toFixed(4)}` : '—'}
                </td>
                <td>
                  <span className={`status-badge status-badge--${a.isActive ? 'green' : 'gray'}`}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => handleToggle(a)}>
                    {a.isActive ? '⏸' : '✅'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal === 'add' && (
        <FormModal
          title="Add Area / Locality"
          fields={[
            { key: '_id',       label: 'Area ID (e.g. IN_MP_INDORE_VIJAY_NAGAR)', required: true },
            { key: 'name',      label: 'Area Name',                               required: true },
            { key: 'cityId',    label: 'City ID (e.g. IN_MP_INDORE)',             required: true },
            { key: 'stateId',   label: 'State ID (e.g. IN_MP)',                   required: true },
            { key: 'countryId', label: 'Country ID (e.g. IN)',                    required: true },
            { key: 'postalCode',label: 'Postal Code' },
            { key: 'lat',       label: 'Latitude',  placeholder: '22.7533' },
            { key: 'lng',       label: 'Longitude', placeholder: '75.8937' },
          ]}
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

/* ── Stats tab ── */
function StatsTab() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminApi.locationStats().then(setStats).catch(console.error);
  }, []);

  if (!stats) return <div className="admin-loading"><div className="admin-loading__spinner" /></div>;

  const max = Math.max(...(stats.cityBreakdown || []).map(c => c.count), 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      <div className="admin-card">
        <div className="admin-section-title">📊 Platform Summary</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Active Providers', value: stats.providerCount },
            { label: 'Total Bookings',   value: stats.bookingCount },
            { label: 'Service Requests', value: stats.requestCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-mid)' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{(value || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-section-title">🗺️ Active Providers by City</div>
        {(stats.cityBreakdown || []).length === 0
          ? <div className="admin-empty"><div className="admin-empty__icon">📍</div>No data yet</div>
          : (
            <div className="admin-bar-chart">
              {stats.cityBreakdown.map((c, i) => (
                <div key={i} className="admin-bar-row">
                  <div className="admin-bar-label">{c._id || 'Unknown'}</div>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: `${Math.round((c.count / max) * 100)}%` }} />
                  </div>
                  <div className="admin-bar-count">{c.count}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AdminLocations() {
  const [tab, setTab] = useState('Cities');

  return (
    <>
      <div className="admin-section-title" style={{ marginBottom: 20 }}>📍 Location Management</div>
      <TabBar tabs={['Cities', 'Areas', 'Stats']} active={tab} onChange={setTab} />
      {tab === 'Cities' && <CitiesTab />}
      {tab === 'Areas'  && <AreasTab />}
      {tab === 'Stats'  && <StatsTab />}
    </>
  );
}
