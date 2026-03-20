import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Clock, User, Building2, CheckCircle2, UserPlus, X, ChevronRight, Mail, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { addDcrEntry } from '@/features/DCR/dcrSlice';
import { searchCustomerByPhone } from './services/callLogService';
import api from '@/lib/axiosInstance';

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

/**
 * CallLogPrompt - Post-call logging dialog (Android Bridge Path)
 * 
 * Re-designed as a premium mobile-friendly bottom-sheet using framer-motion.
 */
export default function CallLogPrompt({ callData, open, onClose, onSkip }) {
    const dispatch = useDispatch();
    const [notes, setNotes] = useState('');
    const [outcome, setOutcome] = useState('');
    const [matchedCustomer, setMatchedCustomer] = useState(null);
    const [matchedContact, setMatchedContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoCloseTimer, setAutoCloseTimer] = useState(30);
    const [isResolving, setIsResolving] = useState(false);
    
    // New contact creation state
    const [showCreateContact, setShowCreateContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactEmail, setNewContactEmail] = useState('');
    const [creating, setCreating] = useState(false);

    const [lastInteraction, setLastInteraction] = useState(Date.now());

    // Auto-match customer by phone number
    useEffect(() => {
        if (open && callData?.phoneNumber) {
            setIsResolving(true);
            searchCustomerByPhone(callData.phoneNumber)
                .then(result => {
                    if (result.customer) {
                        setMatchedCustomer(result.customer);
                        setMatchedContact(result.contact);
                        setShowCreateContact(false);
                    } else {
                        setNewContactName(callData.contactName || '');
                    }
                })
                .catch(err => console.error('Customer lookup failed:', err))
                .finally(() => setIsResolving(false));
        }
    }, [open, callData?.phoneNumber, callData?.contactName]);

    // Auto-dismiss timer — paused while contact creation form is visible
    useEffect(() => {
        if (!open || showCreateContact) return;
        const interval = setInterval(() => {
            const timeElapsed = Math.floor((Date.now() - lastInteraction) / 1000);
            const remaining = 30 - timeElapsed;
            if (remaining <= 0) {
                handleSkip();
            } else {
                setAutoCloseTimer(remaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [open, lastInteraction, showCreateContact]);

    const handleInteraction = useCallback(() => {
        setLastInteraction(Date.now());
        setAutoCloseTimer(30);
    }, []);

    const handleSkip = () => {
        if (onSkip) onSkip(callData);
        resetAndClose();
    };

    const handleCreateContact = async () => {
        if (!newContactName.trim()) {
            toast.error('Please enter a contact name');
            return;
        }

        try {
            handleInteraction();
            setCreating(true);
            
            let countryCode = '+91';
            let phoneNumber = callData.phoneNumber || '';
            
            if (phoneNumber.startsWith('+')) {
                const match = phoneNumber.match(/^(\+\d{1,3})/);
                if (match) {
                    countryCode = match[1];
                    phoneNumber = phoneNumber.substring(match[1].length);
                }
            } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
                countryCode = '+91';
                phoneNumber = phoneNumber.substring(2);
            }
            
            const contactData = {
                first_name: newContactName.split(' ')[0] || '',
                last_name: newContactName.split(' ').slice(1).join(' ') || '',
                email: newContactEmail.trim() || null,
                phone_number: phoneNumber,
                country_code: countryCode,
                notes: `Created from call log on ${new Date().toLocaleString()}`
            };

            const response = await api.post('/contacts', contactData);
            toast.success('Contact created successfully!');
            
            const savedContact = {
                contact_id: response.data.contact_id,
                contact_name: newContactName,
                phone_number: phoneNumber,
                email: newContactEmail || null,
                country_code: countryCode
            };

            setMatchedContact(savedContact);
            setMatchedCustomer({
                customer_id: null,
                customer_name: newContactName,
                company_name: null,
                entity_type: 'contact',
            });
            setShowCreateContact(false);
        } catch (err) {
            toast.error('Failed to create contact: ' + (err.response?.data?.error || err.message));
        } finally {
            setCreating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!notes.trim()) {
            toast.error('Please add notes about the call');
            return;
        }

        handleInteraction();
        setLoading(true);

        try {
            const hours = Math.floor((callData.duration || 0) / 3600);
            const minutes = Math.floor(((callData.duration || 0) % 3600) / 60);
            const fallbackName = newContactName || callData.contactName || null;

            const dcrData = {
                timestamp: callData.timestamp,
                call_type: callData.callType || 'incoming',
                time_spent: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                domain_id: null,
                domain_free_text: matchedCustomer?.company_name || null,
                company_name: matchedCustomer?.company_name || null,
                contact_id: matchedContact?.contact_id || null,
                contact_name: matchedContact?.contact_name || fallbackName,
                contact_phone_number: callData.phoneNumber || '',
                contact_phone_country_code: callData.countryCode || '+91',
                contact_email: matchedContact?.email || newContactEmail || null,
                notes: notes.trim() + (outcome ? `\n\nOutcome: ${outcome}` : ''),
            };

            await dispatch(addDcrEntry(dcrData)).unwrap();
            toast.success('Call logged successfully!');
            window.dispatchEvent(new CustomEvent('callLogged', { detail: callData }));
            resetAndClose();
        } catch (err) {
            toast.error(err || 'Failed to log call');
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setNotes('');
        setOutcome('');
        setMatchedCustomer(null);
        setMatchedContact(null);
        setShowCreateContact(false);
        setNewContactName('');
        setNewContactEmail('');
        setAutoCloseTimer(30);
        setLastInteraction(Date.now());
        onClose();
    };

    if (!callData) return null;

    const { phoneNumber, duration, callType } = callData;

    // ── Name priority logic ────────────────────────────────────────────────────
    const resolvedName = matchedContact?.contact_name || matchedCustomer?.customer_name || callData.contactName;
    const hasName = isValidName(resolvedName);
    const headline = hasName ? `${resolvedName} — ${phoneNumber}` : (phoneNumber || 'Unknown');
    const subtitle = hasName ? phoneNumber : null;

    const isKnown = !!matchedCustomer;

    const formatDur = (s) => {
        const n = Number(s) || 0;
        return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`;
    };

    const glass = (alpha = 0.06) => `rgba(255,255,255,${alpha})`;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleSkip}
                        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
                    />

                    {/* Bottom Sheet Panel */}
                    <motion.div
                        key="panel"
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '110%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 32, stiffness: 360 }}
                        onPointerDown={handleInteraction}
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                            maxWidth: 560, margin: '0 auto',
                            background: 'linear-gradient(160deg, #13131f 0%, #0c0c18 100%)',
                            borderRadius: '32px 32px 0 0',
                            padding: '12px 20px 48px',
                            boxShadow: '0 -16px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)',
                            fontFamily: 'inherit',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        className="custom-scrollbar"
                    >
                        {/* Drag handle */}
                        <div style={{ width: 44, height: 5, borderRadius: 3, background: glass(0.2), margin: '0 auto 20px' }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                                borderRadius: 100, padding: '5px 14px', color: '#60a5fa', fontSize: 12, fontWeight: 800
                            }}>
                                <Phone size={14} />
                                SubSync RMS
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                    fontFamily: 'monospace', fontSize: 13, fontWeight: 800,
                                    color: autoCloseTimer <= 10 ? '#f87171' : 'rgba(255,255,255,0.28)',
                                    transition: 'color 0.4s',
                                }}>
                                    {String(autoCloseTimer).padStart(2, '0')}s
                                </span>
                                <button
                                    onClick={handleSkip}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                        background: glass(0.08), color: 'rgba(255,255,255,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Caller Card */}
                        <div style={{
                            borderRadius: 22,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.03) 100%)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '18px', marginBottom: 16,
                            position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                                borderRadius: '50%', background: 'rgba(59,130,246,0.3)', filter: 'blur(40px)', opacity: 0.5,
                                pointerEvents: 'none',
                            }} />

                            {isResolving ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Loader2 size={18} color="#60a5fa" style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: 600 }}>Looking up contact…</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 18, flexShrink: 0,
                                        background: hasName ? 'linear-gradient(135deg, #3b82f688, #2563eb44)' : 'rgba(255,255,255,0.07)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 22, fontWeight: 900, color: '#fff',
                                        border: hasName ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: hasName ? '0 4px 20px rgba(59,130,246,0.2)' : 'none',
                                    }}>
                                        {hasName ? resolvedName.charAt(0).toUpperCase() : <Phone size={22} color="rgba(255,255,255,0.3)" />}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            color: '#fff', fontSize: hasName ? 17 : 16, fontWeight: 800,
                                            margin: '0 0 4px', lineHeight: 1.25,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            letterSpacing: hasName ? '-0.01em' : '0.01em',
                                        }}>
                                            {headline}
                                        </p>

                                        {subtitle && (
                                            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: '0 0 8px', fontFamily: 'monospace' }}>
                                                {subtitle}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: subtitle ? 0 : 8 }}>
                                            {matchedCustomer?.company_name && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Building2 size={11} color="rgba(255,255,255,0.3)" />
                                                    <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
                                                        {matchedCustomer.company_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Duration Row */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: glass(0.04), borderRadius: 14,
                            padding: '12px 18px', marginBottom: 16,
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <Clock size={15} color="#60a5fa" />
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Duration
                            </span>
                            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginLeft: 6, fontFamily: 'monospace' }}>
                                {formatDur(duration)}
                            </span>
                        </div>

                        {/* Unknown Contact Actions */}
                        <AnimatePresence mode="wait">
                            {!isKnown && !isResolving && (
                                showCreateContact ? (
                                    <motion.div
                                        key="cf"
                                        initial={{ opacity: 0, scaleY: 0.95 }}
                                        animate={{ opacity: 1, scaleY: 1 }}
                                        exit={{ opacity: 0, scaleY: 0.95 }}
                                        style={{
                                            transformOrigin: 'top',
                                            background: 'rgba(59,130,246,0.06)',
                                            border: '1px solid rgba(59,130,246,0.15)',
                                            borderRadius: 20, padding: '18px', marginBottom: 16,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                                            <UserPlus size={14} color="#60a5fa" />
                                            <span style={{ color: '#60a5fa', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                New Contact
                                            </span>
                                        </div>
                                        <input
                                            type="text" placeholder="Full Name *"
                                            value={newContactName}
                                            onChange={e => { setNewContactName(e.target.value); handleInteraction(); }}
                                            style={{
                                                width: '100%', boxSizing: 'border-box', outline: 'none',
                                                background: glass(0.06), border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 12, padding: '12px 14px', color: '#fff',
                                                fontSize: 15, fontWeight: 600, marginBottom: 10,
                                                fontFamily: 'inherit', transition: 'border-color 0.2s'
                                            }}
                                            onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                        <div style={{ position: 'relative', marginBottom: 14 }}>
                                            <Mail size={14} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            <input
                                                type="email" placeholder="Email (optional)"
                                                value={newContactEmail}
                                                onChange={e => { setNewContactEmail(e.target.value); handleInteraction(); }}
                                                style={{
                                                    width: '100%', boxSizing: 'border-box', outline: 'none',
                                                    background: glass(0.06), border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: 12, padding: '12px 14px 12px 36px', color: '#fff',
                                                    fontSize: 15, fontWeight: 600,
                                                    fontFamily: 'inherit', transition: 'border-color 0.2s'
                                                }}
                                                onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button
                                                type="button"
                                                onClick={() => { setShowCreateContact(false); handleInteraction(); }}
                                                style={{
                                                    flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                                                    background: glass(0.06), border: '1px solid rgba(255,255,255,0.08)',
                                                    color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                                                }}>
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCreateContact}
                                                disabled={creating || !newContactName.trim()}
                                                style={{
                                                    flex: 2, padding: '12px 0', borderRadius: 12, cursor: creating ? 'not-allowed' : 'pointer',
                                                    background: creating ? 'rgba(59,130,246,0.45)' : 'linear-gradient(135deg,#2563eb,#60a5fa)',
                                                    border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                    fontFamily: 'inherit',
                                                }}>
                                                {creating
                                                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                                                    : <><CheckCircle2 size={16} /> Save Contact</>
                                                }
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="nc"
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: 'rgba(245,158,11,0.06)',
                                            border: '1px solid rgba(245,158,11,0.15)',
                                            borderRadius: 16, padding: '12px 16px', marginBottom: 16,
                                        }}
                                    >
                                        <div>
                                            <p style={{ color: '#fff', fontSize: 13, fontWeight: 800, margin: '0 0 2px' }}>Unknown number</p>
                                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, margin: 0 }}>Save to SubSync?</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setShowCreateContact(true); handleInteraction(); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                background: 'rgba(245,158,11,0.12)',
                                                border: '1px solid rgba(245,158,11,0.25)',
                                                borderRadius: 10, padding: '8px 12px',
                                                color: '#fbbf24', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                                                fontFamily: 'inherit',
                                            }}>
                                            <UserPlus size={13} /> Add
                                        </button>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>

                        {/* Form Fields Section */}
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Call Notes <span style={{ color: '#60a5fa' }}>*</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => { setNotes(e.target.value); handleInteraction(); }}
                                    placeholder="What was discussed?"
                                    rows={3}
                                    style={{
                                        width: '100%', boxSizing: 'border-box', resize: 'none', outline: 'none',
                                        background: glass(0.05), border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 16, padding: '14px 16px',
                                        color: '#fff', fontSize: 15, lineHeight: 1.5, fontFamily: 'inherit',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 8, color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Outcome <span style={{ color: 'rgba(255,255,255,0.2)' }}>(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={outcome}
                                    onChange={e => { setOutcome(e.target.value); handleInteraction(); }}
                                    placeholder="e.g. Schedule follow-up"
                                    style={{
                                        width: '100%', boxSizing: 'border-box', outline: 'none',
                                        background: glass(0.05), border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 14, padding: '14px 16px',
                                        color: '#fff', fontSize: 15, fontFamily: 'inherit',
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                                <button
                                    type="submit"
                                    disabled={loading || !notes.trim()}
                                    style={{
                                        width: '100%', padding: '16px 0', borderRadius: 16,
                                        cursor: loading || !notes.trim() ? 'not-allowed' : 'pointer',
                                        background: loading || !notes.trim() ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
                                        border: 'none', color: '#fff', fontSize: 14, fontWeight: 900,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        boxShadow: loading || !notes.trim() ? 'none' : '0 8px 32px rgba(37,99,235,0.3)',
                                        fontFamily: 'inherit', transition: 'transform 0.15s, box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => { if (!loading && notes.trim()) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.45)'; } }}
                                    onMouseLeave={e => { if (!loading && notes.trim()) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.3)'; } }}
                                >
                                    {loading
                                        ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing…</>
                                        : <><Sparkles size={18} /> Add to DCR Entry</>
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSkip}
                                    style={{
                                        width: '100%', padding: '14px 0', borderRadius: 16, cursor: 'pointer',
                                        background: 'transparent', border: 'none',
                                        color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 800,
                                        textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'inherit',
                                        transition: 'color 0.2s, background 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = glass(0.04); }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                    Log Later
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </AnimatePresence>
    );
}
