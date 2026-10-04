import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLang } from '../context/LangContext.jsx';

/* ── Validation helpers ── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DIGITS_ONLY = (str) => str.replace(/\D/g, '');

function validate(mode, form, t) {
  const errs = {};

  if (mode === 'register') {
    if (!form.firstName.trim()) errs.firstName = t('auth.err.required');
  }

  /* At least one of phone/email is required */
  const hasPhone = form.phone.trim().length > 0;
  const hasEmail = form.email.trim().length > 0;

  if (!hasPhone && !hasEmail) {
    errs.contact = t('auth.err.required');
  }

  if (hasEmail && !EMAIL_REGEX.test(form.email.trim())) {
    errs.email = t('auth.err.emailInvalid');
  }

  if (hasPhone && DIGITS_ONLY(form.phone).length < 7) {
    errs.phone = t('auth.err.phoneTooShort');
  }

  if (!form.password) {
    errs.password = t('auth.err.required');
  } else if (form.password.length < 6) {
    errs.password = 'Password must be at least 6 characters.';
  }

  return errs;
}

export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const { t } = useLang();

  const [mode,   setMode]   = useState('login'); // 'login' | 'register'
  const [form,   setForm]   = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    /* Clear field-level error on type */
    setErrors(prev => { const n = { ...prev }; delete n[k]; delete n.contact; return n; });
  };

  async function submit(e) {
    e.preventDefault();
    setApiErr('');

    const errs = validate(mode, form, t);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);

    const result = mode === 'login'
      ? await login({
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          password: form.password,
        })
      : await register({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          phone:     form.phone.trim() || undefined,
          email:     form.email.trim() || undefined,
          password:  form.password,
        });

    setLoading(false);
    if (result.success) {
      onSuccess?.(result.user);
      onClose?.();
    } else {
      setApiErr(result.error || 'Something went wrong');
    }
  }

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1.5px solid ${hasErr ? '#cc231e' : 'var(--border-gold)'}`,
    fontFamily: 'var(--font-ui)', fontSize: '0.92rem',
    background: 'white', color: 'var(--text-dark)',
    outline: 'none', marginBottom: hasErr ? 4 : 12,
    boxSizing: 'border-box',
  });

  const errText = (msg) => msg ? (
    <div style={{ fontSize: '0.76rem', color: '#cc231e', marginBottom: 10, fontFamily: 'var(--font-ui)', paddingLeft: 2 }}>
      {msg}
    </div>
  ) : null;

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
              {mode === 'login' ? t('auth.welcomeBack') : t('auth.createAcc')}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4 }}>
              {mode === 'login' ? t('auth.signInSub') : t('auth.registerSub')}
            </p>
          </div>

          <form onSubmit={submit} noValidate>
            {mode === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0 }}>
                <div>
                  <input
                    style={inputStyle(errors.firstName)}
                    placeholder={t('auth.firstName') + ' *'}
                    value={form.firstName}
                    onChange={set('firstName')}
                  />
                  {errText(errors.firstName)}
                </div>
                <div>
                  <input
                    style={inputStyle(false)}
                    placeholder={t('auth.lastName')}
                    value={form.lastName}
                    onChange={set('lastName')}
                  />
                </div>
              </div>
            )}

            {/* Contact hint */}
            {errors.contact && (
              <div style={{ fontSize: '0.76rem', color: '#cc231e', marginBottom: 8, fontFamily: 'var(--font-ui)', paddingLeft: 2 }}>
                {errors.contact}
              </div>
            )}

            {/* Phone */}
            <input
              style={inputStyle(errors.phone)}
              type="tel"
              placeholder={t('auth.phone')}
              value={form.phone}
              onChange={set('phone')}
              inputMode="numeric"
            />
            {errText(errors.phone)}

            {/* Email */}
            <input
              style={inputStyle(errors.email)}
              type="email"
              placeholder={t('auth.email')}
              value={form.email}
              onChange={set('email')}
            />
            {errText(errors.email)}

            {/* Password */}
            <input
              style={inputStyle(errors.password)}
              type="password"
              placeholder={t('auth.password') + ' *'}
              value={form.password}
              onChange={set('password')}
            />
            {errText(errors.password)}

            {apiErr && (
              <div style={{ background: 'rgba(204,35,30,0.08)', border: '1px solid rgba(204,35,30,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#cc231e' }}>
                {apiErr}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '14px', marginTop: 4 }}>
              {loading ? t('auth.waiting') : mode === 'login' ? t('auth.signIn') : t('auth.createBtn')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--text-light)' }}>
            {mode === 'login' ? t('auth.noAcc') : t('auth.haveAcc')}
            <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setErrors({}); setApiErr(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.82rem' }}>
              {mode === 'login' ? t('nav.register') : t('auth.signIn')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
