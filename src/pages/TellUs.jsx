import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Edit3, CheckCircle, ChevronRight, Send } from 'lucide-react';
import MandalaDecor, { RangoliDivider } from '../components/MandalaDecor';
import { PANDITS, CATEGORIES } from '../data/services';
import { serviceRequestsApi, matchesApi } from '../api/index.js';

/* ══════════════════════════════════════════
   INTENT DETECTION
══════════════════════════════════════════ */
const INTENT_MAP = [
  { keywords: ['griha','pravesh','new home','new house','shift','mov','ghar','naya ghar'], service:'Griha Pravesh',        category:'Home & Property', icon:'🏠', id:'griha-pravesh' },
  { keywords: ['satyanarayan','satyanarayana'],                                            service:'Satyanarayan Puja',    category:'Home & Property', icon:'🪔', id:'satyanarayan' },
  { keywords: ['vastu'],                                                                   service:'Vastu Puja',           category:'Home & Property', icon:'🧭', id:'vastu-puja' },
  { keywords: ['bhoomi','bhumi','ground breaking'],                                        service:'Bhoomi Pujan',         category:'Home & Property', icon:'🌱', id:'bhoomi-pujan' },
  { keywords: ['wedding','vivah','shaadi','marriage','bride','groom','shadi'],             service:'Wedding Ceremony',     category:'Wedding',          icon:'💍', id:'wedding-ceremony' },
  { keywords: ['engagement','sagai','sagai'],                                              service:'Engagement Ceremony',  category:'Wedding',          icon:'💍', id:'engagement' },
  { keywords: ['naamkaran','naming ceremony','baby name','newborn'],                       service:'Naamkaran',            category:'Family',           icon:'👶', id:'naamkaran' },
  { keywords: ['mundan','haircut ceremony'],                                               service:'Mundan Ceremony',      category:'Family',           icon:'👶', id:'mundan' },
  { keywords: ['upanayan','janeu','yagnopavit','thread ceremony'],                        service:'Upanayan',             category:'Family',           icon:'🕉️', id:'upanayan' },
  { keywords: ['havan','hawan'],                                                           service:'Havan',                category:'Havan & Yagna',    icon:'🔥', id:'havan' },
  { keywords: ['yagna','yagya'],                                                           service:'Yagna',                category:'Havan & Yagna',    icon:'🔥', id:'yagna' },
  { keywords: ['navgraha','navagraha'],                                                    service:'Navgraha Puja',        category:'Havan & Yagna',    icon:'⭐', id:'navgraha' },
  { keywords: ['rudrabhishek','shiva abhishek','rudra'],                                  service:'Rudrabhishek',         category:'Havan & Yagna',    icon:'🕉️', id:'rudrabhishek' },
  { keywords: ['ganesh','ganapati','ganesha'],                                             service:'Ganesh Puja',          category:'Festival',         icon:'🐘', id:'ganesh-chaturthi' },
  { keywords: ['lakshmi','laxmi'],                                                         service:'Lakshmi Puja',         category:'Festival',         icon:'🪔', id:'lakshmi-puja' },
  { keywords: ['diwali','deepawali'],                                                      service:'Diwali Puja',          category:'Festival',         icon:'🪔', id:'diwali-puja' },
  { keywords: ['navratri','durga'],                                                        service:'Navratri Puja',        category:'Festival',         icon:'🪔', id:'navratri' },
  { keywords: ['office','company','corporate','factory','inaug','opening new'],            service:'Office Inauguration',  category:'Corporate',        icon:'🏢', id:'office-inaug' },
];

/* Suggestion groups shown when user says "I don't know" */
const DISCOVERY_GROUPS = [
  { label:'New Home / Property',  icon:'🏠', services:['Griha Pravesh','Vastu Puja','Bhoomi Pujan'],          path:'home' },
  { label:'Wedding',              icon:'💍', services:['Wedding Ceremony','Engagement','Pre-Wedding Rituals'],  path:'wedding' },
  { label:'Family Ceremony',      icon:'👶', services:['Naamkaran','Mundan','Upanayan'],                         path:'family' },
  { label:'Festival / Daily Puja',icon:'🪔', services:['Ganesh Puja','Lakshmi Puja','Diwali Puja'],             path:'festival' },
  { label:'Havan / Yagna',        icon:'🔥', services:['Havan','Yagna','Navgraha Puja'],                         path:'havan' },
  { label:'Corporate Event',      icon:'🏢', services:['Office Inauguration','Bhoomi Pujan','Corporate Puja'],   path:'corporate' },
];

function detectIntent(text) {
  const lower = text.toLowerCase();
  for (const e of INTENT_MAP) if (e.keywords.some(k => lower.includes(k))) return e;
  return null;
}

function extractDetails(text) {
  const lower = text.toLowerCase();
  const d = {};
  if      (lower.includes('marathi'))  d.language = 'Marathi';
  else if (lower.includes('hindi'))    d.language = 'Hindi';
  else if (lower.includes('english'))  d.language = 'English';
  else if (lower.includes('sanskrit')) d.language = 'Sanskrit';
  if (lower.includes('samagri') || lower.includes('saman') || lower.includes('material'))
    d.samagri = 'Yes, Pandit should arrange it';
  if      (lower.includes('today'))    d.dateHint = 'Today';
  else if (lower.includes('tomorrow')) d.dateHint = 'Tomorrow';
  else if (lower.includes('sunday'))   d.dateHint = 'This Sunday';
  else if (lower.includes('saturday')) d.dateHint = 'This Saturday';
  const m = lower.match(/(\d+)\s*(pandit|brahmin|priest)/);
  if (m) d.providerCount = parseInt(m[1]);
  return d;
}

