/**
 * AdminLayout — sidebar + topbar shell that wraps all admin pages.
 * Redirects to "/" if the logged-in user is not ADMIN.
 */
import React from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV = [
  {
    section: 'Overview',
    items: [
      { to: '/admin',           label: 'Dashboard',        icon: '📊', end: true },
    ],
  },
  {
    section: 'People',
    items: [
      { to: '/admin/users',     label: 'Users',            icon: '👥' },
      { to: '/admin/providers', label: 'Providers',        icon: '🙏' },
    ],
  },
  {
    section: 'Services',
    items: [
      { to: '/admin/services',  label: 'Services',         icon: '🛕' },
      { to: '/admin/locations', label: 'Locations',        icon: '📍' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { to: '/admin/requests',  label: 'Service Requests', icon: '📋' },
      { to: '/admin/bookings',  label: 'Bookings',         icon: '📅' },
      { to: '/admin/payments',  label: 'Payments',         icon: '💰' },
    ],
  },
  {
    section: 'Quality',
    items: [
      { to: '/admin/reviews',   label: 'Reviews',          icon: '⭐' },
      { to: '/admin/audit',     label: 'Audit Logs',       icon: '🔍' },
    ],
  },
];

function Sidebar({ user, logout }) {
  const navigate = useNavigate();
  return (
    <aside className="admin-sidebar">
      <NavLink to="/admin" className="admin-sidebar__logo" style={{ textDecoration: 'none' }}>
        <span style={{ fontSize: '1.4rem' }}>🕉️</span>
        <div>
          <div className="admin-sidebar__logo-text">PanditJi</div>
          <div className="admin-sidebar__logo-sub">Admin Panel</div>
        </div>
      </NavLink>

      <nav className="admin-sidebar__nav">
        {NAV.map(({ section, items }) => (
          <div key={section} className="admin-sidebar__section">
            <div className="admin-sidebar__section-label">{section}</div>
            {items.map(({ to, label, icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `admin-nav-link${isActive ? ' active' : ''}`
                }
              >
                <span>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>
          {user?.profile?.firstName || 'Admin'}
        </div>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="admin-nav-link"
          style={{ color: 'rgba(255,80,80,0.7)', padding: '6px 0' }}
        >
          ↩ Sign Out
        </button>
        <NavLink
          to="/"
          className="admin-nav-link"
          style={{ color: 'rgba(255,255,255,0.35)', padding: '4px 0', fontSize: '0.75rem' }}
        >
          ← Back to site
        </NavLink>
      </div>
    </aside>
  );
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();

  if (loading) return (
    <div className="admin-loading" style={{ height: '100vh' }}>
      <div className="admin-loading__spinner" />
      Loading…
    </div>
  );

  if (!user || user.userType !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="admin-layout">
      <Sidebar user={user} logout={logout} />
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <span className="admin-topbar__title">PanditJi Admin</span>
          <div className="admin-topbar__right">
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              {user.profile?.firstName} {user.profile?.lastName}
            </span>
            <span
              style={{
                background: '#dcfce7', color: '#16a34a',
                fontSize: '0.68rem', fontWeight: 700,
                padding: '3px 8px', borderRadius: 20,
              }}
            >
              ADMIN
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
