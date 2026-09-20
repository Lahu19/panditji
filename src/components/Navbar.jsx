import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from './AuthModal.jsx';

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [showAuth,   setShowAuth]   = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
          <Link to="/browse"  className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>🛕 Browse</Link>
          <Link to="/pandits" className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>👤 Pandits</Link>
          <Link to="/search"  className="btn-ghost" style={{ fontSize: '0.82rem', padding: '8px 16px' }}>
            <Search size={14} /> Search
          </Link>
          <Link to="/tell-us" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.8rem' }}>
            💬 Tell Us What You Need
          </Link>

          {/* Auth area */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>
                {user.profile?.displayName || user.profile?.firstName || 'Account'}
              </span>
              <button
                onClick={logout}
                title="Sign out"
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
              <User size={14} /> Sign In
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
            <Link to="/browse"  onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>🛕 Browse Services</Link>
            <Link to="/pandits" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>👤 All Pandits</Link>
            <Link to="/search"  onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold)', fontFamily: 'var(--font-ui)', textDecoration: 'none' }}>🔎 Search</Link>
            <Link to="/tell-us" onClick={() => setMenuOpen(false)} className="btn-primary" style={{ textAlign: 'center' }}>💬 Tell Us What You Need</Link>
            {user ? (
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                Sign Out
              </button>
            ) : (
              <button onClick={() => { setShowAuth(true); setMenuOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                Sign In / Register
              </button>
            )}
          </div>
        )}

        <style>{`
          @media (max-width: 700px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: block !important; }
          }
        `}</style>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}
