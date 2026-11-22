import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Package, Calendar, TrendingUp, AlertTriangle, Filter,
    CheckCircle, CheckCircle2, XCircle, Clock, ArrowRight, RefreshCw, Search, Mail, Loader2, Maximize2,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, ChevronDown
} from 'lucide-react';
import RevenueBreakdownModal from '../RevenueBreakdownModal';
import RenewSubscriptionModal from '../RenewSubscriptionModal';
import DueSoonBreakdownModal from '../DueSoonBreakdownModal';
import { toast } from '@/utils/toast';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const STATUS_COLORS = {
    active: '#10b981',
    renewed: '#059669',
    expired: '#ef4444',
    'expiring soon': '#f59e0b',
    soon: '#f59e0b'
};

const getMonthNames = () => {
    const now = new Date();
    const currentShort = now.toLocaleString('en-US', { month: 'short' });
    const currentLong = now.toLocaleString('en-US', { month: 'long' });
    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextShort = nextDate.toLocaleString('en-US', { month: 'short' });
    const nextLong = nextDate.toLocaleString('en-US', { month: 'long' });
    return { currentShort, currentLong, nextShort, nextLong };
};

const { currentShort, currentLong, nextShort, nextLong } = getMonthNames();

const FILTER_OPTIONS = [
    { id: 'today', label: 'Today', icon: AlertTriangle },
    { id: 'this_month', label: `This Month (${currentShort})`, icon: Calendar },
    { id: 'next_month', label: `Next Month (${nextShort})`, icon: Calendar },
    { id: 'expired', label: 'Expired', icon: XCircle },
    { id: 'renewed', label: 'Renewed', icon: RefreshCw },
    { id: 'custom', label: 'Custom', icon: Calendar },
];

function SubscriptionsTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [renewalsLoading, setRenewalsLoading] = useState(false);
    const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [isDueSoonModalOpen, setIsDueSoonModalOpen] = useState(false);
    const [subToRenew, setSubToRenew] = useState(null);

    // Helper to check if widget is visible
    const isWidgetVisible = (widgetKey) => {
        if (visibleWidgets === undefined || visibleWidgets === null) return true;
        return visibleWidgets.has(widgetKey);
    };

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        renewed: 0,
        expiringSoon: 0,
        expiringThisMonth: 0,
        expiringNextMonth: 0,
        expiringIn7Days: 0,
        expiringIn15Days: 0,
        expiringSoonRevenue: 0,
        totalRevenue: 0
    });
    const [renewals, setRenewals] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [activeFilter, setActiveFilter] = useState('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const listTopRef = useRef(null);
    const [sendingReminder, setSendingReminder] = useState(null); // Track which sub is sending

    // Reset pagination on filter or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, searchQuery, dateFrom, dateTo]);

    // Send reminder email for a subscription
    const sendReminder = async (subId, e) => {
        e.stopPropagation(); // Prevent navigation
        try {
            setSendingReminder(subId);
            const response = await api.post(`/subscription/${subId}/reminder`);
            if (response.data.success) {
                toast.success('Reminder email sent successfully!');
            } else {
                toast.error(response.data.error || 'Failed to send reminder');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            toast.error(error.response?.data?.error || 'Failed to send reminder email');
        } finally {
            setSendingReminder(null);
        }
    };

    // Open renew modal for a subscription
    const handleOpenRenewModal = (sub, e) => {
        if (e) e.stopPropagation();
        setSubToRenew(sub);
        setIsRenewModalOpen(true);
    };

    // When subscription is renewed successfully
    const handleRenewSuccess = () => {
        loadRenewals();
        loadDashboardStats();
    };

    useEffect(() => {
        loadDashboardStats();
    }, []);

    useEffect(() => {
        if (activeFilter === 'custom' && !dateFrom && !dateTo) {
            return;
        }
        loadRenewals();
    }, [activeFilter, dateFrom, dateTo]);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const dashRes = await api.get('/dashboard');
            const dashData = dashRes.data;

            const active = dashData.stats?.activeSubscriptions || 0;
            const expiredCount = dashData.stats?.expiredCount || 0;
            const renewedCount = dashData.stats?.renewedCount || 0;
            const expiringSoon = dashData.stats?.expiringSoonCount || dashData.renewals?.expiringSoonCount || 0;
            const expiringThisMonth = dashData.stats?.expiringThisMonthCount || dashData.renewals?.expiringThisMonthCount || 0;
            const expiringNextMonth = dashData.stats?.expiringNextMonthCount || 0;
            const expiringIn7Days = dashData.stats?.expiringIn7DaysCount || 0;
            const expiringIn15Days = dashData.stats?.expiringIn15DaysCount || 0;
            const expiringSoonRevenue = dashData.stats?.expiringSoonRevenue || 0;

            setStats({
                total: active + expiredCount,
                active,
                expired: expiredCount,
                renewed: renewedCount,
                expiringSoon,
                expiringThisMonth,
                expiringNextMonth,
                expiringIn7Days,
                expiringIn15Days,
                expiringSoonRevenue,
                totalRevenue: dashData.stats?.monthlyRevenue || 0
            });

            // Build status distribution for pie chart (including Renewed)
            setStatusDistribution([
                { name: 'Active', value: active, color: STATUS_COLORS.active },
                { name: 'Renewed', value: renewedCount, color: STATUS_COLORS.renewed },
                { name: 'Expired', value: expiredCount, color: STATUS_COLORS.expired },
                { name: 'Expiring Soon', value: expiringSoon, color: STATUS_COLORS['expiring soon'] }
            ].filter(item => item.value > 0));

        } catch (err) {
            console.error('Error loading dashboard stats:', err);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const loadRenewals = async () => {
        try {
            setRenewalsLoading(true);
            const params = { filterType: activeFilter };
            if (activeFilter === 'custom') {
                if (dateFrom && dateTo) {
                    const start = dateFrom <= dateTo ? dateFrom : dateTo;
                    const end = dateFrom <= dateTo ? dateTo : dateFrom;
                    params.startDate = start;
                    params.endDate = end;
                } else if (dateFrom) {
                    params.startDate = dateFrom;
                } else if (dateTo) {
                    params.endDate = dateTo;
                }
            }

            const response = await api.get('/dashboard/renewals', { params });
            setRenewals(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error loading renewals:', err);
            toast.error('Failed to load renewals data');
            setRenewals([]);
        } finally {
            setRenewalsLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    // Filter subscriptions based on search query
    const filteredSubscriptions = renewals.filter(sub => {
        // Exclude expired contracts only from forward-looking filters (today, this_month, next_month)
        if (['today', 'this_month', 'next_month'].includes(activeFilter)) {
            if (sub.days_left < 0 || sub.renewal_status === 'expired' || sub.status === 'expired') {
                return false;
            }
        }
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            sub.domain_name?.toLowerCase().includes(query) ||
            sub.customer_name?.toLowerCase().includes(query) ||
            sub.services?.some(s => (s.service_name || s.name)?.toLowerCase().includes(query))
        );
    });

    // Pagination calculations
    const totalRecords = filteredSubscriptions.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, endIndex);

    const changePage = (newPage) => {
        const target = Math.max(1, Math.min(totalPages, newPage));
        setCurrentPage(target);
        if (listTopRef.current) {
            listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };

    const getStatusBadge = (sub) => {
        const days = sub.days_left;
        if (sub.renewal_status === 'renewed' || sub.status === 'renewed') {
            return (
                <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                    Renewed
                </Badge>
            );
        }
        if (days < 0 || sub.renewal_status === 'expired') {
            return (
                <Badge variant="outline" className="border-rose-500/50 text-rose-500 dark:text-rose-400 text-[9px]">
                    Expired {Math.abs(days)}d ago
                </Badge>
            );
        }
        if (days === 0 || sub.renewal_status === 'today') {
            return (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 dark:text-amber-400 text-[9px]">
                    Expires Today
                </Badge>
            );
        }
        if (days <= 7) {
            return (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 dark:text-amber-400 text-[9px]">
                    {days}d left
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="border-blue-500/50 text-blue-500 dark:text-blue-400 text-[9px]">
                {days}d left
            </Badge>
        );
    };

    if (loading) {
        return (
            <BentoGrid columns={4}>
                {[...Array(6)].map((_, i) => (
                    <BentoCard key={i} loading size={i < 4 ? "sm" : "md"} />
                ))}
            </BentoGrid>
        );
    }

    return (
        <>
        <BentoGrid columns={4}>
            {/* Stats Row */}
            <BentoCard size="sm" icon={Package} title="Total">
                <StatCard
                    value={stats.total}
                    label="All Subscriptions"
                    variant="blue"
                />
            </BentoCard>

            <BentoCard size="sm" icon={CheckCircle} title="Active">
                <StatCard
                    value={stats.active}
                    label="Active Contracts"
                    variant="emerald"
                />
            </BentoCard>

            <BentoCard 
                size="sm" 
                icon={XCircle} 
                title="Expired"
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 h-6 px-2 rounded-lg flex items-center gap-1"
                        onClick={() => setActiveFilter('expired')}
                    >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                    </Button>
                }
            >
                <div 
                    onClick={() => setActiveFilter('expired')}
                    className="cursor-pointer group h-full flex flex-col justify-between"
                >
                    <StatCard
                        value={stats.expired}
                        label="Expired Contracts"
                        variant="rose"
                    />
                </div>
            </BentoCard>

            <BentoCard 
                size="sm" 
                icon={Clock} 
                title="Expiring Soon"
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-6 px-2 rounded-lg flex items-center gap-1"
                        onClick={() => setIsDueSoonModalOpen(true)}
                    >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                    </Button>
                }
            >
                <div 
                    onClick={() => setIsDueSoonModalOpen(true)}
                    className="cursor-pointer group h-full flex flex-col justify-between"
                >
                    <StatCard
                        value={stats.expiringSoon}
                        label="Due Soon"
                        variant="amber"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-amber-500/15">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            {stats.expiringIn7Days || 0} in ≤7d
                        </span>
                        {stats.expiringSoonRevenue > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                {formatCurrency(stats.expiringSoonRevenue)}
                            </span>
                        )}
                    </div>
                </div>
            </BentoCard>

            {/* Subscriptions List with Filters - FULL WIDTH */}
            <BentoCard
                size="full"
                icon={Calendar}
                title="Subscriptions & Renewals"
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => navigate(`/${user.username}/dashboard/subscriptions`)}
                    >
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                }
            >
                {/* Filter Tabs & Search */}
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex-wrap">
                            {FILTER_OPTIONS.map((filter) => {
                                const Icon = filter.icon;
                                return (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                            activeFilter === filter.id
                                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative w-full sm:w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs bg-slate-100 dark:bg-slate-800/50 border-0 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Date Range Filter - Show when Custom is selected */}
                    {activeFilter === 'custom' && (
                        <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/30 rounded-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">From:</span>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="h-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-36"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">To:</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="h-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-36"
                                />
                            </div>
                            {dateFrom && dateTo && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 h-8 px-2"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Subscriptions List */}
                <TooltipProvider delayDuration={200}>
                    {renewalsLoading ? (
                        <div className="flex items-center justify-center h-32 text-slate-500 text-sm gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span>Loading subscriptions...</span>
                        </div>
                    ) : filteredSubscriptions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-2">
                            {activeFilter === 'today' ? (
                                <>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        No Subscriptions Expiring Today
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                        All systems clear! There are currently no subscriptions scheduled to expire today.
                                    </p>
                                </>
                            ) : activeFilter === 'expired' ? (
                                <>
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-sm">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        No Expired Subscriptions
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                        All subscriptions are up to date! There are currently no expired contracts.
                                    </p>
                                </>
                            ) : activeFilter === 'custom' && !dateFrom && !dateTo ? (
                                <div className="text-slate-500 text-sm py-4">
                                    Please select a date range to view subscriptions
                                </div>
                            ) : (
                                <div className="text-slate-500 text-sm py-4">
                                    No subscriptions found for {FILTER_OPTIONS.find(f => f.id === activeFilter)?.label || 'this filter'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2 pr-1" ref={listTopRef}>
                            {paginatedSubscriptions.map((sub, i) => (
                                <Tooltip key={sub.sub_id || i}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-all hover:scale-[1.01]"
                                            onClick={() => navigate(`/${user.username}/dashboard/subscriptions/${sub.sub_id}`)}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {sub.domain_name}
                                                    </p>
                                                    {getStatusBadge(sub)}
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    {sub.customer_name} • Ends: {new Date(sub.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {sub.repeat_every_value && (
                                                        <span className="text-slate-400 dark:text-slate-500 ml-1">
                                                            • Renews in {sub.repeat_every_value} {sub.repeat_every_unit}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                                                {sub.total && (
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                        {formatCurrency(parseFloat(sub.total))}
                                                    </span>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2.5 text-[10px] font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                                                    onClick={(e) => handleOpenRenewModal(sub, e)}
                                                    title="Mark as Renewed & Queue Next Cycle"
                                                >
                                                    <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    <span>Renew</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        align="center"
                                        sideOffset={8}
                                        collisionPadding={20}
                                        className="max-w-sm bg-slate-900 dark:bg-slate-800 border-slate-700 p-4 rounded-xl z-50 shadow-2xl"
                                    >
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-bold text-white">{sub.domain_name}</p>
                                                <p className="text-[10px] text-slate-400">{sub.customer_name}</p>
                                            </div>

                                            {/* Services List */}
                                            {sub.services && sub.services.length > 0 && (
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Services</p>
                                                    <div className="space-y-1">
                                                        {sub.services.slice(0, 4).map((service, idx) => (
                                                             <div key={idx} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-slate-800/50">
                                                                <span className="text-slate-300 truncate max-w-[140px]">{service.service_name || 'Unnamed Service'}</span>
                                                                <span className="text-emerald-400 font-bold shrink-0 ml-2">₹{service.amount || service.rate || 0}</span>
                                                            </div>
                                                        ))}
                                                        {sub.services.length > 4 && (
                                                            <p className="text-[9px] text-slate-500 text-center">+{sub.services.length - 4} more services</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Status & Dates */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="p-2 rounded-lg bg-slate-800/50">
                                                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Start</p>
                                                    <p className="text-xs text-slate-300">{sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-slate-800/50">
                                                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">End</p>
                                                    <p className={cn(
                                                        "text-xs font-bold",
                                                        sub.renewal_status === 'renewed' || sub.status === 'renewed' ? "text-emerald-400" :
                                                        sub.days_left < 0 ? "text-rose-400" : sub.days_left <= 7 ? "text-amber-400" : "text-blue-400"
                                                    )}>
                                                        {sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Days Info & Total */}
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                                                <div>
                                                    <span className="text-[9px] text-slate-500 block">Status</span>
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        sub.renewal_status === 'renewed' || sub.status === 'renewed' ? "text-emerald-400" :
                                                        sub.days_left < 0 ? "text-rose-400" : sub.days_left <= 7 ? "text-amber-400" : "text-blue-400"
                                                    )}>
                                                        {sub.renewal_status === 'renewed' || sub.status === 'renewed' ? 'Renewed' :
                                                            sub.days_left < 0 ? `Expired ${Math.abs(sub.days_left)}d ago` :
                                                            sub.days_left === 0 ? 'Expires Today!' :
                                                                `${sub.days_left}d remaining`}
                                                    </span>
                                                </div>
                                                {sub.total && (
                                                    <div className="text-right">
                                                        <span className="text-[9px] text-slate-500 block">Total</span>
                                                        <span className="text-sm font-bold text-emerald-400">₹{parseFloat(sub.total).toLocaleString('en-IN')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions: Renew Button along with Send Reminder Button */}
                                            <div className="flex gap-2 mt-3 pt-2 border-t border-slate-700/60">
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg h-8 shadow-sm transition-all active:scale-95"
                                                    onClick={(e) => handleOpenRenewModal(sub, e)}
                                                >
                                                    <RefreshCw className="w-3 h-3 mr-1.5" />
                                                    Mark as Renewed
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg h-8 shadow-sm transition-all active:scale-95"
                                                    onClick={(e) => sendReminder(sub.sub_id, e)}
                                                    disabled={sendingReminder === sub.sub_id}
                                                >
                                                    {sendingReminder === sub.sub_id ? (
                                                        <>
                                                            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mail className="w-3 h-3 mr-1.5" />
                                                            Send Reminder
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {/* Pagination Toolbar */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-200/80 dark:border-slate-800">
                                    {/* Record Range & Page Size */}
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                            Showing <strong className="text-slate-800 dark:text-slate-200">{startIndex + 1}</strong>–<strong className="text-slate-800 dark:text-slate-200">{endIndex}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> {activeFilter === 'expired' ? 'expired contracts' : 'items'}
                                        </span>
                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium pl-2 border-l border-slate-200 dark:border-slate-800">
                                            <span>Per page:</span>
                                            {[10, 25, 50].map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        setPageSize(size);
                                                        setCurrentPage(1);
                                                    }}
                                                    className={cn(
                                                        "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                                                        pageSize === size
                                                            ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                                                    )}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Navigation Buttons: Prev / Next / First / Last */}
                                    <div className="flex items-center gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(1)}
                                            disabled={safeCurrentPage <= 1}
                                            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
                                            title="First Page"
                                        >
                                            <ChevronsLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(safeCurrentPage - 1)}
                                            disabled={safeCurrentPage <= 1}
                                            className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 flex items-center gap-1"
                                            title="Previous Page (Move up list)"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                            <span>Prev</span>
                                        </Button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-1 px-1">
                                            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                                                .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                                                .reduce((acc, p, i, arr) => {
                                                    if (i > 0 && p - arr[i - 1] > 1) {
                                                        acc.push(-1 * p);
                                                    }
                                                    acc.push(p);
                                                    return acc;
                                                }, [])
                                                .map((p, idx) => {
                                                    if (p < 0) {
                                                        return <span key={`ellipsis-${idx}`} className="text-slate-400 px-1 text-xs">…</span>;
                                                    }
                                                    return (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => changePage(p)}
                                                            className={cn(
                                                                "h-8 min-w-8 px-2 rounded-lg text-xs font-bold transition-all",
                                                                safeCurrentPage === p
                                                                    ? "bg-blue-600 text-white shadow-sm"
                                                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                            )}
                                                        >
                                                            {p}
                                                        </button>
                                                    );
                                                })}
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(safeCurrentPage + 1)}
                                            disabled={safeCurrentPage >= totalPages}
                                            className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 flex items-center gap-1"
                                            title="Next Page (Move down list)"
                                        >
                                            <span>Next</span>
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(totalPages)}
                                            disabled={safeCurrentPage >= totalPages}
                                            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-30"
                                            title="Last Page"
                                        >
                                            <ChevronsRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </TooltipProvider>
            </BentoCard>

            {/* Status Distribution Chart & Revenue Row */}
            <BentoCard
                size="md"
                icon={TrendingUp}
                title="Status Distribution"
            >
                {statusDistribution.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                                }}
                                itemStyle={{
                                    color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                                }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '10px' }}
                                formatter={(value) => <span className="text-slate-600 dark:text-slate-300">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </BentoCard>

            {/* Revenue Card */}
            <BentoCard size="md" icon={TrendingUp} title="Monthly Revenue">
                <div className="flex flex-col justify-center h-full">
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">
                        This Month's Subscription Revenue ({currentLong})
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <Button
                            onClick={() => setIsRevenueModalOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl px-5 h-10 font-black text-[10px] uppercase tracking-widest text-white shadow-md shadow-blue-500/20"
                        >
                            <Maximize2 className="w-4 h-4 mr-2" /> View Detailed Breakdown
                        </Button>
                        <Button
                            onClick={() => navigate(`/${user.username}/dashboard/subscriptions`)}
                            variant="outline"
                            className="rounded-2xl px-5 h-10 font-black text-[10px] uppercase tracking-widest"
                        >
                            <Package className="w-4 h-4 mr-2" /> Manage Subscriptions
                        </Button>
                    </div>
                </div>
            </BentoCard>
        </BentoGrid>

        <RevenueBreakdownModal 
            isOpen={isRevenueModalOpen} 
            onClose={() => setIsRevenueModalOpen(false)} 
        />

        <RenewSubscriptionModal
            isOpen={isRenewModalOpen}
            onClose={() => {
                setIsRenewModalOpen(false);
                setSubToRenew(null);
            }}
            subscription={subToRenew}
            onSuccess={handleRenewSuccess}
        />

        <DueSoonBreakdownModal
            isOpen={isDueSoonModalOpen}
            onClose={() => setIsDueSoonModalOpen(false)}
            stats={stats}
            onNavigateToTable={() => setActiveFilter('this_month')}
            onRefreshStats={() => {
                loadRenewals();
                loadDashboardStats();
            }}
        />
        </>
    );
}

export default SubscriptionsTab;
