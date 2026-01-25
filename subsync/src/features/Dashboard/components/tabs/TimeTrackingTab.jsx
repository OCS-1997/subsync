import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, 
    Calendar, 
    Activity, 
    BarChart3, 
    Users, 
    User,
    Briefcase,
    Award,
    Timer,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useTimeTrackingStats, useProductivityTrend } from '../../hooks/useTimeTrackingData';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

/**
 * TimeTrackingTab - Comprehensive time analytics view
 */
const TimeTrackingTab = ({ visibleWidgets }) => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.roleKey === 'admin' || user?.isAdmin;

    // Fetch data
    const { data: todayStats, loading: todayLoading } = useTimeTrackingStats('today', true);
    const { data: weekStats, loading: weekLoading } = useTimeTrackingStats('week', false);
    const { data: trendData, loading: trendLoading } = useProductivityTrend(7);

    // Helper to check widget visibility
    const isWidgetVisible = (widgetKey) => {
        if (!visibleWidgets) return true;
        return visibleWidgets.has(widgetKey);
    };

    // Utils
    const formatHours = (hours) => {
        if (!hours || hours === 0) return '0h';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const hasActiveTimer = !!todayStats?.activeTimer;
    const todayTotalHours = useMemo(() => {
        if (!todayStats) return 0;
        return hasActiveTimer 
            ? (todayStats.totalHours || 0) + (todayStats.activeTimer?.elapsedMinutes / 60 || 0)
            : (todayStats.totalHours || 0);
    }, [todayStats, hasActiveTimer]);

    return (
        <BentoGrid columns={4}>
            {/* Today's Time Stat */}
            {isWidgetVisible('time_today_stats') && (
                <BentoCard 
                    size="sm" 
                    icon={Clock} 
                    title="Today's Time" 
                    loading={todayLoading}
                    action={hasActiveTimer && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 animate-pulse">
                            <Timer className="w-3 h-3 mr-1" /> Active
                        </Badge>
                    )}
                >
                    <StatCard
                        value={formatHours(todayTotalHours)}
                        label={hasActiveTimer ? `Tracking: ${todayStats?.activeTimer?.title || ''}` : `${todayStats?.entryCount || 0} entries`}
                        variant="blue"
                    />
                </BentoCard>
            )}

            {/* Weekly Summary Stat */}
            {isWidgetVisible('time_week_stats') && (
                <BentoCard size="sm" icon={Calendar} title="This Week" loading={weekLoading}>
                    <StatCard
                        value={formatHours(weekStats?.totalHours || 0)}
                        label={`Avg ${formatHours((weekStats?.totalHours || 0) / 7)} / day`}
                        variant="purple"
                    />
                </BentoCard>
            )}

            {/* Billable Time Stat */}
            {isWidgetVisible('time_today_stats') && (
                <BentoCard size="sm" icon={TrendingUp} title="Billable" loading={todayLoading}>
                    <StatCard
                        value={formatHours(todayStats?.billableHours)}
                        label={`${Math.round((todayStats?.billableHours / (todayTotalHours || 1)) * 100)}% of total`}
                        variant="emerald"
                    />
                </BentoCard>
            )}

            {/* Top Performer (Individual) or Rankings (Admin) */}
            {isWidgetVisible('time_user_rankings') && (
                <BentoCard size="sm" icon={Award} title={isAdmin ? "Top Performer" : "Performance"} loading={weekLoading}>
                    {isAdmin ? (
                        <div className="flex flex-col justify-center h-full">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {weekStats?.topPerformers?.[0]?.fullName || 'No data'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">
                                {formatHours(weekStats?.topPerformers?.[0]?.totalHours || 0)} this week
                            </p>
                        </div>
                    ) : (
                        <StatCard
                            value={todayStats?.entryCount || 0}
                            label="Entries Logged"
                            variant="amber"
                        />
                    )}
                </BentoCard>
            )}

            {/* Activity Breakdown - Wide Chart */}
            {isWidgetVisible('time_activity_breakdown') && (
                <BentoCard size="md" icon={Activity} title="Activity Breakdown" loading={todayLoading}>
                    <div className="h-[180px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={todayStats?.activityBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={2}
                                    dataKey="totalHours"
                                    nameKey="typeName"
                                >
                                    {(todayStats?.activityBreakdown || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => formatHours(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>
            )}

            {/* Productivity Trend - Wide Chart */}
            {isWidgetVisible('time_productivity_trend') && (
                <BentoCard size="md" icon={BarChart3} title="7-Day Trend" loading={trendLoading}>
                    <div className="h-[180px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <Line 
                                    type="monotone" 
                                    dataKey="hours" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#3b82f6' }}
                                    activeDot={{ r: 6 }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(value) => [formatHours(value), 'Hours']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>
            )}

            {/* Project Distribution */}
            {isWidgetVisible('time_project_distribution') && (
                <BentoCard size="md" icon={Briefcase} title="Project Distribution" loading={weekLoading}>
                    <div className="h-[180px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={weekStats?.projectBreakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={2}
                                    dataKey="totalHours"
                                    nameKey="projectName"
                                >
                                    {(weekStats?.projectBreakdown || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(value) => formatHours(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>
            )}

            {/* Client Summary */}
            {isWidgetVisible('time_client_summary') && (
                <BentoCard size="md" icon={User} title="Client Summary" loading={weekLoading}>
                    <div className="h-[180px] w-full mt-2 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weekStats?.customerBreakdown || []} layout="vertical" margin={{ left: -20 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="customerName" 
                                    axisLine={false} 
                                    tickLine={false}
                                    width={90}
                                    tick={{ fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Bar 
                                    dataKey="totalHours" 
                                    fill="#8b5cf6" 
                                    radius={[0, 4, 4, 0]} 
                                    barSize={12}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value) => formatHours(value)}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>
            )}

            {/* Team Overview - Admin Only Full Width */}
            {isAdmin && isWidgetVisible('time_team_overview') && (
                <BentoCard size="full" icon={Users} title="Team Performance" loading={weekLoading}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                        {(weekStats?.teamBreakdown || []).map((team) => (
                            <div key={team.teamId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/50">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{team.teamName}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">{formatHours(team.totalHours)}</span>
                                    <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold">
                                        {team.activeUsers} users
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            )}
        </BentoGrid>
    );
};

export default TimeTrackingTab;
