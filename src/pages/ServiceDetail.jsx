import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Edit3 } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { servicesApi, providersApi } from '../api/index.js';
import { CATEGORIES, PANDITS as STATIC_PANDITS } from '../data/services';

const QUESTIONS = [
  { id: 'date',     icon: '📅', q: 'When would you like the ceremony?',          chips: ['This Sunday','Next Sunday','Tomorrow','In a week'] },
  { id: 'time',     icon: '⏰', q: 'What time would you prefer?',                 chips: ['6–8 AM','8–10 AM','10 AM–12 PM','Afternoon','Evening','Flexible'] },
  { id: 'samagri',  icon: '🧺', q: 'Should the Pandit arrange the Puja Samagri?', chips: ['Yes, Pandit arranges','No, I will arrange','Full package'] },
  { id: 'language', icon: '🗣️', q: 'Language preference?',                         chips: ['Hindi','Marathi','Sanskrit','English','No preference'] },
  { id: 'budget',   icon: '💰', q: 'Approximate budget?',                          chips: ['Under ₹1,500','₹1,500–₹3,000','₹3,000–₹5,000','₹5,000+','No preference'] },
];

function normProvider(p) {
  return {
    id:               p._id || p.id,
    name:             p.displayName || p.name,
    experience:       p.profile?.experienceYears || p.experience || 0,
    location:         p.location?.city ? `${p.location.city}` : (p.location || 'India'),
    languages:        p.profile?.languages || p.languages || [],
    rating:           p.ratingSummary?.overall || p.rating || 0,
    reviews:          p.ratingSummary?.count   || p.reviews || 0,
    verified:         p.verificationStatus === 'VERIFIED' || p.verified || false,
    samagriAvailable: p.capabilities?.samagriAvailable || p.samagriAvailable || false,
    priceFrom:        p.pricing?.startingFrom  || p.priceRange?.[0] || 0,
  };
}

