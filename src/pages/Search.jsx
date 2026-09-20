import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, ArrowLeft } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { servicesApi, providersApi } from '../api/index.js';
import { CATEGORIES, PANDITS as STATIC_PANDITS, POPULAR_SERVICES } from '../data/services';

/* Flat static lists for instant client-side fallback */
const STATIC_SERVICES = CATEGORIES.flatMap(c =>
  c.services.map(s => ({ ...s, categoryTitle: c.title, categoryId: c.id, type: 'service', icon: c.icon }))
);

function buildStaticResults(query) {
  if (!query.trim()) return { services: [], pandits: [] };
  const q = query.toLowerCase();
  return {
    services: STATIC_SERVICES.filter(s => s.name.toLowerCase().includes(q) || s.categoryTitle.toLowerCase().includes(q)).slice(0, 6),
    pandits:  STATIC_PANDITS.filter(p  => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)).slice(0, 3),
  };
}

export default function Search() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState({ services: [], pandits: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults({ services: [], pandits: [] }); return; }
    setLoading(true);
    try {
      const [svcRes, provRes] = await Promise.allSettled([
        servicesApi.search(q),
        providersApi.search(q),
      ]);
      const svcs  = svcRes.status  === 'fulfilled' ? (svcRes.value.services  || []) : [];
      const provs = provRes.status === 'fulfilled' ? (provRes.value.providers || []) : [];

      /* If API returns nothing, fall back to static */
      if (svcs.length === 0 && provs.length === 0) {
        setResults(buildStaticResults(q));
      } else {
        const normSvcs = svcs.map(s => ({
          id: s._id || s.id, name: s.name,
          categoryTitle: s.categoryId?.name || '',
          duration: s.duration?.label || s.duration || '',
          from: s.pricing?.startingFrom || 0,
          icon: s.categoryId?.icon || '🕉️',
          type: 'service',
        }));
        const normProvs = provs.map(p => ({
          id: p._id || p.id,
          name: p.displayName || p.name,
          location: p.location?.city || p.location || '',
          rating: p.ratingSummary?.overall || p.rating || 0,
          verified: p.verificationStatus === 'VERIFIED' || p.verified || false,
          type: 'pandit',
        }));
        setResults({ services: normSvcs.slice(0, 6), pandits: normProvs.slice(0, 3) });
      }
    } catch {
      setResults(buildStaticResults(q));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  const hasResults = results.services.length > 0 || results.pandits.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }} />
      <MandalaDecor size={320} opacity={0.04} style={{ bottom: -60, left: -60, animation: 'spin-reverse 45s linear infinite' }} />

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', marginBottom: 28 }}>
          <ArrowLeft size={15} /> Back
        </button>

        <RangoliDivider label="Search" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 700, color: 'var(--text-dark)', marginTop: 12, marginBottom: 24 }}>
          Search Services
        </h1>

        <div style={{ position: 'relative', marginBottom: 32 }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            className="input-field"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Griha Pravesh, Havan, Pandit name…"
            style={{ paddingLeft: 46, paddingRight: query ? 44 : 18, fontSize: '1rem' }}
            aria-label="Search services or Pandits"
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {query ? (
            <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: 12, height: 60, border: '1px solid var(--border-gold)', opacity: 0.5, animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : !hasResults ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 20 }}>
                    No results for "{query}"
                  </p>
                  <Link to="/tell-us" className="btn-primary">💬 Tell Us What You Need</Link>
                </div>
              ) : (
                <>
                  {results.services.length > 0 && (
                    <div style={{ marginBottom: 28 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>✦ Services</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {results.services.map(s => (
                          <Link key={s.id} to={`/service/${s.id}`} style={{ textDecoration: 'none' }}>
                            <motion.div whileHover={{ x: 4, background: 'var(--saffron-pale)' }}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'white', border: '1px solid var(--border-gold)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                              <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-dark)' }}>{s.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                                  {s.categoryTitle}{s.duration ? ` · ⏱ ${s.duration}` : ''}
                                </div>
                              </div>
                              {s.from > 0 && (
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--saffron)', fontWeight: 700, flexShrink: 0 }}>₹{s.from.toLocaleString()}+</div>
                              )}
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.pandits.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>✦ Pandits</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {results.pandits.map(p => (
                          <Link key={p.id} to={`/pandit/${p.id}`} style={{ textDecoration: 'none' }}>
                            <motion.div whileHover={{ x: 4, background: 'var(--saffron-pale)' }}
                              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'white', border: '1px solid var(--border-gold)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
                              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>🙏</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-dark)' }}>{p.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                                  {p.location && `📍 ${p.location}`}{p.rating > 0 && ` · ⭐ ${p.rating}`}
                                  {p.verified && <span className="verified" style={{ marginLeft: 6, fontSize: '0.62rem' }}>✓ Verified</span>}
                                </div>
                              </div>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', color: 'var(--saffron)', fontWeight: 700, flexShrink: 0 }}>View →</div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>✦ Popular Searches</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['Griha Pravesh','Satyanarayan Puja','Havan','Wedding','Ganesh Puja','Navgraha','Office Inauguration','Diwali Puja'].map(s => (
                    <motion.button key={s} whileHover={{ scale: 1.03 }} onClick={() => setQuery(s)}
                      style={{ padding: '9px 18px', background: 'white', border: '1px solid var(--border-gold)', borderRadius: 50, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-dark)', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--saffron)'; e.currentTarget.style.color = 'var(--saffron)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.color = 'var(--text-dark)'; }}>
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>✦ Browse by Category</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                  {CATEGORIES.map(c => (
                    <Link key={c.id} to={`/browse?cat=${c.id}`} style={{ textDecoration: 'none' }}>
                      <motion.div whileHover={{ y: -3 }}
                        style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '18px 14px', borderLeft: `3px solid ${c.color}`, cursor: 'pointer' }}>
                        <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{c.icon}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: 1.3 }}>{c.title}</div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