const QUESTIONS = [
  { id:'date',     icon:'📅', q:'When would you like the ceremony?',           type:'chips', chips:['This Sunday','Next Sunday','Tomorrow','In a week','Pick a date'] },
  { id:'time',     icon:'⏰', q:'What time would you prefer?',                  type:'chips', chips:['6–8 AM','8–10 AM','10 AM–12 PM','Afternoon','Evening','Flexible'] },
  { id:'samagri',  icon:'🧺', q:'Should the Pandit arrange the Puja Samagri?',  type:'chips', chips:['Yes, Pandit arranges','No, I will arrange','Full package'] },
  { id:'language', icon:'🗣️', q:'Language preference?',                          type:'chips', chips:['Hindi','Marathi','Sanskrit','English','No preference'] },
  { id:'budget',   icon:'💰', q:'Approximate budget?',                           type:'chips', chips:['Under ₹1,500','₹1,500–₹3,000','₹3,000–₹5,000','₹5,000+','No preference'] },
];

/* ── Bubble helpers ── */
const BOT  = 'bot';
const USER = 'user';

/**
 * Converts a small subset of Markdown to React nodes inline:
 *   **bold**  →  <strong>bold</strong>
 *   *italic*  →  <em>italic</em>
 *   `code`    →  <code>code</code>
 * No external dependency needed.
 */
function renderMarkdown(text) {
  if (!text) return null;
  // Split on **, *, ` keeping delimiters
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background:'rgba(255,107,0,0.08)', borderRadius:4, padding:'1px 5px', fontSize:'0.9em', fontFamily:'monospace' }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

function BubbleBot({ text, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity:0, x:-16, scale:0.96 }}
      animate={{ opacity:1, x:0,   scale:1 }}
      transition={{ delay, duration:0.35, ease:'easeOut' }}
      style={{ display:'flex', gap:10, alignItems:'flex-end', marginBottom:12, maxWidth:'85%' }}
    >
      <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--grad-saffron)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0,boxShadow:'0 2px 8px rgba(255,107,0,0.3)' }}>
        🪔
      </div>
      <div style={{ background:'white',border:'1px solid var(--border-gold)',borderRadius:'18px 18px 18px 4px',padding:'12px 16px',boxShadow:'var(--shadow-card)' }}>
        {text && <p style={{ fontFamily:'var(--font-body)',fontSize:'0.97rem',color:'var(--text-dark)',margin:0,lineHeight:1.6 }}>{renderMarkdown(text)}</p>}
        {children}
      </div>
    </motion.div>
  );
}

