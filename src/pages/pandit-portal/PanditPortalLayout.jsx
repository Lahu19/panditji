/**
 * PanditPortalLayout
 * ─ Sticky sidebar on desktop
 * ─ Bottom nav bar on mobile
 * ─ Redirects unauthenticated / non-provider users to /pandit-portal/login
 */
import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { PanditPortalProvider, usePanditPortal } from '../../context/PanditPortalContext.jsx';

/* ── Sidebar navigation groups ── */
const NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/pandit-portal',                label: 'Dashboard',        icon: '🏠', end: true },
    ],
  },
  {
    section: 'My Profile',
    items: [
      { to: '/pandit-portal/profile',        label: 'Profile',          icon: '👤' },
      { to: '/pandit-portal/services',       label: 'My Services',      icon: '🛕' },
      { to: '/pandit-portal/service-areas',  label: 'Service Areas',    icon: '📍' },
      { to: '/pandit-portal/availability',   label: 'Availability',     icon: '📅' },
    ],
  },
  {
    section: 'Bookings',
    items: [
      { to: '/pandit-portal/requests',       label: 'Booking Requests', icon: '📬' },
      { to: '/pandit-portal/bookings',       label: 'My Bookings',      icon: '📋' },
    ],
  },
  {
    section: 'Performance',
    items: [
      { to: '/pandit-portal/earnings',       label: 'Earnings',         icon: '💰' },
      { to: '/pandit-portal/reviews',        label: 'Reviews',          icon: '⭐' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/pandit-portal/verification',   label: 'Verification',     icon: '✅' },
      { to: '/pandit-portal/notifications',  label: 'Notifications',    icon: '🔔' },
    ],
  },
];

/* Mobile bottom nav shows 5 key items */
const BOTTOM_NAV = [
  { to: '/pandit-portal',           label: 'Home',      icon: '🏠', end: true },
  { to: '/pandit-portal/requests',  label: 'Requests',  icon: '📬' },
  { to: '/pandit-portal/bookings',  label: 'Bookings',  icon: '📋' },
  { to: '/pandit-portal/earnings',  label: 'Earnings',  icon: '💰' },
  { to: '/pandit-portal/profile',   label: 'Profile',   icon: '👤' },
];

function CompletionBar({ percent }) {
  const color = percent >= 80 ? '#22c55e' : percent >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ padding: '10px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: 5 }}>
        <span>Profile completion</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function Sidebar({ user, logout, completion }) {
  const navigate = useNavigate();
  return (
    <aside className="pp-sidebar">
      {/* Logo */}
      <div className="pp-sidebar__logo">
        <span style={{ fontSize: '1.4rem' }}>🕉️</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 700, fontSize: '0.95rem' }}>
            PanditJi
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Pandit Portal
          </div>
        </div>
      </div>

      {/* Provider identity */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🙏</div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
              {user?.profile?.firstName || 'Pandit'} {user?.profile?.lastName || ''}
            </div>
            <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)' }}>
              {user?.contact?.phone || user?.contact?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Profile completion */}
      <CompletionBar percent={completion?.percent || 0} />

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div style={{ padding: '12px 16px 4px', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>
              {section}
            </div>
            {items.map(({ to, label, icon, end }) => (
              <NavLink
                key={to} to={to} end={end}
                className={({ isActive }) => `pp-nav-link${isActive ? ' active' : ''}`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Link to="/" style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: 8 }}>
          ← Customer site
        </Link>
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,80,80,0.65)', fontSize: '0.78rem', padding: 0, fontFamily: 'var(--font-ui)' }}
        >
          ↩ Sign out
        </button>
      </div>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav className="pp-bottom-nav">
      {BOTTOM_NAV.map(({ to, label, icon, end }) => (
        <NavLink
          key={to} to={to} end={end}
          className={({ isActive }) => `pp-bottom-nav__item${isActive ? ' active' : ''}`}
        >
          <span className="pp-bottom-nav__icon">{icon}</span>
          <span className="pp-bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* ── Inner layout — reads from PanditPortalContext ── */
function PortalInner() {
  const { user: authUser, loading: authLoading, logout } = useAuth();
  const { completion, loading } = usePanditPortal();

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🕉️</div>
          <div style={{ fontFamily: 'var(--font-ui)', color: '#aaa', fontSize: '0.9rem' }}>Loading your portal…</div>
        </div>
      </div>
    );
  }

  /* Not authenticated → login */
  if (!authUser) return <Navigate to="/pandit-portal/login" replace />;

  /* Wrong role → request role upgrade page */
  if (!['PROVIDER', 'ADMIN'].includes(authUser.userType)) {
    return <Navigate to="/pandit-portal/become" replace />;
  }

  return (
    <div className="pp-layout">
      <Sidebar user={authUser} logout={logout} completion={completion} />
      <div className="pp-main">
        <Outlet />
        <div style={{ height: 80 }} /* bottom nav spacer on mobile */ />
      </div>
      <BottomNav />
    </div>
  );
}

/* ── Exported layout wraps PortalInner in the context provider ── */
export default function PanditPortalLayout() {
  return (
    <PanditPortalProvider>
      <PortalInner />
    </PanditPortalProvider>
  );
}
