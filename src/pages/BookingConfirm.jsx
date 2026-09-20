import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { providersApi, bookingsApi, paymentsApi, servicesApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import AuthModal from '../components/AuthModal.jsx';
import { PANDITS as STATIC_PANDITS } from '../data/services';

const PAYMENT_METHODS = [
  { id: 'UPI',         label: 'UPI',         icon: '📱' },
  { id: 'CARD',        label: 'Card',         icon: '💳' },
  { id: 'NET_BANKING', label: 'Net Banking',  icon: '🏦' },
];

export default function BookingConfirm() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { state }    = useLocation();
  const { user }     = useAuth();

  const req = state?.req || null;

  const [pandit,      setPandit]      = useState(null);
  const [loadingP,    setLoadingP]    = useState(true);
  const [step,        setStep]        = useState(0);
  const [form,        setForm]        = useState({ name: user?.profile?.displayName || '', phone: user?.contact?.phone || '', address: '', notes: '' });
  const [panditCount, setPanditCount] = useState(req?.providerCount || 1);
  const [payMethod,   setPayMethod]   = useState('UPI');
  const [upiId,       setUpiId]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [bookingId,   setBookingId]   = useState(null);
  const [bookingRef,  setBookingRef]  = useState(null);  // local ID for confirmed screen
  const [showAuth,    setShowAuth]    = useState(false);
  const [error,       setError]       = useState('');

  /* Prefill form from user context when they log in */
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:  f.name  || user.profile?.displayName || user.profile?.firstName || '',
        phone: f.phone || user.contact?.phone || '',
      }));
    }
  }, [user]);

  /* Load provider */
  useEffect(() => {
    async function load() {
      setLoadingP(true);
      const isObjectId = /^[a-f\d]{24}$/i.test(id);
      try {
        if (!isObjectId) throw new Error('not an ObjectId — use static');
        const { provider } = await providersApi.get(id);
        setPandit(provider);
      } catch {
        const staticP = STATIC_PANDITS.find(p => p.id === id);
        if (staticP) setPandit(_normStatic(staticP));
      } finally {
        setLoadingP(false);
      }
    }
    load();
  }, [id]);

  if (loadingP) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ fontSize: '2rem' }}>🕉️</motion.div>
    </div>
  );

  if (!pandit) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', color: 'var(--text-light)' }}>
      Pandit not found. <Link to="/" style={{ color: 'var(--saffron)', marginLeft: 8 }}>Go Home</Link>
    </div>
  );

  const priceBreakdown = {
    pandit:   pandit.pricing?.breakdown?.pandit   || pandit.pricing?.startingFrom || pandit.priceBreakdown?.pandit   || 1500,
    samagri:  pandit.pricing?.breakdown?.samagri  || pandit.priceBreakdown?.samagri  || 0,
    travel:   pandit.pricing?.breakdown?.travel   || pandit.priceBreakdown?.travel   || 0,
    platform: pandit.pricing?.breakdown?.platform || pandit.priceBreakdown?.platform || 100,
  };
  const total      = Object.values(priceBreakdown).reduce((a, b) => a + b, 0);
  const grandTotal = total * panditCount;

  async function handleConfirmPayment() {
    if (!user) { setShowAuth(true); return; }
    setLoading(true);
    setError('');
    try {
      /* 1. Create booking */
      const pricingItems = [
        { itemType: 'PANDIT_FEE',   label: 'Pandit service fee',  quantity: panditCount, unitPrice: priceBreakdown.pandit,   totalPrice: priceBreakdown.pandit * panditCount },
        { itemType: 'SAMAGRI',      label: 'Samagri',             quantity: 1, unitPrice: priceBreakdown.samagri,  totalPrice: priceBreakdown.samagri },
        { itemType: 'TRAVEL',       label: 'Travel charges',       quantity: 1, unitPrice: priceBreakdown.travel,   totalPrice: priceBreakdown.travel },
        { itemType: 'PLATFORM_FEE', label: 'Platform fee',         quantity: 1, unitPrice: priceBreakdown.platform, totalPrice: priceBreakdown.platform },
      ].filter(i => i.totalPrice > 0);

      const { booking } = await bookingsApi.create({
        primaryProviderId:   pandit._id || pandit.id,
        serviceId:           req?.serviceId || (pandit.serviceIds?.[0]?._id || pandit.serviceIds?.[0]),
        requestId:           req?.requestId,
        panditCount,
        event: {
          date:      req?.date !== '—' ? req?.date : undefined,
          startTime: req?.time !== '—' ? req?.time : undefined,
          location:  { addressLine1: form.address, city: '', country: 'IN' },
        },
        customerDetails: { name: form.name, phone: form.phone, address: form.address, notes: form.notes },
        requirementsSnapshot: req || {},
        pricingSnapshot: {
          items:    pricingItems,
          subtotal: grandTotal,
          discount: 0,
          total:    grandTotal,
          currency: 'INR',
          panditCount,
        },
      });

      setBookingId(booking._id);

      /* 2. Initiate payment */
      const { payment } = await paymentsApi.create({
        bookingId: booking._id,
        method:    payMethod,
      });

      /* 3. Confirm payment (simulated) */
      await paymentsApi.confirm(payment._id, { gatewayPaymentId: 'SIM_' + Date.now() });

      /* 4. Save to localStorage for home page recent bookings */
      const localBooking = {
        id:         booking._id,
        panditId:   pandit._id || pandit.id,
        panditName: pandit.displayName || pandit.name,
        service:    req?.service || 'Religious Service',
        date:       req?.date   || 'As confirmed',
        amount:     grandTotal,
        panditCount,
        address:    form.address,
        confirmedAt: new Date().toISOString(),
      };
      try {
        const existing = JSON.parse(localStorage.getItem('pj_bookings') || '[]');
        localStorage.setItem('pj_bookings', JSON.stringify([localBooking, ...existing].slice(0, 10)));
      } catch (_) {}

      setBookingRef('PJ-' + booking._id.toString().slice(-6).toUpperCase());
      setStep(2);
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const pName = pandit.displayName || pandit.name;
  const field = (label, key, placeholder, type = 'text') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6, letterSpacing: '0.04em' }}>{label}</label>
      {type === 'textarea'
        ? <textarea className="input-field" rows={3} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />
        : <input type={type} className="input-field" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} />}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }} />
      <MandalaDecor size={300} opacity={0.04} style={{ top: 0, right: -60, animation: 'spin-slow 60s linear infinite' }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 24px 80px', position: 'relative', zIndex: 1 }}>
        {step < 2 && (
          <button onClick={() => step === 0 ? navigate(-1) : setStep(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-light)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', marginBottom: 28 }}>
            <ArrowLeft size={15} /> Back
          </button>
        )}

        {step < 2 && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
            {['Your Details', 'Payment', 'Confirmed'].map((l, i) => (
              <div key={l} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? 'var(--gold)' : i === step ? 'var(--saffron)' : 'rgba(212,175,55,0.18)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 0: Details */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <RangoliDivider label="Booking" />
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: 12, marginBottom: 24 }}>
                Confirm Your Booking
              </h1>

              {/* Auth nudge if not signed in */}
              {!user && (
                <div style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--text-mid)' }}>
                    Sign in to save your booking and get updates
                  </div>
                  <button onClick={() => setShowAuth(true)} className="btn-primary" style={{ fontSize: '0.8rem', padding: '8px 16px' }}>Sign In</button>
                </div>
              )}

              {/* Pandit summary */}
              <div style={{ background: 'var(--grad-hero)', borderRadius: 16, padding: '20px 22px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--grad-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🙏</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'white', fontSize: '1rem' }}>{pName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: 3, fontFamily: 'var(--font-ui)' }}>
                    {req?.service || 'Religious Service'} · {req?.date || 'Date TBD'}
                  </div>
                  <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--gold-light)', fontSize: '1.1rem' }}>₹{total.toLocaleString()}</div>
                </div>
              </div>

              {req && (
                <div style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Your requirement</div>
                  {[
                    { label: 'Service',  val: req.service },
                    { label: 'Date',     val: req.date },
                    { label: 'Time',     val: req.time },
                    { label: 'Language', val: req.language },
                    { label: 'Samagri',  val: req.samagri },
                  ].filter(r => r.val && r.val !== '—').map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(212,175,55,0.1)', fontFamily: 'var(--font-ui)', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-light)' }}>{label}</span>
                      <span style={{ color: 'var(--text-dark)', fontWeight: 500 }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 16 }}>Your Details</h2>
              {field('Full Name *',         'name',    'Your full name')}
              {field('Phone Number *',      'phone',   '+91 XXXXX XXXXX', 'tel')}
              {field('Ceremony Address *',  'address', 'Full address for the ceremony')}

              {/* Number of Pandits stepper */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-mid)', marginBottom: 8, letterSpacing: '0.04em' }}>
                  Number of Pandits Required
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1.5px solid var(--border-gold)', borderRadius: 12, overflow: 'hidden', width: 'fit-content' }}>
                  <button onClick={() => setPanditCount(c => Math.max(1, c - 1))}
                    style={{ width: 44, height: 44, background: 'var(--parchment)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border-gold)' }}>
                    −
                  </button>
                  <div style={{ width: 56, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', background: 'white' }}>
                    {panditCount}
                  </div>
                  <button onClick={() => setPanditCount(c => Math.min(10, c + 1))}
                    style={{ width: 44, height: 44, background: 'var(--parchment)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-gold)' }}>
                    +
                  </button>
                </div>
                {panditCount > 1 && (
                  <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-ui)' }}>
                    ₹{total.toLocaleString()} × {panditCount} = <strong style={{ color: 'var(--saffron)' }}>₹{grandTotal.toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {field('Special Notes', 'notes', 'Any specific requests or information for the Pandit…', 'textarea')}

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: '0.95rem', padding: '16px' }}
                disabled={!form.name || !form.phone || !form.address}
                onClick={() => setStep(1)}>
                Continue to Payment →
              </button>
            </motion.div>
          )}

          {/* Step 1: Payment */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <RangoliDivider label="Payment" />
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: 12, marginBottom: 24 }}>Payment</h1>

              <div style={{ background: 'white', border: '1px solid var(--border-gold)', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
                {[
                  { item: 'Pandit service fee',    amt: priceBreakdown.pandit   * panditCount },
                  { item: 'Samagri',               amt: priceBreakdown.samagri },
                  { item: 'Travel charges',         amt: priceBreakdown.travel },
                  { item: 'Platform fee',           amt: priceBreakdown.platform },
                ].map(({ item, amt }) => (
                  <div key={item} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(212,175,55,0.1)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-mid)' }}>{item}</span>
                    <span style={{ color: amt === 0 ? 'var(--text-light)' : 'var(--text-dark)', fontWeight: amt > 0 ? 600 : 400 }}>
                      {amt === 0 ? 'Included' : `₹${amt.toLocaleString()}`}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--saffron)' }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: 14 }}>Payment Method</h2>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    style={{ flex: 1, padding: '12px 8px', background: payMethod === m.id ? 'var(--saffron-pale)' : 'white', border: payMethod === m.id ? '2px solid var(--saffron)' : '1.5px solid var(--border-gold)', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: payMethod === m.id ? 'var(--saffron)' : 'var(--text-dark)', fontWeight: payMethod === m.id ? 600 : 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: '1.2rem' }}>{m.icon}</span>{m.label}
                  </button>
                ))}
              </div>

              {payMethod === 'UPI' && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 }}>UPI ID</label>
                  <input className="input-field" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="yourname@upi" />
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(204,35,30,0.08)', border: '1px solid rgba(204,35,30,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: '#cc231e' }}>
                  {error}
                </div>
              )}

              <div style={{ background: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.78rem', fontFamily: 'var(--font-ui)', color: '#2e7d32' }}>
                ✓ Secure payment · No hidden charges · Refundable if Pandit cancels
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '16px' }}
                onClick={handleConfirmPayment} disabled={loading}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite', display: 'inline-block' }} />
                    Processing…
                  </span>
                ) : `Pay ₹${grandTotal.toLocaleString()} & Confirm`}
              </button>
            </motion.div>
          )}

          {/* Step 2: Confirmed */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 180 }}>
              <div style={{ position: 'relative', textAlign: 'center', padding: '40px 0' }}>
                <MandalaDecor size={280} opacity={0.12} style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} style={{ fontSize: '4rem', marginBottom: 16, position: 'relative', zIndex: 1 }}>🎊</motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ position: 'relative', zIndex: 1 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem,4vw,2.2rem)', fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>Booking Confirmed!</h1>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--text-light)', fontStyle: 'italic' }}>Your ceremony is all set. Namaste 🙏</p>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ background: 'var(--grad-hero)', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 14 }}>Booking Confirmation</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Booking ID</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 16, letterSpacing: '0.08em' }}>{bookingRef}</div>
                <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Pandit',   val: pName },
                    { label: 'Service',  val: req?.service || 'Religious Service' },
                    { label: 'Date',     val: req?.date || 'As confirmed' },
                    { label: 'Pandits',  val: `${panditCount} Pandit${panditCount > 1 ? 's' : ''}` },
                    { label: 'Amount',   val: `₹${grandTotal.toLocaleString()}` },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                      <span style={{ color: 'white', fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <div style={{ background: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.15)', borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
                  {['Confirmation saved to your account', `${pName} has been notified`, 'You can contact them through the platform', 'Payment secured — refundable on Pandit cancellation'].map(item => (
                    <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', fontFamily: 'var(--font-ui)', color: '#2e7d32', marginBottom: 6 }}>
                      <CheckCircle size={14} />{item}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link to="/" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>🏠 Home</Link>
                  <Link to={`/pandit/${pandit._id || pandit.id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center', textAlign: 'center' }}>View Pandit Profile</Link>
                </div>
                <div style={{ marginTop: 24, textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                  ॐ तत् सत् — May your ceremony be auspicious
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => { setShowAuth(false); handleConfirmPayment(); }}
        />
      )}
    </div>
  );
}

function _normStatic(sp) {
  return {
    _id: sp.id, id: sp.id,
    displayName: sp.name,
    name: sp.name,
    pricing: {
      startingFrom: sp.priceRange?.[0],
      breakdown: sp.priceBreakdown || { pandit: 1500, samagri: 0, travel: 0, platform: 100 },
    },
    serviceIds: sp.services || [],
    priceBreakdown: sp.priceBreakdown || { pandit: 1500, samagri: 0, travel: 0, platform: 100 },
  };
}
