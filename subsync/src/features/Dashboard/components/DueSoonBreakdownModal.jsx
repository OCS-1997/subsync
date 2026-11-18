import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import {
    Clock,
    Calendar,
    AlertTriangle,
    RefreshCw,
    Search,
    ArrowRight,
    CheckCircle2,
    Loader2,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import { toast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import RenewSubscriptionModal from './RenewSubscriptionModal';

export default function DueSoonBreakdownModal({ isOpen, onClose, stats, onNavigateToTable, onRefreshStats }) {
    const [loading, setLoading] = useState(false);
    const [subscriptions, setSubscriptions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeBucket, setTimeBucket] = useState('all'); // 'all', '7d', '15d', '30d'
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [subToRenew, setSubToRenew] = useState(null);

    const loadDueSoonSubscriptions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/dashboard/renewals', { params: { filterType: 'expiring' } });
            setSubscriptions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load due soon subscriptions:', err);
            toast.error('Failed to load due soon subscriptions breakdown');
            setSubscriptions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadDueSoonSubscriptions();
        }
    }, [isOpen]);

    const handleOpenRenew = (sub, e) => {
        if (e) e.stopPropagation();
        setSubToRenew(sub);
        setRenewModalOpen(true);
    };

    const handleRenewSuccess = () => {
        loadDueSoonSubscriptions();
        if (onRefreshStats) onRefreshStats();
    };

    const formatCurrency = (value) => {
        const num = parseFloat(value || 0);
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
        if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
        return `₹${num.toFixed(2)}`;
    };

    // Filter subscriptions by bucket & search query
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter(sub => {
            const days = Number(sub.days_left !== undefined ? sub.days_left : 30);

            // Bucket filter
            if (timeBucket === '7d' && days > 7) return false;
            if (timeBucket === '15d' && (days <= 7 || days > 15)) return false;
            if (timeBucket === '30d' && (days <= 15 || days > 30)) return false;

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const domain = (sub.domain_name || '').toLowerCase();
                const customer = (sub.customer_name || '').toLowerCase();
                const service = (sub.services || []).some(s => (s.service_name || s.name || '').toLowerCase().includes(q));
                return domain.includes(q) || customer.includes(q) || service;
            }

            return true;
        });
    }, [subscriptions, timeBucket, searchQuery]);

    // Metric aggregates
    const criticalCount = subscriptions.filter(s => Number(s.days_left) <= 7).length;
    const midCount = subscriptions.filter(s => Number(s.days_left) > 7 && Number(s.days_left) <= 15).length;
    const laterCount = subscriptions.filter(s => Number(s.days_left) > 15).length;
    const totalPotentialRevenue = subscriptions.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Due Soon Subscriptions Breakdown
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500 font-medium">
                                    Detailed timeline analysis, upcoming renewal risks, and quick renewal actions for contracts expiring within 30 days.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Summary Metrics Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        <div 
                            onClick={() => setTimeBucket('7d')}
                            className={cn(
                                "p-4 rounded-2xl border transition-all cursor-pointer",
                                timeBucket === '7d' 
                                    ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                                    : "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                            )}
                        >
                            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                                <span className="text-[10px] font-black uppercase tracking-wider">Critical (≤ 7 Days)</span>
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-black mt-2 text-rose-700 dark:text-rose-300">
                                {criticalCount}
                            </p>
                            <p className="text-[10px] text-rose-500/80 font-bold mt-0.5">Immediate attention</p>
                        </div>

                        <div 
                            onClick={() => setTimeBucket('15d')}
                            className={cn(
                                "p-4 rounded-2xl border transition-all cursor-pointer",
                                timeBucket === '15d' 
                                    ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20"
                                    : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                            )}
                        >
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                                <span className="text-[10px] font-black uppercase tracking-wider">8 – 15 Days</span>
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-black mt-2 text-amber-700 dark:text-amber-300">
                                {midCount}
                            </p>
                            <p className="text-[10px] text-amber-500/80 font-bold mt-0.5">Approaching deadline</p>
                        </div>

                        <div 
                            onClick={() => setTimeBucket('30d')}
                            className={cn(
                                "p-4 rounded-2xl border transition-all cursor-pointer",
                                timeBucket === '30d' 
                                    ? "bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                                    : "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10"
                            )}
                        >
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                                <span className="text-[10px] font-black uppercase tracking-wider">16 – 30 Days</span>
                                <Calendar className="w-4 h-4" />
                            </div>
                            <p className="text-2xl font-black mt-2 text-blue-700 dark:text-blue-300">
                                {laterCount}
                            </p>
                            <p className="text-[10px] text-blue-500/80 font-bold mt-0.5">Upcoming cycle</p>
                        </div>

                        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                <span className="text-[10px] font-black uppercase tracking-wider">Total Value</span>
                                <span className="text-xs font-mono font-bold">₹</span>
                            </div>
                            <p className="text-2xl font-black mt-2 text-emerald-700 dark:text-emerald-300">
                                {formatCurrency(totalPotentialRevenue)}
                            </p>
                            <p className="text-[10px] text-emerald-500/80 font-bold mt-0.5">{subscriptions.length} contracts due</p>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-full sm:w-auto">
                            <button
                                onClick={() => setTimeBucket('all')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    timeBucket === 'all'
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                All (30 Days)
                            </button>
                            <button
                                onClick={() => setTimeBucket('7d')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    timeBucket === '7d'
                                        ? "bg-rose-500 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                ≤ 7 Days ({criticalCount})
                            </button>
                            <button
                                onClick={() => setTimeBucket('15d')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    timeBucket === '15d'
                                        ? "bg-amber-500 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                8 – 15 Days ({midCount})
                            </button>
                            <button
                                onClick={() => setTimeBucket('30d')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    timeBucket === '30d'
                                        ? "bg-blue-500 text-white shadow-sm"
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                            >
                                16 – 30 Days ({laterCount})
                            </button>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search domain or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs bg-slate-100 dark:bg-slate-800/60 border-0 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Subscriptions List */}
                    <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                                <span className="text-xs font-bold">Scanning upcoming contracts...</span>
                            </div>
                        ) : filteredSubscriptions.length === 0 ? (
                            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Subscriptions Due In This Filter</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {searchQuery ? "Try refining your search terms." : "All contracts in this timeframe are renewed or active."}
                                </p>
                            </div>
                        ) : (
                            filteredSubscriptions.map((sub) => {
                                const days = Number(sub.days_left !== undefined ? sub.days_left : 0);
                                const isCritical = days <= 7;
                                const isWarning = days > 7 && days <= 15;

                                return (
                                    <div
                                        key={sub.sub_id}
                                        className={cn(
                                            "flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:scale-[1.008]",
                                            isCritical 
                                                ? "bg-rose-500/[0.03] border-rose-200 dark:border-rose-900/40 hover:bg-rose-500/[0.07]"
                                                : isWarning 
                                                    ? "bg-amber-500/[0.03] border-amber-200 dark:border-amber-900/40 hover:bg-amber-500/[0.07]"
                                                    : "bg-slate-50/70 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                                        )}
                                    >
                                        <div className="min-w-0 flex-1 pr-3">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                    {sub.domain_name}
                                                </h4>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[9px] font-black px-2 py-0.5",
                                                        isCritical 
                                                            ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                            : isWarning
                                                                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                                                : "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                                    )}
                                                >
                                                    {days === 0 ? "Expires Today" : `${days}d left`}
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] text-slate-500 truncate mt-1">
                                                {sub.customer_name} • Ends: {new Date(sub.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                {sub.repeat_every_value && (
                                                    <span className="text-slate-400 ml-1">
                                                        • Cycle: {sub.repeat_every_value} {sub.repeat_every_unit}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {sub.total && (
                                                <span className="font-black text-sm text-slate-900 dark:text-white">
                                                    ₹{parseFloat(sub.total).toFixed(2)}
                                                </span>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => handleOpenRenew(sub, e)}
                                                className="h-8 px-3 text-xs font-bold border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span>Renew</span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs text-slate-400 font-medium">
                            Showing {filteredSubscriptions.length} of {subscriptions.length} expiring contracts
                        </span>
                        <div className="flex items-center gap-3">
                            {onNavigateToTable && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        onClose();
                                        onNavigateToTable();
                                    }}
                                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                >
                                    Filter Table to Due Soon <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClose}
                                className="rounded-xl px-5 text-xs font-bold"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Quick Renew Modal inside breakdown */}
            <RenewSubscriptionModal
                isOpen={renewModalOpen}
                onClose={() => setRenewModalOpen(false)}
                subscription={subToRenew}
                onSuccess={handleRenewSuccess}
            />
        </>
    );
}
