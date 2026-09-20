import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { categoriesApi, servicesApi } from '../api/index.js';
// Static fallback data (used when API has no data yet)
import { CATEGORIES as STATIC_CATEGORIES } from '../data/services';

const fadeUp  = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || null;

  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [categories,  setCategories]  = useState([]);
  const [services,    setServices]    = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSvcs, setLoadingSvcs] = useState(false);
  const [error,       setError]       = useState(null);

  /* Load categories from API on mount */
  useEffect(() => {
    async function load() {
      setLoadingCats(true);
      try {
        const { categories: cats } = await categoriesApi.list({ parent: 'root' });
        setCategories(cats.length ? cats : _fallbackCategories());
      } catch {
        setCategories(_fallbackCategories());
      } finally {
        setLoadingCats(false);
      }
    }
    load();
  }, []);

  /* Load services when a category is selected */
  useEffect(() => {
    if (!selectedCat) { setServices([]); return; }
    async function load() {
      setLoadingSvcs(true);
      try {
        // Try to find the category by slug first, then by id
        const cat = categories.find(c => c.slug === selectedCat || c._id === selectedCat || c.id === selectedCat);
        const catId = cat?._id || cat?.id || selectedCat;
        if (catId && catId.length === 24) {
          const { services: svcs } = await servicesApi.list({ categoryId: catId });
          setServices(svcs.length ? svcs : _fallbackServicesForCat(selectedCat));
        } else {
          setServices(_fallbackServicesForCat(selectedCat));
        }
      } catch {
        setServices(_fallbackServicesForCat(selectedCat));
      } finally {
        setLoadingSvcs(false);
      }
    }
    load();
  }, [selectedCat, categories]);

  /* Derive display data — normalise API docs and static objects to same shape */
  function normCat(c) {
    return {
      id:       c._id || c.id,
      slug:     c.slug || c.id,
      name:     c.name || c.title,
      title:    c.name || c.title,
      subtitle: c.description || c.subtitle || '',
      icon:     c.icon || '🕉️',
      color:    c.color || 'var(--saffron)',
      serviceCount: c.serviceCount,
    };
  }
  function normService(s) {
    return {
      id:       s._id || s.id,
      name:     s.name,
      duration: s.duration?.label || s.duration || '',
      from:     s.pricing?.startingFrom || s.from || 0,
    };
  }

  const cat = (() => {
    const raw = categories.find(c => c.slug === selectedCat || c._id === selectedCat || c.id === selectedCat);
    return raw ? normCat(raw) : null;
  })();

  const displayServices = services.map(normService);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--gold),var(--saffron),var(--gold))' }} />
      <MandalaDecor size={350} opacity={0.04} style={{ top: 0, right: -60, animation: 'spin-slow 50s linear infinite' }} />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button onClick={() => selectedCat ? setSelectedCat(null) : navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', marginBottom: 24 }}>
            <ArrowLeft size={15} /> {selectedCat ? 'All Categories' : 'Home'}
          </button>
          <RangoliDivider label={selectedCat ? (cat?.title || selectedCat) : 'Browse Services'} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 700, color: 'var(--text-dark)', marginTop: 12, marginBottom: 6 }}>
            {selectedCat ? (cat?.title || 'Services') : 'What are you planning?'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
            {selectedCat
              ? `${displayServices.length} service${displayServices.length !== 1 ? 's' : ''} available`
              : 'Choose a category to explore services'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Category grid */}
          {!selectedCat && (
            <motion.div key="cats" variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>

              {loadingCats
                ? Array.from({ length: 6 }).map((_, i) => (
                    <motion.div key={i} variants={fadeUp} style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '28px 22px', height: 140, opacity: 0.5, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                  ))
                : categories.map(raw => {
                    const c = normCat(raw);
                    return (
                      <motion.div key={c.id} variants={fadeUp}>
                        <motion.button whileHover={{ y: -4, boxShadow: '0 8px 28px rgba(0,0,0,0.1)' }} whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedCat(c.slug || c.id)}
                          style={{ display: 'block', width: '100%', textAlign: 'left', background: 'white', border: '1px solid var(--border-gold)', borderRadius: 16, padding: '28px 22px', borderLeft: `4px solid ${c.color}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                          <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{c.icon}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6 }}>{c.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)', lineHeight: 1.4, marginBottom: 10 }}>{c.subtitle}</div>
                          <div style={{ fontSize: '0.72rem', color: c.color, fontWeight: 600, fontFamily: 'var(--font-ui)' }}>Browse services →</div>
                        </motion.button>
                      </motion.div>
                    );
                  })
              }

              {/* Custom */}
              <motion.div variants={fadeUp}>
                <Link to="/tell-us" style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ y: -4 }}
                    style={{ background: 'var(--grad-hero)', borderRadius: 16, padding: '28px 22px', border: '1px dashed rgba(212,175,55,0.4)', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>❓</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 6 }}>Custom Requirement</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      Can't find your ceremony? Tell us what you need.
                    </div>
                    <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>Describe it →</div>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* Services in category */}
          {selectedCat && (
            <motion.div key="services" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Category hero strip */}
              {cat && (
                <div style={{ background: 'var(--grad-hero)', borderRadius: 16, padding: '24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: '2.8rem' }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'white' }}>{cat.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gold)', marginTop: 4, fontFamily: 'var(--font-ui)' }}>{cat.subtitle}</div>
                  </div>
                </div>
              )}

              {loadingSvcs ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 14, padding: '24px 18px', height: 100, opacity: 0.5, border: '1px solid var(--border-gold)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
                  {displayServices.map(s => (
                    <motion.div key={s.id} variants={fadeUp}>
                      <Link to={`/service/${s.id}`} style={{ textDecoration: 'none' }}>
                        <motion.div whileHover={{ y: -4, boxShadow: 'var(--shadow-deep)' }}
                          style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '24px 18px', cursor: 'pointer', borderTop: `3px solid ${cat?.color || 'var(--saffron)'}` }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>{s.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)' }}>
                              {s.duration ? `⏱ ${s.duration}` : ''}
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--saffron)', fontWeight: 700 }}>
                              {s.from ? `From ₹${s.from.toLocaleString()}` : ''}
                            </div>
                          </div>
                          <div style={{ marginTop: 10, fontSize: '0.72rem', color: cat?.color || 'var(--saffron)', fontWeight: 600, fontFamily: 'var(--font-ui)' }}>
                            Book Pandit →
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* CTA */}
              <div style={{ marginTop: 32, background: 'var(--parchment)', border: '1px dashed var(--border-gold)', borderRadius: 14, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 4 }}>Don't see what you need?</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>Describe your requirement and we'll match you</div>
                </div>
                <Link to="/tell-us" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.82rem' }}>💬 Tell Us</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Fallback helpers — use static data when API has no seed data yet ── */
function _fallbackCategories() {
  return STATIC_CATEGORIES.map(c => ({
    _id: c.id, id: c.id, slug: c.id,
    name: c.title, title: c.title,
    description: c.subtitle, subtitle: c.subtitle,
    icon: c.icon, color: c.color,
  }));
}
function _fallbackServicesForCat(catId) {
  const cat = STATIC_CATEGORIES.find(c => c.id === catId);
  if (!cat) return [];
  return (cat.services || []).map(s => ({
    _id: s.id, id: s.id, name: s.name,
    duration: { label: s.duration }, pricing: { startingFrom: s.from },
  }));
}
