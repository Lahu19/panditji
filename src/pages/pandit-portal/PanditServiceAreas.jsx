/**
 * PanditServiceAreas — define where the provider serves customers.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { panditPortalApi } from '../../api/panditPortal.js';
import { LocationSearch } from '../../components/LocationSelector.jsx';

const TYPE_LABELS = {
  CITY:    '🏙️ City',
  AREA:    '📍 Area / Locality',
  STATE:   '🗺️ State',
  RADIUS:  '📡 Radius',
  COUNTRY: '🌏 Country',
};

const TRAVEL_CHARGE_OPTIONS = [
  { value: 'FREE',   label: 'Free travel' },
  { value: 'FLAT',   label: 'Flat charge' },
  { value: 'PER_KM', label: 'Per km charge' },
];

function AreaCard({ area, onDelete, onToggle }) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Remove this service area?')) return;
    setBusy(true);
    try { await onDelete(area._id); }
    finally { setBusy(false); }
  };

  return (
    <div className="pp-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>
          {area.label || area.locationId || `${area.radiusKm} km radius`}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <span className="pp-badge pp-badge--blue">{TYPE_LABELS[area.locationType] || area.locationType}</span>
          {area.locationType === 'RADIUS' && (
            <span className="pp-badge pp-badge--gray">📡 {area.radiusKm} km</span>
          )}
          <span className={`pp-badge pp-badge--${area.isActive ? 'green' : 'gray'}`}>
            {area.isActive ? 'Active' : 'Inactive'}
          </span>
          {area.travelCharge?.model !== 'FREE' && (
            <span className="pp-badge pp-badge--orange">
              🚗 {area.travelCharge?.model === 'FLAT' ? `₹${area.travelCharge.flatAmount} travel` : `₹${area.travelCharge?.perKmAmount}/km`}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="pp-btn pp-btn--ghost pp-btn--sm" disabled={busy} onClick={() => onToggle(area)}>
          {area.isActive ? '⏸' : '▶'}
        </button>
        <button className="pp-btn pp-btn--danger pp-btn--sm" disabled={busy} onClick={handleDelete}>
          🗑
        </button>
      </div>
    </div>
  );
}

function AddAreaForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({
    locationType: 'CITY',
    label: '',
    locationId: '',
    radiusKm: 25,
    travelCharge: { model: 'FREE', flatAmount: 0, perKmAmount: 0, freeUpToKm: 0 },
  });
  const [saving, setSaving] = useState(false);

  const handleLocationSelect = (result) => {
    const id = form.locationType === 'CITY'  ? result.city?.id  :
               form.locationType === 'AREA'  ? result.area?.id  :
               form.locationType === 'STATE' ? result.state?.id : '';
    const name = form.locationType === 'CITY'  ? result.city?.name  :
                 form.locationType === 'AREA'  ? result.area?.name  :
                 form.locationType === 'STATE' ? result.state?.name : '';
    setForm(f => ({ ...f, locationId: id || '', label: name || result.formattedAddress || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAdd(form);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="pp-card" style={{ borderLeft: '4px solid var(--saffron)', marginBottom: 20 }}>
      <div className="pp-card__title">Add Service Area</div>
      <form onSubmit={handleSubmit}>
        <div className="pp-form-row">
          <div className="pp-form-group">
            <label className="pp-label">Coverage Type</label>
            <select className="pp-select" value={form.locationType} onChange={e => setForm(f => ({ ...f, locationType: e.target.value }))}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {form.locationType === 'RADIUS' && (
            <div className="pp-form-group">
              <label className="pp-label">Radius (km)</label>
              <input type="number" className="pp-input" value={form.radiusKm} min="1" max="500"
                onChange={e => setForm(f => ({ ...f, radiusKm: parseInt(e.target.value) || 25 }))} />
            </div>
          )}
        </div>

        {form.locationType !== 'RADIUS' && (
          <div className="pp-form-group">
            <label className="pp-label">Search Location</label>
            <LocationSearch onSelect={handleLocationSelect} />
            {form.label && (
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#22c55e' }}>
                ✓ Selected: {form.label}
              </div>
            )}
          </div>
        )}

        {/* Travel charge */}
        <div className="pp-form-group">
          <label className="pp-label">Travel Charge</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TRAVEL_CHARGE_OPTIONS.map(({ value, label }) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="radio" name="travelModel" value={value}
                  checked={form.travelCharge.model === value}
                  onChange={() => setForm(f => ({ ...f, travelCharge: { ...f.travelCharge, model: value } }))}
                  style={{ accentColor: 'var(--gold)' }}
                />
                <span style={{ fontSize: '0.84rem' }}>{label}</span>
              </label>
            ))}
          </div>
          {form.travelCharge.model === 'FLAT' && (
            <div style={{ marginTop: 10 }}>
              <label className="pp-label">Flat charge (₹)</label>
              <input type="number" className="pp-input" value={form.travelCharge.flatAmount}
                onChange={e => setForm(f => ({ ...f, travelCharge: { ...f.travelCharge, flatAmount: parseInt(e.target.value) || 0 } }))} />
            </div>
          )}
          {form.travelCharge.model === 'PER_KM' && (
            <div className="pp-form-row" style={{ marginTop: 10 }}>
              <div>
                <label className="pp-label">Per km (₹)</label>
                <input type="number" className="pp-input" value={form.travelCharge.perKmAmount}
                  onChange={e => setForm(f => ({ ...f, travelCharge: { ...f.travelCharge, perKmAmount: parseInt(e.target.value) || 0 } }))} />
              </div>
              <div>
                <label className="pp-label">Free up to (km)</label>
                <input type="number" className="pp-input" value={form.travelCharge.freeUpToKm}
                  onChange={e => setForm(f => ({ ...f, travelCharge: { ...f.travelCharge, freeUpToKm: parseInt(e.target.value) || 0 } }))} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" className="pp-btn pp-btn--ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="pp-btn pp-btn--primary" disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Adding…' : '+ Add Area'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PanditServiceAreas() {
  const [areas,    setAreas]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [adding,   setAdding]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    panditPortalApi.serviceAreas()
      .then(d => setAreas(d.areas || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (form) => {
    await panditPortalApi.addServiceArea(form);
    setAdding(false);
    load();
  };

  const handleDelete = async (id) => {
    await panditPortalApi.deleteServiceArea(id);
    load();
  };

  const handleToggle = async (area) => {
    await panditPortalApi.updateServiceArea(area._id, { isActive: !area.isActive });
    load();
  };

  return (
    <div className="pp-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="pp-page-title">📍 Where I Serve</div>
          <div className="pp-page-sub">Define the areas where you provide services</div>
        </div>
        {!adding && <button className="pp-btn pp-btn--primary" onClick={() => setAdding(true)}>+ Add Area</button>}
      </div>

      {/* Explanation */}
      <div style={{ background: '#fdf8ee', border: '1px solid #f0e8d0', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: '0.84rem', color: '#7a5c1e' }}>
        <strong>📍 Base location</strong> is where you are based.{' '}
        <strong>Service areas</strong> are the locations where you travel to perform ceremonies.
        They can be different — for example, you can be based in Indore but serve customers in Bhopal and Ujjain.
      </div>

      {adding && <AddAreaForm onAdd={handleAdd} onCancel={() => setAdding(false)} />}

      {loading && <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>Loading…</div>}

      {!loading && areas.length === 0 && !adding && (
        <div className="pp-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📍</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>No service areas defined</div>
          <div style={{ fontSize: '0.88rem', color: '#aaa', marginBottom: 20 }}>
            Add the cities and areas where you provide services. Customers in those areas will be able to find you.
          </div>
          <button className="pp-btn pp-btn--primary" onClick={() => setAdding(true)}>+ Add Your First Area</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {areas.map(a => (
          <AreaCard key={a._id} area={a} onDelete={handleDelete} onToggle={handleToggle} />
        ))}
      </div>
    </div>
  );
}
