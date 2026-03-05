import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed,
  User, Building2, Clock, X, CheckCircle, Loader2, Tag
} from 'lucide-react';

/**
 * CallLogPopup — Post-Call DCR Entry Overlay
 *
 * Appears as a slide-up bottom sheet after every phone call.
 * Shows auto-resolved contact details and lets the user log the call
 * as a DCR entry with a description.
 *
 * Props:
 *   callEvent  — from useCallDetector: { raw, resolved, loading }
 *   isLogging  — boolean (submission in progress)
 *   onLog      — async fn({ description }) — submits the DCR entry
 *   onDismiss  — fn() — dismisses without logging
 */
export default function CallLogPopup({ callEvent, isLogging, onLog, onDismiss }) {
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted]     = useState(false);

  // Reset description when a new call arrives
  useEffect(() => {
    if (callEvent) {
      setDescription('');
      setSubmitted(false);
    }
  }, [callEvent]);

  if (!callEvent) return null;

  const { raw, resolved, loading } = callEvent;
  const { phoneNumber, duration, callType } = raw || {};

  // Formatted duration: mm:ss
  const formatDuration = (secs) => {
    if (!secs || secs === 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Call type config
  const callTypeConfig = {
    incoming: { icon: PhoneIncoming, label: 'Incoming',  color: '#22c55e', bg: 'rgba(34,197,94,0.15)'  },
    outgoing: { icon: PhoneOutgoing, label: 'Outgoing',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
    missed:   { icon: PhoneMissed,   label: 'Missed',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)'  },
  };
  const typeConf = callTypeConfig[callType] || callTypeConfig.incoming;
  const TypeIcon = typeConf.icon;

  // Entity type badge
  const entityBadgeConfig = {
    customer:      { label: 'Customer',      color: '#8b5cf6' },
    vendor:        { label: 'Vendor',        color: '#f59e0b' },
    contact:       { label: 'Contact',       color: '#06b6d4' },
    other_contact: { label: 'Contact',       color: '#06b6d4' },
    unknown:       { label: 'Unknown',       color: '#6b7280' },
  };
  const entityConf = entityBadgeConfig[resolved?.type || 'unknown'];

  const handleLog = async () => {
    const result = await onLog({ description });
    if (result?.success) {
      setSubmitted(true);
      setTimeout(() => {
        onDismiss();
      }, 1200);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Bottom Sheet Panel */}
      <motion.div
        key="panel"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 9999,
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px 36px',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.6)',
          maxWidth: '560px',
          margin: '0 auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.2)',
          margin: '0 auto 20px',
        }} />

        {/* ─── Success state ─── */}
        {submitted ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ textAlign: 'center', padding: '24px 0' }}
          >
            <CheckCircle size={56} color="#22c55e" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: 0 }}>
              Call logged as DCR entry
            </p>
          </motion.div>
        ) : (
          <>
            {/* ─── Header row: call type + dismiss ─── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: typeConf.bg,
                borderRadius: 24, padding: '5px 14px',
                border: `1px solid ${typeConf.color}40`,
              }}>
                <TypeIcon size={15} color={typeConf.color} />
                <span style={{ color: typeConf.color, fontSize: 13, fontWeight: 600 }}>
                  {typeConf.label} Call
                </span>
              </div>
              <button
                onClick={onDismiss}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
                  borderRadius: '50%', width: 34, height: 34,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ─── Caller identity ─── */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 16, padding: '18px 16px',
              marginBottom: 16,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Loader2 size={20} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Resolving contact…</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar circle */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: resolved?.type !== 'unknown'
                      ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                      : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {resolved?.type !== 'unknown'
                      ? <User size={24} color="#fff" />
                      : <Phone size={22} color="rgba(255,255,255,0.4)" />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name */}
                    <p style={{
                      color: '#fff', fontSize: 20, fontWeight: 700,
                      margin: '0 0 4px', lineHeight: 1.2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {resolved?.name || phoneNumber || 'Unknown'}
                    </p>

                    {/* Phone number */}
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 8px' }}>
                      {phoneNumber || resolved?.phone}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {/* Company */}
                      {resolved?.company && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Building2 size={12} color="rgba(255,255,255,0.4)" />
                          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
                            {resolved.company}
                          </span>
                        </div>
                      )}

                      {/* Entity badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: `${entityConf.color}20`,
                        borderRadius: 12, padding: '2px 10px',
                        border: `1px solid ${entityConf.color}40`,
                      }}>
                        <Tag size={10} color={entityConf.color} />
                        <span style={{ color: entityConf.color, fontSize: 11, fontWeight: 600 }}>
                          {entityConf.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Duration + stats row ─── */}
            <div style={{
              display: 'flex', gap: 10, marginBottom: 16,
            }}>
              <div style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                borderRadius: 12, padding: '12px 14px',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Clock size={16} color="#8b5cf6" />
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Duration</p>
                  <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {formatDuration(duration)}
                  </p>
                </div>
              </div>
              {callType === 'missed' && (
                <div style={{
                  flex: 1, background: 'rgba(239,68,68,0.08)',
                  borderRadius: 12, padding: '12px 14px',
                  border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <PhoneMissed size={16} color="#ef4444" />
                  <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: 0 }}>Not answered</p>
                </div>
              )}
            </div>

            {/* ─── Description textarea ─── */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                color: 'rgba(255,255,255,0.5)', fontSize: 12,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                display: 'block', marginBottom: 8,
              }}>
                Call Notes (optional)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe what was discussed…"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '12px 14px',
                  color: '#fff', fontSize: 14, lineHeight: 1.5,
                  resize: 'none', outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* ─── Action buttons ─── */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onDismiss}
                style={{
                  flex: 1, padding: '13px 0',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 14, color: 'rgba(255,255,255,0.7)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.12)'}
                onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.07)'}
              >
                Skip
              </button>

              <button
                onClick={handleLog}
                disabled={isLogging || loading}
                style={{
                  flex: 2, padding: '13px 0',
                  background: isLogging
                    ? 'rgba(139,92,246,0.6)'
                    : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  border: 'none',
                  borderRadius: 14, color: '#fff',
                  fontSize: 14, fontWeight: 700, cursor: isLogging ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s, transform 0.1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(109,40,217,0.4)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (!isLogging) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {isLogging
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Logging…</>
                  : <><Phone size={16} /> Log as DCR Entry</>
                }
              </button>
            </div>

            {/* Subtle hint */}
            <p style={{
              textAlign: 'center', color: 'rgba(255,255,255,0.25)',
              fontSize: 11, margin: '12px 0 0',
            }}>
              This will create a DCR entry for this call
            </p>
          </>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AnimatePresence>
  );
}
