import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { X, Phone, Clock, User, FileText, CheckCircle2, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { addDcrEntry } from '@/features/DCR/dcrSlice';
import { searchCustomerByPhone } from './services/callLogService';
import api from '@/lib/axiosInstance';

/**
 * CallLogPrompt - Post-call logging dialog
 * 
 * Appears after a phone call ends, prompting user to log the call to DCR.
 * Auto-dismisses after 30 seconds of inactivity.
 * Mobile-friendly with option to create new contact for unmatched calls.
 * 
 * @param {Object} callData - Metadata from Android CallLog
 * @param {string} callData.phoneNumber - Phone number from call
 * @param {number} callData.duration - Call duration in seconds
 * @param {string} callData.timestamp - Call start time (ISO format)
 * @param {string} callData.callType - 'incoming' | 'outgoing'
 * @param {boolean} open - Dialog open state
 * @param {Function} onClose - Close handler
 * @param {Function} onSkip - Skip handler (stores to Recent Calls)
 */
export default function CallLogPrompt({ callData, open, onClose, onSkip }) {
    const dispatch = useDispatch();
    const [notes, setNotes] = useState('');
    const [outcome, setOutcome] = useState('');
    const [matchedCustomer, setMatchedCustomer] = useState(null);
    const [matchedContact, setMatchedContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoCloseTimer, setAutoCloseTimer] = useState(30);
    
    // New contact creation state
    const [showCreateContact, setShowCreateContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactEmail, setNewContactEmail] = useState('');

    // Reset inactivity timer when user interacts
    const [lastInteraction, setLastInteraction] = useState(Date.now());

    // Auto-match customer by phone number
    useEffect(() => {
        if (open && callData?.phoneNumber) {
            searchCustomerByPhone(callData.phoneNumber)
                .then(result => {
                    if (result.customer) {
                        setMatchedCustomer(result.customer);
                        setMatchedContact(result.contact);
                        setShowCreateContact(false);
                    } else {
                        // Prefill name from caller ID if available
                        setNewContactName(callData.contactName || '');
                    }
                })
                .catch(err => console.error('Customer lookup failed:', err));
        }
    }, [open, callData?.phoneNumber, callData?.contactName]);

    // Auto-dismiss timer
    useEffect(() => {
        if (!open) return;

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
    }, [open, lastInteraction]);

    // Reset interaction timer on user activity
    const handleInteraction = useCallback(() => {
        setLastInteraction(Date.now());
    }, []);

    const handleSkip = () => {
        if (onSkip) {
            onSkip(callData);
        }
        resetAndClose();
    };

    const handleCreateContact = async () => {
        if (!newContactName.trim()) {
            toast.error('Please enter a contact name');
            return;
        }

        try {
            setLoading(true);
            
            // Extract country code from phone number if present, otherwise use default
            let countryCode = '+91';
            let phoneNumber = callData.phoneNumber;
            
            // If phone starts with +, extract country code
            if (phoneNumber.startsWith('+')) {
                const match = phoneNumber.match(/^(\+\d{1,3})/);
                if (match) {
                    countryCode = match[1];
                    phoneNumber = phoneNumber.substring(match[1].length);
                }
            }
            
            const contactData = {
                first_name: newContactName.split(' ')[0] || '',
                last_name: newContactName.split(' ').slice(1).join(' ') || '',
                email: newContactEmail.trim() || null, // Allow null email
                phone_number: phoneNumber,
                country_code: countryCode,
                notes: `Created from call log on ${new Date().toLocaleString()}`
            };

            const response = await api.post('/contacts', contactData);
            
            toast.success('Contact created successfully!');
            
            // Use the newly created contact for DCR entry
            setMatchedContact({
                contact_id: response.data.contact_id,
                contact_name: newContactName,
                phone_number: phoneNumber,
                email: newContactEmail || null,
                country_code: countryCode
            });
            setShowCreateContact(false);
        } catch (err) {
            toast.error('Failed to create contact: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!notes.trim()) {
            toast.error('Please add notes about the call');
            return;
        }

        setLoading(true);

        try {
            // Convert duration from seconds to HH:MM format
            const hours = Math.floor(callData.duration / 3600);
            const minutes = Math.floor((callData.duration % 3600) / 60);

            const dcrData = {
                timestamp: callData.timestamp,
                call_type: callData.callType,
                time_spent: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                // Don't send domain_id - send company_name instead for free text
                // This avoids foreign key constraint issues
                domain_id: null,
                domain_free_text: matchedCustomer?.company_name || null,
                company_name: matchedCustomer?.company_name || null,
                contact_id: matchedContact?.contact_id || null,
                contact_name: matchedContact?.contact_name || newContactName || callData.contactName || null,
                contact_phone_number: callData.phoneNumber,
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

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
            <DialogContent 
                className="w-[92vw] max-w-lg p-0 dark:bg-slate-950/90 border-slate-800/50 rounded-[32px] overflow-hidden shadow-2xl backdrop-blur-xl"
                onPointerDown={handleInteraction}
                onKeyDown={handleInteraction}
            >
                {/* Premium Branding Header */}
                <div className="bg-gradient-to-r from-blue-600/20 to-violet-600/20 px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/30">
                            <Phone className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-1.5">
                                SubSync <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-blue-400">RMS</span>
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400">Log Call to DCR</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Auto-dismiss</span>
                        <span className="text-xs font-mono font-bold text-blue-400">00:{String(autoCloseTimer).padStart(2, '0')}</span>
                    </div>
                </div>

                <div className="p-5 sm:p-7 max-h-[80vh] overflow-y-auto custom-scrollbar">

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Call Metadata Display */}
                    {/* Modern Metadata Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/40 border border-white/5 rounded-[20px] p-4 flex flex-col gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Phone</span>
                            <p className="text-sm font-bold text-white break-all leading-tight">
                                {callData.phoneNumber}
                            </p>
                        </div>
                        <div className="bg-slate-900/40 border border-white/5 rounded-[20px] p-4 flex flex-col gap-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Duration</span>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                <p className="text-sm font-bold text-white uppercase tabular-nums">
                                    {Math.floor(callData.duration / 60)}m {callData.duration % 60}s
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Identity Match Card */}
                    {matchedCustomer ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-[24px] p-5 flex items-start gap-4">
                            <div className="bg-green-500/20 p-2.5 rounded-full">
                                <User className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[9px] font-black text-green-400/80 uppercase tracking-widest block mb-1">✓ Matched Entity</span>
                                <p className="text-base font-extrabold text-white leading-tight">
                                    {matchedCustomer.company_name || matchedCustomer.customer_name}
                                </p>
                                {matchedContact && (
                                    <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                                        <FileText className="w-3 h-3 opacity-50" />
                                        {matchedContact.contact_name}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : !showCreateContact && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[24px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500/20 p-2 rounded-full">
                                    <UserPlus className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-sm font-bold text-white">No Contact Found</p>
                                    <p className="text-[10px] font-semibold text-slate-500">Add this number to SubSync?</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowCreateContact(true);
                                    handleInteraction();
                                }}
                                className="rounded-full h-10 px-6 font-black text-[10px] uppercase tracking-widest border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                            >
                                Create Contact
                            </Button>
                        </div>
                    )}

                    {/* Create New Contact Form */}
                    {showCreateContact && (
                        <div className="bg-blue-600/5 border border-blue-600/10 rounded-[24px] p-6 space-y-4 animate-in zoom-in-95">
                            <div className="flex items-center gap-2 mb-2">
                                <UserPlus className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">New Contact</span>
                            </div>
                            
                            <div className="grid gap-3">
                                <Input
                                    placeholder="Full Name *"
                                    value={newContactName}
                                    onChange={(e) => { setNewContactName(e.target.value); handleInteraction(); }}
                                    className="h-12 text-sm rounded-[14px] font-bold bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                                    required
                                />
                                <Input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={newContactEmail}
                                    onChange={(e) => { setNewContactEmail(e.target.value); handleInteraction(); }}
                                    className="h-12 text-sm rounded-[14px] font-bold bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setShowCreateContact(false);
                                        handleInteraction();
                                    }}
                                    className="flex-1 rounded-full text-[10px] font-black uppercase text-slate-500 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCreateContact}
                                    disabled={loading || !newContactName.trim()}
                                    className="flex-2 rounded-full h-11 bg-blue-600 hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                >
                                    {loading ? 'Processing...' : 'Save & Attach'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Form Fields Section */}
                    <div className="space-y-5">
                        <div className="space-y-2.5">
                            <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">
                                Call Notes <span className="text-blue-500">*</span>
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => { setNotes(e.target.value); handleInteraction(); }}
                                placeholder="What was discussed?"
                                rows={3}
                                required
                                className="rounded-[20px] p-4 text-sm font-bold bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none transition-all"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="outcome" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 pl-1">
                                Outcome (Optional)
                            </Label>
                            <Input
                                id="outcome"
                                value={outcome}
                                onChange={(e) => { setOutcome(e.target.value); handleInteraction(); }}
                                placeholder="e.g. Schedule follow-up"
                                className="h-12 px-4 rounded-[16px] text-sm font-bold bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Action Group */}
                    <div className="flex flex-col gap-3 group">
                        <Button
                            type="submit"
                            disabled={loading || !notes.trim()}
                            className="h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-full font-black uppercase text-[11px] tracking-[0.2em] text-white shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            {loading ? 'Finalizing Log...' : 'Add to DCR Entry'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleSkip}
                            className="h-12 rounded-full font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Log Later
                        </Button>
                    </div>
                </form>
                
                {/* Visual Footer Gradient */}
                <div className="h-2 bg-gradient-to-r from-blue-600/30 to-violet-600/30 w-full" />
            </div>
            </DialogContent>
        </Dialog>
    );
}
