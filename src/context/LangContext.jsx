/**
 * LangContext — English / Marathi language toggle for the whole app.
 *
 * Usage:
 *   const { t, lang, setLang } = useLang();
 *   t('nav.browse')  →  "Browse" | "ब्राउझ करा"
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

/* ── Translation dictionary ── */
const TRANSLATIONS = {
  en: {
    /* ── Navbar ── */
    'nav.browse':        'Browse',
    'nav.pandits':       'Pandits',
    'nav.search':        'Search',
    'nav.tellUs':        '💬 Tell Us What You Need',
    'nav.signIn':        'Sign In',
    'nav.signOut':       'Sign Out',
    'nav.admin':         '⚙️ Admin',
    'nav.myPortal':      '🙏 My Portal',
    'nav.register':      'Register',
    'nav.selectLoc':     'Select location',
    'nav.detecting':     'Detecting…',
    'lang.toggle':       'मराठी',

    /* ── Auth Modal ── */
    'auth.welcomeBack':  'Welcome back',
    'auth.createAcc':    'Create account',
    'auth.signInSub':    'Sign in to book your ceremony',
    'auth.registerSub':  'Join the platform in seconds',
    'auth.firstName':    'First name',
    'auth.lastName':     'Last name',
    'auth.phone':        'Phone number',
    'auth.email':        'Email (optional)',
    'auth.password':     'Password',
    'auth.signIn':       'Sign In',
    'auth.createBtn':    'Create Account',
    'auth.waiting':      'Please wait…',
    'auth.noAcc':        "Don't have an account? ",
    'auth.haveAcc':      'Already have an account? ',
    'auth.err.emailInvalid':   'Please enter a valid email address.',
    'auth.err.phoneTooShort':  'Phone number must be at least 7 digits.',
    'auth.err.required':       'Please fill in all required fields.',

    /* ── Booking / Payment ── */
    'payment.title':          'Payment',
    'payment.method':         'Payment Method',
    'payment.cash':           'Cash',
    'payment.cashNote':       'Pay directly to the Pandit on the day of the ceremony.',
    'payment.upi':            'UPI',
    'payment.card':           'Card',
    'payment.netBanking':     'Net Banking',
    'payment.comingSoon':     'Coming Soon',
    'payment.comingSoonMsg':  '🚀 Online payments are on their way! For now, please use Cash and settle directly with the Pandit.',
    'payment.secure':         '✓ Secure booking · No hidden charges · Refundable if Pandit cancels',
    'payment.payBtn':         'Confirm Booking',

    /* ── Location ── */
    'loc.setLocation':    'Set your location',
    'loc.searchHint':     'Search city or area…',
    'loc.useMyLoc':       '📍 Use my current location',
    'loc.allow':          'Allow location access?',
    'loc.allowBody':      'Your location helps us find Pandits who serve your area.',
    'loc.useLocation':    'Use my location',
    'loc.enterManually':  'Enter manually',
    'loc.detected':       'We detected your location as:',
    'loc.correct':        'Yes, this is correct',
    'loc.change':         'Change location',
    'loc.denied':         'Location access is turned off in your browser.',
    'loc.deniedHint':     'To enable: open browser settings → Site permissions → Allow location for this site.',
    'loc.enterManualBtn': 'Enter location manually',
    'loc.searchCity':     'Search for your city or area:',
    'loc.current':        'Current: ',
    'loc.noResults':      'No locations found for ',

    /* ── Home ── */
    'home.hero1':         'Find the right Pandit,',
    'home.hero2':         'for every sacred moment.',
    'home.heroCta':       '💬 Tell Us What You Need',
    'home.heroSearch':    'Or search directly',
    'home.popular':       'Popular Services',
    'home.browse':        'Browse All Services',
    'home.pandits':       'Top-Rated Pandits',
    'home.viewAll':       'View All Pandits',
  },

  mr: {
    /* ── Navbar ── */
    'nav.browse':        'ब्राउझ करा',
    'nav.pandits':       'पंडित',
    'nav.search':        'शोधा',
    'nav.tellUs':        '💬 आम्हाला सांगा',
    'nav.signIn':        'साइन इन',
    'nav.signOut':       'साइन आउट',
    'nav.admin':         '⚙️ प्रशासक',
    'nav.myPortal':      '🙏 माझा पोर्टल',
    'nav.register':      'नोंदणी करा',
    'nav.selectLoc':     'स्थान निवडा',
    'nav.detecting':     'शोधत आहे…',
    'lang.toggle':       'English',

    /* ── Auth Modal ── */
    'auth.welcomeBack':  'पुन्हा स्वागत आहे',
    'auth.createAcc':    'खाते तयार करा',
    'auth.signInSub':    'आपली पूजा बुक करण्यासाठी साइन इन करा',
    'auth.registerSub':  'काही सेकंदात प्लॅटफॉर्मवर सामील व्हा',
    'auth.firstName':    'पहिले नाव',
    'auth.lastName':     'आडनाव',
    'auth.phone':        'फोन नंबर',
    'auth.email':        'ईमेल (ऐच्छिक)',
    'auth.password':     'पासवर्ड',
    'auth.signIn':       'साइन इन करा',
    'auth.createBtn':    'खाते तयार करा',
    'auth.waiting':      'कृपया थांबा…',
    'auth.noAcc':        'खाते नाही? ',
    'auth.haveAcc':      'आधीच खाते आहे? ',
    'auth.err.emailInvalid':   'कृपया वैध ईमेल पत्ता प्रविष्ट करा.',
    'auth.err.phoneTooShort':  'फोन नंबर किमान ७ अंकी असावा.',
    'auth.err.required':       'कृपया सर्व आवश्यक माहिती भरा.',

    /* ── Booking / Payment ── */
    'payment.title':          'पेमेंट',
    'payment.method':         'पेमेंट पद्धत',
    'payment.cash':           'रोख',
    'payment.cashNote':       'समारंभाच्या दिवशी थेट पंडितांना द्या.',
    'payment.upi':            'UPI',
    'payment.card':           'कार्ड',
    'payment.netBanking':     'नेट बँकिंग',
    'payment.comingSoon':     'लवकरच येणार',
    'payment.comingSoonMsg':  '🚀 ऑनलाइन पेमेंट लवकरच उपलब्ध होईल! सध्या रोख पेमेंट वापरा.',
    'payment.secure':         '✓ सुरक्षित बुकिंग · कोणतेही छुपे शुल्क नाही · पंडित रद्द केल्यास परतावा मिळेल',
    'payment.payBtn':         'बुकिंग निश्चित करा',

    /* ── Location ── */
    'loc.setLocation':    'आपले स्थान सेट करा',
    'loc.searchHint':     'शहर किंवा भाग शोधा…',
    'loc.useMyLoc':       '📍 माझे सध्याचे स्थान वापरा',
    'loc.allow':          'स्थान प्रवेश द्यायचा का?',
    'loc.allowBody':      'आपले स्थान आम्हाला तुमच्या क्षेत्रातील पंडित शोधण्यास मदत करते.',
    'loc.useLocation':    'माझे स्थान वापरा',
    'loc.enterManually':  'स्वतः टाका',
    'loc.detected':       'आम्ही आपले स्थान शोधले:',
    'loc.correct':        'हो, हे बरोबर आहे',
    'loc.change':         'स्थान बदला',
    'loc.denied':         'आपल्या ब्राउझरमध्ये स्थान प्रवेश बंद आहे.',
    'loc.deniedHint':     'सक्षम करण्यासाठी: ब्राउझर सेटिंग्ज → साइट परवानग्या → स्थान परवानगी द्या.',
    'loc.enterManualBtn': 'स्थान स्वतः टाका',
    'loc.searchCity':     'आपले शहर किंवा भाग शोधा:',
    'loc.current':        'सध्याचे: ',
    'loc.noResults':      'यासाठी कोणतेही स्थान सापडले नाही: ',

    /* ── Home ── */
    'home.hero1':         'योग्य पंडित शोधा,',
    'home.hero2':         'प्रत्येक पवित्र क्षणासाठी.',
    'home.heroCta':       '💬 आम्हाला सांगा',
    'home.heroSearch':    'किंवा थेट शोधा',
    'home.popular':       'लोकप्रिय सेवा',
    'home.browse':        'सर्व सेवा पाहा',
    'home.pandits':       'शीर्ष-रेटेड पंडित',
    'home.viewAll':       'सर्व पंडित पाहा',
  },
};

/* ── Context ── */
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('pj_lang') || 'en'; } catch { return 'en'; }
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('pj_lang', l); } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'mr' : 'en');
  }, [lang, setLang]);

  /** t(key) — look up translation, fallback to English, fallback to key */
  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

export default LangContext;
