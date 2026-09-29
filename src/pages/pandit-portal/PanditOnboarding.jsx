/**
 * PanditOnboarding — 11-step guided wizard.
 * Shows only when profile completion < 100 and provider is in PENDING_VERIFICATION / draft.
 * Each step auto-saves to backend via POST /api/pandit-portal/onboarding/step.
 * Progress persists across page reloads via the provider document.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePanditPortal } from '../../context/PanditPortalContext.jsx';
import { panditPortalApi } from '../../api/panditPortal.js';
import { LocationSearch } from '../../components/LocationSelector.jsx';

/* ── Step definitions ── */
const STEPS = [
  { num: 1,  title: 'About You',         sub: 'Tell us who you are.' },
  { num: 2,  title: 'Your Location',     sub: 'Where are you based?' },
  { num: 3,  title: 'Your Services',     sub: 'What services do you offer?' },
  { num: 4,  title: 'Experience',        sub: 'Tell customers about your background.' },
  { num: 5,  title: 'Languages',         sub: 'Which languages do you speak?' },
  { num: 6,  title: 'Pricing',           sub: 'How much do your services cost?' },
  { num: 7,  title: 'Where You Serve',   sub: 'Which areas do you cover?' },
  { num: 8,  title: 'Availability',      sub: 'When are you available?' },
  { num: 9,  title: 'Photos & Videos',   sub: 'Showcase your work.' },
  { num: 10, title: 'Verification',      sub: 'Verify your identity.' },
  { num: 11, title: 'Review & Submit',   sub: 'Preview and submit for approval.' },
];

const TOTAL = STEPS.length;

