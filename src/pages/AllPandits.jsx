import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { providersApi } from '../api/index.js';
import { PANDITS as STATIC_PANDITS } from '../data/services';

const LANGUAGE_OPTS = ['Hindi', 'Marathi', 'Sanskrit', 'English'];
const RATING_OPTS   = [{ label: '4.9+', min: 4.9 }, { label: '4.7+', min: 4.7 }, { label: '4.5+', min: 4.5 }];
const PRICE_OPTS    = [
  { label: 'Under ₹1,500', max: 1500 },
  { label: '₹1,500–₹3,000', min: 1500, max: 3000 },
  { label: '₹3,000+', min: 3000 },
];

const fadeUp  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

function Chip({ label, active, onClick, color = 'var(--saffron)' }) {
  return (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{ padding: '7px 16px', borderRadius: 50, border: active ? 'none' : '1.5px solid var(--border-gold)', background: active ? color : 'white', color: active ? 'white' : 'var(--text-dark)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', boxShadow: active ? `0 2px 10px ${color}40` : 'none' }}>
      {label}
    </motion.button>
  );
}

/* Normalise API provider doc to display shape */
function norm(p) {
  return {
    id:               p._id || p.id,
    name:             p.displayName || p.name,
    experience:       p.profile?.experienceYears || p.experience || 0,
    location:         [p.location?.city, p.location?.state].filter(Boolean).join(', ') || p.location || 'India',
    languages:        p.profile?.languages || p.languages || [],
    rating:           p.ratingSummary?.overall || p.rating || 0,
    reviews:          p.ratingSummary?.count || p.reviews || 0,
    bookings:         p.bookingSummary?.total || p.bookings || 0,
    verified:         p.verificationStatus === 'VERIFIED' || p.verified || false,
    samagriAvailable: p.capabilities?.samagriAvailable || p.samagriAvailable || false,
    priceFrom:        p.pricing?.startingFrom || (p.priceRange?.[0]) || 0,
    badges:           p.badges || p.badge || [],
  };
}

