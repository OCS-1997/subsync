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
    Briefcase, Users, Calendar, ArrowUpRight, TrendingUp, 
    DollarSign, Filter, ChevronRight, Download, Target, Activity
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from "@/lib/utils";

const OpportunityDetailedReport = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState('last_6_months');
    const [startDate, setStartDate] = useState(subMonths(startOfMonth(new Date()), 6));
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
            const response = await api.get('/dcr/users'); // Reusing user endpoint
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/opportunities/detailed', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                    userId: selectedUser === 'all' ? undefined : selectedUser
                }
            });
            setData(response.data.data);
        } catch (error) {
            console.error('Error fetching Opportunity report:', error);
            toast.error('Failed to load Opportunity report');
        } finally {
            setLoading(false);
        }
    };

    const updateDateRange = (range) => {
        const now = new Date();
        switch (range) {
            case 'this_month':
                setStartDate(startOfMonth(now));
                setEndDate(endOfMonth(now));
                break;
            case 'last_3_months':
                setStartDate(subMonths(startOfMonth(now), 3));
                setEndDate(endOfMonth(now));
                break;
            case 'last_6_months':
                setStartDate(subMonths(startOfMonth(now), 6));
                setEndDate(endOfMonth(now));
                break;
            case 'this_year':
                setStartDate(new Date(now.getFullYear(), 0, 1));
                setEndDate(new Date(now.getFullYear(), 11, 31, 23, 59, 59));
                break;
        }
        setDateRange(range);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#f97316'];

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="h-12 w-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Pipeline Analytics...</span>
            </div>
        );
    }

    const { summary = {}, stageDistribution = [], monthlyTrend = [], userBreakdown = [] } = data || {};

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Filter Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Briefcase className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Opportunity Pipeline</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Sales Analytics & Conversions
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
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-1">
                        <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="h-9 w-44 border-none bg-transparent font-black text-[10px] uppercase tracking-widest focus:ring-0">
                                <Users className="w-3 h-3 mr-2 text-rose-500" />
                                <SelectValue placeholder="Filter Owner" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-slate-800">
                                <SelectItem value="all">All Owners</SelectItem>
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
                    { label: 'Total Value', value: formatCurrency(summary.total_value || 0), sub: `${summary.total_count || 0} opportunities`, icon: DollarSign, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Closed Won', value: formatCurrency(summary.won_value || 0), sub: `${summary.won_count || 0} conversions`, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Win Rate', value: `${summary.total_count > 0 ? Math.round((summary.won_count / summary.total_count) * 100) : 0}%`, sub: 'By deal count', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Avg Deal Size', value: formatCurrency(summary.total_count > 0 ? Math.round(summary.total_value / summary.total_count) : 0), sub: 'Gross performance', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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
                {/* Monthly Value Trend Chart */}
                <Card className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Pipeline Value Trend
                                </CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Monthly opportunity accumulation</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[350px]">
                            {monthlyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyTrend}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" name="PIPELINE VALUE" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase text-[10px] tracking-widest">No pipeline history available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Status distribution Pie */}
                <Card className="lg:col-span-4 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Stage Analytics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[250px]">
                            {stageDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stageDistribution}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                        >
                                            {stageDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} cornerRadius={6} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase'}}
                                            formatter={(val) => formatCurrency(val)}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 font-black uppercase text-[10px] tracking-widest">No data</div>
                            )}
                        </div>
                        <div className="space-y-2 mt-6">
                            {stageDistribution.map((stage, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: stage.color || COLORS[i % COLORS.length]}} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{stage.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-900 dark:text-white">{formatCurrency(stage.value)}</div>
                                        <div className="text-[8px] font-bold text-slate-400">{stage.count} deals</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Owner Breakdown Table */}
            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Owner Performance
                        </CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sales team pipeline contribution</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-gray-50/50 dark:bg-slate-950/50">
                                    <th className="px-8 py-4">Account Owner</th>
                                    <th className="px-8 py-4">Deal Count</th>
                                    <th className="px-8 py-4">Pipeline Value</th>
                                    <th className="px-8 py-4">Avg Opportunity</th>
                                    <th className="px-8 py-4 text-right">Pipeline Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                {userBreakdown.length > 0 ? (
                                    userBreakdown.map((user, i) => (
                                        <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                        {user.name?.[0]}
                                                    </div>
                                                    <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="secondary" className="bg-rose-50/50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-none rounded-lg font-black text-[10px]">{user.count} deals</Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300">{formatCurrency(user.value)}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold text-slate-400 uppercase">{formatCurrency(Math.round(user.value / (user.count || 1)))} / deal</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="w-24 bg-gray-100 dark:bg-slate-950 h-1.5 rounded-full inline-block overflow-hidden">
                                                    <div 
                                                        className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.min(100, (user.value / (summary.total_value || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-8 py-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No account owner data available</td>
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

export default OpportunityDetailedReport;
