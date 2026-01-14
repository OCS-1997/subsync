import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Users, Globe, Package, Calendar, TrendingUp, Clock,
    AlertTriangle, ArrowRight, Plus, Phone, Target, RefreshCw,
    ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function OverviewTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);

    // Helper to check if widget is visible
    // Only show all widgets if visibleWidgets is explicitly undefined/null (API failure fallback)
    const isWidgetVisible = (widgetKey) => {
        if (visibleWidgets === undefined || visibleWidgets === null) return true;
        return visibleWidgets.has(widgetKey);
    };

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

    useEffect(() => {
        loadOverviewData();
    }, []);

    const loadOverviewData = async () => {
        try {
            setLoading(true);

            // Fetch dashboard data
            const [dashboardRes, renewalsRes, trendRes] = await Promise.all([
                api.get('/dashboard'),
                api.get('/dashboard/renewals', { params: { filterType: 'today' } }),
                api.get('/dashboard/revenue-trend')
            ]);

            const dashData = dashboardRes.data;

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

            setRevenueTrend(trendRes.data || { trend: [], percentChange: 0, isPositive: true });
            setRenewals(renewalsRes.data?.slice(0, 5) || []);
            setRecentActivity(dashData.recentActivity || []);

        } catch (err) {
            console.error('Error loading overview data:', err);
            // toast.error('Failed to load dashboard data'); 
            // Silently fail for some sub-queries to keep the page working
        } finally {
            setLoading(false);
        }
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

    if (loading) {
        return (
            <BentoGrid columns={4}>
                {[...Array(8)].map((_, i) => (
                    <BentoCard key={i} loading size={i === 2 ? "sm" : "sm"} />
                ))}
            </BentoGrid>
        );
    }

    return (
        <BentoGrid columns={4}>
            {/* Key Stats Row */}
            {isWidgetVisible('overview_customers') && (
                <BentoCard size="sm" icon={Users} title="Customers">
                    <StatCard
                        value={stats.totalCustomers}
                        label="Total Customers"
                        variant="blue"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_subscriptions') && (
                <BentoCard size="sm" icon={Package} title="Subscriptions">
                    <StatCard
                        value={stats.activeSubscriptions}
                        label="Active Contracts"
                        variant="emerald"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_revenue') && (
                <BentoCard size="sm" icon={TrendingUp} title="Revenue">
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
                <BentoCard size="sm" icon={Calendar} title="Renewals">
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
                    {renewals.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-slate-500 text-sm">
                            No renewals due today
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                            {renewals.map((r, i) => (
                                <div
                                    key={r.sub_id || i}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/${user.username}/dashboard/subscriptions/${r.sub_id}`)}
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{r.domain_name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wide">{r.customer_name}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${r.days_left < 0 ? 'bg-rose-500/20 text-rose-400' :
                                        r.days_left === 0 ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {r.days_left < 0 ? `${Math.abs(r.days_left)}d ago` :
                                            r.days_left === 0 ? 'Today' : `${r.days_left}d`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
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
                <BentoCard size="sm" icon={Clock} title="Expired">
                    <StatCard
                        value={stats.expiredCount}
                        label="Expired Subscriptions"
                        variant="rose"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_dcr') && (
                <BentoCard size="sm" icon={Phone} title="Today's DCR">
                    <StatCard
                        value={stats.todayDCRs}
                        label="Logged Today"
                        variant="purple"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_opportunities') && (
                <BentoCard size="sm" icon={Target} title="Opportunities">
                    <StatCard
                        value={stats.openOpportunities}
                        label="Open Pipeline"
                        variant="amber"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('overview_kb') && (
                <BentoCard size="sm" icon={Globe} title="Knowledge Base">
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

