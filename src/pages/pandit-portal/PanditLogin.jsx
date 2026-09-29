/**
 * PanditLogin — entry point for the Pandit Portal.
 * Combines login + "become a provider" in one page.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PanditLogin() {
  const { login, register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode,    setMode]    = useState('login'); // 'login' | 'register'
  const [form,    setForm]    = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);

  /* If already logged in as PROVIDER go to portal */
  if (!loading && user && ['PROVIDER', 'ADMIN'].includes(user.userType)) {
    navigate('/pandit-portal', { replace: true });
    return null;
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (mode === 'login') {
        const res = await login({ phone: form.phone, email: form.email, password: form.password });
        if (!res.success) throw new Error(res.error);
        if (!['PROVIDER', 'ADMIN'].includes(res.user?.userType)) {
          throw new Error('This account is not registered as a Pandit. Please use the customer portal or register as a Pandit below.');
        }
      } else {
        const res = await register({
          firstName: form.firstName,
          lastName:  form.lastName,
          phone:     form.phone,
          email:     form.email,
          password:  form.password,
          userType:  'PROVIDER',
        });
        if (!res.success) throw new Error(res.error);
      }
      navigate('/pandit-portal', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pp-login">
      <div className="pp-login__card">
        {/* Logo */}
        <div className="pp-login__logo">
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🕉️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color: 'var(--gold)' }}>PanditJi</div>
          <div style={{ fontSize: '0.78rem', color: '#aaa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Pandit Portal</div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="pp-login__title">
            {mode === 'login' ? 'Welcome back 🙏' : 'Join as a Pandit'}
          </div>
          <div className="pp-login__sub">
            {mode === 'login'
              ? 'Sign in to manage your bookings and profile'
              : 'Connect with customers seeking trusted religious services'}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: '#f4f1eb', borderRadius: 10, padding: 3, marginBottom: 24 }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: '0.84rem', fontWeight: 600,
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? 'var(--saffron)' : '#888',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="pp-label">First Name</label>
                <input className="pp-input" value={form.firstName} onChange={e => set('firstName', e.target.value)} required placeholder="Rajesh" />
              </div>
              <div>
                <label className="pp-label">Last Name</label>
                <input className="pp-input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Sharma" />
              </div>
            </div>
          )}

          <div>
            <label className="pp-label">Mobile Number</label>
            <input className="pp-input" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
          </div>

          <div>
            <label className="pp-label">Email {mode === 'register' ? '(optional)' : '(or use mobile)'}</label>
            <input className="pp-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="pandit@example.com" />
          </div>

          <div>
            <label className="pp-label">Password</label>
            <input className="pp-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="••••••••" />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: '0.84rem', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="pp-btn pp-btn--primary pp-btn--full" style={{ marginTop: 4 }}>
            {busy ? 'Please wait…' : mode === 'login' ? '→ Sign In' : '→ Create Account'}
          </button>
        </form>

        {/* Customer site link */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem', color: '#aaa' }}>
          Looking for puja services?{' '}
          <Link to="/" style={{ color: 'var(--saffron)', fontWeight: 600 }}>
            Visit customer site →
          </Link>
        </div>
      </div>
    </div>
  );
}
