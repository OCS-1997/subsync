import { useMemo } from 'react';
import {
    Clock,
    TrendingUp,
    TrendingDown,
    Users,
    Activity,
    BarChart3,
    Loader2,
    AlertCircle,
    Award,
    Calendar,
    Timer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils';
import { useTimeTrackingStats, useProductivityTrend } from '../hooks/useTimeTrackingData';
import { useSelector } from 'react-redux';
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

/**
 * Helper function to format hours display
 */
const formatHours = (hours) => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

/**
 * Loading Skeleton Component
 */
const LoadingSkeleton = () => (
    <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
        </div>
    </div>
);

/**
 * Error Display Component
 */
const ErrorDisplay = ({ error, onRetry }) => (
    <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <AlertCircle className="w-10 h-10 text-destructive opacity-50" />
            <div>
                <p className="font-semibold text-sm mb-1">Failed to load data</p>
                <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="text-xs text-blue-600 hover:underline"
                >
                    Try again
                </button>
            )}
        </div>
    </div>
);

/**
 * Today's Time Stats Widget
 */
export const TodayTimeStatsWidget = () => {
    const { data, loading, error, refetch } = useTimeTrackingStats('today', true);

    const stats = useMemo(() => {
        if (!data) return null;
        
        const hasActiveTimer = data.activeTimer !== null;
        const totalHours = hasActiveTimer 
            ? data.totalHours + (data.activeTimer.elapsedMinutes / 60)
            : data.totalHours;

        return {
            totalHours,
            entryCount: data.entryCount,
            billableHours: data.billableHours,
            hasActiveTimer,
            activeTimerTitle: data.activeTimer?.title
        };
    }, [data]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (!stats) return null;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Today's Time
                    </CardTitle>
                    {stats.hasActiveTimer && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 animate-pulse">
                            <Timer className="w-3 h-3 mr-1" />
                            Active
                        </Badge>
                    )}
                </div>
                <CardDescription className="text-xs">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-1">
                            {formatHours(stats.totalHours)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.entryCount} {stats.entryCount === 1 ? 'entry' : 'entries'}
                        </p>
                    </div>

                    {stats.hasActiveTimer && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                                Currently tracking:
                            </p>
                            <p className="text-sm font-semibold text-green-700 dark:text-green-300 truncate">
                                {stats.activeTimerTitle}
                            </p>
                        </div>
                    )}

                    {stats.billableHours > 0 && (
                        <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-xs text-muted-foreground">Billable</span>
                            <span className="font-semibold text-sm text-green-600">
                                {formatHours(stats.billableHours)}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Weekly Time Stats Widget
 */
export const WeekTimeStatsWidget = () => {
    const { data, loading, error, refetch } = useTimeTrackingStats('week', false);

    const stats = useMemo(() => {
        if (!data) return null;
        
        const avgPerDay = data.totalHours / 7;
        
        return {
            totalHours: data.totalHours,
            entryCount: data.entryCount,
            avgPerDay: avgPerDay.toFixed(1),
            billableHours: data.billableHours
        };
    }, [data]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (!stats) return null;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    This Week
                </CardTitle>
                <CardDescription className="text-xs">Weekly summary</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-1">
                            {formatHours(stats.totalHours)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.entryCount} {stats.entryCount === 1 ? 'entry' : 'entries'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Avg/day</p>
                            <p className="font-semibold text-sm">{formatHours(parseFloat(stats.avgPerDay))}</p>
                        </div>
                        {stats.billableHours > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Billable</p>
                                <p className="font-semibold text-sm text-green-600">
                                    {formatHours(stats.billableHours)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Activity Breakdown Chart Widget
 */
export const ActivityBreakdownWidget = () => {
    const { data, loading, error, refetch } = useTimeTrackingStats('today', false);

    const chartData = useMemo(() => {
        if (!data?.activityBreakdown) return [];
        return data.activityBreakdown.map(activity => ({
            name: activity.typeName,
            value: activity.totalHours,
            percentage: activity.percentage,
            color: activity.color || '#6b7280'
        }));
    }, [data]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        Activity Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                        <Activity className="w-12 h-12 opacity-20 mb-2" />
                        <p className="text-sm">No activity data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    Activity Breakdown
                </CardTitle>
                <CardDescription className="text-xs">Time distribution by type</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name} (${percentage}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatHours(value)}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                    {chartData.slice(0, 3).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: activity.color }}
                                />
                                <span className="text-xs">{activity.name}</span>
                            </div>
                            <span className="font-semibold text-xs">{formatHours(activity.value)}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Productivity Trend Chart Widget
 */
export const ProductivityTrendWidget = () => {
    const { data, loading, error, refetch } = useProductivityTrend(7);

    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            hours: day.totalHours,
            entries: day.entryCount
        }));
    }, [data]);

    const trend = useMemo(() => {
        if (chartData.length < 2) return null;
        const recent = chartData.slice(-3).reduce((sum, d) => sum + d.hours, 0) / 3;
        const previous = chartData.slice(-6, -3).reduce((sum, d) => sum + d.hours, 0) / 3;
        const change = ((recent - previous) / (previous || 1)) * 100;
        return {
            direction: change >= 0 ? 'up' : 'down',
            percentage: Math.abs(Math.round(change))
        };
    }, [chartData]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        Productivity Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                        <BarChart3 className="w-12 h-12 opacity-20 mb-2" />
                        <p className="text-sm">No trend data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            Productivity Trend
                        </CardTitle>
                        <CardDescription className="text-xs">Last 7 days activity</CardDescription>
                    </div>
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md",
                            trend.direction === 'up'
                                ? "text-green-700 bg-green-100 dark:bg-green-950 dark:text-green-300"
                                : "text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300"
                        )}>
                            {trend.direction === 'up' ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-xs">{trend.percentage}%</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(value) => `${value}h`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px'
                            }}
                            formatter={(value, name) => {
                                if (name === 'hours') return [formatHours(value), 'Hours'];
                                return [value, 'Entries'];
                            }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line
                            type="monotone"
                            dataKey="hours"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ fill: '#6366f1', r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Hours"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

/**
 * Team Overview Widget (Admin Only)
 */
export const TeamOverviewWidget = () => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.roleKey === 'admin' || user?.isAdmin;
    const { data, loading, error, refetch } = useTimeTrackingStats('week', false);

    if (!isAdmin) return null;

    const teams = useMemo(() => {
        if (!data?.teamBreakdown) return [];
        return data.teamBreakdown.sort((a, b) => b.totalHours - a.totalHours);
    }, [data]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (teams.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-cyan-600" />
                        Team Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                        <Users className="w-12 h-12 opacity-20 mb-2" />
                        <p className="text-sm">No team data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600" />
                    Team Overview
                </CardTitle>
                <CardDescription className="text-xs">Team performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {teams.map((team, index) => (
                        <div
                            key={team.teamId}
                            className={cn(
                                "p-3 rounded-lg border transition-colors",
                                index === 0
                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900"
                                    : "bg-muted/30 hover:bg-muted/50"
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {index === 0 && <Award className="w-4 h-4 text-yellow-600" />}
                                    <span className="font-semibold text-sm">{team.teamName}</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">
                                    {formatHours(team.totalHours)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{team.activeUsers} active {team.activeUsers === 1 ? 'member' : 'members'}</span>
                                <span>Avg: {formatHours(team.avgMinutesPerUser / 60)}/user</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Top Performers Widget (Admin Only)
 */
export const TopPerformersWidget = () => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.roleKey === 'admin' || user?.isAdmin;
    const { data, loading, error, refetch } = useTimeTrackingStats('week', false);

    if (!isAdmin) return null;

    const performers = useMemo(() => {
        if (!data?.topPerformers) return [];
        return data.topPerformers.slice(0, 5);
    }, [data]);

    if (loading) return <LoadingSkeleton />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (performers.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        Top Performers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                        <Award className="w-12 h-12 opacity-20 mb-2" />
                        <p className="text-sm">No performer data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Top Performers
                </CardTitle>
                <CardDescription className="text-xs">Ranked by tracked hours</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {performers.map((user, index) => (
                        <div
                            key={user.userId}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                index === 0
                                    ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20"
                                    : "bg-muted/30 hover:bg-muted/50"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0",
                                index === 0
                                    ? "bg-yellow-600 text-white"
                                    : index === 1
                                        ? "bg-gray-400 text-white"
                                        : index === 2
                                            ? "bg-orange-600 text-white"
                                            : "bg-muted text-muted-foreground"
                            )}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-blue-600">{formatHours(user.totalHours)}</p>
                                <p className="text-xs text-muted-foreground">{user.entryCount} entries</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
