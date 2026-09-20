import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, MapPin } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { providersApi, reviewsApi, providerAvailabilityApi } from '../api/index.js';
import { PANDITS as STATIC_PANDITS, CATEGORIES } from '../data/services';

const TABS = ['Overview', 'Services', 'Videos', 'Reviews', 'Pricing', 'Availability', 'Ask'];

function RatingBar({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-mid)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)' }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(212,175,55,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(value / 5) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ height: '100%', background: 'linear-gradient(90deg,var(--saffron),var(--gold))', borderRadius: 3 }} />
      </div>
    </div>
  );
}

function AvailBadge({ status }) {
  const cfg = {
    available: { label: 'Available', bg: 'rgba(76,175,80,0.08)',  color: '#2e7d32' },
    limited:   { label: 'Limited',   bg: 'rgba(255,152,0,0.08)',  color: '#e65100' },
    booked:    { label: 'Booked',    bg: 'rgba(244,67,54,0.08)',  color: '#b71c1c' },
  }[status] || { label: 'Unknown', bg: '#eee', color: '#666' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', background: cfg.bg, padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontFamily: 'var(--font-ui)', color: cfg.color, fontWeight: 600 }}>
      {cfg.label}
    </span>
  );
}

function AskTab({ panditId, qa }) {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState([]);
  const [sent, setSent] = useState(false);

  function sendQuestion() {
    if (!question.trim()) return;
    setSent(true);
    setSubmitted(prev => [{ q: question.trim(), pending: true }, ...prev]);
    setQuestion('');
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6 }}>Ask a Question</h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 24 }}>
        Questions go directly to the Pandit and stay inside the platform
      </p>
      <div className="card" style={{ padding: '20px', marginBottom: 28 }}>
        <textarea className="input-field" rows={3} value={question} onChange={e => setQuestion(e.target.value)}
          placeholder={`e.g. "Do you bring Samagri?" or "Can you explain in Marathi?"`}
          style={{ marginBottom: 12, fontSize: '0.92rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)' }}>Conversations stay inside the platform</div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.82rem' }} onClick={sendQuestion} disabled={!question.trim()}>
            {sent ? '✓ Sent!' : 'Send Question'}
          </motion.button>
        </div>
      </div>
      {submitted.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--saffron)', marginBottom: 12 }}>✦ Your Questions</div>
          {submitted.map((item, i) => (
            <div key={i} style={{ background: 'var(--saffron-pale)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 500, marginBottom: 4 }}>{item.q}</div>
              <span className="tag" style={{ fontSize: '0.6rem' }}>⏳ Pending reply</span>
            </div>
          ))}
        </div>
      )}
      {qa?.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>✦ Frequently Asked Questions</div>
          {qa.map(({ question: q, answer: a }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="card" style={{ padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 8, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--saffron)', flexShrink: 0 }}>Q.</span>{q}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-mid)', lineHeight: 1.65, display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 600, flexShrink: 0 }}>A.</span>
                <span style={{ fontStyle: 'italic' }}>{a}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: 10 }}>Tap to ask</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Do you bring Samagri?', 'Can you explain in Marathi?', 'Do you travel outside Indore?', 'How early should I book?', 'Do you provide a ceremony guide?'].map(s => (
            <motion.button key={s} whileHover={{ scale: 1.03 }} onClick={() => setQuestion(s)}
              style={{ padding: '8px 14px', background: 'white', border: '1.5px solid var(--border-gold)', borderRadius: 50, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--text-dark)', cursor: 'pointer' }}>
              {s}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PanditProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [tab,     setTab]     = useState('Overview');
  const [pandit,  setPandit]  = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avail,   setAvail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      try {
        if (!isObjectId) throw new Error('not an ObjectId — use static');
        const [provData, revData] = await Promise.all([
          providersApi.get(id),
          reviewsApi.list({ providerId: id }),
        ]);
        setPandit(provData.provider);
        setReviews(revData.reviews || []);

        try {
          const availData = await providerAvailabilityApi.get(id);
          setAvail(availData.availability || availData.defaults);
        } catch { /* availability optional */ }
      } catch {
        /* Fall back to static if id matches */
        const staticP = STATIC_PANDITS.find(p => p.id === id);
        if (staticP) {
          setPandit(_normStatic(staticP));
          setReviews([]);
        } else {
          setError('Pandit not found');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sacred-white)' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '2rem' }}>🕉️</motion.div>
    </div>
  );

  if (error || !pandit) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-display)', color: 'var(--text-light)' }}>
      <span style={{ fontSize: '3rem' }}>🔍</span>
      {error || 'Pandit not found'}
      <Link to="/pandits" style={{ color: 'var(--saffron)' }}>Browse Pandits</Link>
    </div>
  );

  /* Normalise fields regardless of source */
  const p = {
    id:           pandit._id || pandit.id,
    name:         pandit.displayName || pandit.name,
    experience:   pandit.profile?.experienceYears || pandit.experience || 0,
    location:     pandit.location?.city ? `${pandit.location.city}, ${pandit.location.state || ''}`.trim().replace(/,$/, '') : (pandit.location || 'India'),
    languages:    pandit.profile?.languages || pandit.languages || [],
    traditions:   pandit.profile?.traditions || [],
    about:        pandit.profile?.about || pandit.aboutText || '',
    rating:       pandit.ratingSummary?.overall || pandit.rating || 0,
    ratingBreak:  pandit.ratingSummary || pandit.ratingsBreakdown || {},
    reviewCount:  pandit.ratingSummary?.count || pandit.reviews || 0,
    bookings:     pandit.bookingSummary?.total || pandit.bookings || 0,
    repeatCustomers: pandit.bookingSummary?.repeatCustomers || pandit.repeatCustomers || 0,
    cancellationRate: pandit.cancellationRate || 0,
    verified:     pandit.verificationStatus === 'VERIFIED' || pandit.verified || false,
    verifications: pandit.verifications || [],
    serviceAreas: pandit.serviceAreas || [],
    badges:       pandit.badges || pandit.badge || [],
    media:        pandit.media || [],
    videos:       pandit.videos || [],
    qa:           pandit.qa || [],
    eventBreakdown: pandit.eventBreakdown || [],
    pricing:      pandit.pricing || pandit.priceBreakdown || {},
    capabilities: pandit.capabilities || {},
  };

  const panditServices = CATEGORIES.flatMap(c =>
    c.services
      .filter(s => (pandit.serviceIds || []).some(sid => sid === s.id || sid?._id === s.id || sid?.slug === s.id))
      .map(s => ({ ...s, catTitle: c.title, catColor: c.color, catIcon: c.icon }))
  );

  /* Use static services if API provider has no serviceIds */
  const staticP = STATIC_PANDITS.find(sp => sp.id === id);
  const displayServices = panditServices.length
    ? panditServices
    : (staticP ? CATEGORIES.flatMap(c => c.services.filter(s => staticP.services?.includes(s.id)).map(s => ({ ...s, catTitle: c.title, catColor: c.color, catIcon: c.icon }))) : []);

  const displayVideos = p.media.filter(m => m.mediaType === 'VIDEO' || m.mediaType === 'INTRO_VIDEO' || m.mediaType === 'EVENT_VIDEO').map(m => m.title || 'Event Video')
    .concat(p.videos);

  const priceBreakdown = {
    pandit:   p.pricing?.breakdown?.pandit   || p.pricing?.pandit   || p.pricing?.startingFrom || 0,
    samagri:  p.pricing?.breakdown?.samagri  || p.pricing?.samagri  || 0,
    travel:   p.pricing?.breakdown?.travel   || p.pricing?.travel   || 0,
    platform: p.pricing?.breakdown?.platform || p.pricing?.platform || 100,
  };
  const total = Object.values(priceBreakdown).reduce((a, b) => a + b, 0);

  /* Availability map — merge legacy Map + new slot model */
  const legacyAvailMap = pandit.availability instanceof Map
    ? Object.fromEntries(pandit.availability)
    : (typeof pandit.availability === 'object' ? pandit.availability : {});

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sacred-white)' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }} />

      {/* Hero */}
      <div style={{ background: 'var(--grad-hero)', position: 'relative', overflow: 'hidden', paddingBottom: 60 }}>
        <MandalaDecor size={360} opacity={0.06} style={{ top: -60, right: -60, animation: 'spin-slow 50s linear infinite' }} />
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 0', position: 'relative', zIndex: 1 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'white', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', marginBottom: 28, backdropFilter: 'blur(8px)' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              style={{ width: 90, height: 90, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0, boxShadow: '0 0 32px rgba(255,107,0,0.4)', border: '3px solid rgba(212,175,55,0.5)' }}>
              🙏
            </motion.div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem,3vw,1.8rem)', fontWeight: 700, color: 'white' }}>{p.name}</h1>
                {p.verified && <span className="verified" style={{ fontSize: '0.72rem', background: 'rgba(46,125,50,0.3)', borderColor: 'rgba(76,175,80,0.4)', color: '#a5d6a7' }}>✓ Verified</span>}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-ui)', marginBottom: 10, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>📍 {p.location}</span>
                <span>📅 {p.experience} yrs experience</span>
                {p.traditions.length > 0 && <span>🕉️ {p.traditions[0]}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {p.languages.map(l => <span key={l} className="tag" style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>🗣 {l}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.badges.map(b => <span key={b} className="tag tag-gold" style={{ fontSize: '0.65rem', background: 'rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.35)', color: 'var(--gold-light)' }}>✦ {b}</span>)}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(212,175,55,0.2)', flexShrink: 0 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--gold)' }}>{p.rating || '—'}</div>
                {p.rating > 0 && <div className="stars" style={{ fontSize: '0.9rem' }}>{'★'.repeat(Math.floor(p.rating))}</div>}
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>{p.reviewCount} reviews</div>
              </div>
              <div style={{ borderTop: '1px solid rgba(212,175,55,0.15)', paddingTop: 10, display: 'flex', gap: 16, justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'white' }}>{p.bookings}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-ui)' }}>Bookings</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'white' }}>{p.repeatCustomers}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-ui)' }}>Repeat</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
            <button className="btn-primary" style={{ fontSize: '0.88rem' }} onClick={() => navigate(`/book/${p.id}`)}>📅 Book Now</button>
            <button className="btn-secondary" style={{ fontSize: '0.88rem' }} onClick={() => navigate('/tell-us')}>💬 Start with your requirement</button>
          </div>
        </div>
      </div>

      {/* Sticky tabs */}
      <div style={{ position: 'sticky', top: 64, zIndex: 50, background: 'white', borderBottom: '1px solid var(--border-gold)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--saffron)' : '2px solid transparent', fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: tab === t ? 700 : 500, color: tab === t ? 'var(--saffron)' : 'var(--text-light)', cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px 80px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

            {/* OVERVIEW */}
            {tab === 'Overview' && (
              <div style={{ display: 'grid', gap: 24 }}>
                <div className="card" style={{ padding: '24px' }}>
                  <RangoliDivider label="About" />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-mid)', lineHeight: 1.8, fontStyle: 'italic', marginTop: 8 }}>
                    {p.about || 'Experienced Pandit with deep knowledge of Vedic rituals and ceremonies.'}
                  </p>
                </div>
                <div className="card" style={{ padding: '24px' }}>
                  <RangoliDivider label="Verification" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginTop: 12 }}>
                    {(['Mobile verified', 'Identity verified', 'Profile verified', 'Event history verified']).map(v => (
                      <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(46,125,50,0.05)', borderRadius: 8, border: '1px solid rgba(46,125,50,0.15)' }}>
                        <CheckCircle size={15} style={{ color: '#2e7d32', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--text-mid)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {p.serviceAreas.length > 0 && (
                  <div className="card" style={{ padding: '24px' }}>
                    <RangoliDivider label="Service Area" />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                      {p.serviceAreas.map(a => (
                        <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', background: 'var(--saffron-pale)', borderRadius: 50, fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--saffron)', border: '1px solid rgba(255,107,0,0.2)' }}>
                          <MapPin size={11} /> {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="card" style={{ padding: '24px' }}>
                  <RangoliDivider label="Reliability" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 16, marginTop: 12 }}>
                    {[
                      { label: 'Total Bookings',    val: p.bookings },
                      { label: 'Repeat Customers',  val: p.repeatCustomers },
                      { label: 'Cancellation Rate', val: p.cancellationRate ? `${p.cancellationRate}%` : '< 2%' },
                      { label: 'Verified Reviews',  val: p.reviewCount },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ textAlign: 'center', padding: '16px 10px', background: 'var(--parchment)', borderRadius: 10 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--saffron)' }}>{val}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)', marginTop: 4 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {p.eventBreakdown.length > 0 && (
                  <div className="card" style={{ padding: '24px' }}>
                    <RangoliDivider label="Completed Events" />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 8, marginBottom: 16 }}>
                      Breakdown of {p.bookings} completed bookings
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {p.eventBreakdown.map(({ label, serviceId, count, icon }) => {
                        const lbl = label || serviceId;
                        const pct = p.bookings > 0 ? Math.round((count / p.bookings) * 100) : 0;
                        return (
                          <div key={lbl}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {icon && <span>{icon}</span>}{lbl}
                              </span>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)' }}>{count}</span>
                            </div>
                            <div style={{ height: 6, background: 'rgba(212,175,55,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                                style={{ height: '100%', background: 'linear-gradient(90deg,var(--saffron),var(--gold))', borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SERVICES */}
            {tab === 'Services' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 20 }}>Services Offered</h2>
                {displayServices.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                    {displayServices.map(s => (
                      <Link key={s.id || s._id} to={`/service/${s.id || s._id}`} style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ y: -3 }}
                          style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '18px 16px', borderLeft: `3px solid ${s.catColor || 'var(--saffron)'}`, cursor: 'pointer' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            {s.catIcon && <span style={{ fontSize: '1.2rem' }}>{s.catIcon}</span>}
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{s.name}</span>
                          </div>
                          {(s.duration || s.from) && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)' }}>
                              {s.duration && `⏱ ${s.duration}`}{s.from && ` · From ₹${s.from.toLocaleString()}`}
                            </div>
                          )}
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-light)', fontStyle: 'italic' }}>Contact the Pandit to learn about available services.</div>
                )}
              </div>
            )}

            {/* VIDEOS */}
            {tab === 'Videos' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>Past Event Videos</h2>
                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 20, fontSize: '0.95rem' }}>Uploaded with consent from event participants</p>
                {displayVideos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
                    {displayVideos.map((v, i) => (
                      <motion.div key={i} whileHover={{ scale: 1.02 }}
                        style={{ background: 'var(--grad-hero)', borderRadius: 12, aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, cursor: 'pointer', border: '1px solid rgba(212,175,55,0.2)', position: 'relative', overflow: 'hidden' }}>
                        <MandalaDecor size={120} opacity={0.1} style={{ top: -20, right: -20 }} />
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,107,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Play size={18} style={{ color: 'white', marginLeft: 2 }} fill="white" />
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600, color: 'white', textAlign: 'center', padding: '0 12px', position: 'relative', zIndex: 1 }}>{typeof v === 'string' ? v : v.title}</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-light)', fontStyle: 'italic' }}>No videos uploaded yet.</div>
                )}
              </div>
            )}

            {/* REVIEWS */}
            {tab === 'Reviews' && (
              <div>
                <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 900, color: 'var(--saffron)' }}>{p.rating || '—'}</div>
                      {p.rating > 0 && <div className="stars" style={{ fontSize: '1.1rem' }}>{'★'.repeat(Math.floor(p.rating))}</div>}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)', marginTop: 4 }}>{p.reviewCount} reviews</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {Object.entries({
                        Punctuality:    p.ratingBreak.punctuality,
                        Communication:  p.ratingBreak.communication,
                        'Service Quality': p.ratingBreak.serviceQuality || p.ratingBreak.service,
                        Professionalism: p.ratingBreak.professionalism,
                      }).filter(([, v]) => v).map(([label, value]) => (
                        <RatingBar key={label} label={label} value={value} />
                      ))}
                    </div>
                  </div>
                </div>
                {reviews.length > 0 ? reviews.map((r, i) => {
                  const name = r.customerId?.profile?.displayName || r.customerId?.profile?.firstName || 'Customer';
                  const avg  = r.ratings ? Object.values(r.ratings).reduce((a, b) => a + b, 0) / Object.values(r.ratings).length : 5;
                  return (
                    <div key={i} className="card" style={{ padding: '20px', marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-display)' }}>
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)' }}>{name}</div>
                          </div>
                        </div>
                        <span className="stars" style={{ fontSize: '0.85rem' }}>{'★'.repeat(Math.round(avg))}</span>
                      </div>
                      {r.comment && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-mid)', lineHeight: 1.7, fontStyle: 'italic' }}>"{r.comment}"</p>}
                      <span className="verified" style={{ marginTop: 8, display: 'inline-flex', fontSize: '0.62rem' }}>✓ Verified Booking</span>
                    </div>
                  );
                }) : (
                  <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-light)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
                    No reviews yet — be the first to book and review!
                  </div>
                )}
              </div>
            )}

            {/* PRICING */}
            {tab === 'Pricing' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 20 }}>Complete Pricing</h2>
                <div className="card" style={{ padding: '28px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>✦ Sample breakdown</div>
                  {[
                    { item: 'Pandit service fee',    amount: priceBreakdown.pandit },
                    { item: 'Samagri (if arranged)', amount: priceBreakdown.samagri },
                    { item: 'Travel charges',         amount: priceBreakdown.travel },
                    { item: 'Platform fee',           amount: priceBreakdown.platform },
                  ].map(({ item, amount }) => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(212,175,55,0.12)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text-mid)' }}>{item}</span>
                      <span style={{ color: amount === 0 ? 'var(--text-light)' : 'var(--text-dark)', fontWeight: amount > 0 ? 600 : 400 }}>
                        {amount === 0 ? 'Not included' : `₹${amount.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0 0', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--saffron)' }}>₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ background: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.15)', borderRadius: 10, padding: '14px 18px', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', color: '#2e7d32' }}>
                  ✓ No hidden charges · Final price confirmed at booking
                </div>
              </div>
            )}

            {/* AVAILABILITY */}
            {tab === 'Availability' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 20 }}>Availability</h2>
                {Object.keys(legacyAvailMap).length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
                    {Object.entries(legacyAvailMap).map(([date, status]) => (
                      <div key={date} style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 8 }}>{date}</div>
                        <AvailBadge status={status} />
                      </div>
                    ))}
                  </div>
                ) : avail?.workingHours?.length > 0 ? (
                  <div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 16 }}>
                      Working hours (contact to check specific date availability)
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => {
                        const wh = avail.workingHours.find(h => h.dayOfWeek === i);
                        return (
                          <div key={day} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', background: wh?.isActive ? 'white' : 'var(--parchment)', border: '1px solid var(--border-gold)', borderRadius: 8, fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{day}</span>
                            <span style={{ color: wh?.isActive ? '#2e7d32' : 'var(--text-light)' }}>
                              {wh?.isActive ? `${wh.startTime} – ${wh.endTime}` : 'Not available'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontFamily: 'var(--font-body)', color: 'var(--text-light)', fontStyle: 'italic' }}>
                    Contact the Pandit directly to check availability for your date.
                  </div>
                )}
              </div>
            )}

            {/* ASK */}
            {tab === 'Ask' && <AskTab panditId={p.id} qa={p.qa} />}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* Normalise static PANDITS shape to API shape */
function _normStatic(sp) {
  return {
    _id: sp.id,
    displayName: sp.name,
    profile: { about: sp.aboutText, experienceYears: sp.experience, languages: sp.languages, traditions: [sp.tradition] },
    location: { city: sp.location?.split(',')[0]?.trim() || sp.location, state: sp.location?.split(',')[1]?.trim() || '' },
    serviceAreas: sp.serviceAreas || [],
    ratingSummary: { overall: sp.rating, count: sp.reviews, punctuality: sp.ratingsBreakdown?.punctuality, communication: sp.ratingsBreakdown?.communication, serviceQuality: sp.ratingsBreakdown?.service, professionalism: sp.ratingsBreakdown?.professionalism },
    bookingSummary: { total: sp.bookings, repeatCustomers: sp.repeatCustomers },
    verificationStatus: sp.verified ? 'VERIFIED' : 'UNVERIFIED',
    badges: sp.badge || [],
    media: [],
    videos: sp.videos || [],
    qa: (sp.qa || []).map(q => ({ question: q.q, answer: q.a })),
    eventBreakdown: sp.eventBreakdown || [],
    pricing: { startingFrom: sp.priceRange?.[0], breakdown: sp.priceBreakdown },
    capabilities: { samagriAvailable: sp.samagriAvailable },
    availability: sp.availability || {},
    cancellationRate: sp.cancellationRate,
  };
}