const LANGUAGES = ['Hindi','Sanskrit','Marathi','Gujarati','Bengali','Tamil','Telugu','Kannada','Malayalam','Punjabi','English','Other'];
const TRADITIONS = ['Vedic','North Indian','South Indian','Regional','Vaishnavite','Shaivite','Shakta','Custom'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/* ── Shared chip multi-select ── */
function ChipSelect({ options, selected = [], onChange }) {
  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };
  return (
    <div className="pp-chip-group">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className={`pp-chip${selected.includes(o) ? ' pp-chip--active' : ''}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ── Step 1 — Basic Profile ── */
function Step1({ data, onChange }) {
  return (
    <>
      <div className="pp-form-row">
        <div className="pp-form-group">
          <label className="pp-label">Full Name</label>
          <input className="pp-input" value={data.fullName || ''} onChange={e => onChange('fullName', e.target.value)} placeholder="Rajesh Sharma" />
        </div>
        <div className="pp-form-group">
          <label className="pp-label">Display Name (shown to customers)</label>
          <input className="pp-input" value={data.displayName || ''} onChange={e => onChange('displayName', e.target.value)} placeholder="Pandit Rajesh Sharma" />
        </div>
      </div>
      <div className="pp-form-group">
        <label className="pp-label">Provider Type</label>
        <select className="pp-select" value={data.providerType || 'INDIVIDUAL'} onChange={e => onChange('providerType', e.target.value)}>
          {['INDIVIDUAL','TEAM','ORGANIZATION','TEMPLE','SERVICE_GROUP'].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="pp-form-group">
        <label className="pp-label">About Me</label>
        <textarea
          className="pp-input pp-textarea"
          value={data.about || ''}
          onChange={e => onChange('about', e.target.value)}
          placeholder="Tell customers about your experience and approach to ceremonies..."
          rows={4}
        />
        <div style={{ fontSize: '0.72rem', color: '#bbb', marginTop: 4 }}>
          {(data.about || '').length}/500 characters (minimum 20 recommended)
        </div>
      </div>
    </>
  );
}

/* ── Step 2 — Location ── */
function Step2({ data, onChange }) {
  const [confirmed, setConfirmed] = useState(!!data.city);

  const handleSelect = (result) => {
    onChange('locationResult', result);
    onChange('city',    result.city?.name    || '');
    onChange('state',   result.state?.name   || '');
    onChange('country', result.country?.name || 'India');
    onChange('cityId',    result.city?.id    || '');
    onChange('stateId',   result.state?.id   || '');
    onChange('countryId', result.country?.id || 'IN');
    onChange('coordinates', result.coordinates);
    onChange('formattedAddress', result.formattedAddress);
    setConfirmed(true);
  };

  return (
    <>
      <div style={{ background: '#fdf8ee', border: '1px solid #f0e8d0', borderRadius: 12, padding: '14px 16px', marginBottom: 20, fontSize: '0.84rem', color: '#7a5c1e' }}>
        📍 Your base location helps customers find you. This is where you are based — not necessarily your service area.
      </div>

      <div className="pp-form-group">
        <label className="pp-label">Search your city or area</label>
        <LocationSearch onSelect={handleSelect} autoFocus={!confirmed} />
      </div>

      {confirmed && data.city && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginTop: 12 }}>
          <div style={{ fontWeight: 700, color: '#15803d' }}>📍 {data.city}</div>
          <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>
            {[data.state, data.country].filter(Boolean).join(', ')}
          </div>
          <button className="pp-btn pp-btn--ghost pp-btn--sm" style={{ marginTop: 10 }} onClick={() => setConfirmed(false)}>
            Change location
          </button>
        </div>
      )}
    </>
  );
}

/* ── Step 3 — Services ── */
function Step3({ data, onChange }) {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    panditPortalApi.servicesCatalog()
      .then(d => setCatalog(d.grouped || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selected = data.selectedServiceIds || [];
  const toggle = (id) => {
    if (selected.includes(id)) onChange('selectedServiceIds', selected.filter(s => s !== id));
    else onChange('selectedServiceIds', [...selected, id]);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>Loading services…</div>;

  return (
    <>
      <div style={{ marginBottom: 14, fontSize: '0.84rem', color: '#888' }}>
        Select all services you provide. You can configure pricing for each service separately.
      </div>
      {catalog.map(({ category, services }) => (
        <div key={category._id} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            {category.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {services.map(s => (
              <label
                key={s._id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${selected.includes(s._id) ? 'var(--gold)' : '#e0d8cc'}`,
                  background: selected.includes(s._id) ? '#fffbee' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(s._id)}
                  onChange={() => toggle(s._id)}
                  style={{ accentColor: 'var(--gold)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: '0.84rem', color: 'var(--text-dark)', fontWeight: selected.includes(s._id) ? 600 : 400 }}>
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {selected.length > 0 && (
        <div style={{ background: '#fffbee', border: '1px solid #f0e8c8', borderRadius: 10, padding: '10px 14px', fontSize: '0.84rem', color: '#7a5c1e' }}>
          ✓ {selected.length} service{selected.length > 1 ? 's' : ''} selected
        </div>
      )}
    </>
  );
}

/* ── Step 4 — Experience ── */
function Step4({ data, onChange }) {
  return (
    <>
      <div className="pp-form-row">
        <div className="pp-form-group">
          <label className="pp-label">Years of Experience</label>
          <input className="pp-input" type="number" min="0" max="70" value={data.experienceYears || ''} onChange={e => onChange('experienceYears', parseInt(e.target.value) || 0)} placeholder="14" />
        </div>
        <div className="pp-form-group">
          <label className="pp-label">Ceremonies Completed (approx.)</label>
          <input className="pp-input" type="number" min="0" value={data.ceremoniesCount || ''} onChange={e => onChange('ceremoniesCount', parseInt(e.target.value) || 0)} placeholder="500" />
        </div>
      </div>
      <div className="pp-form-group">
        <label className="pp-label">Tradition / Practice</label>
        <ChipSelect options={TRADITIONS} selected={data.traditions || []} onChange={v => onChange('traditions', v)} />
      </div>
      <div className="pp-form-group" style={{ marginTop: 16 }}>
        <label className="pp-label">Specializations (optional)</label>
        <input className="pp-input" value={data.specializations || ''} onChange={e => onChange('specializations', e.target.value)} placeholder="Griha Pravesh, Wedding, Havan…" />
      </div>
    </>
  );
}

/* ── Step 5 — Languages ── */
function Step5({ data, onChange }) {
  return (
    <>
      <div style={{ marginBottom: 16, fontSize: '0.84rem', color: '#888' }}>Select all languages you can perform ceremonies in.</div>
      <ChipSelect options={LANGUAGES} selected={data.languages || []} onChange={v => onChange('languages', v)} />
    </>
  );
}

/* ── Step 6 — Pricing ── */
function Step6({ data, onChange }) {
  return (
    <>
      <div style={{ background: '#fdf8ee', border: '1px solid #f0e8d0', borderRadius: 12, padding: '12px 14px', marginBottom: 18, fontSize: '0.82rem', color: '#7a5c1e' }}>
        💡 These are your base rates. You can set specific pricing per service on the My Services page.
      </div>
      <div className="pp-form-row">
        <div className="pp-form-group">
          <label className="pp-label">Starting From (₹)</label>
          <input className="pp-input" type="number" min="0" value={data.startingFrom || ''} onChange={e => onChange('startingFrom', parseInt(e.target.value) || 0)} placeholder="1500" />
        </div>
        <div className="pp-form-group">
          <label className="pp-label">Pricing Model</label>
          <select className="pp-select" value={data.pricingModel || 'STARTING_FROM'} onChange={e => onChange('pricingModel', e.target.value)}>
            {['FIXED','STARTING_FROM','CUSTOM_QUOTE','REQUEST_QUOTE'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="pp-form-group">
        <label className="pp-label">Samagri (ritual materials)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['both',     'Both options — I can provide or customer can bring'],
            ['provider', 'I provide Samagri (included in price)'],
            ['customer', 'Customer provides Samagri'],
          ].map(([val, label]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', border: `1.5px solid ${data.samagriOption === val ? 'var(--gold)' : '#e0d8cc'}`, borderRadius: 10, background: data.samagriOption === val ? '#fffbee' : 'white' }}>
              <input type="radio" name="samagri" value={val} checked={data.samagriOption === val} onChange={() => onChange('samagriOption', val)} style={{ accentColor: 'var(--gold)' }} />
              <span style={{ fontSize: '0.84rem' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

/* ── Step 7 — Service Areas ── */
function Step7({ data, onChange }) {
  const addArea = () => {
    const areas = data.areas || [];
    onChange('areas', [...areas, { locationType: 'CITY', label: '' }]);
  };
  const removeArea = (i) => {
    const areas = [...(data.areas || [])];
    areas.splice(i, 1);
    onChange('areas', areas);
  };
  const updateArea = (i, field, val) => {
    const areas = [...(data.areas || [])];
    areas[i] = { ...areas[i], [field]: val };
    onChange('areas', areas);
  };

  return (
    <>
      <div style={{ fontSize: '0.84rem', color: '#888', marginBottom: 16 }}>
        Define where you provide services. You can be as specific as individual areas or as broad as entire states.
      </div>
      {(data.areas || []).map((area, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 120px' }}>
            <label className="pp-label">Type</label>
            <select className="pp-select" value={area.locationType} onChange={e => updateArea(i, 'locationType', e.target.value)}>
              {['CITY','AREA','STATE','RADIUS'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="pp-label">
              {area.locationType === 'RADIUS' ? 'Radius (km)' : 'Location Name'}
            </label>
            <input className="pp-input" value={area.label} onChange={e => updateArea(i, 'label', e.target.value)} placeholder={area.locationType === 'RADIUS' ? '25' : 'e.g. Vijay Nagar, Indore'} />
          </div>
          <button className="pp-btn pp-btn--danger pp-btn--sm" onClick={() => removeArea(i)} style={{ marginBottom: 0 }}>✕</button>
        </div>
      ))}
      <button className="pp-btn pp-btn--ghost" onClick={addArea} style={{ marginTop: 4 }}>+ Add Area</button>
    </>
  );
}

/* ── Step 8 — Availability ── */
function Step8({ data, onChange }) {
  const wh = data.workingHours || DAYS.map((_, i) => ({
    dayOfWeek: i, startTime: '08:00', endTime: '19:00', isActive: i > 0,
  }));

  const update = (i, field, val) => {
    const arr = [...wh];
    arr[i] = { ...arr[i], [field]: val };
    onChange('workingHours', arr);
  };

  return (
    <>
      <div style={{ fontSize: '0.84rem', color: '#888', marginBottom: 16 }}>
        Set your regular working schedule. Customers will only see times you mark as available.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {wh.map((day, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: day.isActive ? '#fffbee' : '#f9f9f9', border: `1.5px solid ${day.isActive ? '#f0e8c8' : '#eeeeee'}`, borderRadius: 10 }}>
            <input type="checkbox" checked={day.isActive} onChange={e => update(i, 'isActive', e.target.checked)} style={{ accentColor: 'var(--gold)', width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ width: 90, fontWeight: day.isActive ? 600 : 400, fontSize: '0.84rem', color: day.isActive ? 'var(--text-dark)' : '#aaa' }}>{DAYS[i]}</span>
            {day.isActive && (
              <>
                <input type="time" value={day.startTime} onChange={e => update(i, 'startTime', e.target.value)} className="pp-input" style={{ width: 120 }} />
                <span style={{ color: '#aaa', fontSize: '0.82rem' }}>to</span>
                <input type="time" value={day.endTime} onChange={e => update(i, 'endTime', e.target.value)} className="pp-input" style={{ width: 120 }} />
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Step 9 — Media ── */
function Step9({ data, onChange }) {
  const add = () => {
    const media = data.media || [];
    onChange('media', [...media, { mediaType: 'PHOTO', title: '', url: '' }]);
  };
  const remove = (i) => {
    const m = [...(data.media || [])];
    m.splice(i, 1);
    onChange('media', m);
  };
  const update = (i, k, v) => {
    const m = [...(data.media || [])];
    m[i] = { ...m[i], [k]: v };
    onChange('media', m);
  };

  return (
    <>
      <div style={{ background: '#fdf8ee', border: '1px solid #f0e8d0', borderRadius: 12, padding: '12px 14px', marginBottom: 18, fontSize: '0.82rem', color: '#7a5c1e' }}>
        📸 Add links to photos or videos of ceremonies you have performed. All media is reviewed before being shown publicly.
      </div>
      {(data.media || []).map((m, i) => (
        <div key={i} className="pp-card" style={{ marginBottom: 12, padding: '14px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <label className="pp-label">Type</label>
              <select className="pp-select" value={m.mediaType} onChange={e => update(i, 'mediaType', e.target.value)}>
                {['PHOTO','VIDEO','INTRO_VIDEO','CERTIFICATE'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="pp-label">Title</label>
              <input className="pp-input" value={m.title} onChange={e => update(i, 'title', e.target.value)} placeholder="Griha Pravesh 2024" />
            </div>
            <button className="pp-btn pp-btn--danger pp-btn--sm" onClick={() => remove(i)}>✕</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="pp-label">URL (photo/video link)</label>
            <input className="pp-input" value={m.url} onChange={e => update(i, 'url', e.target.value)} placeholder="https://…" />
          </div>
        </div>
      ))}
      <button className="pp-btn pp-btn--ghost" onClick={add}>+ Add Photo / Video</button>
    </>
  );
}

/* ── Step 10 — Verification ── */
function Step10() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { type: 'PHONE',    label: 'Phone Number',    icon: '📞', note: 'We will send an OTP to your registered mobile.' },
        { type: 'IDENTITY', label: 'Identity (Aadhaar / PAN)', icon: '🪪', note: 'Government-issued photo ID.' },
        { type: 'ADDRESS',  label: 'Address Proof',   icon: '📮', note: 'Utility bill, bank statement, etc.' },
      ].map(({ type, label, icon, note }) => (
        <div key={type} style={{ display: 'flex', gap: 14, padding: '14px 18px', background: '#faf8f4', border: '1px solid #e8e4da', borderRadius: 12 }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: '0.78rem', color: '#888' }}>{note}</div>
          </div>
          <span className="pp-badge pp-badge--yellow">Pending</span>
        </div>
      ))}
      <div style={{ fontSize: '0.82rem', color: '#aaa', background: '#f9f9f9', borderRadius: 10, padding: '12px 14px' }}>
        ℹ️ Verification is completed by the PanditJi team after profile submission. You can submit your profile now and verification will follow.
      </div>
    </div>
  );
}

/* ── Step 11 — Review & Submit ── */
function Step11({ allData, onSubmit, submitting }) {
  const checks = [
    ['Basic info',    !!(allData[1]?.displayName)],
    ['Location',      !!(allData[2]?.city)],
    ['Services',      !!(allData[3]?.selectedServiceIds?.length > 0)],
    ['Experience',    !!(allData[4]?.experienceYears > 0)],
    ['Languages',     !!(allData[5]?.languages?.length > 0)],
    ['Pricing',       !!(allData[6]?.startingFrom > 0)],
    ['Service areas', !!(allData[7]?.areas?.length > 0)],
    ['Availability',  true],
  ];

  const allReady = checks.every(([, ok]) => ok);

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checks.map(([label, ok]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: ok ? '#f0fdf4' : '#fffbeb', border: `1px solid ${ok ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: '1rem' }}>{ok ? '✅' : '⚠️'}</span>
          </div>
        ))}
      </div>

      {!allReady && (
        <div style={{ background: '#fff7ed', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: '0.84rem', color: '#92400e' }}>
          Complete the missing sections above for the best results. You can still submit and add details later.
        </div>
      )}

      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: '0.86rem', color: '#166534' }}>
        🔒 Your profile will be reviewed by the PanditJi team before becoming visible to customers. This typically takes 1–2 business days.
      </div>

      <button className="pp-btn pp-btn--primary pp-btn--full" onClick={onSubmit} disabled={submitting} style={{ fontSize: '0.95rem', padding: '14px' }}>
        {submitting ? 'Submitting…' : '🙏 Submit for Verification'}
      </button>
    </div>
  );
}

/* ── Main Wizard ── */
export default function PanditOnboarding() {
  const { provider, refresh } = usePanditPortal();
  const navigate = useNavigate();
  const [step,       setStep]       = useState(1);
  const [stepData,   setStepData]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved,      setSaved]      = useState(false);

  /* Pre-fill from existing provider data */
  useEffect(() => {
    if (!provider) return;
    setStepData(prev => ({
      ...prev,
      1: {
        displayName:  prev[1]?.displayName  ?? provider.displayName ?? '',
        providerType: prev[1]?.providerType ?? provider.providerType ?? 'INDIVIDUAL',
        about:        prev[1]?.about        ?? provider.profile?.about ?? '',
      },
      2: {
        city:      prev[2]?.city      ?? provider.location?.city ?? '',
        state:     prev[2]?.state     ?? provider.location?.state ?? '',
        country:   prev[2]?.country   ?? provider.location?.country ?? '',
        cityId:    prev[2]?.cityId    ?? provider.location?.cityId ?? '',
        stateId:   prev[2]?.stateId   ?? provider.location?.stateId ?? '',
        countryId: prev[2]?.countryId ?? provider.location?.countryId ?? '',
      },
      4: {
        experienceYears:  prev[4]?.experienceYears ?? provider.profile?.experienceYears ?? 0,
        traditions:       prev[4]?.traditions      ?? provider.profile?.traditions      ?? [],
      },
      5: {
        languages: prev[5]?.languages ?? provider.profile?.languages ?? [],
      },
      6: {
        startingFrom:  prev[6]?.startingFrom  ?? provider.pricing?.startingFrom  ?? 0,
        pricingModel:  prev[6]?.pricingModel  ?? provider.pricing?.model         ?? 'STARTING_FROM',
        samagriOption: prev[6]?.samagriOption ?? (provider.capabilities?.samagriAvailable ? 'provider' : 'customer'),
      },
    }));
  }, [provider]);

  const setField = useCallback((k, v) => {
    setStepData(prev => ({
      ...prev,
      [step]: { ...(prev[step] || {}), [k]: v },
    }));
  }, [step]);

  const saveCurrentStep = async () => {
    setSaving(true);
    try {
      await panditPortalApi.saveStep(step, stepData[step] || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error('Step save failed:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    await saveCurrentStep();
    if (step < TOTAL) setStep(s => s + 1);
  };

  const prev = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      /* Save all steps then submit */
      for (const [s, data] of Object.entries(stepData)) {
        if (Object.keys(data || {}).length > 0) {
          await panditPortalApi.saveStep(parseInt(s), data).catch(() => {});
        }
      }
      await panditPortalApi.submit();
      await refresh();
      navigate('/pandit-portal');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentData = stepData[step] || {};
  const percent     = Math.round(((step - 1) / TOTAL) * 100);

  const renderStep = () => {
    switch (step) {
      case 1:  return <Step1 data={currentData} onChange={setField} />;
      case 2:  return <Step2 data={currentData} onChange={setField} />;
      case 3:  return <Step3 data={currentData} onChange={setField} />;
      case 4:  return <Step4 data={currentData} onChange={setField} />;
      case 5:  return <Step5 data={currentData} onChange={setField} />;
      case 6:  return <Step6 data={currentData} onChange={setField} />;
      case 7:  return <Step7 data={currentData} onChange={setField} />;
      case 8:  return <Step8 data={currentData} onChange={setField} />;
      case 9:  return <Step9 data={currentData} onChange={setField} />;
      case 10: return <Step10 />;
      case 11: return <Step11 allData={stepData} onSubmit={handleSubmit} submitting={submitting} />;
      default: return null;
    }
  };

  const info = STEPS[step - 1];

  return (
    <div className="pp-wizard">
      {/* Step indicators */}
      <div className="pp-wizard__steps">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            {i > 0 && <div className={`pp-wizard__connector${s.num < step ? ' pp-wizard__connector--done' : ''}`} />}
            <button
              className={`pp-wizard__step${s.num === step ? ' pp-wizard__step--active' : s.num < step ? ' pp-wizard__step--done' : ''}`}
              onClick={() => s.num < step && setStep(s.num)}
              title={s.title}
            >
              {s.num < step ? '✓' : s.num}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Progress bar */}
      <div className="pp-wizard__progress">
        <div className="pp-wizard__progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {/* Step header */}
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--saffron)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Step {step} of {TOTAL}
        </div>
        <div className="pp-step-title">{info.title}</div>
        <div className="pp-step-sub">{info.sub}</div>
      </div>

      {/* Step content */}
      {renderStep()}

      {/* Navigation */}
      {step < 11 && (
        <div className="pp-wizard__nav">
          <button className="pp-btn pp-btn--ghost" onClick={prev} disabled={step === 1}>
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {saved && <span style={{ fontSize: '0.78rem', color: '#22c55e' }}>✓ Saved</span>}
            <button className="pp-btn pp-btn--ghost pp-btn--sm" onClick={saveCurrentStep} disabled={saving}>
              {saving ? 'Saving…' : '💾 Save'}
            </button>
            <button className="pp-btn pp-btn--primary" onClick={next} disabled={saving}>
              {step === TOTAL - 1 ? 'Review →' : 'Next →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
