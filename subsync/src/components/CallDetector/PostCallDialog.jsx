import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  Building2, Clock, X, CheckCircle, Loader2,
  UserPlus, ChevronRight, Mail, Sparkles, LogIn
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import { toast } from 'react-toastify';

/* ─────────────────────────────────────────────────────────────────────────────
 * isValidName — Business rule: a name is valid if it is:
 *   • non-null, non-empty, non-whitespace-only
 *   • not a sentinel string ('Unknown Number', 'Unknown Contact', 'Unknown')
 * ───────────────────────────────────────────────────────────────────────────── */
const SENTINEL_NAMES = new Set(['unknown number', 'unknown contact', 'unknown']);

function isValidName(raw) {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return !SENTINEL_NAMES.has(trimmed.toLowerCase());
}

/* ─────────────────────────────────────────────────────────────────────────────
 * PostCallDialog — Post-call DCR entry overlay (native Capacitor path).
 *
 * Display priority (business rule):
 *   1. If DB resolved a valid name  → "<Name> — <Number>"
 *   2. Otherwise                    → "<Number>"
 *
 * Key design choices:
 *   • Uses lastCall.callId to tell a NEW call from a resolve-update.
 *     Only a new callId triggers UI reset; a resolve update just refreshes
 *     the displayed name without closing or resetting anything.
 *   • resolvedOverride: local state set after inline contact creation.
 *     Takes priority over hook-supplied resolved.
 * ───────────────────────────────────────────────────────────────────────────── */