function RequirementPipeline({ service, eligible, onDone }) {
  const [qIdx,      setQIdx]      = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [done,      setDone]      = useState(false);
  const [customDate, setCustomDate] = useState('');

  function answer(id, val) {
    const next = { ...answers, [id]: val };
    setAnswers(next);
    const nextQ = QUESTIONS.findIndex((q, i) => i > qIdx && !next[q.id]);
    if (nextQ === -1) setDone(true);
    else setQIdx(nextQ);
  }

  const req = {
    serviceId: service.id || service._id,
    service:   service.name,
    date:      answers.date     || '—',
    time:      answers.time     || '—',
    samagri:   answers.samagri  || '—',
    language:  answers.language || '—',
    budget:    answers.budget   || '—',
  };

  const matched = eligible.filter(p => {
    if (req.language !== '—' && req.language !== 'No preference' && !p.languages.includes(req.language)) return false;
    if (req.samagri.startsWith('Yes') && !p.samagriAvailable) return false;
    return true;
  });
  const fallback = matched.length === 0 ? eligible : matched;
  const q = QUESTIONS[qIdx];

  if (done) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ background: 'var(--grad-hero)', borderRadius: 14, padding: '20px 22px', marginBottom: 22, display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: '0.95rem', marginBottom: 4 }}>Your Requirement</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(req).filter(([k, v]) => v && v !== '—' && k !== 'serviceId' && k !== 'service').map(([k, v]) => (
                  <span key={k} className="tag" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>{v}</span>
                ))}
              </div>
            </div>
            <button onClick={() => { setDone(false); setQIdx(0); setAnswers({}); }}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 12px', color: 'white', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Edit3 size={11} /> Edit
            </button>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>
            ✦ {fallback.length} Pandit{fallback.length !== 1 ? 's' : ''} available
          </div>
          {fallback.map(p => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '18px', marginBottom: 12, borderTop: '3px solid var(--gold)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🙏</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.93rem', color: 'var(--text-dark)' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 2 }}>📍 {p.location} · {p.experience} yrs</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                    {p.languages.map(l => <span key={l} className="tag" style={{ fontSize: '0.6rem' }}>🗣 {l}</span>)}
                    {p.verified && <span className="verified" style={{ fontSize: '0.6rem' }}>✓</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.97rem', color: 'var(--saffron)' }}>
                    {p.priceFrom > 0 ? `₹${p.priceFrom.toLocaleString()}` : ''}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-light)' }}>starting</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Service',  ok: true },
                  { label: 'Language', ok: req.language === '—' || req.language === 'No preference' || p.languages.includes(req.language) },
                  { label: 'Samagri',  ok: req.samagri.startsWith('Yes') ? p.samagriAvailable : true },
                ].map(({ label, ok }) => (
                  <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontFamily: 'var(--font-ui)', color: ok ? '#2e7d32' : '#cc231e' }}>
                    <span style={{ fontWeight: 700 }}>{ok ? '✓' : '✗'}</span>{label}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Link to={`/pandit/${p.id}`} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '9px 10px' }}>View Profile</Link>
                <Link to={`/book/${p.id}`} state={{ req }} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '9px 10px' }}>Book Now</Link>
              </div>
            </motion.div>
          ))}
          {fallback.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 24px', background: 'var(--parchment)', borderRadius: 14, border: '1px solid var(--border-gold)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</div>
              <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 16 }}>No Pandits match your preferences exactly.</p>
              <button className="btn-primary" onClick={() => { setDone(false); setQIdx(0); setAnswers({}); }}>← Adjust Requirements</button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key={`q-${qIdx}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < qIdx ? 'var(--gold)' : i === qIdx ? 'var(--saffron)' : 'rgba(212,175,55,0.2)', transition: 'all 0.3s' }} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>{q.icon}</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.4 }}>{q.q}</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {q.chips.map(c => (
            <motion.button key={c} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }} onClick={() => answer(q.id, c)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', background: answers[q.id] === c ? 'var(--saffron-pale)' : 'white', border: answers[q.id] === c ? '2px solid var(--saffron)' : '1.5px solid var(--border-gold)', borderRadius: 11, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', color: answers[q.id] === c ? 'var(--saffron)' : 'var(--text-dark)', fontWeight: answers[q.id] === c ? 600 : 400, textAlign: 'left' }}>
              {c}<ChevronRight size={15} style={{ opacity: 0.3 }} />
            </motion.button>
          ))}
          {q.id === 'date' && (
            <input type="date" className="input-field" value={customDate} onChange={e => setCustomDate(e.target.value)} onBlur={e => { if (e.target.value) answer('date', e.target.value); }} style={{ fontSize: '0.9rem', marginTop: 4 }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          {qIdx > 0
            ? <button className="btn-secondary" style={{ padding: '9px 16px', fontSize: '0.78rem' }} onClick={() => setQIdx(i => i - 1)}><ArrowLeft size={13} /> Back</button>
            : <div />}
          <button onClick={() => answer(q.id, 'No preference')}
            style={{ background: 'none', border: '1px solid var(--border-gold)', borderRadius: 50, padding: '9px 16px', fontSize: '0.78rem', color: 'var(--text-light)', cursor: 'pointer', fontFamily: 'var(--font-ui)' }}>
            Skip →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPipeline, setShowPipeline] = useState(false);
  const [service,  setService]  = useState(null);
  const [category, setCategory] = useState(null);
  const [eligible, setEligible] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        /* Try API first — route now accepts ObjectId OR slug */
        const { service: svc } = await servicesApi.get(id);
        setService(svc);
        setCategory(svc.categoryId || null);

        /* Fetch providers that support this service */
        try {
          const { providers } = await providersApi.list({ serviceId: id, limit: 20 });
          setEligible(providers.map(normProvider));
        } catch {
          setEligible(_staticEligible(id));
        }
      } catch {
        /* Fall back to static data */
        let found = null, foundCat = null;
        for (const cat of CATEGORIES) {
          const s = cat.services.find(s => s.id === id);
          if (s) { found = s; foundCat = cat; break; }
        }
        if (found) {
          setService({ ...found, _id: found.id, pricing: { startingFrom: found.from }, duration: { label: found.duration } });
          setCategory(foundCat);
        }
        setEligible(_staticEligible(id));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '2rem' }}>🕉️</motion.div>
    </div>
  );

  if (!service) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-display)', color: 'var(--text-light)' }}>
      <span style={{ fontSize: '3rem' }}>🕉️</span>
      Service not found.
      <Link to="/browse" style={{ color: 'var(--saffron)' }}>Browse Services</Link>
    </div>
  );

  const svcName  = service.name;
  const svcFrom  = service.pricing?.startingFrom || service.from || 0;
  const svcDur   = service.duration?.label || service.duration || '';
  const catIcon  = category?.icon  || '🕉️';
  const catTitle = category?.name  || category?.title || '';
  const catColor = category?.color || 'var(--saffron)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }} />
      <div style={{ background: 'var(--grad-hero)', position: 'relative', overflow: 'hidden', paddingBottom: 50 }}>
        <MandalaDecor size={300} opacity={0.06} style={{ top: -40, right: -40, animation: 'spin-slow 50s linear infinite' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 0', position: 'relative', zIndex: 1 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginBottom: 24, backdropFilter: 'blur(8px)' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span className="tag" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem' }}>{catIcon} {catTitle}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, color: 'white', marginBottom: 10 }}>{svcName}</h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-ui)' }}>
            {svcDur && <span>⏱ Duration: {svcDur}</span>}
            {svcFrom > 0 && <span>💰 From ₹{svcFrom.toLocaleString()}</span>}
            <span>👤 {eligible.length} Pandits available</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 24px 80px' }}>
        {!showPipeline ? (
          <>
            <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
              <RangoliDivider label="About" />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-mid)', lineHeight: 1.8, fontStyle: 'italic', marginTop: 10 }}>
                {service.description || `${svcName} is a sacred Hindu ceremony conducted by a qualified Pandit with specific Vedic rituals, chanting, and offerings at an auspicious Muhurat. Each ceremony is tailored to the family's tradition.`}
              </p>
            </div>
            {/* Dynamic requirement fields if available */}
            {service.requirementFields?.length > 0 && (
              <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
                <RangoliDivider label="What We'll Ask" />
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 8, marginBottom: 14 }}>
                  We'll walk you through these questions to find the right Pandit
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {service.requirementFields.map(f => (
                    <span key={f.key} className="tag" style={{ fontSize: '0.75rem' }}>{f.icon || '•'} {f.label}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="card" style={{ padding: '24px', marginBottom: 20 }}>
              <RangoliDivider label="Typically Includes" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10, marginTop: 12 }}>
                {['Qualified Pandit', 'Vedic chanting & rituals', 'Puja guidance', 'Completion blessing', 'Basic consultation'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(46,125,50,0.05)', borderRadius: 8, border: '1px solid rgba(46,125,50,0.12)', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', color: 'var(--text-mid)' }}>
                    <span style={{ color: '#2e7d32', fontWeight: 700 }}>✓</span>{item}
                  </div>
                ))}
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.99 }} onClick={() => setShowPipeline(true)}
              className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '18px', marginBottom: 16 }}>
              Continue — Find a Pandit for {svcName} →
            </motion.button>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/tell-us" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center', fontSize: '0.85rem' }}>💬 Tell us your full requirement</Link>
              <Link to="/browse" className="btn-ghost" style={{ flex: 1, justifyContent: 'center', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)', border: '1px solid var(--border-gold)' }}>← Browse more</Link>
            </div>
          </>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setShowPipeline(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-light)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>
                <ArrowLeft size={14} /> Back to service info
              </button>
              <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,var(--saffron),transparent)' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--saffron)', letterSpacing: '0.06em' }}>{svcName}</div>
            </div>
            <RequirementPipeline service={service} eligible={eligible} onDone={() => {}} />
          </div>
        )}
      </div>
    </div>
  );
}

function _staticEligible(serviceId) {
  return STATIC_PANDITS.filter(p => p.services?.includes(serviceId)).map(p => ({
    id: p.id, name: p.name, experience: p.experience,
    location: p.location, languages: p.languages,
    rating: p.rating, reviews: p.reviews,
    verified: p.verified, samagriAvailable: p.samagriAvailable,
    priceFrom: p.priceRange?.[0] || 0,
  }));
}
