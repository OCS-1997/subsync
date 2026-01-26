import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { 
    Phone, Users, Calendar, ArrowUpRight, TrendingUp, 
    Clock, Filter, ChevronRight, Download, Activity
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from "@/lib/utils";

const DcrDetailedReport = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState('this_month');
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(endOfMonth(new Date()));
    const [selectedUser, setSelectedUser] = useState('all');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchReport();
        }
    }, [startDate, endDate, selectedUser]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/dcr/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/dcr/detailed', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    userId: selectedUser === 'all' ? undefined : selectedUser
                }
            });
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching DCR report:', error);
            toast.error('Failed to load DCR report');
        } finally {
            setLoading(false);
        }
    };

    const updateDateRange = (range) => {
        const now = new Date();
        switch (range) {
            case 'today':
                setStartDate(new Date(now.setHours(0, 0, 0, 0)));
                setEndDate(new Date(now.setHours(23, 59, 59, 999)));
                break;
            case 'this_week':
                setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
                setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
                break;
            case 'this_month':
                setStartDate(startOfMonth(now));
                setEndDate(endOfMonth(now));
                break;
            case 'last_30_days':
                setStartDate(subDays(now, 30));
                setEndDate(now);
                break;
            case 'last_90_days':
                setStartDate(subDays(now, 90));
                setEndDate(now);
                break;
        }
        setDateRange(range);
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analyzing DCR Data...</span>
            </div>
        );
    }

    const { summary = {}, dailyTrend = [], callTypes = [], userBreakdown = [] } = data || {};

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Filter Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Phone className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">DCR Analytics</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Communication Performance Tracking
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-1">
                        <Select value={dateRange} onValueChange={updateDateRange}>
                            <SelectTrigger className="h-9 w-36 border-none bg-transparent font-black text-[10px] uppercase tracking-widest focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-slate-800">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-1">
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="h-9 w-44 border-none bg-transparent font-black text-[10px] uppercase tracking-widest focus:ring-0">
                                <Users className="w-3 h-3 mr-2 text-blue-500" />
                                <SelectValue placeholder="Filter User" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-slate-800">
                                <SelectItem value="all">All Team Members</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.username} value={u.username}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        onClick={() => window.print()}
                        className="h-11 px-6 bg-slate-900 border-none text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Calls', value: summary.total_calls || 0, sub: 'Attempted segments', icon: Phone, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Talk Time', value: `${Math.round((summary.total_minutes || 0) / 60)}h`, sub: `${summary.total_minutes || 0} total minutes`, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Network Reach', value: summary.unique_contacts || 0, sub: 'Unique stakeholders', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Active Users', value: summary.active_users || 0, sub: 'Reporting staff', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("p-4 rounded-2.5xl", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</h3>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{stat.value}</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Trend Chart */}
                <Card className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Daily Volume Trend
                                </CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Call distribution over time</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[350px]">
                            {dailyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyTrend.map(d => ({ ...d, date: format(new Date(d.date), 'MMM d') }))}>
                                        <defs>
                                            <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}}
                                            itemStyle={{color: '#3b82f6'}}
                                        />
                                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCalls)" name="CALLS" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase text-[10px] tracking-widest">Insufficient data for trend</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Call Type Pie */}
                <Card className="lg:col-span-4 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Engagement Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[250px]">
                            {callTypes.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={callTypes}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                        >
                                            {callTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={6} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase text-[10px] tracking-widest">No data</div>
                            )}
                        </div>
                        <div className="space-y-3 mt-6">
                            {callTypes.map((type, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{type.name}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{type.value} logs</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Breakdown Table */}
            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Team Performance
                        </CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff activity breakdown</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-gray-50/50 dark:bg-slate-950/50">
                                    <th className="px-8 py-4">Team Member</th>
                                    <th className="px-8 py-4">Total Calls</th>
                                    <th className="px-8 py-4">Talk Time</th>
                                    <th className="px-8 py-4">Avg Duration</th>
                                    <th className="px-8 py-4 text-right">Activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {userBreakdown.length > 0 ? (
                                    userBreakdown.map((user, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                        {user.name?.[0]}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="secondary" className="bg-blue-50/50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-none rounded-lg font-black text-[10px]">{user.calls} calls</Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{(user.minutes / 60).toFixed(1)}h</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold text-slate-400 uppercase">{Math.round(user.minutes / (user.calls || 1))}m / call</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="w-24 bg-gray-100 dark:bg-slate-950 h-1.5 rounded-full inline-block overflow-hidden">
                                                    <div 
                                                        className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (user.calls / (summary.total_calls || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No member data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DcrDetailedReport;
