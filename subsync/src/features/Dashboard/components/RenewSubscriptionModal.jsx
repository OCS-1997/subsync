import { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    RefreshCw,
    Clock,
    ShieldCheck,
    Loader2,
    Mail,
    Send,
    CheckCircle2,
    AlertTriangle,
    Eye,
    AtSign,
    ExternalLink
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';

export default function RenewSubscriptionModal({ isOpen, onClose, subscription, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [targetEndDate, setTargetEndDate] = useState('');
    const [cycleDescription, setCycleDescription] = useState('1 Year');

    // Email Preview state
    const [sendEmail, setSendEmail] = useState(true);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const debounceTimerRef = useRef(null);

    // Calculate initial renewal cycle and target date
    useEffect(() => {
        if (!subscription || !isOpen) return;

        const val = parseInt(subscription.repeat_every_value, 10) || 1;
        const unit = subscription.repeat_every_unit || 'years';

        const unitLabel = unit.charAt(0).toUpperCase() + unit.slice(1);
        setCycleDescription(`${val} ${unitLabel.replace(/s$/, val > 1 ? 's' : '')}`);

        // Calculate next cycle date based on renews in
        const now = new Date();
        const baseDate = subscription.end_date ? new Date(subscription.end_date) : now;

        const addInterval = (d) => {
            const next = new Date(d);
            if (unit === 'days') next.setDate(next.getDate() + val);
            else if (unit === 'weeks') next.setDate(next.getDate() + (val * 7));
            else if (unit === 'months') next.setMonth(next.getMonth() + val);
            else if (unit === 'years') next.setFullYear(next.getFullYear() + val);
            else next.setFullYear(next.getFullYear() + 1);
            return next;
        };

        let calculated = addInterval(baseDate);
        while (calculated <= now) {
            calculated = addInterval(calculated);
        }

        const year = calculated.getFullYear();
        const month = String(calculated.getMonth() + 1).padStart(2, '0');
        const day = String(calculated.getDate()).padStart(2, '0');
        const calculatedDateStr = `${year}-${month}-${day}`;

        setTargetEndDate(calculatedDateStr);
        setSendEmail(true);
        setRecipientEmail('');
        setPreviewData(null);

        // Fetch initial email preview with calculated date
        loadPreview(subscription.sub_id, calculatedDateStr);
    }, [subscription, isOpen]);

    // Fetch email preview from server
    const loadPreview = async (subId, endDateVal) => {
        if (!subId) return;
        try {
            setPreviewLoading(true);
            const response = await api.post(`/subscriptions/${subId}/renewal-preview`, {
                end_date: endDateVal || undefined
            });

            if (response.data && response.data.success) {
                setPreviewData(response.data);
                setRecipientEmail((prev) => (prev ? prev : (response.data.to || '')));
            }
        } catch (err) {
            console.error('Error fetching renewal email preview:', err);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Refetch preview when targetEndDate changes (debounced)
    const handleEndDateChange = (e) => {
        const newDate = e.target.value;
        setTargetEndDate(newDate);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (subscription?.sub_id && newDate) {
            debounceTimerRef.current = setTimeout(() => {
                loadPreview(subscription.sub_id, newDate);
            }, 500);
        }
    };

    const handleOpenInNewTab = () => {
        if (!previewData?.html) return;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(previewData.html);
            newWindow.document.close();
        }
    };

    const handleRenew = async () => {
        if (!subscription?.sub_id) return;
        if (!targetEndDate) {
            toast.error('Please select a valid new end date');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post(`/subscriptions/${subscription.sub_id}/renew`, {
                end_date: targetEndDate,
                send_email: sendEmail,
                recipient_email: sendEmail ? recipientEmail : null
            });

            if (response.data.success) {
                let msg = response.data.message || 'Subscription renewed! Reminders queued for next cycle.';
                if (sendEmail) {
                    if (response.data.emailSent) {
                        msg += ' Renewal confirmation email sent.';
                    } else if (response.data.emailError) {
                        msg += ` (Note: Email delivery failed: ${response.data.emailError})`;
                    }
                }
                toast.success(msg);
                if (onSuccess) {
                    onSuccess(response.data);
                }
                onClose();
            } else {
                toast.error(response.data.error || 'Failed to renew subscription');
            }
        } catch (error) {
            console.error('Error renewing subscription:', error);
            toast.error(error.response?.data?.error || 'Failed to renew subscription');
        } finally {
            setLoading(false);
        }
    };

    if (!subscription) return null;

    const currentEndDate = subscription.end_date
        ? new Date(subscription.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'N/A';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[96vw] max-w-[1600px] !max-w-[96vw] h-[92vh] max-h-[94vh] p-0 gap-0 flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
                    <DialogHeader className="space-y-0.5 text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                <RefreshCw className="w-4 h-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Renew Subscription
                                    <Badge variant="outline" className="text-[11px] font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                                        {subscription.domain_name}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                    Advance subscription cycle and review the full renewal confirmation email before sending.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body: Two columns on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden">
                    {/* Left Column: Renewal Configuration (4 cols) */}
                    <div className="lg:col-span-4 xl:col-span-4 p-5 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                        {/* Subscription Info Card */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {subscription.domain_name}
                                </p>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    {subscription.sub_id}
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{subscription.customer_name}</span>
                            </p>
                        </div>

                        {/* Cycle & Dates Breakdown */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800/60">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                    Current Expiry
                                </span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{currentEndDate}</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                                    Renewal Cycle
                                </span>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Renews in {cycleDescription}</span>
                                </div>
                            </div>
                        </div>

                        {/* Target End Date Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="newEndDate" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <span>New Expiry Date</span>
                                <span className="text-[10px] font-normal text-slate-400">Calculated from cycle</span>
                            </Label>
                            <Input
                                id="newEndDate"
                                type="date"
                                value={targetEndDate}
                                onChange={handleEndDateChange}
                                className="h-10 text-xs font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                            />
                        </div>

                        {/* Next cycle queueing notice */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Next cycle queueing</p>
                                <p className="text-[10px] text-blue-700/90 dark:text-blue-300/80 leading-normal mt-0.5">
                                    Status will be marked as <strong>Renewed</strong> and previous reminder jobs will be refreshed for this new cycle.
                                </p>
                            </div>
                        </div>

                        {/* Email Dispatch Settings */}
                        <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        Send Confirmation Email
                                    </span>
                                </div>
                                <Switch
                                    checked={sendEmail}
                                    onCheckedChange={setSendEmail}
                                    className="data-[state=checked]:bg-emerald-600"
                                />
                            </div>

                            {sendEmail ? (
                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                        <AtSign className="w-3 h-3 text-slate-400" />
                                        <span>Recipient Email(s)</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        value={recipientEmail}
                                        onChange={(e) => setRecipientEmail(e.target.value)}
                                        placeholder="customer@example.com (comma separated)"
                                        className="h-8 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg"
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Email will be dispatched to this address upon confirming renewal.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                    Email confirmation is turned off. The cycle will advance without sending an email.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Live Email Preview (8 cols, full height) */}
                    <div className="lg:col-span-8 xl:col-span-8 flex flex-col p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-900/50 min-h-0 h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                    Full Email Preview
                                </span>
                                <Badge variant="secondary" className="text-[10px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    renewal_confirmation
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {previewData?.html && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleOpenInNewTab}
                                        className="h-7 px-2 text-[11px] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        title="Open full email in new tab"
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        New Tab
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => loadPreview(subscription.sub_id, targetEndDate)}
                                    disabled={previewLoading || !subscription}
                                    className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                >
                                    <RefreshCw className={cn("w-3 h-3 mr-1", previewLoading && "animate-spin")} />
                                    Refresh Preview
                                </Button>
                            </div>
                        </div>

                        {/* Email Frame / Mockup */}
                        <div className="flex-1 min-h-0 h-full flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                            {/* Email Envelope Header */}
                            <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shrink-0">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-400 w-14 text-[11px]">To:</span>
                                    <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate font-semibold">
                                        {recipientEmail || previewData?.to || 'Not specified'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <span className="font-semibold text-slate-400 w-14 text-[11px]">Subject:</span>
                                    <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                                        {previewData?.subject || 'Renewal Confirmation'}
                                    </span>
                                </div>
                            </div>

                            {/* Email Body Preview (Iframe with full height scroll) */}
                            <div className="relative flex-1 min-h-0 h-full bg-slate-100/50 dark:bg-slate-950/50 p-2 sm:p-3 overflow-hidden flex flex-col">
                                {previewLoading && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 dark:bg-slate-950/85 backdrop-blur-xs z-10 gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Rendering renewal email preview...</span>
                                    </div>
                                )}

                                {!sendEmail && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-900/65 backdrop-blur-xs">
                                        <Mail className="w-10 h-10 text-slate-300 mb-2" />
                                        <p className="text-sm font-bold text-white">Email Notification Disabled</p>
                                        <p className="text-xs text-slate-300 max-w-xs mt-1 mb-3">
                                            This renewal will be recorded in the system without emailing the customer.
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => setSendEmail(true)}
                                            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Turn Email Back On
                                        </Button>
                                    </div>
                                )}

                                {previewData?.html ? (
                                    <iframe
                                        title="Renewal Email Preview"
                                        srcDoc={previewData.html}
                                        className="w-full flex-1 h-full min-h-0 border-0 bg-white rounded-lg shadow-xs"
                                    />
                                ) : !previewLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full p-6 text-slate-400 text-xs gap-2">
                                        <AlertTriangle className="w-8 h-8 text-amber-500" />
                                        <span>Preview not available yet</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadPreview(subscription.sub_id, targetEndDate)}
                                            className="text-xs mt-1"
                                        >
                                            Retry Preview
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
                        {sendEmail
                            ? 'The renewal confirmation email will be delivered automatically upon confirmation.'
                            : 'Renewal only: no email notifications will be dispatched.'}
                    </p>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 sm:flex-initial h-9 px-4 text-xs rounded-xl text-slate-600 dark:text-slate-400"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleRenew}
                            disabled={loading || !targetEndDate}
                            className="flex-1 sm:flex-initial h-9 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    {sendEmail ? 'Renewing & Sending...' : 'Renewing...'}
                                </>
                            ) : sendEmail ? (
                                <>
                                    <Send className="w-3.5 h-3.5 mr-1.5" />
                                    Confirm Renewal & Send Email
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    Confirm Renewal Only
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
