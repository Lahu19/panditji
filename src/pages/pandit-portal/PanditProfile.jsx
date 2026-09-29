/**
 * PanditProfile — edit basic profile info with live save.
 * Also includes a public-profile preview card.
 */
import React, { useState, useEffect } from 'react';
import { usePanditPortal } from '../../context/PanditPortalContext.jsx';
import { panditPortalApi } from '../../api/panditPortal.js';

const LANGUAGES  = ['Hindi','Sanskrit','Marathi','Gujarati','Bengali','Tamil','Telugu','Kannada','Malayalam','Punjabi','English','Other'];
const TRADITIONS = ['Vedic','North Indian','South Indian','Regional','Vaishnavite','Shaivite','Shakta','Custom'];

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`pp-chip${active ? ' pp-chip--active' : ''}`}>
      {label}
    </button>
  );
}

export default function PanditProfile() {
  const { provider, user, refresh } = usePanditPortal();
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    if (!provider) return;
    setForm({
      displayName:  provider.displayName || '',
      providerType: provider.providerType || 'INDIVIDUAL',
      about:        provider.profile?.about || '',
      experienceYears: provider.profile?.experienceYears || 0,
      languages:    provider.profile?.languages || [],
      traditions:   provider.profile?.traditions || [],
    });
  }, [provider]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleChip = (arr, val) =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const handleSave = async () => {
    setSaving(true);
    try {
      await panditPortalApi.updateProfile({
        displayName:  form.displayName,
        providerType: form.providerType,
        profile: {
          about:           form.about,
          experienceYears: parseInt(form.experienceYears) || 0,
          languages:       form.languages,
          traditions:      form.traditions,
        },
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="pp-content">
      <div className="pp-page-title">👤 My Profile</div>
      <div className="pp-page-sub">This information is shown to customers</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
        {/* Edit form */}
        <div className="pp-card">
          <div className="pp-form-group">
            <label className="pp-label">Display Name (shown to customers)</label>
            <input className="pp-input" value={form.displayName || ''} onChange={e => set('displayName', e.target.value)} placeholder="Pandit Rajesh Sharma" />
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Provider Type</label>
            <select className="pp-select" value={form.providerType || 'INDIVIDUAL'} onChange={e => set('providerType', e.target.value)}>
              {['INDIVIDUAL','TEAM','ORGANIZATION','TEMPLE','SERVICE_GROUP'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div className="pp-form-group">
            <label className="pp-label">About Me</label>
            <textarea className="pp-input pp-textarea" rows={5} value={form.about || ''} onChange={e => set('about', e.target.value)} placeholder="Describe your experience and approach to ceremonies…" />
            <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: 4 }}>{(form.about || '').length}/500 chars</div>
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Years of Experience</label>
            <input className="pp-input" type="number" min="0" value={form.experienceYears || ''} onChange={e => set('experienceYears', e.target.value)} style={{ maxWidth: 120 }} />
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Languages</label>
            <div className="pp-chip-group">
              {LANGUAGES.map(l => (
                <Chip key={l} label={l} active={(form.languages || []).includes(l)}
                  onClick={() => set('languages', toggleChip(form.languages || [], l))} />
              ))}
            </div>
          </div>

          <div className="pp-form-group">
            <label className="pp-label">Tradition / Practice</label>
            <div className="pp-chip-group">
              {TRADITIONS.map(t => (
                <Chip key={t} label={t} active={(form.traditions || []).includes(t)}
                  onClick={() => set('traditions', toggleChip(form.traditions || [], t))} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
            <button className="pp-btn pp-btn--primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Profile'}
            </button>
            {saved && <span style={{ fontSize: '0.82rem', color: '#22c55e' }}>✓ Saved</span>}
          </div>
        </div>

        {/* Public profile preview */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: '0.72rem', color: '#aaa', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Customer View Preview
          </div>
          <div style={{ background: 'white', border: '1px solid #e8e4da', borderRadius: 14, padding: 20, borderTop: '3px solid var(--gold)' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'center' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                🙏
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-dark)' }}>
                  {form.displayName || 'Your Display Name'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 2 }}>
                  {form.experienceYears ? `${form.experienceYears} years exp` : 'Experience not set'}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
              {provider?.verificationStatus === 'VERIFIED' && (
                <span className="pp-badge pp-badge--green">✓ Verified</span>
              )}
              <span className="pp-badge pp-badge--blue">
                {provider?.ratingSummary?.overall ? `⭐ ${provider.ratingSummary.overall.toFixed(1)}` : '⭐ —'}
              </span>
            </div>

            {/* Languages */}
            {(form.languages || []).length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '0.68rem', color: '#aaa', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Languages</div>
                <div style={{ fontSize: '0.78rem', color: '#555' }}>
                  {(form.languages || []).join(' · ')}
                </div>
              </div>
            )}

            {/* About snippet */}
            {form.about && (
              <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', marginBottom: 12 }}>
                {form.about}
              </div>
            )}

            {/* Location */}
            {provider?.location?.city && (
              <div style={{ fontSize: '0.78rem', color: '#888' }}>
                📍 {provider.location.city}
                {provider.location.state ? `, ${provider.location.state}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
