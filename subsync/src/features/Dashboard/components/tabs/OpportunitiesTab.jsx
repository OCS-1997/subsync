import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Target, TrendingUp, DollarSign, Users,
    ArrowRight, Plus, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

// Status colors matching database opportunity_statuses table
const STATUS_COLORS = {
    'Proposal Sent': '#3b82f6',     // blue-500
    'in Progress': '#3b82f6',       // blue-500
    'Demo Provided': '#3b82f6',     // blue-500
    'Closed / Won': '#22c55e',      // green-500
    'Closed / Lost': '#ef4444',     // red-500
    'Pending Client': '#f59e0b',    // amber-500
    'Pending OCS': '#6366f1',       // indigo-500
    'Completed': '#10b981',         // emerald-500
    'Dropped': '#6b7280',           // gray-500
    'Evaluation Requirements': '#8b5cf6' // violet-500
};

function OpportunitiesTab({ visibleWidgets }) {
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
        open: 0,
        won: 0,
        lost: 0,
        totalValue: 0,
        winRate: 0
    });
    const [stageDistribution, setStageDistribution] = useState([]);
    const [recentOpportunities, setRecentOpportunities] = useState([]);

    useEffect(() => {
        loadOpportunitiesData();
    }, []);

    const loadOpportunitiesData = async () => {
        try {
            setLoading(true);

            const response = await api.get('/opportunities');
            const opportunities = response.data.opportunities || [];

            // Calculate stats - use status_name field from API
            // Status names from DB: 'Closed / Won', 'Closed / Lost', 'Proposal Sent', 'in Progress', etc.
            const won = opportunities.filter(o => o.status_name === 'Closed / Won' || o.status_name === 'Completed').length;
            const lost = opportunities.filter(o => o.status_name === 'Closed / Lost' || o.status_name === 'Dropped').length;
            const open = opportunities.filter(o => !['Closed / Won', 'Closed / Lost', 'Completed', 'Dropped'].includes(o.status_name)).length;
            const closed = won + lost;

            const totalValue = opportunities.reduce((sum, o) => {
                return sum + (parseFloat(o.opportunity_value) || 0);
            }, 0);

            setStats({
                total: opportunities.length,
                open,
                won,
                lost,
                totalValue,
                winRate: closed > 0 ? Math.round((won / closed) * 100) : 0
            });

            // Stage distribution for chart - group by status_name
            const statusCounts = opportunities.reduce((acc, opp) => {
                const status = opp.status_name || 'Unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            const distribution = Object.entries(statusCounts).map(([status, count]) => ({
                stage: status,
                count,
                fill: STATUS_COLORS[status] || '#94a3b8'
            })).filter(s => s.count > 0);

            setStageDistribution(distribution);

            // Recent opportunities - use opportunity_id (not id)
            const sorted = [...opportunities]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 6);
            setRecentOpportunities(sorted);

        } catch (err) {
            console.error('Error loading opportunities:', err);
            toast.error('Failed to load opportunities data');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
        return `₹${value}`;
    };

    const getStatusIcon = (statusName) => {
        if (statusName === 'Closed / Won' || statusName === 'Completed') {
            return <CheckCircle className="w-3 h-3 text-emerald-400" />;
        }
        if (statusName === 'Closed / Lost' || statusName === 'Dropped') {
            return <XCircle className="w-3 h-3 text-rose-400" />;
        }
        return <Clock className="w-3 h-3 text-blue-400" />;
    };

    if (loading) {
        return (
            <BentoGrid columns={4}>
                {[...Array(8)].map((_, i) => (
                    <BentoCard key={i} loading size={i < 4 ? "sm" : "md"} />
                ))}
            </BentoGrid>
        );
    }

    return (
        <BentoGrid columns={4}>
            {/* Stats Row */}
            <BentoCard size="sm" icon={Target} title="Total">
                <StatCard
                    value={stats.total}
                    label="All Opportunities"
                    variant="blue"
                />
            </BentoCard>

            <BentoCard size="sm" icon={Clock} title="Open">
                <StatCard
                    value={stats.open}
                    label="In Progress"
                    variant="amber"
                />
            </BentoCard>

            <BentoCard size="sm" icon={CheckCircle} title="Won">
                <StatCard
                    value={stats.won}
                    label="Closed Won"
                    variant="emerald"
                />
            </BentoCard>

            <BentoCard size="sm" icon={TrendingUp} title="Win Rate">
                <StatCard
                    value={`${stats.winRate}%`}
                    label="Conversion Rate"
                    variant="purple"
                />
            </BentoCard>

            {/* Pipeline Value */}
            <BentoCard size="md" icon={DollarSign} title="Pipeline Value">
                <div className="flex flex-col justify-center h-full">
                    <p className="text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(stats.totalValue)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-2">
                        Total Estimated Value
                    </p>
                    <div className="mt-4 flex gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-400">Won: {stats.won}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-slate-400">Lost: {stats.lost}</span>
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* Stage Distribution - Horizontal Pipeline */}
            <BentoCard size="md" icon={Target} title="Pipeline Stages">
                {stageDistribution.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No data available
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[180px] overflow-y-auto scrollbar-thin">
                        {stageDistribution
                            .sort((a, b) => b.count - a.count)
                            .map((stage, index) => {
                                const maxCount = Math.max(...stageDistribution.map(s => s.count), 1);
                                const percentage = Math.round((stage.count / maxCount) * 100);
                                return (
                                    <div key={index} className="group">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                                {stage.stage}
                                            </span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">
                                                {stage.count}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-80"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: stage.fill
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </BentoCard>

            {/* Recent Opportunities */}
            <BentoCard
                size="xl"
                icon={Target}
                title="Recent Opportunities"
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => navigate(`/${user.username}/dashboard/opportunities`)}
                    >
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                }
            >
                {recentOpportunities.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                        No opportunities yet
                    </div>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {recentOpportunities.map((opp, i) => (
                            <div
                                key={opp.opportunity_id || i}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                onClick={() => navigate(`/${user.username}/dashboard/opportunities/view/${opp.opportunity_id}`)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {getStatusIcon(opp.status_name)}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{opp.product_services || opp.domain || 'Opportunity'}</p>
                                        <p className="text-[10px] text-slate-500 truncate">{opp.customer_name || opp.company_name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <span className="text-xs font-bold text-emerald-400">
                                        {formatCurrency(parseFloat(opp.opportunity_value) || 0)}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="text-[9px] shrink-0"
                                        style={{
                                            borderColor: opp.status_color ? `${opp.status_color}50` : `${STATUS_COLORS[opp.status_name] || '#94a3b8'}50`,
                                            color: opp.status_color || STATUS_COLORS[opp.status_name] || '#94a3b8'
                                        }}
                                    >
                                        {opp.status_name}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </BentoCard>

            {/* Quick Action */}
            <BentoCard size="full" icon={Target} title="Opportunity Management">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black text-slate-900 dark:text-white">Sales Pipeline</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">
                            Track and manage your sales opportunities
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => navigate(`/${user.username}/dashboard/opportunities/new`)}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Opportunity
                        </Button>
                        <Button
                            onClick={() => navigate(`/${user.username}/dashboard/opportunities`)}
                            variant="outline"
                            className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest border-slate-700 hover:bg-slate-800"
                        >
                            View Pipeline <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </BentoCard>
        </BentoGrid>
    );
}

export default OpportunitiesTab;
