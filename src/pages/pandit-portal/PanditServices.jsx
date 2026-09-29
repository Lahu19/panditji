/**
 * PanditServices — list, add, configure, and remove provider services.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { panditPortalApi } from '../../api/panditPortal.js';

function ServiceConfigModal({ ps, onSave, onClose }) {
  const [form, setForm] = useState({
    experienceCount: ps?.experienceCount || 0,
    notes:           ps?.notes || '',
    pricing: {
      model:         ps?.pricing?.model         || 'STARTING_FROM',
      startingPrice: ps?.pricing?.startingPrice || 0,
      maxPrice:      ps?.pricing?.maxPrice      || 0,
      currency:      'INR',
    },
    capabilities: {
      providesSamagri:            ps?.capabilities?.providesSamagri            || false,
      supportsMultipleParticipants: ps?.capabilities?.supportsMultipleParticipants || false,
      acceptsCorporateBookings:   ps?.capabilities?.acceptsCorporateBookings   || false,
      acceptsNriBookings:         ps?.capabilities?.acceptsNriBookings         || false,
    },
  });
  const [saving, setSaving] = useState(false);

  const set = (path, value) => {
    const parts = path.split('.');
    setForm(f => {
      const copy = JSON.parse(JSON.stringify(f));
      let cur = copy;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
            Configure: {ps?.serviceId?.name}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#aaa' }}>✕</button>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: 20 }}>
          <div className="pp-card__title">Pricing</div>
          <div className="pp-form-row">
            <div className="pp-form-group">
              <label className="pp-label">Model</label>
              <select className="pp-select" value={form.pricing.model} onChange={e => set('pricing.model', e.target.value)}>
                {['FIXED','STARTING_FROM','HOURLY','CUSTOM_QUOTE','REQUEST_QUOTE'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="pp-form-group">
              <label className="pp-label">Starting Price (₹)</label>
              <input className="pp-input" type="number" min="0" value={form.pricing.startingPrice} onChange={e => set('pricing.startingPrice', parseInt(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="pp-form-group" style={{ marginBottom: 20 }}>
          <label className="pp-label">Ceremonies Completed (approx.)</label>
          <input className="pp-input" type="number" min="0" value={form.experienceCount} onChange={e => setForm(f => ({ ...f, experienceCount: parseInt(e.target.value) || 0 }))} />
        </div>

        {/* Capabilities */}
        <div style={{ marginBottom: 20 }}>
          <div className="pp-card__title">Capabilities</div>
          {[
            ['providesSamagri',            '🪔 I provide Samagri for this service'],
            ['supportsMultipleParticipants','👥 Supports multiple participants'],
            ['acceptsCorporateBookings',   '🏢 Accepts corporate bookings'],
            ['acceptsNriBookings',         '✈️ Accepts NRI / remote bookings'],
          ].map(([key, label]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.capabilities[key]}
                onChange={e => set(`capabilities.${key}`, e.target.checked)}
                style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
              />
              <span style={{ fontSize: '0.86rem' }}>{label}</span>
            </label>
          ))}
        </div>

        {/* Notes */}
        <div className="pp-form-group" style={{ marginBottom: 20 }}>
          <label className="pp-label">Additional Notes (optional)</label>
          <textarea className="pp-input pp-textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes about how you perform this service…" />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="pp-btn pp-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="pp-btn pp-btn--primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : '💾 Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddServiceModal({ catalog, existing, onAdd, onClose }) {
  const [selected, setSelected] = useState(null);

  const existingIds = existing.map(ps => ps.serviceId?._id?.toString() || ps.serviceId?.toString());

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Add a Service</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#aaa' }}>✕</button>
        </div>
        {catalog.map(({ category, services }) => (
          <div key={category._id} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {category.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
              {services.map(s => {
                const already = existingIds.includes(s._id.toString());
                return (
                  <button
                    key={s._id}
                    disabled={already}
                    onClick={() => setSelected(s)}
                    style={{
                      padding: '8px 12px', border: `1.5px solid ${selected?._id === s._id ? 'var(--gold)' : '#e0d8cc'}`,
                      borderRadius: 8, background: already ? '#f5f5f5' : selected?._id === s._id ? '#fffbee' : 'white',
                      cursor: already ? 'not-allowed' : 'pointer', fontSize: '0.82rem',
                      color: already ? '#bbb' : 'var(--text-dark)', fontFamily: 'var(--font-ui)',
                      textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    {s.name} {already ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="pp-btn pp-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="pp-btn pp-btn--primary" disabled={!selected} onClick={() => selected && onAdd(selected)} style={{ flex: 1 }}>
            Add {selected?.name || 'Service'} →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PanditServices() {
  const [providerServices, setProviderServices] = useState([]);
  const [catalog,          setCatalog]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [configuring,      setConfiguring]      = useState(null);
  const [addingModal,      setAddingModal]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [servicesRes, catalogRes] = await Promise.all([
        panditPortalApi.myServices(),
        panditPortalApi.servicesCatalog(),
      ]);
      setProviderServices(servicesRes.providerServices || []);
      setCatalog(catalogRes.grouped || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (service) => {
    try {
      await panditPortalApi.addService({ serviceId: service._id });
      setAddingModal(false);
      load();
    } catch (e) { alert(e.message); }
  };

  const handleSaveConfig = async (form) => {
    await panditPortalApi.updateService(configuring._id, form);
    load();
  };

  const handleRemove = async (ps) => {
    if (!window.confirm(`Remove "${ps.serviceId?.name}" from your profile?`)) return;
    try { await panditPortalApi.removeService(ps._id); load(); }
    catch (e) { alert(e.message); }
  };

  const handleToggle = async (ps) => {
    const newStatus = ps.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await panditPortalApi.updateService(ps._id, { status: newStatus });
    load();
  };

  return (
    <div className="pp-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div className="pp-page-title">🛕 My Services</div>
          <div className="pp-page-sub">Manage the services you offer and configure pricing</div>
        </div>
        <button className="pp-btn pp-btn--primary" onClick={() => setAddingModal(true)}>+ Add Service</button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading…</div>}

      {!loading && providerServices.length === 0 && (
        <div className="pp-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 14 }}>🛕</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>No services yet</div>
          <div style={{ fontSize: '0.88rem', color: '#aaa', marginBottom: 20 }}>Add the services you provide to appear in customer searches</div>
          <button className="pp-btn pp-btn--primary" onClick={() => setAddingModal(true)}>+ Add Your First Service</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {providerServices.map(ps => (
          <div key={ps._id} className="pp-card" style={{ borderTop: `3px solid ${ps.status === 'ACTIVE' ? 'var(--saffron)' : '#ddd'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
                {ps.serviceId?.name || 'Service'}
              </div>
              <span className={`pp-badge pp-badge--${ps.status === 'ACTIVE' ? 'green' : 'gray'}`}>
                {ps.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#888' }}>Starting from</span>
                <span style={{ fontWeight: 600 }}>
                  {ps.pricing?.startingPrice ? `₹${ps.pricing.startingPrice.toLocaleString()}` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: '#888' }}>Ceremonies</span>
                <span style={{ fontWeight: 600 }}>{ps.experienceCount || 0}</span>
              </div>
              {ps.capabilities?.providesSamagri && (
                <div style={{ fontSize: '0.78rem', color: '#22c55e' }}>🪔 Samagri available</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={() => setConfiguring(ps)} style={{ flex: 1 }}>
                ⚙️ Configure
              </button>
              <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={() => handleToggle(ps)}>
                {ps.status === 'ACTIVE' ? '⏸' : '▶'}
              </button>
              <button className="pp-btn pp-btn--danger pp-btn--sm" onClick={() => handleRemove(ps)}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      {addingModal && (
        <AddServiceModal
          catalog={catalog}
          existing={providerServices}
          onAdd={handleAdd}
          onClose={() => setAddingModal(false)}
        />
      )}

      {configuring && (
        <ServiceConfigModal
          ps={configuring}
          onSave={handleSaveConfig}
          onClose={() => setConfiguring(null)}
        />
      )}
    </div>
  );
}
