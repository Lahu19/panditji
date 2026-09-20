import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { POPULAR_SERVICES, CATEGORIES, TESTIMONIALS, PANDITS } from '../data/services';

/* ── tiny helper ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* Rotating headline words */
const WORDS = ['Griha Pravesh', 'Wedding Ceremony', 'Satyanarayan Puja', 'Havan & Yagna', 'Corporate Puja', 'Naamkaran'];

export default function Home() {
  const navigate = useNavigate();
  const [wordIdx, setWordIdx] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  // Load recent bookings from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pj_bookings') || '[]');
      setRecentBookings(saved.slice(0, 3));
    } catch (_) {}
  }, []);

  return (
    <div className="page-container" style={{ background: 'var(--sacred-white)' }}>
      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          minHeight: '92vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--grad-hero)',
          overflow: 'hidden',
          padding: '100px 24px 60px',
        }}
      >
        {/* Mandala decorations */}
        <MandalaDecor size={700} opacity={0.07} style={{ top: -100, right: -150, animation: 'spin-slow 60s linear infinite' }} />
        <MandalaDecor size={400} opacity={0.05} style={{ bottom: -80, left: -80, animation: 'spin-reverse 40s linear infinite' }} />

        {/* Floating emojis */}
        {['🪔', '🌸', '🕉️', '🌺', '✨', '🪷'].map((e, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              fontSize: `${1.2 + (i % 3) * 0.4}rem`,
              opacity: 0.18,
              left: `${8 + i * 15}%`,
              top: `${15 + (i % 3) * 20}%`,
              animation: `float ${5 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
              pointerEvents: 'none',
            }}
          >
            {e}
          </div>
        ))}

        {/* Gold horizontal lines */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, transparent, var(--gold), var(--saffron), var(--gold), transparent)',
        }} />

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 780 }}>
          {/* Om badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            style={{ fontSize: '3.5rem', marginBottom: 16, display: 'block', lineHeight: 1 }}
          >
            🕉️
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.65rem, 1.5vw, 0.8rem)',
              letterSpacing: '0.25em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            ✦ Trusted Religious Services Platform ✦
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.15,
              letterSpacing: '0.02em',
              marginBottom: 12,
            }}
          >
            Find the Perfect Pandit
            <br />
            <span style={{ color: 'var(--gold)', display: 'block' }}>for Your</span>
          </motion.h1>

          {/* Rotating word */}
          <div style={{ height: 'clamp(2.5rem, 6vw, 4rem)', overflow: 'hidden', marginBottom: 28 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={wordIdx}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                exit={{   y: -40, opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 5vw, 3.4rem)',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--saffron), var(--gold-light), var(--saffron-light))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: 1.1,
                }}
              >
                {WORDS[wordIdx]}
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1rem, 2.2vw, 1.25rem)',
              color: 'rgba(255,255,255,0.75)',
              marginBottom: 44,
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            Transparent · Verified · Matching your exact requirements
          </motion.p>

          {/* Three CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}
          >
            <Link to="/tell-us" className="btn-primary" style={{ fontSize: '0.9rem', padding: '16px 36px' }}>
              💬 Tell Us What You Need
            </Link>
            <Link to="/browse" className="btn-secondary" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>
              🛕 Browse Services
            </Link>
            <Link to="/search" className="btn-ghost">
              🔎 Search
            </Link>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 32,
              marginTop: 52,
              paddingTop: 32,
              borderTop: '1px solid rgba(212,175,55,0.2)',
            }}
          >
            {[
              { n: '500+', label: 'Verified Pandits' },
              { n: '12,000+', label: 'Ceremonies Completed' },
              { n: '4.9 ⭐', label: 'Average Rating' },
              { n: '30+', label: 'Cities Covered' },
            ].map(({ n, label }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                  fontWeight: 700, color: 'var(--gold)',
                }}>{n}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', fontFamily: 'var(--font-ui)', textTransform: 'uppercase' }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: -1, left: 0, right: 0,
        }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 60 }}>
            <path d="M0,40 C360,70 1080,10 1440,40 L1440,60 L0,60 Z" fill="var(--sacred-white)" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          THREE ENTRY POINTS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <motion.div variants={fadeUp}>
            <RangoliDivider label="How It Works" />
            <h2 className="section-title" style={{ marginTop: 12 }}>Three Ways to Find Your Pandit</h2>
            <p className="section-subtitle" style={{ marginTop: 8 }}>Start however feels natural — all paths lead to the perfect match</p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}
        >
          {[
            {
              to: '/tell-us',
              icon: '💬',
              title: 'Tell Us What You Need',
              desc: "Describe your event in plain language. Don't worry if you don't know the Puja name — we'll figure it out together.",
              cta: 'Start Conversation',
              accent: 'var(--saffron)',
              bg: 'linear-gradient(145deg, #FFF3E6, #FFF8EE)',
              badge: 'AI-Assisted',
            },
            {
              to: '/browse',
              icon: '🛕',
              title: 'Browse Services',
              desc: 'Know roughly what you want? Browse by category — Home, Wedding, Festival, Corporate and more.',
              cta: 'Browse Categories',
              accent: 'var(--gold)',
              bg: 'linear-gradient(145deg, #FFFDF7, #FFF8EE)',
              badge: 'Category-Driven',
            },
            {
              to: '/search',
              icon: '🔎',
              title: 'Search',
              desc: 'Know exactly what you want? Search by service name, ceremony, or Pandit name directly.',
              cta: 'Search Now',
              accent: '#1565C0',
              bg: 'linear-gradient(145deg, #F0F4FF, #FFFDF7)',
              badge: 'Traditional Search',
            },
            {
              to: '/tell-us?mode=decide',
              icon: '🤔',
              title: 'Help Me Decide',
              desc: "Not sure which Puja you need? Tell us the occasion — new home, wedding, festival — and we'll guide you.",
              cta: 'Get Guidance',
              accent: '#9C27B0',
              bg: 'linear-gradient(145deg, #F8F0FF, #FFFDF7)',
              badge: 'Guided Discovery',
            },
            {
              to: '/pandits',
              icon: '👤',
              title: 'Find a Pandit',
              desc: 'Browse all verified Pandits directly. Filter by language, price, rating, Samagri and more.',
              cta: 'Browse Pandits',
              accent: 'var(--gold-dark)',
              bg: 'linear-gradient(145deg, #FFFDF7, #FFF8EE)',
              badge: 'Pandit Directory',
            },
          ].map(({ to, icon, title, desc, cta, accent, bg, badge }) => (
            <motion.div key={to} variants={fadeUp}>
              <Link to={to} style={{ textDecoration: 'none' }}>
                <div
                  className="card"
                  style={{
                    background: bg,
                    padding: '36px 28px',
                    borderTop: `4px solid ${accent}`,
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontSize: '2.4rem', marginBottom: 8 }}>{icon}</div>
                  <span className="tag" style={{ color: accent, borderColor: `${accent}40`, background: `${accent}12`, marginBottom: 14, alignSelf: 'flex-start' }}>
                    {badge}
                  </span>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 10 }}>
                    {title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-light)', lineHeight: 1.6, flex: 1 }}>
                    {desc}
                  </p>
                  <div style={{ marginTop: 20, fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {cta} →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          POPULAR SERVICES CAROUSEL
      ══════════════════════════════════════════ */}
      <section style={{ padding: '0 0 64px', background: 'var(--cream)', overflow: 'hidden' }}>
        <div style={{ padding: '56px 24px 0', maxWidth: 1100, margin: '0 auto' }}>
          <RangoliDivider label="Popular Services" />
          <h2 className="section-title" style={{ marginTop: 12, marginBottom: 4 }}>Most Booked Ceremonies</h2>
          <p className="section-subtitle">Trusted by thousands of families across India</p>
        </div>

        <div style={{ marginTop: 36, padding: '0 24px' }}>
          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={2}
            spaceBetween={16}
            autoplay={{ delay: 2800, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop
            breakpoints={{
              640:  { slidesPerView: 3 },
              900:  { slidesPerView: 4 },
              1200: { slidesPerView: 5 },
            }}
            style={{ paddingBottom: 40 }}
          >
            {POPULAR_SERVICES.map((s) => (
              <SwiperSlide key={s.id}>
                <Link to={`/service/${s.id}`} style={{ textDecoration: 'none' }}>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(255,107,0,0.2)' }}
                    style={{
                      background: 'white',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 16,
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>{s.icon}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 4, lineHeight: 1.3 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)' }}>
                      From ₹{s.from.toLocaleString()}
                    </div>
                  </motion.div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORIES GRID
      ══════════════════════════════════════════ */}
      <section style={{ padding: '64px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RangoliDivider label="Categories" />
        <h2 className="section-title" style={{ marginTop: 12, marginBottom: 4 }}>Browse by Occasion</h2>
        <p className="section-subtitle" style={{ marginBottom: 40 }}>Every ceremony, every tradition</p>

        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.id} variants={fadeUp}>
              <Link to={`/browse?cat=${cat.id}`} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ y: -4 }}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-gold)',
                    borderRadius: 16,
                    padding: '28px 20px',
                    borderLeft: `4px solid ${cat.color}`,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>{cat.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 6 }}>
                    {cat.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)', lineHeight: 1.4 }}>
                    {cat.subtitle}
                  </div>
                  <div style={{ marginTop: 12, fontSize: '0.7rem', color: cat.color, fontWeight: 600, fontFamily: 'var(--font-ui)' }}>
                    {cat.services.length} services →
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS STEPS
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--grad-hero)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <MandalaDecor size={500} opacity={0.05} style={{ top: -100, left: -100 }} />
        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <RangoliDivider label="Process" />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'white', marginTop: 12 }}>
              How PanditJi Works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '01', icon: '💬', title: 'Tell Us', desc: 'Describe your need in plain language or browse services' },
              { step: '02', icon: '🎯', title: 'We Match', desc: 'Our engine finds Pandits who meet every requirement' },
              { step: '03', icon: '👤', title: 'You Choose', desc: 'Compare profiles, videos, reviews and pricing transparently' },
              { step: '04', icon: '📅', title: 'Book & Done', desc: 'Confirm, pay and get ready for a perfect ceremony' },
            ].map(({ step, icon, title, desc }) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: parseInt(step) * 0.1 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(212,175,55,0.15)',
                  border: '2px solid rgba(212,175,55,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.8rem', margin: '0 auto 16px',
                  animation: 'pulse-glow 3s ease-in-out infinite',
                }}>
                  {icon}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Step {step}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          RECENT / REBOOK SECTION
      ══════════════════════════════════════════ */}
      {recentBookings.length > 0 && (
        <section style={{ padding:'0 24px 64px', maxWidth:1100, margin:'0 auto' }}>
          <RangoliDivider label="Recent Bookings"/>
          <h2 className="section-title" style={{ marginTop:12, marginBottom:4 }}>Your Recent Bookings</h2>
          <p className="section-subtitle" style={{ marginBottom:28 }}>Book again with one tap</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {recentBookings.map((b,i)=>(
              <motion.div key={i} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                style={{ background:'white', border:'1px solid var(--border-gold)', borderRadius:14, padding:'20px', borderLeft:'4px solid var(--gold)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.9rem', color:'var(--text-dark)', marginBottom:3 }}>{b.service}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-light)', fontFamily:'var(--font-ui)' }}>{b.panditName}</div>
                  </div>
                  <span className="tag tag-gold" style={{ fontSize:'0.6rem' }}>✓ Completed</span>
                </div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-light)', fontFamily:'var(--font-ui)', marginBottom:14, display:'flex', gap:10 }}>
                  <span>📅 {b.date}</span>
                  <span>💰 ₹{b.amount?.toLocaleString()}</span>
                </div>
                <Link to={`/book/${b.panditId}`}
                  className="btn-primary"
                  style={{ width:'100%', justifyContent:'center', fontSize:'0.78rem', padding:'9px', textAlign:'center' }}>
                  🔄 Book Again
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FEATURED PANDITS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '72px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <RangoliDivider label="Our Pandits" />
        <h2 className="section-title" style={{ marginTop: 12, marginBottom: 4 }}>Verified Pandits</h2>
        <p className="section-subtitle" style={{ marginBottom: 40 }}>Every profile is verified. Every review is real.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {PANDITS.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Link to={`/pandit/${p.id}`} style={{ textDecoration: 'none' }}>
                <div className="card gold-top" style={{ padding: '28px 24px' }}>
                  {/* Avatar + name */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: 'var(--grad-saffron)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem', flexShrink: 0,
                      boxShadow: '0 4px 16px rgba(255,107,0,0.3)',
                    }}>
                      🙏
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 2 }}>
                        📍 {p.location} · {p.experience} yrs exp
                      </div>
                    </div>
                  </div>

                  {/* Languages */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {p.languages.map(l => (
                      <span key={l} className="tag" style={{ fontSize: '0.68rem' }}>🗣 {l}</span>
                    ))}
                  </div>

                  {/* Rating & bookings */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <span className="stars">{'★'.repeat(Math.floor(p.rating))}</span>
                      <span style={{ fontSize: '0.85rem', marginLeft: 4, fontWeight: 600, color: 'var(--text-dark)' }}>{p.rating}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginLeft: 4 }}>({p.reviews} reviews)</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{p.bookings} bookings</span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {p.badge.map(b => <span key={b} className="tag tag-gold" style={{ fontSize: '0.65rem' }}>✦ {b}</span>)}
                    {p.verified && <span className="verified" style={{ fontSize: '0.65rem' }}>✓ Verified</span>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      From <span style={{ color: 'var(--saffron)', fontWeight: 700, fontSize: '1rem' }}>₹{p.priceRange[0].toLocaleString()}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--saffron)', fontWeight: 600 }}>
                      View Profile →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS CAROUSEL
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--parchment)', padding: '72px 24px', overflow: 'hidden' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <RangoliDivider label="Testimonials" />
          <h2 className="section-title" style={{ marginTop: 12, marginBottom: 4, textAlign: 'center' }}>What Families Say</h2>
          <p className="section-subtitle" style={{ marginBottom: 40, textAlign: 'center' }}>Real stories, real ceremonies</p>

          <Swiper
            modules={[Autoplay, Pagination]}
            slidesPerView={1}
            spaceBetween={24}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop
            breakpoints={{ 640: { slidesPerView: 2 } }}
            style={{ paddingBottom: 48 }}
          >
            {TESTIMONIALS.map((t, i) => (
              <SwiperSlide key={i}>
                <div style={{
                  background: 'white',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 16,
                  padding: '32px 28px',
                  borderTop: '4px solid var(--gold)',
                  minHeight: 200,
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: 12, color: 'var(--gold)' }}>"</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: 'var(--text-mid)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 20 }}>
                    {t.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: 'var(--grad-saffron)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: '0.85rem',
                    }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)' }}>{t.event} · {t.location}</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      <span className="stars">{'★'.repeat(t.rating)}</span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA BANNER
      ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--grad-hero)', padding: '72px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <MandalaDecor size={300} opacity={0.06} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🙏</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: 'white', marginBottom: 12 }}>
            Ready to Begin?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', marginBottom: 36, fontStyle: 'italic' }}>
            Describe your ceremony and we'll handle the rest
          </p>
          <Link to="/tell-us" className="btn-primary" style={{ fontSize: '1rem', padding: '18px 48px' }}>
            💬 Tell Us What You Need
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#0D0303',
        padding: '48px 24px 32px',
        borderTop: '1px solid rgba(212,175,55,0.15)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            <div style={{ flex: '1 1 240px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)', marginBottom: 10 }}>🕉️ PanditJi</div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
                Connecting you with verified Pandits for every ceremony, every tradition, with complete transparency.
              </p>
            </div>
            {[
              { title: 'Services', links: ['Griha Pravesh', 'Wedding', 'Havan', 'Corporate Puja', 'Satyanarayan'] },
              { title: 'Platform', links: ['How It Works', 'Verified Pandits', 'Pricing', 'For Pandits'] },
            ].map(({ title, links }) => (
              <div key={title} style={{ flex: '1 1 160px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  {title}
                </div>
                {links.map(l => (
                  <div key={l} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontFamily: 'var(--font-ui)', cursor: 'pointer' }}>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(212,175,55,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-ui)' }}>
              © 2026 PanditJi. All rights reserved.
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
              ॐ नमः शिवाय
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