export default function PostCallDialog({ lastCall: incomingCall }) {
  const isAuthenticated = useSelector((state) => !!state.auth?.user);
  
  // To handle the post-login replay, we use local state that can be
  // populated either from props (incomingCall) or localStorage (pending).
  const [lastCall, setLastCall]   = useState(null);

  const [open, setOpen]           = useState(false);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Tracks the callId of the currently displayed call
  const currentCallIdRef          = useRef(null);
  const lastInteractionRef        = useRef(Date.now());

  // Inline contact creation
  const [resolvedOverride, setResolvedOverride] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [creating, setCreating]   = useState(false);

  // ── Restore pending call after login ───────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      const pendingData = localStorage.getItem('subsync_pending_call_after_login');
      if (pendingData) {
        try {
          const parsedCall = JSON.parse(pendingData);
          localStorage.removeItem('subsync_pending_call_after_login');
          setLastCall(parsedCall);
        } catch (e) {
          console.error('Failed to parse pending call', e);
          localStorage.removeItem('subsync_pending_call_after_login');
        }
      }
    }
  }, [isAuthenticated]);

  // ── Sync props to state ────────────────────────────────────────────────────
  useEffect(() => {
    if (incomingCall) {
      setLastCall(incomingCall);
    }
  }, [incomingCall]);

  // ── Guard: only reset UI for a genuinely NEW call ──────────────────────────
  useEffect(() => {
    if (!lastCall) return;
    const incomingId = lastCall.callId || lastCall.phoneNumber;
    if (incomingId === currentCallIdRef.current) return; // same call, resolve update — ignore

    // New call
    currentCallIdRef.current = incomingId;
    setOpen(true);
    setNotes('');
    setSubmitted(false);
    setResolvedOverride(null);
    setShowCreate(false);
    setCreateName('');
    setCreateEmail('');
    setCountdown(30);
    lastInteractionRef.current = Date.now();
  }, [lastCall]);

  // ── Auto-dismiss countdown (paused while create form is open / submitted) ──
  useEffect(() => {
    if (!open || submitted || showCreate) return;
    const iv = setInterval(() => {
      const remaining = 30 - Math.floor((Date.now() - lastInteractionRef.current) / 1000);
      if (remaining <= 0) { setOpen(false); }
      else { setCountdown(remaining); }
    }, 1000);
    return () => clearInterval(iv);
  }, [open, submitted, showCreate]);

  const touch = () => {
    lastInteractionRef.current = Date.now();
    setCountdown(30);
  };

  // ── Bail early ─────────────────────────────────────────────────────────────
  if (!lastCall) return null;

  const { phoneNumber, duration, callType } = lastCall;
  const activeResolved = resolvedOverride ?? lastCall.resolved;
  const isLoading      = activeResolved?.loading === true;
  const isKnown        = !isLoading && activeResolved?.type && activeResolved.type !== 'unknown';

  // ── Name priority logic ────────────────────────────────────────────────────
  // Business rule: prefer valid DB name; fall back to raw number.
  const resolvedName   = activeResolved?.name;
  const hasName        = isValidName(resolvedName);
  // Primary display line: "Name — Number" or just "Number"
  const headline = hasName
    ? `${resolvedName} — ${phoneNumber}`
    : (phoneNumber || 'Unknown');
  // Sub-line: only shown when we have a name (shows number alone in secondary slot)
  const subtitle = hasName ? phoneNumber : null;

  const formatDur = (s) => {
    const n = Number(s) || 0;
    return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`;
  };

  // ── Call type config ───────────────────────────────────────────────────────
  const TYPE_CFG = {
    incoming: { Icon: PhoneIncoming, label: 'Incoming', clr: '#34d399', bg: 'rgba(52,211,153,0.12)', glow: 'rgba(52,211,153,0.3)' },
    outgoing: { Icon: PhoneOutgoing, label: 'Outgoing', clr: '#60a5fa', bg: 'rgba(96,165,250,0.12)', glow: 'rgba(96,165,250,0.3)' },
    missed:   { Icon: PhoneMissed,   label: 'Missed',   clr: '#f87171', bg: 'rgba(248,113,113,0.12)', glow: 'rgba(248,113,113,0.3)' },
  };
  const tc  = TYPE_CFG[callType] || TYPE_CFG.incoming;
  const TIcon = tc.Icon;

  // ── Entity badge config ────────────────────────────────────────────────────
  const ENTITY_CLR = {
    customer: '#a78bfa', vendor: '#fbbf24', contact: '#22d3ee', other_contact: '#22d3ee', unknown: '#6b7280',
  };
  const entityClr   = ENTITY_CLR[activeResolved?.type] || '#6b7280';
  const entityLabel = (activeResolved?.type || 'unknown').replace('_', ' ');

  // ── Inline create contact ──────────────────────────────────────────────────
  const handleCreateContact = async () => {
    if (!createName.trim()) { toast.error('Name is required'); return; }
    touch();
    setCreating(true);
    try {
      let cc = '+91', lp = phoneNumber || '';
      if (lp.startsWith('+')) {
        const m = lp.match(/^(\+\d{1,3})/);
        if (m) { cc = m[1]; lp = lp.slice(m[1].length); }
      } else if (lp.startsWith('91') && lp.length === 12) {
        cc = '+91'; lp = lp.slice(2);
      }
      const parts = createName.trim().split(' ');
      const res = await api.post('/contacts', {
        first_name: parts[0],
        last_name: parts.slice(1).join(' ') || '',
        email: createEmail.trim() || null,
        phone_number: lp, country_code: cc,
        notes: `Created from call log — ${new Date().toLocaleString('en-IN')}`,
      });
      toast.success('Contact saved!');
      setResolvedOverride({
        type: 'contact', id: res.data?.contact_id || null,
        name: createName.trim(), company: null,
        phone: lp, loading: false,
      });
      setShowCreate(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create contact');
    } finally {
      setCreating(false);
    }
  };

  const handleLoginRedirect = () => {
    if (!lastCall) return;
    localStorage.setItem('subsync_pending_call_after_login', JSON.stringify(lastCall));
    setOpen(false);
    window.location.href = '/';
    toast.info('Please sign in to log your call. We saved the call details.');
  };

  // ── Submit call log ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    touch();
    setSubmitting(true);
    try {
      const ar = resolvedOverride || activeResolved;
      await api.post('/log-call', {
        phone:       phoneNumber || ar?.phone || '',
        name:        (hasName ? resolvedName : null) || phoneNumber || 'Unknown Number',
        entity_type: ar?.type  || 'unknown',
        entity_id:   ar?.id    || null,
        company:     ar?.company || null,
        call_type:   ['incoming','outgoing','missed'].includes(callType) ? callType : 'incoming',
        duration:    Number(duration) || 0,
        description: notes.trim() || 'Call logged via Android overlay',
      });
      setSubmitted(true);
      setTimeout(() => setOpen(false), 1600);
    } catch (err) {
      console.error('[PostCallDialog] submit:', err);
      toast.error(err.response?.data?.error || 'Failed to log call');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles helpers ─────────────────────────────────────────────────────────
  const glass = (alpha = 0.06) => `rgba(255,255,255,${alpha})`;
  const pill = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    borderRadius: 100, padding: '4px 12px',
    fontSize: 11, fontWeight: 800,
    letterSpacing: '0.04em',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────────── */}
          <motion.div
            key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)' }}
          />

          {/* ── Panel ────────────────────────────────────────────────────── */}
          <motion.div
            key="panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '110%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            onPointerDown={touch}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
              maxWidth: 520, margin: '0 auto',
              background: 'linear-gradient(160deg,#13131f 0%,#0c0c18 100%)',
              borderRadius: '28px 28px 0 0',
              padding: '8px 18px 44px',
              boxShadow: '0 -16px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)',
              fontFamily: 'inherit',
            }}
          >

            {/* Drag handle */}
            <div style={{ width:40, height:4, borderRadius:2, background:glass(0.15), margin:'10px auto 22px' }} />

            {/* ── Success ───────────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="ok"
                initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }}
                style={{ textAlign:'center', padding:'28px 0 12px' }}
              >
                <motion.div
                  initial={{ scale:0 }}
                  animate={{ scale:1 }}
                  transition={{ type:'spring', damping:14, stiffness:260, delay:0.1 }}
                  style={{
                    width:72, height:72, borderRadius:'50%',
                    background:'linear-gradient(135deg,#10b981,#059669)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto 16px',
                    boxShadow:'0 0 40px rgba(16,185,129,0.4)',
                  }}
                >
                  <CheckCircle size={34} color="#fff" />
                </motion.div>
                <p style={{ color:'#fff', fontSize:20, fontWeight:800, margin:'0 0 6px' }}>Call Logged!</p>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, margin:0 }}>Added to your DCR</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity:0 }} animate={{ opacity:1 }}>

                {/* ── Top row: type badge + countdown + close ─────────── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ ...pill, background: tc.bg, border:`1px solid ${tc.clr}30`, color: tc.clr }}>
                    <TIcon size={13} />
                    {tc.label} Call
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{
                      fontFamily:'monospace', fontSize:13, fontWeight:800,
                      color: countdown <= 10 ? '#f87171' : 'rgba(255,255,255,0.28)',
                      transition:'color 0.4s',
                      display: !isAuthenticated ? 'none' : 'inline-block'
                    }}>
                      {String(countdown).padStart(2,'0')}s
                    </span>
                    <button
                      onClick={() => setOpen(false)}
                      style={{
                        width:32, height:32, borderRadius:'50%', border:'none', cursor:'pointer',
                        background:glass(0.08), color:'rgba(255,255,255,0.5)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* ── Caller card ────────────────────────────────────────── */}
                <div style={{
                  borderRadius:22,
                  background:'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.03) 100%)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  padding:'18px 18px 16px',
                  marginBottom:14,
                  position:'relative', overflow:'hidden',
                }}>
                  {/* Subtle glow accent top-right */}
                  <div style={{
                    position:'absolute', top:-30, right:-30, width:100, height:100,
                    borderRadius:'50%', background: tc.glow, filter:'blur(40px)', opacity:0.6,
                    pointerEvents:'none',
                  }} />

                  {isLoading ? (
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Loader2 size={18} color="#a78bfa" style={{ animation:'spin 1s linear infinite' }} />
                      <span style={{ color:'rgba(255,255,255,0.45)', fontSize:13 }}>Looking up contact…</span>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                      {/* Avatar */}
                      <div style={{
                        width:56, height:56, borderRadius:18, flexShrink:0,
                        background: hasName
                          ? `linear-gradient(135deg, ${entityClr}cc, ${entityClr}44)`
                          : 'rgba(255,255,255,0.07)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:22, fontWeight:900, color:'#fff',
                        border: hasName ? `1px solid ${entityClr}40` : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: hasName ? `0 4px 20px ${entityClr}30` : 'none',
                      }}>
                        {hasName
                          ? resolvedName.charAt(0).toUpperCase()
                          : <Phone size={22} color="rgba(255,255,255,0.3)" />
                        }
                      </div>

                      <div style={{ flex:1, minWidth:0 }}>
                        {/* ── HEADLINE: "Name — Number" or "Number" ── */}
                        <p style={{
                          color:'#fff', fontSize: hasName ? 17 : 15, fontWeight:800,
                          margin:'0 0 3px', lineHeight:1.25,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          letterSpacing: hasName ? '-0.01em' : '0.01em',
                        }}>
                          {headline}
                        </p>

                        {/* Sub-line: entity type + company (when name is known) */}
                        {subtitle && (
                          <p style={{ color:'rgba(255,255,255,0.38)', fontSize:11, margin:'0 0 8px', fontFamily:'monospace' }}>
                            {subtitle}
                          </p>
                        )}

                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center', marginTop: subtitle ? 0 : 8 }}>
                          {activeResolved?.company && (
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <Building2 size={10} color="rgba(255,255,255,0.3)" />
                              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>
                                {activeResolved.company}
                              </span>
                            </div>
                          )}
                          <span style={{
                            ...pill,
                            background:`${entityClr}18`,
                            border:`1px solid ${entityClr}30`,
                            color:entityClr,
                            padding:'2px 8px', fontSize:10,
                          }}>
                            {entityLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Duration bar ─────────────────────────────────────── */}
                <div style={{
                  display:'flex', alignItems:'center', gap:8,
                  background:glass(0.04), borderRadius:14,
                  padding:'10px 16px', margin:'0 0 14px',
                  border:'1px solid rgba(255,255,255,0.06)',
                }}>
                  <Clock size={14} color="#a78bfa" />
                  <span style={{ color:'rgba(255,255,255,0.35)', fontSize:10, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                    Duration
                  </span>
                  <span style={{ color:'#fff', fontSize:15, fontWeight:800, marginLeft:4, fontFamily:'monospace' }}>
                    {formatDur(duration)}
                  </span>
                  {callType === 'missed' && (
                    <span style={{
                      marginLeft:'auto', fontSize:10, fontWeight:800,
                      color:'#f87171', background:'rgba(248,113,113,0.12)',
                      borderRadius:8, padding:'2px 9px', border:'1px solid rgba(248,113,113,0.2)',
                    }}>
                      Unanswered
                    </span>
                  )}
                </div>

                {/* ── Unauthenticated State Overlay ───────────────────────── */}
                {!isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      marginTop: 16,
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: 16, padding: '20px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
                    }}>
                      <LogIn size={24} color="#60a5fa" />
                    </div>
                    <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Sign in required</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>
                      You need to be signed in to log calls. We will save this call data and prompt you again after you sign in.
                    </p>
                    <button
                      onClick={handleLoginRedirect}
                      style={{
                        width: '100%', padding: '14px 0', borderRadius: 12, cursor: 'pointer',
                        background: 'linear-gradient(135deg,#2563eb,#60a5fa)',
                        border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 4px 14px rgba(59,130,246,0.4)', fontFamily: 'inherit'
                      }}
                    >
                      Sign in to continue
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* ── Unknown number action ──────────────────────────── */}
                    <AnimatePresence mode="wait">
                    {!isKnown && !isLoading && (
                      showCreate ? (
                        /* Inline create form */
                        <motion.div
                          key="cf"
                          initial={{ opacity:0, scaleY:0.9 }}
                          animate={{ opacity:1, scaleY:1 }}
                          exit={{ opacity:0, scaleY:0.9 }}
                          style={{
                            transformOrigin:'top',
                            background:'rgba(96,165,250,0.07)',
                            border:'1px solid rgba(96,165,250,0.15)',
                            borderRadius:18, padding:'15px', marginBottom:14,
                          }}
                        >
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                            <UserPlus size={13} color="#60a5fa" />
                            <span style={{ color:'#60a5fa', fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em' }}>
                              Add Contact
                            </span>
                          </div>
                          {/* Name */}
                          <input
                            type="text" placeholder="Full Name *"
                            value={createName}
                            onChange={e => { setCreateName(e.target.value); touch(); }}
                            style={{
                              width:'100%', boxSizing:'border-box', outline:'none',
                              background:glass(0.07), border:'1px solid rgba(255,255,255,0.1)',
                              borderRadius:10, padding:'10px 12px', color:'#fff',
                              fontSize:14, fontWeight:600, marginBottom:8,
                              fontFamily:'inherit',
                            }}
                            onFocus={e => e.target.style.borderColor='rgba(96,165,250,0.5)'}
                            onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                          />
                          {/* Email */}
                          <div style={{ position:'relative', marginBottom:12 }}>
                            <Mail size={12} color="rgba(255,255,255,0.25)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                            <input
                              type="email" placeholder="Email (optional)"
                              value={createEmail}
                              onChange={e => { setCreateEmail(e.target.value); touch(); }}
                              style={{
                                width:'100%', boxSizing:'border-box', outline:'none',
                                background:glass(0.07), border:'1px solid rgba(255,255,255,0.1)',
                                borderRadius:10, padding:'10px 12px 10px 32px', color:'#fff',
                                fontSize:14, fontWeight:600,
                                fontFamily:'inherit',
                              }}
                              onFocus={e => e.target.style.borderColor='rgba(96,165,250,0.5)'}
                              onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'}
                            />
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <button
                              onClick={() => { setShowCreate(false); touch(); }}
                              style={{
                                flex:1, padding:'10px 0', borderRadius:10, cursor:'pointer',
                                background:glass(0.06), border:'1px solid rgba(255,255,255,0.08)',
                                color:'rgba(255,255,255,0.5)', fontSize:12, fontWeight:700, fontFamily:'inherit',
                              }}>
                              Cancel
                            </button>
                            <button
                              onClick={handleCreateContact}
                              disabled={creating || !createName.trim()}
                              style={{
                                flex:2, padding:'10px 0', borderRadius:10, cursor: creating ? 'not-allowed' : 'pointer',
                                background: creating ? 'rgba(59,130,246,0.45)' : 'linear-gradient(135deg,#2563eb,#60a5fa)',
                                border:'none', color:'#fff', fontSize:12, fontWeight:800,
                                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                                fontFamily:'inherit',
                              }}>
                              {creating
                                ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Saving…</>
                                : <><CheckCircle size={12} /> Save &amp; Attach</>
                              }
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        /* "Add contact" prompt strip */
                        <motion.div
                          key="nc"
                          initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                          style={{
                            display:'flex', alignItems:'center', justifyContent:'space-between',
                            background:'rgba(251,191,36,0.05)',
                            border:'1px solid rgba(251,191,36,0.12)',
                            borderRadius:14, padding:'10px 14px', marginBottom:14,
                          }}
                        >
                          <div>
                            <p style={{ color:'#fff', fontSize:12, fontWeight:700, margin:0 }}>Unknown number</p>
                            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:10, margin:0 }}>Add to contacts?</p>
                          </div>
                          <button
                            onClick={() => { setShowCreate(true); touch(); }}
                            style={{
                              display:'flex', alignItems:'center', gap:5,
                              background:'rgba(251,191,36,0.12)',
                              border:'1px solid rgba(251,191,36,0.2)',
                              borderRadius:9, padding:'6px 11px',
                              color:'#fbbf24', fontSize:11, fontWeight:800, cursor:'pointer',
                              fontFamily:'inherit',
                            }}>
                            <UserPlus size={11} /> Add <ChevronRight size={10} />
                          </button>
                        </motion.div>
                      )
                    )}
                    </AnimatePresence>

                    {/* ── Notes ───────────────────────────────────────────── */}
                    <div style={{ marginBottom:16 }}>
                      <label style={{
                        display:'block', marginBottom:7,
                        color:'rgba(255,255,255,0.35)', fontSize:10,
                        textTransform:'uppercase', letterSpacing:'0.1em',
                      }}>
                        Call Notes <span style={{ color:'rgba(255,255,255,0.2)' }}>(optional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => { setNotes(e.target.value); touch(); }}
                        placeholder="What was discussed?"
                        rows={3}
                        style={{
                          width:'100%', boxSizing:'border-box', resize:'none', outline:'none',
                          background:glass(0.05), border:'1px solid rgba(255,255,255,0.08)',
                          borderRadius:16, padding:'12px 14px',
                          color:'#fff', fontSize:14, lineHeight:1.55, fontFamily:'inherit',
                          transition:'border-color 0.2s',
                        }}
                        onFocus={e => e.target.style.borderColor='rgba(167,139,250,0.4)'}
                        onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
                      />
                    </div>

                    {/* ── Action buttons ───────────────────────────────────── */}
                    <div style={{ display:'flex', gap:10 }}>
                      <button
                        onClick={() => setOpen(false)}
                        style={{
                          flex:1, padding:'13px 0', borderRadius:16, cursor:'pointer',
                          background:glass(0.06), border:'1px solid rgba(255,255,255,0.09)',
                          color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:700, fontFamily:'inherit',
                          transition:'background 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.background=glass(0.12)}
                        onMouseLeave={e => e.target.style.background=glass(0.06)}
                      >
                        Skip
                      </button>

                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                          flex:2.5, padding:'13px 0', borderRadius:16,
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          background: submitting
                            ? 'rgba(124,58,237,0.5)'
                            : 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
                          border:'none', color:'#fff', fontSize:13, fontWeight:800,
                          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                          boxShadow: submitting ? 'none' : '0 6px 28px rgba(109,40,217,0.4)',
                          fontFamily:'inherit', transition:'transform 0.15s, box-shadow 0.15s',
                        }}
                        onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 36px rgba(109,40,217,0.55)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=submitting?'none':'0 6px 28px rgba(109,40,217,0.4)'; }}
                      >
                        {submitting
                          ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }}/> Logging…</>
                          : <><Sparkles size={14}/> Log as DCR Entry</>
                        }
                      </button>
                    </div>

                    <p style={{
                      textAlign:'center', color:'rgba(255,255,255,0.16)',
                      fontSize:10, margin:'11px 0 0', letterSpacing:'0.04em',
                    }}>
                      Creates a DCR entry for this call · dismisses in {countdown}s
                    </p>
                  </>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </AnimatePresence>
  );
}
