import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
    BarChart, Bar, PieChart, Pie, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { 
    Download, TrendingUp, Clock, 
    DollarSign, Users, FolderKanban,
    Calendar, ArrowUpRight, Target, Activity,
    Shapes, Filter, ChevronRight
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from "@/lib/utils";

const TimeTrackingReports = () => {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState(null);
    const [dateRange, setDateRange] = useState('this_week');
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [endDate, setEndDate] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));
    const [selectedUser, setSelectedUser] = useState(null);
    const [userEntries, setUserEntries] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);

    useEffect(() => {
        updateDateRange(dateRange);
    }, []);

    useEffect(() => {
        if (startDate && endDate) {
            fetchReports();
        }
    }, [startDate, endDate]);

    const updateDateRange = (range) => {
        const now = new Date();
        switch (range) {
            case 'today':
                setStartDate(new Date(now.setHours(0, 0, 0, 0)));
                setEndDate(new Date(now.setHours(23, 59, 59, 999)));
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                setStartDate(new Date(yesterday.setHours(0, 0, 0, 0)));
                setEndDate(new Date(yesterday.setHours(23, 59, 59, 999)));
                break;
            case 'this_week':
                setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
                setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
                break;
            case 'last_week':
                const lastWeek = subDays(now, 7);
                setStartDate(startOfWeek(lastWeek, { weekStartsOn: 1 }));
                setEndDate(endOfWeek(lastWeek, { weekStartsOn: 1 }));
                break;
            case 'this_month':
                setStartDate(startOfMonth(now));
                setEndDate(endOfMonth(now));
                break;
            case 'last_30_days':
                setStartDate(subDays(now, 30));
                setEndDate(now);
                break;
        }
        setDateRange(range);
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get('/time-tracking/reports/detailed', {
                params: {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                }
            });
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserActivity = async (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setFetchingDetails(true);
        try {
            const response = await api.get('/time-tracking/entries', {
                params: {
                    user_id: user.user_id,
                    startDate: format(startDate, 'yyyy-MM-dd'),
                    endDate: format(endDate, 'yyyy-MM-dd'),
                    limit: 1000
                }
            });
            setUserEntries(response.data.entries || []);
        } catch (error) {
            console.error('Error fetching user activity:', error);
            toast.error('Failed to load activity details');
        } finally {
            setFetchingDetails(false);
        }
    };

    const handleExport = async (formatType = 'csv') => {
        try {
            const response = await api.get('/time-tracking/reports/export', {
                params: {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                }
            });

            const entries = response.data.entries || [];
            
            if (formatType === 'csv') {
                const headers = ['Date', 'Start Time', 'End Time', 'Duration (hrs)', 'User', 'Title', 'Customer', 'Project', 'Activity', 'Billable'];
                const rows = entries.map(entry => [
                    format(new Date(entry.start_time), 'yyyy-MM-dd'),
                    format(new Date(entry.start_time), 'HH:mm'),
                    entry.end_time ? format(new Date(entry.end_time), 'HH:mm') : '-',
                    (entry.duration_minutes / 60).toFixed(2),
                    `${entry.first_name} ${entry.last_name}`,
                    entry.title,
                    entry.customer_name || '-',
                    entry.project_name || '-',
                    entry.activity_type || '-',
                    entry.is_billable ? 'Yes' : 'No'
                ]);

                const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `time-tracking-report-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.csv`;
                a.click();
                toast.success('Report exported successfully');
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    const formatHours = (minutes) => {
        if (!minutes) return '0h';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };

    const formatChartData = (data, valueKey = 'total_minutes') => {
        return data.map(item => ({
            ...item,
            hours: parseFloat((item[valueKey] / 60).toFixed(1))
        }));
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#f97316'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Reports...</span>
            </div>
        );
    }

    const { 
        summary = {}, 
        byProject = [], 
        byCustomer = [], 
        byActivity = [], 
        dailyTrend = [], 
        topUsers = [] 
    } = reports || {};

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Report Controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Calendar className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">Time Reports</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {format(startDate, 'MMM d, yyyy')} <span className="mx-2 text-blue-500 opacity-50">/</span> {format(endDate, 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-1">
                        <Select value={dateRange} onValueChange={updateDateRange}>
                            <SelectTrigger className="h-9 w-40 border-none bg-transparent font-black text-[10px] uppercase tracking-widest focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-slate-800">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="last_week">Last Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button 
                        onClick={() => handleExport('csv')}
                        className="h-11 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Time', value: formatHours(summary?.total_minutes || 0), sub: `${summary?.total_entries || 0} entries`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Billable Time', value: formatHours(summary?.billable_minutes || 0), sub: `${(summary?.total_minutes || 0) > 0 ? ((summary.billable_minutes / summary.total_minutes) * 100).toFixed(0) : 0}% billable`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Projects', value: summary?.unique_projects || 0, sub: 'Active projects', icon: FolderKanban, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Customers', value: summary?.unique_customers || 0, sub: 'Active customers', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("p-4 rounded-2.5xl", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</h3>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{stat.value}</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Activity Analysis */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Daily Trend Area Chart */}
                <Card className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Daily Hours Trend
                                </CardTitle>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Daily time tracking</p>
                            </div>
                            <Badge variant="outline" className="rounded-lg border-gray-100 text-[9px] font-black uppercase tracking-widest px-3">Live Data</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        {dailyTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={dailyTrend.map(d => ({
                                    ...d,
                                    date: format(new Date(d.date), 'MMM d'),
                                    total_hours: parseFloat((d.total_minutes / 60).toFixed(1)),
                                    billable_hours: parseFloat((d.billable_minutes / 60).toFixed(1))
                                }))}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorBillable" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}}
                                    />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px'}}
                                    />
                                    <Area type="monotone" dataKey="total_hours" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" name="TOTAL HRS" />
                                    <Area type="monotone" dataKey="billable_hours" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorBillable)" name="BILLABLE" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[350px] gap-4 text-slate-300">
                                <Activity size={48} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase tracking-widest">No data available</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Breakdown Pie */}
                <Card className="lg:col-span-4 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                            <Shapes className="w-4 h-4" />
                            Activity Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        {byActivity.length > 0 ? (
                            <div className="relative">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={formatChartData(byActivity)}
                                            dataKey="hours"
                                            nameKey="type_name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                        >
                                            {byActivity.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} cornerRadius={4} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px'}}
                                            formatter={(value) => `${value}h`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-2 mt-4">
                                    {byActivity.slice(0, 4).map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950 p-3 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color || COLORS[i % COLORS.length]}} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{item.type_name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white">{(item.total_minutes / 60).toFixed(1)}h</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] gap-4 text-slate-300">
                                <Shapes size={48} strokeWidth={1} />
                                <span className="text-[10px] font-black uppercase tracking-widest">No data available</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Summary Details */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Project Breakdown */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Project Stats</CardTitle>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Time spent by project</p>
                        </div>
                        <Filter className="w-4 h-4 text-slate-300" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                            {byProject.length > 0 ? (
                                byProject.slice(0, 5).map((project, i) => (
                                    <div key={i} className="p-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 flex items-center justify-center shadow-sm">
                                                    <div className="w-3 h-3 rounded-full shadow-lg" style={{backgroundColor: project.color || COLORS[i % COLORS.length]}} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{project.project_name}</h4>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{project.customer_name || 'Internal'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{(project.total_minutes / 60).toFixed(1)}h</span>
                                                <div className="flex items-center gap-1 mt-1 justify-end">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{(project.billable_minutes / 60).toFixed(1)}h Billable</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-950 rounded-full mt-4 overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000" 
                                                style={{
                                                    width: `${Math.min(100, (project.total_minutes / (summary.total_minutes || 1)) * 100)}%`,
                                                    backgroundColor: project.color || COLORS[i % COLORS.length]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest">No projects found</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Team Ranking */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Top Team Members</CardTitle>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efficiency rankings</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50 dark:divide-slate-800">
                            {topUsers.length > 0 ? (
                                topUsers.map((user, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => fetchUserActivity(user)}
                                        className="p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{user.first_name} {user.last_name}</h4>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-950 text-[8px] font-black uppercase tracking-widest px-2">{user.entry_count} entries</Badge>
                                                    <Badge className="bg-blue-600/10 text-blue-600 dark:text-blue-400 border-none text-[8px] font-black uppercase tracking-widest px-2">Active</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm font-black text-slate-900 dark:text-white">{(user.total_minutes / 60).toFixed(1)}h</div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Hours</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest">No members found</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* User Activity Drill-down Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none dark:bg-slate-950 shadow-2xl">
                    <DialogHeader className="p-10 bg-slate-900 dark:bg-slate-900">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-3xl bg-blue-600 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-blue-500/20">
                                {selectedUser?.first_name?.[0]}{selectedUser?.last_name?.[0]}
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">
                                    {selectedUser?.first_name} {selectedUser?.last_name}
                                </DialogTitle>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mt-1 italic">
                                    Operational Activity Registry • {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                        {fetchingDetails ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling activities...</span>
                            </div>
                        ) : userEntries.length > 0 ? (
                            <div className="space-y-3">
                                {userEntries.map((entry, idx) => (
                                    <div key={idx} className="p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.activity_color || '#3b82f6' }} />
                                            <div>
                                                <h5 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{entry.title}</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {entry.customer_name && (
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                                                            {entry.customer_name}
                                                        </span>
                                                    )}
                                                    {entry.project_name && (
                                                        <span className="text-[9px] font-bold text-blue-500/70 uppercase tracking-widest bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10">
                                                            {entry.project_name}
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                        {format(new Date(entry.start_time), 'MMM dd')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right pl-6">
                                            <div className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums">
                                                {formatHours(entry.duration_minutes)}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No activities logged in this period</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-8 border-t border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative Time</p>
                            <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                                {selectedUser ? (selectedUser.total_minutes / 60).toFixed(1) + 'h' : '0.0h'}
                            </span>
                        </div>
                        <Button 
                            onClick={() => setIsModalOpen(false)}
                            className="h-10 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest"
                        >
                            Close Registry
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TimeTrackingReports;

