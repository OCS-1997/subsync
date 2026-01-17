import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Users, Globe, Package, Calendar, TrendingUp, Clock,
    AlertTriangle, ArrowRight, Plus, Phone, Target, RefreshCw,
    ArrowUpRight, ArrowDownRight, Mail, Loader2
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

function OverviewTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [statsLoading, setStatsLoading] = useState(true);
    const [renewalsLoading, setRenewalsLoading] = useState(true);
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(true);

    const [stats, setStats] = useState({
        totalCustomers: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        pendingRenewals: 0,
        expiredCount: 0,
        todayDCRs: 0,
        openOpportunities: 0,
        kbArticles: 0
    });
    const [revenueTrend, setRevenueTrend] = useState({
        trend: [],
        percentChange: 0,
        isPositive: true
    });
    const [renewals, setRenewals] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [sendingReminder, setSendingReminder] = useState(null);

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
        loadData();
    }, []);

    const loadData = () => {
        fetchStats();
        fetchRenewals();
        fetchRevenueTrend();
    };

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            setActivityLoading(true);
            const res = await api.get('/dashboard');
            const dashData = res.data;
            setStats({
                totalCustomers: dashData.stats?.totalCustomers || 0,
                activeSubscriptions: dashData.stats?.activeSubscriptions || 0,
                monthlyRevenue: dashData.stats?.monthlyRevenue || 0,
                pendingRenewals: dashData.renewals?.expiringTodayCount || 0,
                expiredCount: dashData.stats?.expiredCount || 0,
                todayDCRs: dashData.stats?.todayDCRs || 0,
                openOpportunities: dashData.stats?.openOpportunities || 0,
                kbArticles: dashData.stats?.kbArticles || 0
            });
            setRecentActivity(dashData.recentActivity || []);
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
        } finally {
            setStatsLoading(false);
            setActivityLoading(false);
        }
    };

    const fetchRenewals = async () => {
        try {
            setRenewalsLoading(true);
            const res = await api.get('/dashboard/renewals', { params: { filterType: 'today' } });
            setRenewals(res.data?.slice(0, 5) || []);
        } catch (err) {
            console.error('Error fetching renewals:', err);
        } finally {
            setRenewalsLoading(false);
        }
    };

    const fetchRevenueTrend = async () => {
        try {
            setRevenueLoading(true);
            const res = await api.get('/dashboard/revenue-trend');
            setRevenueTrend(res.data || { trend: [], percentChange: 0, isPositive: true });
        } catch (err) {
            console.error('Error fetching revenue trend:', err);
        } finally {
            setRevenueLoading(false);
        }
    };

    // Helper to check if widget is visible
    const isWidgetVisible = (widgetKey) => {
        if (visibleWidgets === undefined || visibleWidgets === null) return true;
        return visibleWidgets.has(widgetKey);
    };

    const formatCurrency = (value) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    const quickActions = [
        { label: 'New Subscription', icon: Package, path: 'subscriptions/add', color: 'blue' },
        { label: 'Add Customer', icon: Users, path: 'customers/add', color: 'emerald' },
        { label: 'Log DCR', icon: Phone, path: 'dcr/new', color: 'purple' },
        { label: 'New Opportunity', icon: Target, path: 'opportunities/new', color: 'amber' },
    ];

    return (
        <BentoGrid columns={4}>
            {/* Key Stats Row */}
            {isWidgetVisible('overview_customers') && (
                <BentoCard size="sm" icon={Users} title="Customers" loading={statsLoading}>
                    <StatCard
                        value={stats.totalCustomers}
                        label="Total Customers"
                        variant="blue"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_subscriptions') && (
                <BentoCard size="sm" icon={Package} title="Subscriptions" loading={statsLoading}>
                    <StatCard
                        value={stats.activeSubscriptions}
                        label="Active Contracts"
                        variant="emerald"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_revenue') && (
                <BentoCard size="sm" icon={TrendingUp} title="Revenue" loading={revenueLoading}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between">
                            <StatCard
                                value={formatCurrency(stats.monthlyRevenue)}
                                label="This Month"
                                variant="purple"
                            />
                            <div className={cn(
                                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-black mt-1",
                                revenueTrend.isPositive
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-rose-500/10 text-rose-500"
                            )}>
                                {revenueTrend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(revenueTrend.percentChange)}%
                            </div>
                        </div>

                        {/* Sparkline */}
                        <div className="h-10 w-full mt-auto pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueTrend.trend}>
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke={revenueTrend.isPositive ? "#10b981" : "#ef4444"}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </BentoCard>
            )}

            {isWidgetVisible('overview_renewals') && (
                <BentoCard size="sm" icon={Calendar} title="Renewals" loading={statsLoading}>
                    <StatCard
                        value={stats.pendingRenewals}
                        label="Due Today"
                        variant={stats.pendingRenewals > 0 ? "amber" : "default"}
                    />
                </BentoCard>
            )}

            {/* Renewal Alerts */}
            {isWidgetVisible('overview_renewal_alerts') && (
                <BentoCard
                    size="md"
                    icon={AlertTriangle}
                    title="Renewal Alerts"
                    loading={renewalsLoading}
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
                    <TooltipProvider delayDuration={200}>
                        {renewals.length === 0 ? (
                            <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
                                No renewals due today
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-2">
                                {renewals.map((sub, i) => (
                                    <Tooltip key={sub.sub_id || i}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                                onClick={() => navigate(`/${user.username}/dashboard/subscriptions/${sub.sub_id}`)}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{sub.domain_name}</p>
                                                    <p 
                                                        className="text-[10px] text-slate-500 uppercase tracking-wide hover:text-blue-500 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/${user.username}/dashboard/customers/${sub.customer_id}`);
                                                        }}
                                                    >
                                                        {sub.customer_name}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-1 rounded-full",
                                                    sub.days_left < 0 ? "bg-rose-500/20 text-rose-400" :
                                                    sub.days_left === 0 ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-blue-500/20 text-blue-400"
                                                )}>
                                                    {sub.days_left < 0 ? `${Math.abs(sub.days_left)}d ago` :
                                                    sub.days_left === 0 ? 'Today' : `${sub.days_left}d`}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="left"
                                            align="center"
                                            sideOffset={8}
                                            collisionPadding={20}
                                            className="max-w-sm bg-slate-900 dark:bg-slate-800 border-slate-700 p-4 rounded-xl z-50"
                                        >
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm font-bold text-white">{sub.domain_name}</p>
                                                    <p 
                                                        className="text-[10px] text-slate-400 hover:text-blue-400 cursor-pointer transition-colors"
                                                        onClick={() => navigate(`/${user.username}/dashboard/customers/${sub.customer_id}`)}
                                                    >
                                                        {sub.customer_name}
                                                    </p>
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
                            </div>
                        )}
                    </TooltipProvider>
                </BentoCard>
            )}

            {/* Quick Actions */}
            {isWidgetVisible('overview_quick_actions') && (
                <BentoCard size="md" icon={Plus} title="Quick Actions">
                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(`/${user.username}/dashboard/${action.path}`)}
                                className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-${action.color}-500/20`}>
                                    <action.icon className={`w-4 h-4 text-${action.color}-400`} />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </BentoCard>
            )}

            {/* Secondary Stats Row */}
            {isWidgetVisible('overview_expired') && (
                <BentoCard size="sm" icon={Clock} title="Expired" loading={statsLoading}>
                    <StatCard
                        value={stats.expiredCount}
                        label="Expired Subscriptions"
                        variant="rose"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_dcr') && (
                <BentoCard size="sm" icon={Phone} title="Today's DCR" loading={statsLoading}>
                    <StatCard
                        value={stats.todayDCRs}
                        label="Logged Today"
                        variant="purple"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_opportunities') && (
                <BentoCard size="sm" icon={Target} title="Opportunities" loading={statsLoading}>
                    <StatCard
                        value={stats.openOpportunities}
                        label="Open Pipeline"
                        variant="amber"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_kb') && (
                <BentoCard size="sm" icon={Globe} title="Knowledge Base" loading={statsLoading}>
                    <StatCard
                        value={stats.kbArticles}
                        label="Total Articles"
                        variant="blue"
                    />
                </BentoCard>
            )}
        </BentoGrid>
    );
}

export default OverviewTab;

