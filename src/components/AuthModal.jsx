import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode,   setMode]   = useState('login'); // 'login' | 'register'
  const [form,   setForm]   = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [error,  setError]  = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = mode === 'login'
      ? await login({ phone: form.phone || undefined, email: form.email || undefined, password: form.password })
      : await register({ firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined, email: form.email || undefined, password: form.password });

    setLoading(false);
    if (result.success) {
      onSuccess?.(result.user);
      onClose?.();
    } else {
      setError(result.error || 'Something went wrong');
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid var(--border-gold)',
    fontFamily: 'var(--font-ui)', fontSize: '0.92rem',
    background: 'white', color: 'var(--text-dark)',
    outline: 'none', marginBottom: 12,
    boxSizing: 'border-box',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(26,5,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          style={{ background: 'white', borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={20} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🕉️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-dark)' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4 }}>
              {mode === 'login' ? 'Sign in to book your ceremony' : 'Join the platform in seconds'}
            </p>
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0 }}>
                <input style={inputStyle} placeholder="First name" value={form.firstName} onChange={set('firstName')} required />
                <input style={inputStyle} placeholder="Last name"  value={form.lastName}  onChange={set('lastName')} />
              </div>
            )}
            <input style={inputStyle} type="tel"      placeholder="Phone number"   value={form.phone}    onChange={set('phone')} />
            <input style={inputStyle} type="email"    placeholder="Email (optional)" value={form.email}  onChange={set('email')} />
            <input style={inputStyle} type="password" placeholder="Password"       value={form.password} onChange={set('password')} required minLength={6} />

            {error && (
              <div style={{ background: 'rgba(204,35,30,0.08)', border: '1px solid rgba(204,35,30,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#cc231e' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '14px', marginTop: 4 }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-light)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.82rem' }}>
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
