import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Phone, Clock, TrendingUp, Users, Calendar,
    ArrowRight, Plus, BarChart3, User
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

function DCRTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);

    // Helper to check if widget is visible
    const isWidgetVisible = (widgetKey) => {
        if (visibleWidgets === undefined || visibleWidgets === null) return true;
        return visibleWidgets.has(widgetKey);
    };

    const [todayStats, setTodayStats] = useState({ totalCalls: 0, totalTime: 0 });
    const [weekStats, setWeekStats] = useState({ totalCalls: 0, totalTime: 0 });
    const [summary, setSummary] = useState({});
    const [callTypeDistribution, setCallTypeDistribution] = useState([]);
    const [dailyActivity, setDailyActivity] = useState([]);
    const [topDomains, setTopDomains] = useState([]);
    const [userStats, setUserStats] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        loadDCRData();
    }, []);

    const loadDCRData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [statsResponse, userStatsResponse] = await Promise.all([
                api.get('/dcr/stats'),
                api.get('/dcr/user-stats')
            ]);

            const data = statsResponse.data;
            setSummary(data.summary || {});
            setCallTypeDistribution(data.callTypeDistribution || []);
            setDailyActivity(data.dailyActivity || []);
            setTopDomains(data.topDomains || []);

            // Set user stats
            setUserStats(userStatsResponse.data.userStats || []);
            setIsAdmin(userStatsResponse.data.isAdmin || false);

            // Calculate today's stats
            const today = new Date();
            const entriesResponse = await api.get('/dcr', {
                params: {
                    startDate: new Date(today.setHours(0, 0, 0, 0)).toISOString(),
                    endDate: new Date(today.setHours(23, 59, 59, 999)).toISOString(),
                    limit: 1000
                }
            });

            const todayEntries = entriesResponse.data.entries || [];
            const todayTimeMinutes = todayEntries.reduce((sum, entry) => {
                const [hours, minutes] = (entry.time_spent || '00:00').split(':').map(Number);
                return sum + (hours * 60) + minutes;
            }, 0);

            setTodayStats({
                totalCalls: todayEntries.length,
                totalTime: Math.round(todayTimeMinutes / 60 * 10) / 10
            });

            // Calculate this week's stats
            const weekStart = new Date();
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0);

            const weekEntriesResponse = await api.get('/dcr', {
                params: {
                    startDate: weekStart.toISOString(),
                    endDate: new Date().toISOString(),
                    limit: 1000
                }
            });

            const weekTimeMinutes = (weekEntriesResponse.data.entries || []).reduce((sum, entry) => {
                const [hours, minutes] = (entry.time_spent || '00:00').split(':').map(Number);
                return sum + (hours * 60) + minutes;
            }, 0);

            setWeekStats({
                totalCalls: weekEntriesResponse.data.totalRecords || 0,
                totalTime: Math.round(weekTimeMinutes / 60 * 10) / 10
            });

        } catch (err) {
            console.error('Error loading DCR data:', err);
            toast.error('Failed to load DCR statistics');
        } finally {
            setLoading(false);
        }
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
            {/* Today's Stats */}
            <BentoCard size="sm" icon={Phone} title="Today's DCRs">
                <StatCard
                    value={todayStats.totalCalls}
                    label="Logged Today"
                    variant="emerald"
                />
            </BentoCard>

            <BentoCard size="sm" icon={Clock} title="Today's Time">
                <StatCard
                    value={`${todayStats.totalTime}h`}
                    label="Time Spent Today"
                    variant="blue"
                />
            </BentoCard>

            <BentoCard size="sm" icon={Phone} title="This Week">
                <StatCard
                    value={weekStats.totalCalls}
                    label="Weekly DCRs"
                    variant="purple"
                />
            </BentoCard>

            <BentoCard size="sm" icon={Clock} title="Week Time">
                <StatCard
                    value={`${weekStats.totalTime}h`}
                    label="Weekly Hours"
                    variant="amber"
                />
            </BentoCard>

            {/* Per-User Stats for Admins */}
            {isAdmin && userStats.length > 0 && (
                <BentoCard size="full" icon={Users} title="Team DCR Statistics (Last 30 Days)">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wide">User</th>
                                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wide">Today</th>
                                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wide">Total Calls</th>
                                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wide">Total Hours</th>
                                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wide">Avg/Day</th>
                                    <th className="text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wide">Contacts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userStats.map((stat, index) => (
                                    <tr
                                        key={stat.user_id}
                                        className={cn(
                                            "border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                            index === 0 && "bg-emerald-50/50 dark:bg-emerald-500/5"
                                        )}
                                    >
                                        <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                                    {(stat.user_name || stat.user_id || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{stat.user_name || stat.user_id}</p>
                                                    <p className="text-[10px] text-slate-400">@{stat.user_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center py-2.5 px-3">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] font-bold",
                                                stat.today_calls > 0
                                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                            )}>
                                                {stat.today_calls || 0} ({stat.today_hours || 0}h)
                                            </span>
                                        </td>
                                        <td className="text-center py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                            {stat.total_calls || 0}
                                        </td>
                                        <td className="text-center py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">
                                            {stat.total_hours || 0}h
                                        </td>
                                        <td className="text-center py-2.5 px-3 font-bold text-purple-600 dark:text-purple-400">
                                            {stat.avg_per_day || 0}
                                        </td>
                                        <td className="text-center py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">
                                            {stat.unique_contacts || 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </BentoCard>
            )}

            {/* Daily Activity Chart */}
            <BentoCard size="md" icon={TrendingUp} title="Daily Activity (7 Days)">
                {dailyActivity.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No activity data
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={dailyActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <Tooltip
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
                            <Line
                                type="monotone"
                                dataKey="calls"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#3b82f6' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </BentoCard>

            {/* Call Type Distribution */}
            <BentoCard size="md" icon={BarChart3} title="Call Types">
                {callTypeDistribution.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                            <Pie
                                data={callTypeDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {callTypeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
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
                                wrapperStyle={{ fontSize: '9px' }}
                                formatter={(value) => <span className="text-slate-300">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </BentoCard>

            {/* 30 Day Summary */}
            <BentoCard size="md" icon={Calendar} title="Last 30 Days">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{summary.totalCalls || 0}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Total Calls</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
                        <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{summary.totalHours || 0}h</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Total Hours</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{summary.avgPerDay || 0}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Avg/Day</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{summary.uniqueContacts || 0}</p>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Contacts</p>
                    </div>
                </div>
            </BentoCard>

            {/* Top Domains */}
            <BentoCard size="md" icon={Users} title="Top Domains">
                {topDomains.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No domain data
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={topDomains.slice(0, 5)} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                            <YAxis
                                dataKey="domain"
                                type="category"
                                tick={{ fill: '#94a3b8', fontSize: 9 }}
                                width={80}
                            />
                            <Tooltip
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
                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </BentoCard>

            {/* Quick Action */}
            <BentoCard size="full" icon={Phone} title="DCR Management">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black text-slate-900 dark:text-white">Daily Call Reports</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">
                            Track your daily customer interactions and call activities
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => navigate('dcr/new')}
                            className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New DCR
                        </Button>
                        <Button
                            onClick={() => navigate('dcr')}
                            variant="outline"
                            className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest border-slate-700 hover:bg-slate-800"
                        >
                            View All <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </BentoCard>
        </BentoGrid>
    );
}

export default DCRTab;

