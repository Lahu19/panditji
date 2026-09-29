/**
 * PanditBecome — shown when a logged-in CUSTOMER tries to access the Pandit Portal.
 * Explains the distinction and offers two clear paths:
 *   1. Register a new PROVIDER account
 *   2. Go back to the customer site
 *
 * Route: /pandit-portal/become
 * Also used as the fallback redirect from PanditPortalLayout when
 * userType is not PROVIDER or ADMIN.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PanditBecome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  /* If already a provider, go straight to the portal */
  if (user && ['PROVIDER', 'ADMIN'].includes(user?.userType)) {
    navigate('/pandit-portal', { replace: true });
    return null;
  }

  const handleLogoutAndRegister = async () => {
    setBusy(true);
    logout();
    navigate('/pandit-portal/login', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, maxWidth: 560,
        width: '100%', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      }}>
        {/* Header band */}
        <div style={{
          background: 'linear-gradient(135deg, #fff8ee, #fffdf7)',
          borderBottom: '1px solid #f0e8d0',
          padding: '32px 40px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🕉️</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: '1.5rem',
            color: 'var(--text-dark)', marginBottom: 6,
          }}>
            Pandit Portal
          </div>
          <div style={{ fontSize: '0.88rem', color: '#888' }}>
            This portal is for Pandits and religious service providers
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '32px 40px' }}>
          {user && (
            <div style={{
              background: '#fdf8ee', border: '1px solid #f0e8d0',
              borderRadius: 12, padding: '12px 16px', marginBottom: 24,
              fontSize: '0.84rem', color: '#7a5c1e',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span>👤</span>
              <span>
                You are logged in as <strong>{user.profile?.firstName || user.contact?.email}</strong> (customer account).
                The Pandit Portal requires a separate provider account.
              </span>
            </div>
          )}

          {/* Two portals explanation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
            {[
              {
                icon: '🛕',
                title: 'Customer Portal',
                desc: 'Find Pandits, book ceremonies, make payments, write reviews.',
                link: '/',
                linkLabel: '← Go to customer site',
                active: true,
              },
              {
                icon: '🙏',
                title: 'Pandit Portal',
                desc: 'Register as a Pandit, manage bookings, set availability, view earnings.',
                link: null,
                linkLabel: 'Register as Pandit →',
                active: false,
              },
            ].map(({ icon, title, desc, link, linkLabel, active }) => (
              <div key={title} style={{
                padding: '18px 16px',
                border: `2px solid ${active ? '#e8e4da' : 'var(--saffron)'}`,
                borderRadius: 14,
                background: active ? '#fafaf8' : '#fff8f0',
              }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: 6,
                }}>
                  {title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#888', lineHeight: 1.5, marginBottom: 12 }}>
                  {desc}
                </div>
                {link
                  ? <Link to={link} style={{ fontSize: '0.8rem', color: '#666', textDecoration: 'none', fontWeight: 600 }}>{linkLabel}</Link>
                  : <span style={{ fontSize: '0.8rem', color: 'var(--saffron)', fontWeight: 600 }}>{linkLabel}</span>
                }
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {user ? (
              <>
                <button
                  onClick={handleLogoutAndRegister}
                  disabled={busy}
                  className="pp-btn pp-btn--primary pp-btn--full"
                  style={{ fontSize: '0.95rem', padding: '13px' }}
                >
                  {busy ? 'Please wait…' : '🙏 Register a Pandit Account'}
                </button>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#aaa' }}>
                  This will sign you out of your customer account first.
                </div>
                <Link
                  to="/"
                  className="pp-btn pp-btn--ghost pp-btn--full"
                  style={{ textAlign: 'center', fontSize: '0.88rem' }}
                >
                  ← Back to customer site
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/pandit-portal/login"
                  className="pp-btn pp-btn--primary pp-btn--full"
                  style={{ textAlign: 'center', fontSize: '0.95rem', padding: '13px' }}
                >
                  🙏 Sign In or Register as Pandit
                </Link>
                <Link
                  to="/"
                  className="pp-btn pp-btn--ghost pp-btn--full"
                  style={{ textAlign: 'center', fontSize: '0.88rem' }}
                >
                  ← Back to customer site
                </Link>
              </>
            )}
          </div>

          {/* Fine print */}
          <div style={{
            marginTop: 24, padding: '14px 16px',
            background: '#f9f9f9', borderRadius: 10,
            fontSize: '0.78rem', color: '#aaa', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#888' }}>Why separate accounts?</strong>
            {' '}Customer and provider accounts have different roles, permissions, and dashboards.
            You can have both — just register with a different email address for your provider account.
          </div>
        </div>
      </div>
    </div>
  );
}