export default function AllPandits() {
  const navigate = useNavigate();

  /* Filter state */
  const [langs,       setLangs]       = useState([]);
  const [ratingMin,   setRatingMin]   = useState(null);
  const [priceOpt,    setPriceOpt]    = useState(null);
  const [samagri,     setSamagri]     = useState(false);
  const [verified,    setVerified]    = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  /* Data state */
  const [providers, setProviders] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (langs.length)  params.language  = langs.join(',');
    if (samagri)       params.samagri   = 'true';
    if (verified)      params.verified  = 'true';
    if (ratingMin)     params.ratingMin = ratingMin;
    if (priceOpt?.max) params.priceMax  = priceOpt.max;
    if (priceOpt?.min) params.priceMin  = priceOpt.min;

    try {
      const data = await providersApi.list(params);
      if (data.providers?.length) {
        setProviders(data.providers.map(norm));
        setTotal(data.total || data.providers.length);
        setUsingFallback(false);
      } else {
        throw new Error('empty');
      }
    } catch {
      /* Fall back to static data with client-side filter */
      const filtered = STATIC_PANDITS.filter(p => {
        if (langs.length && !langs.some(l => p.languages.includes(l))) return false;
        if (ratingMin && p.rating < ratingMin) return false;
        if (priceOpt?.max && p.priceRange[0] > priceOpt.max) return false;
        if (priceOpt?.min && p.priceRange[0] < priceOpt.min) return false;
        if (samagri  && !p.samagriAvailable) return false;
        if (verified && !p.verified) return false;
        return true;
      }).map(p => ({ ...norm(p), id: p.id, priceFrom: p.priceRange?.[0] || 0 }));
      setProviders(filtered);
      setTotal(filtered.length);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, [langs, ratingMin, priceOpt, samagri, verified, page]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  function toggleLang(l) { setLangs(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]); }
  function clearAll() { setLangs([]); setRatingMin(null); setPriceOpt(null); setSamagri(false); setVerified(false); setPage(1); }
  const activeCount = langs.length + (ratingMin ? 1 : 0) + (priceOpt ? 1 : 0) + (samagri ? 1 : 0) + (verified ? 1 : 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }} />
      <MandalaDecor size={320} opacity={0.04} style={{ top: 0, right: -60, animation: 'spin-slow 55s linear infinite' }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', marginBottom: 28 }}>
          <ArrowLeft size={15} /> Back
        </button>

        <RangoliDivider label="Our Pandits" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, color: 'var(--text-dark)', marginTop: 12, marginBottom: 6 }}>
          Find a Pandit
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 28 }}>
          {loading ? 'Loading…' : `${total} verified Pandits · Filter by language, price, rating and more`}
        </p>

        {/* Filter bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            {LANGUAGE_OPTS.map(l => <Chip key={l} label={`🗣 ${l}`} active={langs.includes(l)} onClick={() => toggleLang(l)} />)}
            <Chip label="🧺 Samagri" active={samagri} onClick={() => setSamagri(s => !s)} color="var(--gold-dark)" />
            <Chip label="✓ Verified" active={verified} onClick={() => setVerified(v => !v)} color="#2e7d32" />
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowFilters(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 50, border: `1.5px solid ${showFilters ? 'var(--saffron)' : 'var(--border-gold)'}`, background: showFilters ? 'var(--saffron-pale)' : 'white', color: showFilters ? 'var(--saffron)' : 'var(--text-dark)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', cursor: 'pointer' }}>
              <SlidersHorizontal size={13} /> Filters {activeCount > 0 && <span style={{ background: 'var(--saffron)', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>{activeCount}</span>}
            </motion.button>
            {activeCount > 0 && (
              <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--vermillion)', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', cursor: 'pointer' }}>
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                <div style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '20px 22px', marginTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Rating</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {RATING_OPTS.map(r => <Chip key={r.label} label={`⭐ ${r.label}`} active={ratingMin === r.min} onClick={() => setRatingMin(prev => prev === r.min ? null : r.min)} />)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Starting Price</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {PRICE_OPTS.map(p => <Chip key={p.label} label={`💰 ${p.label}`} active={priceOpt?.label === p.label} onClick={() => setPriceOpt(prev => prev?.label === p.label ? null : p)} color="var(--gold-dark)" />)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Other</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Chip label="🧺 Samagri" active={samagri} onClick={() => setSamagri(s => !s)} color="var(--gold-dark)" />
                        <Chip label="✓ Verified" active={verified} onClick={() => setVerified(v => !v)} color="#2e7d32" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-light)', marginBottom: 20 }}>
          Showing <strong style={{ color: 'var(--text-dark)' }}>{providers.length}</strong> of {total} Pandits
          {activeCount > 0 && <span style={{ color: 'var(--saffron)', marginLeft: 6 }}>· {activeCount} filter{activeCount > 1 ? 's' : ''} active</span>}
          {usingFallback && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>· (sample data)</span>}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 16, padding: '24px 20px', height: 220, border: '1px solid var(--border-gold)', opacity: 0.5, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
              ))}
            </motion.div>
          ) : providers.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 16, border: '1px solid var(--border-gold)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 14 }}>🔍</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 20 }}>
                No Pandits match these filters.
              </p>
              <button className="btn-primary" onClick={clearAll}>Clear Filters</button>
            </motion.div>
          ) : (
            <motion.div key="grid" variants={stagger} initial="hidden" animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {providers.map(p => (
                <motion.div key={p.id} variants={fadeUp}>
                  <Link to={`/pandit/${p.id}`} style={{ textDecoration: 'none' }}>
                    <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-deep)' }}
                      style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '24px 20px', borderTop: '3px solid var(--gold)', height: '100%', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0, boxShadow: '0 4px 14px rgba(255,107,0,0.28)' }}>🙏</div>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.97rem', fontWeight: 700, color: 'var(--text-dark)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 2 }}>📍 {p.location} · {p.experience} yrs</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {p.languages.map(l => <span key={l} className="tag" style={{ fontSize: '0.64rem' }}>🗣 {l}</span>)}
                        {p.samagriAvailable && <span className="tag tag-gold" style={{ fontSize: '0.64rem' }}>🧺 Samagri</span>}
                        {p.verified && <span className="verified" style={{ fontSize: '0.64rem' }}>✓ Verified</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          {p.rating > 0 && <>
                            <span className="stars" style={{ fontSize: '0.82rem' }}>{'★'.repeat(Math.floor(p.rating))}</span>
                            <span style={{ fontSize: '0.82rem', marginLeft: 4, fontWeight: 600, color: 'var(--text-dark)' }}>{p.rating}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginLeft: 4 }}>({p.reviews})</span>
                          </>}
                        </div>
                        {p.bookings > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>{p.bookings} bookings</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                        {(p.badges || []).slice(0, 2).map(b => <span key={b} className="tag tag-gold" style={{ fontSize: '0.6rem' }}>✦ {b}</span>)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          {p.priceFrom > 0 && <>From <span style={{ color: 'var(--saffron)', fontWeight: 700, fontSize: '1rem' }}>₹{p.priceFrom.toLocaleString()}</span></>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--saffron)', fontWeight: 600 }}>View Profile →</div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <div style={{ marginTop: 48, background: 'var(--grad-hero)', borderRadius: 16, padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <MandalaDecor size={200} opacity={0.07} style={{ top: '50%', right: -40, transform: 'translateY(-50%)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>Not sure which Pandit to choose?</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', marginBottom: 16 }}>
              Tell us your requirement and we'll match you with the best available Pandit
            </p>
            <Link to="/tell-us" className="btn-primary" style={{ fontSize: '0.85rem', padding: '12px 28px' }}>💬 Tell Us What You Need</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