function BubbleUser({ text }) {
  return (
    <motion.div
      initial={{ opacity:0, x:16 }}
      animate={{ opacity:1, x:0 }}
      transition={{ duration:0.3 }}
      style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}
    >
      <div style={{ background:'var(--grad-saffron)',borderRadius:'18px 18px 4px 18px',padding:'12px 16px',maxWidth:'80%',boxShadow:'0 2px 12px rgba(255,107,0,0.25)' }}>
        <p style={{ fontFamily:'var(--font-ui)',fontSize:'0.92rem',color:'white',margin:0,lineHeight:1.5 }}>{text}</p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity:0,x:-12 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0 }}
      style={{ display:'flex',gap:10,alignItems:'flex-end',marginBottom:12 }}>
      <div style={{ width:32,height:32,borderRadius:'50%',background:'var(--grad-saffron)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',flexShrink:0 }}>🪔</div>
      <div style={{ background:'white',border:'1px solid var(--border-gold)',borderRadius:'18px 18px 18px 4px',padding:'12px 16px',boxShadow:'var(--shadow-card)' }}>
        <div style={{ display:'flex',gap:5,alignItems:'center' }}>
          {[0,1,2].map(i=>(
            <motion.div key={i} animate={{ y:[0,-5,0] }} transition={{ repeat:Infinity,duration:0.8,delay:i*0.15 }}
              style={{ width:7,height:7,borderRadius:'50%',background:'var(--saffron)',opacity:0.7 }}/>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Match result card ── */
function ResultCard({ pandit, req, onView, onBook }) {
  const lang  = req.language;
  const items = [
    { label:'Service',  ok: pandit.services.includes(req.serviceId) || req.serviceId==='custom' },
    { label:'Language', ok: !lang || lang==='No preference' || pandit.languages.includes(lang) },
    { label:'Samagri',  ok: req.samagri?.startsWith('Yes') ? pandit.samagriAvailable : true },
    { label:'Location', ok: true },
    { label:'Budget',   ok: true },
  ];
  const matched = items.filter(x=>x.ok).length;
  return (
    <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
      style={{ background:'white',border:'1px solid var(--border-gold)',borderRadius:16,padding:'20px',borderTop:'3px solid var(--gold)',marginBottom:14 }}>
      <div style={{ display:'flex',gap:12,alignItems:'flex-start',marginBottom:12 }}>
        <div style={{ width:46,height:46,borderRadius:'50%',background:'var(--grad-saffron)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0 }}>🙏</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.93rem',color:'var(--text-dark)' }}>{pandit.name}</div>
          <div style={{ fontSize:'0.72rem',color:'var(--text-light)',marginTop:2 }}>📍 {pandit.location} · {pandit.experience} yrs</div>
          <div style={{ display:'flex',gap:4,marginTop:5,flexWrap:'wrap' }}>
            {pandit.languages.map(l=><span key={l} className="tag" style={{fontSize:'0.6rem'}}>🗣 {l}</span>)}
            {pandit.verified&&<span className="verified" style={{fontSize:'0.6rem'}}>✓ Verified</span>}
          </div>
        </div>
        <div style={{ textAlign:'right',flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1rem',color:'var(--saffron)' }}>₹{pandit.priceRange[0].toLocaleString()}</div>
          <div style={{ fontSize:'0.6rem',color:'var(--text-light)' }}>starting</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:14,marginBottom:12,fontSize:'0.75rem',color:'var(--text-light)',fontFamily:'var(--font-ui)' }}>
        <span><span className="stars" style={{fontSize:'0.72rem'}}>{'★'.repeat(Math.floor(pandit.rating))}</span> {pandit.rating} ({pandit.reviews})</span>
        <span>🎥 {pandit.videos.length} videos</span>
        <span>📋 {pandit.bookings} bookings</span>
      </div>
      <div style={{ background:'rgba(46,125,50,0.05)',border:'1px solid rgba(46,125,50,0.15)',borderRadius:8,padding:'10px 12px',marginBottom:12 }}>
        <div style={{ fontSize:'0.65rem',fontFamily:'var(--font-display)',fontWeight:600,color:'#2e7d32',marginBottom:6,letterSpacing:'0.05em' }}>
          WHY THIS MATCH — {matched}/{items.length} requirements met
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 0' }}>
          {items.map(({label,ok})=>(
            <div key={label} style={{ display:'flex',alignItems:'center',gap:5,fontSize:'0.74rem',color:'var(--text-mid)',fontFamily:'var(--font-ui)' }}>
              <span style={{ color:ok?'#2e7d32':'#cc231e',fontWeight:700,fontSize:'0.8rem' }}>{ok?'✓':'✗'}</span>{label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <button onClick={()=>onView(pandit.id)} className="btn-secondary" style={{ flex:1,justifyContent:'center',padding:'9px 10px',fontSize:'0.77rem' }}>View Profile</button>
        <button onClick={()=>onBook(pandit.id)} className="btn-primary"   style={{ flex:1,justifyContent:'center',padding:'9px 10px',fontSize:'0.77rem' }}>Book Now</button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function TellUs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* mode: 'tell' | 'decide' */
  const initialMode = searchParams.get('mode') === 'decide' ? 'decide' : 'tell';

  /* ── State ── */
  const [mode, setMode]           = useState(initialMode);  // 'tell' | 'decide'
  const [phase, setPhase]         = useState('entry');       // entry | chat | loading | results
  const [inputText, setInputText] = useState('');
  const [bubbles, setBubbles]     = useState([]);            // {id, role, text, node}
  const [typing, setTyping]       = useState(false);
  const [intent, setIntent]       = useState(null);
  const [extracted, setExtracted] = useState({});
  const [answers, setAnswers]     = useState({});
  const [qIdx, setQIdx]           = useState(0);             // current question index
  const [chatDone, setChatDone]   = useState(false);
  const [customDate, setCustomDate] = useState('');

  /* "decide" mode state */
  const [decideStep, setDecideStep] = useState(0); // 0=pick group, 1=pick service
  const [decideGroup, setDecideGroup] = useState(null);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  /* Scroll to bottom after every bubble */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [bubbles, typing]);

  /* Auto-focus input when chat is active */
  useEffect(() => {
    if (phase === 'chat') inputRef.current?.focus();
  }, [phase, qIdx]);

  /* ── Derived requirement ── */
  const req = {
    service:   intent?.service  || 'Custom Ceremony',
    serviceId: intent?.id       || 'custom',
    category:  intent?.category || 'Custom',
    icon:      intent?.icon     || '🕉️',
    date:      answers.date     || extracted.dateHint || '—',
    time:      answers.time     || '—',
    samagri:   answers.samagri  || (extracted.samagri ? 'Yes, Pandit should arrange it' : '—'),
    language:  answers.language || extracted.language || '—',
    budget:    answers.budget   || '—',
  };

  const matched = PANDITS.filter(p =>
    p.services.includes(req.serviceId) || req.serviceId === 'custom'
  );

  /* ── Bubble helper ── */
  const addBubble = useCallback((role, text, node = null) => {
    setBubbles(prev => [...prev, { id: Date.now() + Math.random(), role, text, node }]);
  }, []);

  const botSay = useCallback((text, delay = 600, node = null) => {
    setTyping(true);
    return new Promise(res => {
      setTimeout(() => {
        setTyping(false);
        setBubbles(prev => [...prev, { id: Date.now() + Math.random(), role: BOT, text, node }]);
        res();
      }, delay);
    });
  }, []);

  /* ── Start the "tell us" chat after user submits their first message ── */
  async function startChat(text) {
    const det = detectIntent(text);
    const ext = extractDetails(text);
    setIntent(det);
    setExtracted(ext);

    /* pre-fill answers from extracted details */
    const pre = {};
    if (ext.dateHint) pre.date     = ext.dateHint;
    if (ext.language) pre.language = ext.language;
    if (ext.samagri)  pre.samagri  = 'Yes, Pandit should arrange it';
    setAnswers(pre);

    setPhase('chat');

    /* Show user's message as first bubble */
    setBubbles([{ id: 1, role: USER, text }]);

    if (det) {
      /* Known intent */
      await botSay(`Got it! Sounds like you're looking for a **${det.service}**.`, 700);
      await botSay('Let me ask a few quick questions to find the right Pandit for you.', 400);
    } else {
      /* Unknown intent — offer suggestions */
      await botSay("I'm not sure which ceremony that is — let me show you some options.", 700);
      /* inject suggestion chips as a bot node */
      await botSay(null, 300, 'service-suggestions');
      return; /* wait for user to pick */
    }

    /* kick off first unanswered question */
    const firstUnanswered = QUESTIONS.findIndex(q => !pre[q.id]);
    if (firstUnanswered === -1) {
      goToSummary();
    } else {
      setQIdx(firstUnanswered);
      await botSay(QUESTIONS[firstUnanswered].q, 600);
    }
  }

  /* Called when user selects a service suggestion */
  async function pickSuggestion(entry) {
    setIntent(entry);
    addBubble(USER, entry.service);
    await botSay(`Perfect — **${entry.service}**. A few quick questions.`, 700);
    const firstUnanswered = QUESTIONS.findIndex(q => !answers[q.id]);
    setQIdx(firstUnanswered);
    await botSay(QUESTIONS[firstUnanswered].q, 600);
  }

  /* Called when user answers a question chip */
  async function answerQuestion(qId, val) {
    const next = { ...answers, [qId]: val };
    setAnswers(next);
    addBubble(USER, val);

    const nextQ = QUESTIONS.findIndex((q, i) => i > qIdx && !next[q.id]);
    if (nextQ === -1) {
      await botSay('Great — I have everything I need!', 500);
      goToSummary();
    } else {
      setQIdx(nextQ);
      await botSay(QUESTIONS[nextQ].q, 700);
    }
  }

  function goToSummary() {
    setChatDone(true);
  }

  function startSearch() {
    setPhase('loading');
    // Submit to real API, fall back to static on error
    async function doSearch() {
      try {
        const { request } = await serviceRequestsApi.create({
          source: 'NATURAL_LANGUAGE',
          rawInput: inputText,
          extractedRequirements: {
            serviceName:   req.service,
            serviceId:     req.serviceId,
            date:          req.date   !== '—' ? req.date   : undefined,
            time:          req.time   !== '—' ? req.time   : undefined,
            language:      req.language !== '—' ? req.language : undefined,
            samagri:       req.samagri  !== '—' ? req.samagri  : undefined,
            budget:        req.budget   !== '—' ? req.budget   : undefined,
          },
        });
        // Run matching engine
        try {
          await serviceRequestsApi.match(request._id);
        } catch (_) { /* matching failure is non-fatal */ }
      } catch (_) {
        /* API unavailable — static results shown anyway */
      }
      setPhase('results');
    }
    doSearch();
  }

  /* ── Current question chips node ── */
  function QuestionChips({ qId }) {
    const q = QUESTIONS.find(x => x.id === qId);
    if (!q || answers[qId]) return null;
    return (
      <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:8 }}>
        {q.chips.map(c => (
          <motion.button key={c} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
            onClick={() => {
              if (c === 'Pick a date') return; /* handled by date input */
              answerQuestion(qId, c);
            }}
            style={{ padding:'8px 14px',background:'var(--saffron-pale)',border:'1.5px solid rgba(255,107,0,0.25)',borderRadius:50,fontFamily:'var(--font-ui)',fontSize:'0.82rem',color:'var(--saffron)',cursor:'pointer',fontWeight:500,transition:'all 0.15s' }}>
            {c}
          </motion.button>
        ))}
        {q.type === 'chips' && qId === 'date' && (
          <input type="date" className="input-field" value={customDate}
            onChange={e => setCustomDate(e.target.value)}
            onBlur={e => { if (e.target.value) answerQuestion('date', e.target.value); }}
            style={{ fontSize:'0.82rem', padding:'7px 12px', borderRadius:50, maxWidth:160 }}
          />
        )}
      </div>
    );
  }

  /* ── Service suggestion chips ── */
  function ServiceSuggestions() {
    return (
      <div style={{ marginTop:8 }}>
        <div style={{ fontSize:'0.72rem',color:'var(--text-light)',fontFamily:'var(--font-ui)',marginBottom:8 }}>Which of these is closest?</div>
        {INTENT_MAP.slice(0,8).map(entry => (
          <motion.button key={entry.id} whileHover={{ x:4 }} onClick={() => pickSuggestion(entry)}
            style={{ display:'flex',alignItems:'center',gap:8,width:'100%',padding:'9px 12px',marginBottom:6,background:'white',border:'1.5px solid var(--border-gold)',borderRadius:10,cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:'0.83rem',color:'var(--text-dark)',transition:'all 0.15s',textAlign:'left' }}>
            <span>{entry.icon}</span>{entry.service}
            <span style={{ marginLeft:'auto',color:'var(--saffron)',fontSize:'0.75rem' }}>→</span>
          </motion.button>
        ))}
        <button onClick={() => navigate('/browse')}
          style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 12px',width:'100%',background:'none',border:'1.5px dashed var(--border-gold)',borderRadius:10,cursor:'pointer',fontFamily:'var(--font-ui)',fontSize:'0.82rem',color:'var(--text-light)',marginTop:4 }}>
          ❓ Something else → Browse all services
        </button>
      </div>
    );
  }

  /* ── Summary card ── */
  function SummaryCard() {
    return (
      <div style={{ marginTop:8 }}>
        <div style={{ background:'var(--grad-hero)',borderRadius:12,padding:'16px',marginBottom:10 }}>
          <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:10 }}>
            <span style={{ fontSize:'1.8rem' }}>{req.icon}</span>
            <div>
              <div style={{ fontFamily:'var(--font-display)',fontWeight:700,color:'white',fontSize:'0.95rem' }}>{req.service}</div>
              <div style={{ fontSize:'0.7rem',color:'var(--gold)',fontFamily:'var(--font-ui)' }}>{req.category}</div>
            </div>
          </div>
          {[
            {icon:'📅',label:'Date',    val:req.date},
            {icon:'⏰',label:'Time',    val:req.time},
            {icon:'🗣️',label:'Language',val:req.language},
            {icon:'🧺',label:'Samagri', val:req.samagri},
            {icon:'💰',label:'Budget',  val:req.budget},
          ].map(({icon,label,val})=>val&&val!=='—'&&(
            <div key={label} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(212,175,55,0.15)',fontFamily:'var(--font-ui)',fontSize:'0.78rem' }}>
              <span style={{ color:'rgba(255,255,255,0.6)' }}>{icon} {label}</span>
              <span style={{ color:'white',fontWeight:500 }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex',gap:8,marginTop:6 }}>
          <button onClick={()=>{ setChatDone(false); setQIdx(0); setAnswers({}); }}
            className="btn-secondary" style={{ flex:1,justifyContent:'center',fontSize:'0.78rem',padding:'9px 10px' }}>
            <Edit3 size={12}/> Edit
          </button>
          <button onClick={startSearch}
            className="btn-primary" style={{ flex:2,justifyContent:'center',fontSize:'0.82rem',padding:'9px 14px' }}>
            🔍 Find Pandits
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     DECIDE MODE — "Help me decide"
  ══════════════════════════════════════════ */
  function DecideFlow() {
    return (
      <div style={{ maxWidth:600, margin:'0 auto', padding:'36px 24px 80px', position:'relative', zIndex:1 }}>
        <button onClick={()=>setMode('tell')}
          style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:'var(--text-light)',fontFamily:'var(--font-ui)',fontSize:'0.88rem',marginBottom:28 }}>
          <ArrowLeft size={15}/> Back
        </button>

        <div style={{ textAlign:'center', marginBottom:36 }}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}}
            style={{ fontSize:'3rem', marginBottom:16 }}>🤔</motion.div>
          <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(1.4rem,4vw,2rem)',fontWeight:700,color:'var(--text-dark)',marginBottom:10 }}>
            Help Me Decide
          </h1>
          <p style={{ fontFamily:'var(--font-body)',fontSize:'1.05rem',color:'var(--text-light)',fontStyle:'italic',lineHeight:1.6 }}>
            Tell us what's happening — we'll suggest the right Puja
          </p>
        </div>

        <AnimatePresence mode="wait">
          {decideStep === 0 && (
            <motion.div key="step0" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}>
              <div style={{ fontFamily:'var(--font-display)',fontSize:'0.7rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--gold)',marginBottom:14 }}>
                ✦ What's the occasion?
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {DISCOVERY_GROUPS.map(g => (
                  <motion.button key={g.path} whileHover={{x:4,background:'var(--saffron-pale)'}}
                    onClick={()=>{ setDecideGroup(g); setDecideStep(1); }}
                    style={{ display:'flex',alignItems:'center',gap:14,padding:'16px 18px',background:'white',border:'1.5px solid var(--border-gold)',borderRadius:12,cursor:'pointer',textAlign:'left',transition:'all 0.15s' }}>
                    <span style={{ fontSize:'1.6rem',flexShrink:0 }}>{g.icon}</span>
                    <div>
                      <div style={{ fontFamily:'var(--font-display)',fontSize:'0.9rem',fontWeight:600,color:'var(--text-dark)',marginBottom:3 }}>{g.label}</div>
                      <div style={{ fontSize:'0.72rem',color:'var(--text-light)',fontFamily:'var(--font-ui)' }}>{g.services.join(' • ')}</div>
                    </div>
                    <ChevronRight size={16} style={{ marginLeft:'auto',color:'var(--text-light)',flexShrink:0 }}/>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {decideStep === 1 && decideGroup && (
            <motion.div key="step1" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}}>
              <button onClick={()=>setDecideStep(0)}
                style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:'var(--text-light)',fontFamily:'var(--font-ui)',fontSize:'0.85rem',marginBottom:20 }}>
                <ArrowLeft size={14}/> Back
              </button>

              <div style={{ background:'var(--grad-hero)',borderRadius:14,padding:'20px',marginBottom:20,display:'flex',gap:12,alignItems:'center' }}>
                <span style={{ fontSize:'2rem' }}>{decideGroup.icon}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-display)',fontWeight:700,color:'white',fontSize:'1rem' }}>{decideGroup.label}</div>
                  <div style={{ fontSize:'0.75rem',color:'rgba(255,255,255,0.6)',fontFamily:'var(--font-body)',fontStyle:'italic',marginTop:3 }}>
                    Here are the common ceremonies for this occasion
                  </div>
                </div>
              </div>

              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {CATEGORIES.find(c=>c.id===decideGroup.path)?.services.slice(0,5).map(s => {
                  const entry = INTENT_MAP.find(e=>e.id===s.id) || { service:s.name,icon:'🕉️',id:s.id,category:decideGroup.label };
                  return (
                    <motion.button key={s.id} whileHover={{x:4,background:'var(--saffron-pale)'}}
                      onClick={()=>{
                        setMode('tell');
                        setIntent(entry);
                        setPhase('chat');
                        setBubbles([{ id:Date.now(), role:BOT, text:`Great choice — **${entry.service}**. Let me ask a few quick questions.` }]);
                        const first = QUESTIONS.findIndex(q=>!answers[q.id]);
                        setQIdx(first);
                        setTimeout(()=>{ setBubbles(prev=>[...prev,{ id:Date.now()+1, role:BOT, text:QUESTIONS[first].q }]); }, 900);
                      }}
                      style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'white',border:'1.5px solid var(--border-gold)',borderRadius:12,cursor:'pointer',textAlign:'left',transition:'all 0.15s' }}>
                      <span style={{ fontSize:'1.3rem' }}>{entry.icon||'🕉️'}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'var(--font-display)',fontSize:'0.88rem',fontWeight:600,color:'var(--text-dark)' }}>{s.name}</div>
                        <div style={{ fontSize:'0.7rem',color:'var(--text-light)',fontFamily:'var(--font-ui)',marginTop:2 }}>⏱ {s.duration} · From ₹{s.from.toLocaleString()}</div>
                      </div>
                      <ChevronRight size={15} style={{ color:'var(--text-light)',flexShrink:0 }}/>
                    </motion.button>
                  );
                })}
              </div>

              <div style={{ marginTop:16,padding:'14px 18px',background:'var(--parchment)',border:'1px dashed var(--border-gold)',borderRadius:10 }}>
                <div style={{ fontFamily:'var(--font-body)',fontSize:'0.9rem',color:'var(--text-light)',fontStyle:'italic',marginBottom:8 }}>
                  Not sure which one? Just describe your situation.
                </div>
                <button className="btn-primary" style={{ fontSize:'0.8rem',padding:'10px 18px' }}
                  onClick={()=>{setMode('tell');setPhase('entry');}}>
                  💬 Tell us in your own words
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     ENTRY SCREEN
  ══════════════════════════════════════════ */
  function EntryScreen() {
    const [text, setText] = useState('');
    const ref = useRef(null);
    useEffect(() => { ref.current?.focus(); }, []);

    function submit() {
      if (!text.trim()) return;
      setInputText(text);
      startChat(text);
    }

    return (
      <div style={{ maxWidth:600, margin:'0 auto', padding:'36px 24px 80px', position:'relative', zIndex:1 }}>
        <button onClick={()=>navigate(-1)}
          style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:'var(--text-light)',fontFamily:'var(--font-ui)',fontSize:'0.88rem',marginBottom:28 }}>
          <ArrowLeft size={15}/> Home
        </button>

        {/* Mode toggle */}
        <div style={{ display:'flex',gap:8,marginBottom:28 }}>
          {[{id:'tell',label:'💬 Tell Us What You Need'},{id:'decide',label:'🤔 Help Me Decide'}].map(m=>(
            <button key={m.id} onClick={()=>m.id==='decide'?setMode('decide'):null}
              style={{ flex:1,padding:'11px 10px',background:mode===m.id?'var(--saffron)':'white',color:mode===m.id?'white':'var(--text-light)',border:mode===m.id?'none':'1.5px solid var(--border-gold)',borderRadius:50,fontFamily:'var(--font-display)',fontSize:'0.75rem',fontWeight:600,letterSpacing:'0.04em',cursor:'pointer',transition:'all 0.2s' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ textAlign:'center',marginBottom:32 }}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}}
            style={{ fontSize:'3rem',marginBottom:14 }}>🪔</motion.div>
          <h1 style={{ fontFamily:'var(--font-display)',fontSize:'clamp(1.4rem,4vw,2rem)',fontWeight:700,color:'var(--text-dark)',marginBottom:10 }}>
            Tell Us What You Need
          </h1>
          <p style={{ fontFamily:'var(--font-body)',fontSize:'1.05rem',color:'var(--text-light)',fontStyle:'italic',maxWidth:440,margin:'0 auto',lineHeight:1.6 }}>
            Describe your event naturally. You don't need to know the exact Puja name.
          </p>
        </div>

        {/* Example prompts */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:'0.68rem',fontFamily:'var(--font-display)',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--gold)',marginBottom:10 }}>
            ✦ Try something like
          </div>
          {[
            'We are shifting to our new home next Sunday, need a Marathi-speaking Pandit with Samagri.',
            'Need a Pandit for Havan tomorrow evening around 5 PM.',
            "I don't know which Puja to do — we just bought a new house.",
          ].map((ex,i)=>(
            <motion.button key={i} whileHover={{x:4}} onClick={()=>setText(ex)}
              style={{ display:'block',width:'100%',textAlign:'left',background:'none',border:'none',padding:'8px 0',fontFamily:'var(--font-body)',fontSize:'0.93rem',color:'var(--text-light)',cursor:'pointer',fontStyle:'italic',borderBottom:'1px dashed rgba(212,175,55,0.2)',transition:'color 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--saffron)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--text-light)'}>
              "{ex}"
            </motion.button>
          ))}
        </div>

        {/* Input */}
        <div style={{ position:'relative' }}>
          <textarea ref={ref} className="input-field" value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) submit(); }}
            placeholder="Describe your ceremony or event here…"
            rows={4} style={{ marginBottom:14,fontSize:'1rem',lineHeight:1.7,paddingRight:52 }}/>
          <button onClick={submit} disabled={!text.trim()}
            style={{ position:'absolute',bottom:26,right:14,width:38,height:38,borderRadius:'50%',background:text.trim()?'var(--saffron)':'rgba(212,175,55,0.2)',border:'none',cursor:text.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',transition:'background 0.2s' }}>
            <Send size={15} style={{ color:'white' }}/>
          </button>
        </div>

        <div style={{ display:'flex',justifyContent:'flex-end' }}>
          <button className="btn-primary" onClick={submit} disabled={!text.trim()} style={{ opacity:text.trim()?1:0.5 }}>
            Continue <ArrowRight size={15}/>
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     CHAT SCREEN
  ══════════════════════════════════════════ */
  function ChatScreen() {
    const [localInput, setLocalInput] = useState('');

    function sendFreeText() {
      if (!localInput.trim()) return;
      /* Only meaningful for custom/unknown intent where user types freely */
      answerQuestion(QUESTIONS[qIdx]?.id, localInput.trim());
      setLocalInput('');
    }

    /* which question is currently "live" (last unanswered) */
    const liveQId = chatDone ? null : QUESTIONS[qIdx]?.id;

    return (
      <div style={{ display:'flex',flexDirection:'column',height:'calc(100vh - 64px)',position:'relative' }}>
        {/* Header */}
        <div style={{ background:'white',borderBottom:'1px solid var(--border-gold)',padding:'14px 20px',display:'flex',alignItems:'center',gap:12,flexShrink:0,zIndex:2 }}>
          <button onClick={()=>{setPhase('entry');setBubbles([]);setChatDone(false);setAnswers({});setIntent(null);setExtracted({});}}
            style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-light)',display:'flex',alignItems:'center',gap:5,fontFamily:'var(--font-ui)',fontSize:'0.85rem' }}>
            <ArrowLeft size={15}/> Back
          </button>
          <div style={{ flex:1,textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)',fontSize:'0.85rem',fontWeight:700,color:'var(--text-dark)' }}>
              {req.service !== 'Custom Ceremony' ? req.service : 'Finding your Puja'}
            </div>
            <div style={{ fontSize:'0.62rem',color:'var(--text-light)',fontFamily:'var(--font-ui)' }}>
              {chatDone ? 'Ready to find Pandits' : `Question ${Math.min(qIdx+1,QUESTIONS.length)} of ${QUESTIONS.length}`}
            </div>
          </div>
          <div style={{ width:36 }}/>
        </div>

        {/* Bubble stream */}
        <div style={{ flex:1,overflowY:'auto',padding:'20px 16px',background:'var(--cream)' }}>
          <AnimatePresence>
            {bubbles.map(b => (
              b.role === USER
                ? <BubbleUser  key={b.id} text={b.text}/>
                : <BubbleBot   key={b.id} text={b.text}>
                    {b.node === 'service-suggestions' && <ServiceSuggestions/>}
                    {b.node === 'question-chips' && liveQId && <QuestionChips qId={liveQId}/>}
                  </BubbleBot>
            ))}

            {/* Floating question chips below the last bot bubble */}
            {!typing && !chatDone && liveQId && bubbles.length > 0 && bubbles[bubbles.length-1].role===BOT && !bubbles[bubbles.length-1].node && (
              <motion.div key={`chips-${liveQId}`} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}
                style={{ paddingLeft:42,marginBottom:12 }}>
                <QuestionChips qId={liveQId}/>
              </motion.div>
            )}

            {typing && <TypingIndicator key="typing"/>}

            {/* Summary card once all questions answered */}
            {chatDone && !typing && (
              <BubbleBot key="summary" text="Here's your complete requirement — does this look right?">
                <SummaryCard/>
              </BubbleBot>
            )}
          </AnimatePresence>
          <div ref={bottomRef}/>
        </div>

        {/* Text input bar (for free-text answers) */}
        {!chatDone && (
          <div style={{ background:'white',borderTop:'1px solid var(--border-gold)',padding:'12px 16px',display:'flex',gap:8,flexShrink:0 }}>
            <input className="input-field" ref={inputRef}
              value={localInput} onChange={e=>setLocalInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') sendFreeText(); }}
              placeholder="Or type your answer…"
              style={{ flex:1,fontSize:'0.9rem',padding:'10px 14px',borderRadius:50 }}/>
            <button onClick={sendFreeText} disabled={!localInput.trim()}
              style={{ width:42,height:42,borderRadius:'50%',background:localInput.trim()?'var(--saffron)':'rgba(212,175,55,0.2)',border:'none',cursor:localInput.trim()?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background 0.2s' }}>
              <Send size={16} style={{ color:'white' }}/>
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════
     LOADING SCREEN
  ══════════════════════════════════════════ */
  function LoadingScreen() {
    const steps = [
      'Analysing your requirement…',
      'Checking Pandit availability…',
      'Matching service experience…',
      'Applying your preferences…',
      `Found ${matched.length} suitable Pandits!`,
    ];
    const [stepIdx, setStepIdx] = useState(0);

    useEffect(() => {
      let i = 0;
      const t = setInterval(() => {
        i++;
        setStepIdx(i);
        if (i >= steps.length - 1) clearInterval(t);
      }, 420);
      return () => clearInterval(t);
    }, []);

    return (
      <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--grad-hero)',position:'relative',overflow:'hidden' }}>
        <MandalaDecor size={400} opacity={0.08} style={{ top:'50%',left:'50%',transform:'translate(-50%,-50%)',animation:'spin-slow 20s linear infinite' }}/>
        <div style={{ position:'relative',zIndex:1,textAlign:'center',padding:'0 24px' }}>
          <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity,duration:3,ease:'linear' }}
            style={{ fontSize:'4rem',marginBottom:24,display:'block' }}>🕉️</motion.div>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:700,color:'white',marginBottom:32 }}>
            Finding Your Pandits
          </h2>
          <div style={{ display:'flex',flexDirection:'column',gap:10,minWidth:280 }}>
            {steps.map((s,i)=>(
              <motion.div key={s}
                initial={{ opacity:0,x:-20 }}
                animate={{ opacity:i<=stepIdx?1:0.2, x:0 }}
                transition={{ delay:i*0.08,duration:0.3 }}
                style={{ display:'flex',alignItems:'center',gap:10,fontFamily:'var(--font-ui)',fontSize:'0.88rem',color: i<=stepIdx?'white':'rgba(255,255,255,0.3)' }}>
                <span style={{ fontSize:'0.9rem' }}>
                  {i < stepIdx ? '✓' : i === stepIdx ? '◦' : '·'}
                </span>
                {s}
              </motion.div>
            ))}
          </div>
          <div style={{ marginTop:32,display:'flex',gap:8,justifyContent:'center' }}>
            {[0,1,2,3].map(i=>(
              <motion.div key={i} animate={{ scale:[1,1.4,1] }} transition={{ repeat:Infinity,duration:1,delay:i*0.2 }}
                style={{ width:8,height:8,borderRadius:'50%',background:'var(--gold)',opacity:0.7 }}/>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     RESULTS SCREEN
  ══════════════════════════════════════════ */
  function ResultsScreen() {
    return (
      <div style={{ maxWidth:640,margin:'0 auto',padding:'36px 24px 80px',position:'relative',zIndex:1 }}>
        <button onClick={()=>setPhase('chat')}
          style={{ background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:'var(--text-light)',fontFamily:'var(--font-ui)',fontSize:'0.88rem',marginBottom:24 }}>
          <ArrowLeft size={15}/> Modify
        </button>

        <div style={{ textAlign:'center',marginBottom:24 }}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:200}}
            style={{ fontSize:'3rem',marginBottom:12 }}>🎯</motion.div>
          <h2 style={{ fontFamily:'var(--font-display)',fontSize:'1.6rem',fontWeight:700,color:'var(--text-dark)',marginBottom:6 }}>
            {matched.length > 0 ? `${matched.length} Pandits Available` : 'No Exact Matches'}
          </h2>
          <p style={{ fontFamily:'var(--font-body)',color:'var(--text-light)',fontStyle:'italic',fontSize:'0.95rem' }}>
            {req.service} · {req.date} · {req.language !== '—' ? req.language : 'Any language'}
          </p>
          <RangoliDivider/>
        </div>

        {/* Requirement summary chip row */}
        <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginBottom:20 }}>
          {[
            req.service&&{icon:'🪔',val:req.service},
            req.date!=='—'&&{icon:'📅',val:req.date},
            req.time!=='—'&&{icon:'⏰',val:req.time},
            req.language!=='—'&&{icon:'🗣️',val:req.language},
            req.samagri!=='—'&&{icon:'🧺',val:'Samagri'},
            req.budget!=='—'&&{icon:'💰',val:req.budget},
          ].filter(Boolean).map(({icon,val})=>(
            <span key={val} className="tag" style={{ fontSize:'0.72rem' }}>{icon} {val}</span>
          ))}
        </div>

        {matched.length > 0 ? (
          <div>
            {matched.map(p=>(
              <ResultCard key={p.id} pandit={p} req={req}
                onView={id=>navigate(`/pandit/${id}`)}
                onBook={id=>navigate(`/book/${id}`,{state:{req}})}
              />
            ))}
          </div>
        ) : (
          <div style={{ background:'var(--parchment)',border:'1px solid var(--border-gold)',borderRadius:16,padding:'36px 24px',textAlign:'center' }}>
            <div style={{ fontSize:'2.5rem',marginBottom:12 }}>🔍</div>
            <p style={{ fontFamily:'var(--font-body)',fontSize:'1.05rem',color:'var(--text-mid)',marginBottom:20 }}>
              No exact match — but we can still help.
            </p>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              <button className="btn-primary" onClick={()=>setPhase('chat')}>← Modify Requirements</button>
              <button className="btn-secondary" onClick={()=>navigate('/browse')}>Browse All Services</button>
            </div>
          </div>
        )}

        <div style={{ marginTop:24,textAlign:'center' }}>
          <button onClick={()=>{ setPhase('entry');setBubbles([]);setChatDone(false);setAnswers({});setIntent(null);setExtracted({}); }}
            style={{ background:'none',border:'none',color:'var(--text-light)',fontFamily:'var(--font-ui)',fontSize:'0.83rem',cursor:'pointer',textDecoration:'underline' }}>
            ← Start over
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     SHELL
  ══════════════════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background: phase==='loading'?'transparent':'var(--cream)', position:'relative' }}>
      {phase !== 'loading' && (
        <div style={{ height:4, background:'linear-gradient(90deg,var(--saffron),var(--gold),var(--vermillion))' }}/>
      )}
      {phase !== 'loading' && phase !== 'chat' && (
        <MandalaDecor size={380} opacity={0.04} style={{ top:0,right:-80,animation:'spin-slow 60s linear infinite' }}/>
      )}

      <AnimatePresence mode="wait">
        {mode==='decide' && phase!=='chat' && phase!=='loading' && phase!=='results'
          ? <motion.div key="decide" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><DecideFlow/></motion.div>
          : phase==='entry'   ? <motion.div key="entry"   initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><EntryScreen/></motion.div>
          : phase==='chat'    ? <motion.div key="chat"    initial={{opacity:0}}      animate={{opacity:1}}     exit={{opacity:0}} style={{height:'100%'}}><ChatScreen/></motion.div>
          : phase==='loading' ? <motion.div key="loading" initial={{opacity:0}}      animate={{opacity:1}}     exit={{opacity:0}}><LoadingScreen/></motion.div>
          : phase==='results' ? <motion.div key="results" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0}}><ResultsScreen/></motion.div>
          : null
        }
      </AnimatePresence>
    </div>
  );
}
