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
                className="w-[95vw] max-w-lg p-4 sm:p-6 dark:bg-slate-900 border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                onPointerDown={handleInteraction}
                onKeyDown={handleInteraction}
            >
                <DialogHeader className="pb-3 sm:pb-4 border-b border-slate-800">
                    <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                        Log Call to DCR
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-400 mt-1">
                        Auto-dismiss in {autoCloseTimer}s
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pt-2">
                    {/* Call Metadata Display */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl">
                        <div className="space-y-1">
                            <Label className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Phone Number
                            </Label>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-all">
                                {callData.phoneNumber}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Duration
                            </Label>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-500" />
                                {Math.floor(callData.duration / 60)}m {callData.duration % 60}s
                            </p>
                        </div>
                    </div>

                    {/* Matched Customer/Contact Display */}
                    {matchedCustomer && (
                        <div className="p-3 sm:p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl sm:rounded-2xl animate-in fade-in slide-in-from-top-2">
                            <Label className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-2 block">
                                ✓ Matched Customer
                            </Label>
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {matchedCustomer.company_name || matchedCustomer.customer_name}
                            </p>
                            {matchedContact && (
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                    {matchedContact.contact_name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* No Match - Create New Contact Option */}
                    {!matchedCustomer && !showCreateContact && (
                        <div className="p-3 sm:p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-xl sm:rounded-2xl space-y-3">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                ⚠ No customer match found
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowCreateContact(true);
                                    handleInteraction();
                                }}
                                className="w-full h-9 sm:h-10 rounded-lg font-bold text-xs border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create New Contact
                            </Button>
                        </div>
                    )}

                    {/* Create New Contact Form */}
                    {showCreateContact && (
                        <div className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-500/20 rounded-xl sm:rounded-2xl space-y-3">
                            <Label className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                <UserPlus className="w-3 h-3 inline mr-1" />
                                New Contact Details
                            </Label>
                            
                            <div className="space-y-2">
                                <Input
                                    placeholder="Contact Name *"
                                    value={newContactName}
                                    onChange={(e) => { setNewContactName(e.target.value); handleInteraction(); }}
                                    className="h-9 sm:h-10 text-xs sm:text-sm rounded-lg font-semibold bg-white dark:bg-slate-950"
                                    required
                                />
                                <Input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={newContactEmail}
                                    onChange={(e) => { setNewContactEmail(e.target.value); handleInteraction(); }}
                                    className="h-9 sm:h-10 text-xs sm:text-sm rounded-lg font-semibold bg-white dark:bg-slate-950"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowCreateContact(false);
                                        handleInteraction();
                                    }}
                                    className="flex-1 h-9 rounded-lg text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={handleCreateContact}
                                    disabled={loading || !newContactName.trim()}
                                    className="flex-1 h-9 rounded-lg text-xs bg-blue-600 hover:bg-blue-700"
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {loading ? 'Creating...' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Notes Field (Required) */}
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Call Notes <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => { setNotes(e.target.value); handleInteraction(); }}
                            placeholder="What was discussed during the call?"
                            rows={3}
                            required
                            className="rounded-lg sm:rounded-xl p-3 sm:p-4 font-semibold text-xs sm:text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 resize-none"
                        />
                    </div>

                    {/* Outcome Field (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="outcome" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Outcome (Optional)
                        </Label>
                        <Input
                            id="outcome"
                            value={outcome}
                            onChange={(e) => { setOutcome(e.target.value); handleInteraction(); }}
                            placeholder="e.g., Follow-up scheduled, Deal closed"
                            className="h-10 sm:h-11 px-3 sm:px-4 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
                        />
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            className="w-full sm:flex-1 h-11 sm:h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-transform"
                        >
                            Skip for Later
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !notes.trim()}
                            className="w-full sm:flex-1 h-11 sm:h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
                        >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {loading ? 'Logging...' : 'Log Call'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
