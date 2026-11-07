import { useState, useEffect } from 'react';
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
import { RefreshCw, Calendar, CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/axiosInstance';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

export default function RenewSubscriptionModal({ isOpen, onClose, subscription, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [targetEndDate, setTargetEndDate] = useState('');
    const [cycleDescription, setCycleDescription] = useState('1 Year');

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
        // If base date was in past, advance until future
        while (calculated <= now) {
            calculated = addInterval(calculated);
        }

        // Format to YYYY-MM-DD
        const year = calculated.getFullYear();
        const month = String(calculated.getMonth() + 1).padStart(2, '0');
        const day = String(calculated.getDate()).padStart(2, '0');
        setTargetEndDate(`${year}-${month}-${day}`);
    }, [subscription, isOpen]);

    const handleRenew = async () => {
        if (!subscription?.sub_id) return;
        if (!targetEndDate) {
            toast.error('Please select a valid new end date');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post(`/subscriptions/${subscription.sub_id}/renew`, {
                end_date: targetEndDate
            });

            if (response.data.success) {
                toast.success(response.data.message || 'Subscription marked as renewed! Reminders queued for next cycle.');
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
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                Renew Subscription
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                Advance cycle and queue reminder notifications for the next period.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 my-2">
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
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {currentEndDate}
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                                Renewal Cycle
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                <RefreshCw className="w-3.5 h-3.5" />
                                Renews in {cycleDescription}
                            </div>
                        </div>
                    </div>

                    {/* Target End Date Input */}
                    <div className="space-y-1.5">
                        <Label htmlFor="newEndDate" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>New Expiry Date</span>
                            <span className="text-[10px] font-normal text-slate-400">Calculated from cycle</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="newEndDate"
                                type="date"
                                value={targetEndDate}
                                onChange={(e) => setTargetEndDate(e.target.value)}
                                className="h-10 text-xs font-semibold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Next cycle queueing</p>
                            <p className="text-[10px] text-blue-700/90 dark:text-blue-300/80 leading-normal mt-0.5">
                                Status will be marked as <strong>Renewed</strong> and previous reminder jobs will be refreshed for this new cycle.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex items-center gap-2 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 h-9 text-xs rounded-xl text-slate-600 dark:text-slate-400"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleRenew}
                        disabled={loading || !targetEndDate}
                        className="flex-1 h-9 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Renewing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                Confirm Renewal
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
