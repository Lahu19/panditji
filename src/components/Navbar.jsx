import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';
import AuthModal from './AuthModal.jsx';
import { LocationBadge, LocationSelectorModal } from './LocationSelector.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { user, logout } = useAuth();
  const { t, toggleLang } = useLang();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <nav
        className="navbar"
        style={{
          background: scrolled ? 'rgba(26,5,5,0.97)' : 'rgba(26,5,5,0.85)',
          transition: 'background 0.3s',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🕉️</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '0.08em', color: 'var(--gold)', lineHeight: 1 }}>
              PanditJi
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'var(--font-ui)' }}>
              Find Your Pandit
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="desktop-nav">
          {/* Location badge */}
          <LocationBadge />

          <Link to="/browse"  className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>🛕 {t('nav.browse')}</Link>
          <Link to="/pandits" className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>👤 {t('nav.pandits')}</Link>
          <Link to="/search"  className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
            <Search size={14} /> {t('nav.search')}
          </Link>
          <Link to="/tell-us" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.8rem' }}>
            {t('nav.tellUs')}
          </Link>

          {/* Language toggle */}
          <button
            onClick={toggleLang}
            title="Switch language / भाषा बदला"
            style={{
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderRadius: 8,
              padding: '7px 12px',
              cursor: 'pointer',
              color: 'var(--gold)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {t('lang.toggle')}
          </button>

          {/* Auth area */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              {user.userType === 'ADMIN' && (
                <Link
                  to="/admin"
                  style={{ background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 8, padding: '7px 12px', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  {t('nav.admin')}
                </Link>
              )}
              {user.userType === 'PROVIDER' && (
                <Link
                  to="/pandit-portal"
                  style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.4)', borderRadius: 8, padding: '7px 12px', color: 'var(--saffron)', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  {t('nav.myPortal')}
                </Link>
              )}
              {/* My Bookings — show for regular customers only */}
              {user.userType === 'CUSTOMER' && (
                <Link
                  to="/my-bookings"
                  style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: '7px 12px', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
                >
                  📅 My Bookings
                </Link>
              )}
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                {user.profile?.displayName || user.profile?.firstName || 'Account'}
              </span>
              <button
                onClick={logout}
                title={t('nav.signOut')}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <User size={14} /> {t('nav.signIn')}
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ position: 'absolute', top: 64, left: 0, right: 0, background: 'rgba(26,5,5,0.98)', borderBottom: '1px solid rgba(212,175,55,0.2)', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 99 }}>
            <LocationBadge />
            <Link to="/browse"  onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>🛕 {t('nav.browse')}</Link>
            <Link to="/pandits" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>👤 {t('nav.pandits')}</Link>
            <Link to="/search"  onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>🔎 {t('nav.search')}</Link>
            <Link to="/tell-us" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center' }}>{t('nav.tellUs')}</Link>
            {user?.userType === 'ADMIN' && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>{t('nav.admin')}</Link>
            )}
            {user?.userType === 'CUSTOMER' && (
              <Link to="/my-bookings" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>📅 My Bookings</Link>
            )}
            <button
              onClick={() => { toggleLang(); setMenuOpen(false); }}
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 8, padding: '8px 14px', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
            >
              🌐 {t('lang.toggle')}
            </button>
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                {t('nav.signOut')}
              </button>
            ) : (
              <button onClick={() => { setShowAuth(true); setMenuOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                {t('nav.signIn')} / {t('nav.register')}
              </button>
            )}
          </div>
        )}

        <style>{`
          .location-badge {
            display: flex; align-items: center; gap: 5px;
            background: rgba(255,255,255,0.08); border: 1px solid rgba(212,175,55,0.3);
            border-radius: 8px; padding: 6px 12px; cursor: pointer; color: rgba(255,255,255,0.8);
            font-family: var(--font-ui); font-size: 0.76rem; transition: all 0.2s;
            max-width: 180px;
          }
          .location-badge:hover { background: rgba(212,175,55,0.15); }
          .location-badge__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
          .location-badge__caret { opacity: 0.5; flex-shrink: 0; }
          @media (max-width: 700px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: block !important; }
          }
        `}</style>
      </nav>

      {/* Location modal — rendered at top level so it overlays everything */}
      <LocationSelectorModal />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}
