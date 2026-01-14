import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Package, Calendar, TrendingUp, AlertTriangle, Filter,
    CheckCircle, XCircle, Clock, ArrowRight, RefreshCw, Search, Mail, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
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
    expired: '#ef4444',
    'expiring soon': '#f59e0b',
    soon: '#f59e0b'
};

const FILTER_OPTIONS = [
    { id: 'all', label: 'All', icon: Package },
    { id: 'today', label: 'Today', icon: AlertTriangle },
    { id: 'expiring', label: 'Expiring Soon', icon: Clock },
    { id: 'expired', label: 'Expired', icon: XCircle },
    { id: 'custom', label: 'Custom', icon: Calendar },
];

function SubscriptionsTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);

    // Helper to check if widget is visible
    const isWidgetVisible = (widgetKey) => {
        if (visibleWidgets === undefined || visibleWidgets === null) return true;
        return visibleWidgets.has(widgetKey);
    };

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0,
        totalRevenue: 0
    });
    const [allSubscriptions, setAllSubscriptions] = useState([]);
    const [todaySubscriptions, setTodaySubscriptions] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sendingReminder, setSendingReminder] = useState(null); // Track which sub is sending

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

    useEffect(() => {
        loadSubscriptionData();
    }, []);

    const loadSubscriptionData = async () => {
        try {
            setLoading(true);

            const [dashRes, renewalsRes, expiredRes, todayRes] = await Promise.all([
                api.get('/dashboard'),
                api.get('/dashboard/renewals', { params: { filterType: 'current' } }),
                api.get('/dashboard/renewals', { params: { filterType: 'expired' } }),
                api.get('/dashboard/renewals', { params: { filterType: 'today' } })
            ]);

            const dashData = dashRes.data;

            const active = dashData.stats?.activeSubscriptions || 0;
            const expiredCount = expiredRes.data?.length || 0;
            const expiringSoon = dashData.renewals?.expiringTodayCount || 0;

            setStats({
                total: active + expiredCount,
                active,
                expired: expiredCount,
                expiringSoon,
                totalRevenue: dashData.stats?.monthlyRevenue || 0
            });

            // Combine expiring and expired subscriptions
            const expiring = (renewalsRes.data || []).map(item => ({
                ...item,
                status_type: item.days_left <= 0 ? 'expired' : item.days_left === 0 ? 'today' : 'expiring'
            }));
            const expired = (expiredRes.data || []).map(item => ({
                ...item,
                status_type: 'expired'
            }));
            const today = (todayRes.data || []).map(item => ({
                ...item,
                status_type: 'today'
            }));

            // Store today's subscriptions separately
            setTodaySubscriptions(today);

            // Combine and deduplicate by sub_id
            const combined = [...today];
            expiring.forEach(exp => {
                if (!combined.find(c => c.sub_id === exp.sub_id)) {
                    combined.push(exp);
                }
            });
            expired.forEach(exp => {
                if (!combined.find(c => c.sub_id === exp.sub_id)) {
                    combined.push(exp);
                }
            });

            // Sort by days_left (most urgent first)
            combined.sort((a, b) => (a.days_left || 0) - (b.days_left || 0));

            setAllSubscriptions(combined);

            // Build status distribution for pie chart
            setStatusDistribution([
                { name: 'Active', value: active, color: STATUS_COLORS.active },
                { name: 'Expired', value: expiredCount, color: STATUS_COLORS.expired },
                { name: 'Expiring Soon', value: expiringSoon, color: STATUS_COLORS['expiring soon'] }
            ].filter(item => item.value > 0));

        } catch (err) {
            console.error('Error loading subscription data:', err);
            toast.error('Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    // Filter subscriptions based on active filter and search query
    const filteredSubscriptions = allSubscriptions.filter(sub => {
        // Status filter
        if (activeFilter === 'today' && sub.days_left !== 0) return false;
        if (activeFilter === 'expiring' && (sub.days_left <= 0 || sub.days_left === 0)) return false;
        if (activeFilter === 'expired' && sub.days_left > 0) return false;

        // Custom date filter
        if (activeFilter === 'custom' && dateFrom && dateTo) {
            const subDate = new Date(sub.end_date);
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (subDate < fromDate || subDate > toDate) return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                sub.domain_name?.toLowerCase().includes(query) ||
                sub.customer_name?.toLowerCase().includes(query) ||
                sub.services?.some(s => s.name?.toLowerCase().includes(query))
            );
        }
        return true;
    });

    const getStatusBadge = (sub) => {
        if (sub.days_left < 0) {
            return (
                <Badge variant="outline" className="border-rose-500/50 text-rose-500 dark:text-rose-400 text-[9px]">
                    Expired {Math.abs(sub.days_left)}d ago
                </Badge>
            );
        }
        if (sub.days_left === 0) {
            return (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 dark:text-amber-400 text-[9px]">
                    Expires Today
                </Badge>
            );
        }
        if (sub.days_left <= 7) {
            return (
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 dark:text-amber-400 text-[9px]">
                    {sub.days_left}d left
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="border-blue-500/50 text-blue-500 dark:text-blue-400 text-[9px]">
                {sub.days_left}d left
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

            <BentoCard size="sm" icon={XCircle} title="Expired">
                <StatCard
                    value={stats.expired}
                    label="Expired"
                    variant="rose"
                />
            </BentoCard>

            <BentoCard size="sm" icon={Clock} title="Expiring Soon">
                <StatCard
                    value={stats.expiringSoon}
                    label="Due Soon"
                    variant="amber"
                />
            </BentoCard>

            {/* Subscriptions List with Filters - FULL WIDTH */}
            <BentoCard
                size="full"
                icon={AlertTriangle}
                title="Expiring & Expired Subscriptions"
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
                    {filteredSubscriptions.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                            No subscriptions found
                        </div>
                    ) : (
                        <div className="space-y-2 pr-1">
                            {filteredSubscriptions.slice(0, 25).map((sub, i) => (
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
                                                </p>
                                            </div>
                                            {sub.total && (
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 ml-2">
                                                    {formatCurrency(parseFloat(sub.total))}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="top"
                                        align="center"
                                        sideOffset={8}
                                        collisionPadding={20}
                                        className="max-w-sm bg-slate-900 dark:bg-slate-800 border-slate-700 p-4 rounded-xl z-50"
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
                                                        sub.days_left < 0 ? "text-rose-400" : sub.days_left <= 7 ? "text-amber-400" : "text-blue-400"
                                                    )}>
                                                        {sub.days_left < 0 ? `Expired ${Math.abs(sub.days_left)}d ago` :
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

                                            {/* Send Reminder Button */}
                                            <Button
                                                size="sm"
                                                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg h-8"
                                                onClick={(e) => sendReminder(sub.sub_id, e)}
                                                disabled={sendingReminder === sub.sub_id}
                                            >
                                                {sendingReminder === sub.sub_id ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="w-3 h-3 mr-2" />
                                                        Send Reminder Email
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                            {filteredSubscriptions.length > 25 && (
                                <p className="text-center text-[10px] text-slate-500 py-2">
                                    Showing 25 of {filteredSubscriptions.length} subscriptions
                                </p>
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
                        This Month's Subscription Revenue
                    </p>
                    <Button
                        onClick={() => navigate(`/${user.username}/dashboard/subscriptions`)}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-2xl px-6 h-10 font-black text-[10px] uppercase tracking-widest w-fit"
                    >
                        <Package className="w-4 h-4 mr-2" /> Manage Subscriptions
                    </Button>
                </div>
            </BentoCard>
        </BentoGrid>
    );
}

export default SubscriptionsTab;
