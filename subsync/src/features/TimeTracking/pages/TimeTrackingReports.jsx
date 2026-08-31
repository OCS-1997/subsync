import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    BarChart, Bar, PieChart, Pie, LineChart, Line, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { 
    Download, TrendingUp, Clock, 
    DollarSign, Users, User, FolderKanban,
    Calendar, ArrowUpRight, Target, Activity,
    Shapes, Filter, ChevronRight, Sparkles
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, startOfYear, endOfYear, subMonths } from 'date-fns';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from "@/lib/utils";
import ExportModal from '../components/ExportModal';

const TimeTrackingReports = () => {
    const currentUser = useSelector(state => state.auth.user);
    const permissions = useSelector(state => state.auth.permissions);
    const hasTeamView = permissions?.includes('time-tracking.view-team') || permissions?.includes('time-tracking.manage');

    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState(null);
    const [dateRange, setDateRange] = useState('this_week');
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [endDate, setEndDate] = useState(endOfWeek(new Date(), { weekStartsOn: 1 }));
    const [trendViewMode, setTrendViewMode] = useState('monthly'); // 'daily' | 'monthly'
    const [selectedUser, setSelectedUser] = useState(null);
    const [userEntries, setUserEntries] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fetchingDetails, setFetchingDetails] = useState(false);

    // Sub-tabs State
    const [subTab, setSubTab] = useState('team');
    const [selectedInsightUserId, setSelectedInsightUserId] = useState('');
    const [indTrendViewMode, setIndTrendViewMode] = useState('monthly'); // 'monthly' | 'daily'
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [individualLogs, setIndividualLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Advanced Filters State
    const [filterUserId, setFilterUserId] = useState('all');
    const [customerId, setCustomerId] = useState('all');
    const [projectId, setProjectId] = useState('all');
    const [activityTypeId, setActivityTypeId] = useState('all');
    const [isBillable, setIsBillable] = useState('all');
    
    // Filter Options
    const [users, setUsers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isInternalLoading, setIsInternalLoading] = useState(false);

    // Temp states for custom dates
    const [tempFromDate, setTempFromDate] = useState(startDate);
    const [tempToDate, setTempToDate] = useState(endDate);

    useEffect(() => {
        if (currentUser?.username && !selectedInsightUserId) {
            setSelectedInsightUserId(currentUser.username);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [usersRes, customersRes, projectsRes, categoriesRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/time-tracking/customers?limit=1000'),
                    api.get('/time-tracking/projects?limit=1000'),
                    api.get('/time-tracking/categories')
                ]);
                setUsers(usersRes.data);
                setCustomers(customersRes.data.customers || []);
                setProjects(projectsRes.data.projects || []);
                setCategories(categoriesRes.data.categories || []);
            } catch (error) {
                console.error('Error fetching filter options:', error);
            }
        };
        fetchFilters();
        updateDateRange(dateRange);
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            };

            let targetUserId = filterUserId;
            if (subTab === 'individual') {
                targetUserId = selectedInsightUserId || currentUser?.username;
            }

            if (targetUserId && targetUserId !== 'all') params.user_id = targetUserId;
            if (customerId !== 'all') params.customer_id = customerId;
            if (projectId !== 'all') params.project_id = projectId;
            if (activityTypeId !== 'all') params.activity_type_id = activityTypeId;
            if (isBillable !== 'all') params.is_billable = isBillable;

            const response = await api.get('/time-tracking/reports/detailed', { params });
            setReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const fetchIndividualLogs = async (userId) => {
        if (!userId) return;
        setLoadingLogs(true);
        try {
            const params = {
                user_id: userId,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                limit: 10
            };
            const response = await api.get('/time-tracking/entries/all', { params });
            setIndividualLogs(response.data.entries || []);
        } catch (err) {
            console.error("Error fetching individual logs:", err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (subTab === 'individual') {
            const targetUser = selectedInsightUserId || currentUser?.username;
            if (targetUser) {
                fetchIndividualLogs(targetUser);
            }
        }
    }, [startDate, endDate, selectedInsightUserId, subTab, currentUser]);

    useEffect(() => {
        if (startDate && endDate) {
            fetchReports();
        }
    }, [startDate, endDate, filterUserId, customerId, projectId, activityTypeId, isBillable, subTab, selectedInsightUserId]);

    const updateDateRange = (range) => {
        const now = new Date();
        if (range === 'custom') {
            setDateRange('custom');
            setTempFromDate(startDate);
            setTempToDate(endDate);
            return;
        }
        
        let start = new Date();
        let end = new Date();

        switch (range) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                start = new Date(yesterday.setHours(0, 0, 0, 0));
                end = new Date(yesterday.setHours(23, 59, 59, 999));
                break;
            case 'this_week':
                start = startOfWeek(now, { weekStartsOn: 1 });
                end = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'last_week':
                const lastWeek = subDays(now, 7);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case 'this_month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'last_30_days':
                start = subDays(now, 30);
                end = now;
                break;
            case 'this_year':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'last_12_months':
                start = subMonths(now, 12);
                end = now;
                break;
        }
        setStartDate(start);
        setEndDate(end);
        setTempFromDate(start);
        setTempToDate(end);
        setDateRange(range);
    };

    const handleRefreshCustomRange = () => {
        setStartDate(tempFromDate);
        setEndDate(tempToDate);
        fetchReports();
    };

    const fetchUserActivity = async (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
        setFetchingDetails(true);
        try {
            // Use username from row if available, fallback to user_id or id
            const userId = user.username || user.user_id || user.id;

            if (!userId) {
                console.warn('No user ID found for activity fetch:', user);
                setUserEntries([]);
                return;
            }

            const params = {
                user_id: userId,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
                limit: 1000
            };

            if (customerId !== 'all') params.customer_id = customerId;
            if (projectId !== 'all') params.project_id = projectId;
            if (activityTypeId !== 'all') params.activity_type_id = activityTypeId;
            if (isBillable !== 'all') params.is_billable = isBillable;

            const response = await api.get('/time-tracking/entries/all', { params });
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
            const params = {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            };

            if (filterUserId !== 'all') params.user_id = filterUserId;
            if (customerId !== 'all') params.customer_id = customerId;
            if (projectId !== 'all') params.project_id = projectId;
            if (activityTypeId !== 'all') params.activity_type_id = activityTypeId;
            if (isBillable !== 'all') params.is_billable = isBillable;

            const response = await api.get('/time-tracking/reports/export', { params });

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
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

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 mr-2 bg-gray-50 dark:bg-slate-950 p-1.5 rounded-xl border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 px-2">
                                <Label className="text-[9px] font-black uppercase text-slate-400">From</Label>
                                <Input 
                                    type="date" 
                                    value={format(tempFromDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setTempFromDate(new Date(e.target.value))}
                                    className="h-7 w-32 border-none bg-transparent font-bold text-[10px] focus-visible:ring-0 p-0"
                                />
                            </div>
                            <div className="h-4 w-px bg-gray-200 dark:bg-slate-800" />
                            <div className="flex items-center gap-2 px-2">
                                <Label className="text-[9px] font-black uppercase text-slate-400">To</Label>
                                <Input 
                                    type="date" 
                                    value={format(tempToDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setTempToDate(new Date(e.target.value))}
                                    className="h-7 w-32 border-none bg-transparent font-bold text-[10px] focus-visible:ring-0 p-0"
                                />
                            </div>
                            <Button 
                                onClick={handleRefreshCustomRange}
                                size="sm"
                                className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                            >
                                Apply
                            </Button>
                        </div>
                    )}
                    <div className="bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-1">
                        <Select value={dateRange} onValueChange={updateDateRange}>
                            <SelectTrigger className="h-9 w-full sm:w-40 border-none bg-transparent font-black text-[10px] uppercase tracking-widest focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-gray-100 dark:border-slate-800">
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="last_week">Last Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                                <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button 
                            variant="outline"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className={cn(
                                "h-11 flex-1 sm:flex-none sm:px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-gray-100 dark:border-slate-800 transition-all",
                                showAdvanced ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-900"
                            )}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                        <Button 
                            onClick={() => setIsExportModalOpen(true)}
                            className="h-11 flex-1 sm:flex-none sm:px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tab Selection */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 gap-6 mt-4">
                <button 
                    onClick={() => setSubTab('team')}
                    className={cn(
                        "pb-4 font-black text-xs uppercase tracking-widest border-b-2 transition-all relative",
                        subTab === 'team' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Team Overview
                    </div>
                </button>
                <button 
                    onClick={() => setSubTab('individual')}
                    className={cn(
                        "pb-4 font-black text-xs uppercase tracking-widest border-b-2 transition-all relative",
                        subTab === 'individual' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Individual Insights
                    </div>
                </button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvanced && (
                <div className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-4 duration-500",
                    subTab === 'individual' ? "lg:grid-cols-4" : "lg:grid-cols-5"
                )}>
                    {subTab !== 'individual' && (
                        <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Team Member</Label>
                            <Select value={filterUserId} onValueChange={setFilterUserId}>
                                <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs">
                                    <SelectValue placeholder="All Members" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Members</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.username} value={u.username}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Client</Label>
                        <Select value={customerId} onValueChange={(val) => {
                            setCustomerId(val);
                            setProjectId('all'); // Reset project when client changes
                        }}>
                            <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs">
                                <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Clients</SelectItem>
                                {customers.map(c => (
                                    <SelectItem key={c.customer_id} value={String(c.customer_id)}>{c.display_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Project</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs">
                                <SelectValue placeholder="All Projects" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects
                                    .filter(p => customerId === 'all' || String(p.customer_id) === customerId)
                                    .map(p => (
                                        <SelectItem key={p.id} value={String(p.id)}>{p.project_name}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Activity</Label>
                        <Select value={activityTypeId} onValueChange={setActivityTypeId}>
                            <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs">
                                <SelectValue placeholder="All Activities" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Activities</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.type_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing</Label>
                        <Select value={isBillable} onValueChange={setIsBillable}>
                            <SelectTrigger className="h-10 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs">
                                <SelectValue placeholder="All Entries" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all">All Entries</SelectItem>
                                <SelectItem value="true">Billable Only</SelectItem>
                                <SelectItem value="false">Non-Billable</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {subTab === 'team' && (
                <>
                    {/* Quick Stats */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                        {/* Daily / Monthly Trend Area Chart */}
                        <Card className="lg:col-span-8 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="p-8 pb-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            {trendViewMode === 'monthly' ? 'Monthly Hours & Performance Trend' : 'Daily Hours Trend'}
                                        </CardTitle>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                            {trendViewMode === 'monthly' ? 'Month-by-month hours logged performance' : 'Daily time tracking'}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200/60 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setTrendViewMode('daily')}
                                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                                    trendViewMode === 'daily'
                                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                Daily
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTrendViewMode('monthly')}
                                                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                                    trendViewMode === 'monthly'
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            >
                                                Monthly
                                            </button>
                                        </div>
                                        <Badge variant="outline" className="rounded-lg border-gray-100 text-[9px] font-black uppercase tracking-widest px-3 hidden xs:inline-flex">Live Data</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-8 overflow-x-auto no-scrollbar space-y-6">
                                <div className="min-w-[500px] h-[350px]">
                                    {(() => {
                                        let chartData = [];
                                        if (trendViewMode === 'monthly') {
                                            if (summary?.monthlyTrend && summary.monthlyTrend.length > 0) {
                                                chartData = summary.monthlyTrend.map(m => {
                                                    const [y, mNum] = (m.month_str || '').split('-');
                                                    const dObj = new Date(parseInt(y), parseInt(mNum) - 1, 1);
                                                    return {
                                                        date: format(dObj, 'MMM yyyy'),
                                                        total_hours: parseFloat(((m.total_minutes || 0) / 60).toFixed(1)),
                                                        billable_hours: parseFloat(((m.billable_minutes || 0) / 60).toFixed(1)),
                                                        non_billable_hours: parseFloat(((m.non_billable_minutes || 0) / 60).toFixed(1))
                                                    };
                                                });
                                            } else {
                                                // Roll up dailyTrend into monthly buckets on client side if backend summary not present
                                                const monthsMap = {};
                                                (dailyTrend || []).forEach(d => {
                                                    const dateObj = new Date(d.date);
                                                    const mKey = format(dateObj, 'MMM yyyy');
                                                    if (!monthsMap[mKey]) {
                                                        monthsMap[mKey] = { total_minutes: 0, billable_minutes: 0 };
                                                    }
                                                    const tot = Number(d.total_minutes || 0);
                                                    const bill = Number(d.billable_minutes || 0);
                                                    monthsMap[mKey].total_minutes += tot;
                                                    monthsMap[mKey].billable_minutes += bill;
                                                });
                                                chartData = Object.keys(monthsMap).map(mKey => ({
                                                    date: mKey,
                                                    total_hours: parseFloat((monthsMap[mKey].total_minutes / 60).toFixed(1)),
                                                    billable_hours: parseFloat((monthsMap[mKey].billable_minutes / 60).toFixed(1))
                                                }));
                                            }
                                        } else {
                                            chartData = (dailyTrend || []).map(d => ({
                                                ...d,
                                                date: format(new Date(d.date), 'MMM d'),
                                                total_hours: parseFloat(((d.total_minutes || 0) / 60).toFixed(1)),
                                                billable_hours: parseFloat(((d.billable_minutes || 0) / 60).toFixed(1))
                                            }));
                                        }

                                        return chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData}>
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
                                            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
                                                <Activity size={48} strokeWidth={1} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">No data available</span>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Monthly Performance Table */}
                                {trendViewMode === 'monthly' && summary?.monthlyTrend && summary.monthlyTrend.length > 0 && (
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-3">
                                            Month-by-Month Hours Logged & Performance
                                        </h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-[9px] font-black">
                                                    <tr>
                                                        <th className="p-2.5 rounded-l-xl">Month</th>
                                                        <th className="p-2.5 text-right">Total Entries</th>
                                                        <th className="p-2.5 text-right">Total Logged</th>
                                                        <th className="p-2.5 text-right">Billable Hours</th>
                                                        <th className="p-2.5 text-right rounded-r-xl">Billable %</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                                    {summary.monthlyTrend.map(m => {
                                                        const [y, mNum] = (m.month_str || '').split('-');
                                                        const monthLabel = m.month_str ? format(new Date(parseInt(y), parseInt(mNum) - 1, 1), 'MMMM yyyy') : 'Unknown';
                                                        const totalHrs = (m.total_minutes / 60).toFixed(1);
                                                        const billableHrs = (m.billable_minutes / 60).toFixed(1);
                                                        const billablePct = m.total_minutes > 0 ? Math.round((m.billable_minutes / m.total_minutes) * 100) : 0;
                                                        return (
                                                            <tr key={m.month_str} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{monthLabel}</td>
                                                                <td className="p-2.5 text-right text-slate-500 dark:text-slate-400">{m.total_entries}</td>
                                                                <td className="p-2.5 text-right font-black text-blue-600 dark:text-blue-400">{totalHrs}h</td>
                                                                <td className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">{billableHrs}h</td>
                                                                <td className="p-2.5 text-right font-bold text-slate-700 dark:text-slate-300">{billablePct}%</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
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
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <User className="h-2 w-2" />
                                                                {user.username}
                                                            </span>
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
                </>
            )}

            {subTab === 'individual' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* User Selection & Profile Card */}
                    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-xl shadow-blue-500/20">
                                {(() => {
                                    const activeUserObj = users.find(u => u.username === (selectedInsightUserId || currentUser?.username)) || (selectedInsightUserId === currentUser?.username ? currentUser : null);
                                    const nameVal = activeUserObj?.name || activeUserObj?.display_name || activeUserObj?.first_name || selectedInsightUserId || 'User';
                                    const parts = nameVal.trim().split(/\s+/);
                                    if (parts.length >= 2) {
                                        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                                    }
                                    return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'U';
                                })()}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">
                                    {(() => {
                                        const activeUserObj = users.find(u => u.username === (selectedInsightUserId || currentUser?.username)) || (selectedInsightUserId === currentUser?.username ? currentUser : null);
                                        return activeUserObj?.name || activeUserObj?.display_name || activeUserObj?.first_name || selectedInsightUserId || 'Team Member';
                                    })()}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {selectedInsightUserId || currentUser?.username}
                                </p>
                            </div>
                        </div>

                        {hasTeamView ? (
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">Analyze Member:</Label>
                                <Select 
                                    value={selectedInsightUserId || currentUser?.username} 
                                    onValueChange={(val) => setSelectedInsightUserId(val)}
                                >
                                    <SelectTrigger className="h-11 w-full sm:w-64 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs">
                                        <SelectValue placeholder="Select Team Member" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {users.map(u => (
                                            <SelectItem key={u.username} value={u.username}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1">
                                Personal Insights
                            </Badge>
                        )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { 
                                label: 'Hours Tracked', 
                                value: formatHours(summary?.total_minutes || 0), 
                                sub: `${summary?.total_entries || 0} time entries`, 
                                icon: Clock, 
                                color: 'text-blue-500', 
                                bg: 'bg-blue-500/10' 
                            },
                            { 
                                label: 'Billability Rate', 
                                value: `${(summary?.total_minutes || 0) > 0 ? Math.round((summary.billable_minutes / summary.total_minutes) * 100) : 0}%`, 
                                sub: `${formatHours(summary?.billable_minutes || 0)} billable`, 
                                icon: DollarSign, 
                                color: 'text-emerald-500', 
                                bg: 'bg-emerald-500/10' 
                            },
                            { 
                                label: 'Active Projects', 
                                value: byProject.length, 
                                sub: `${byCustomer.length} clients served`, 
                                icon: FolderKanban, 
                                color: 'text-purple-500', 
                                bg: 'bg-purple-500/10' 
                            },
                            { 
                                label: 'Daily Tracker Avg', 
                                value: (() => {
                                    const activeDays = dailyTrend.filter(d => d.total_minutes > 0).length || 1;
                                    return formatHours(Math.round((summary?.total_minutes || 0) / activeDays));
                                })(), 
                                sub: 'Per active tracking day', 
                                icon: Activity, 
                                color: 'text-amber-500', 
                                bg: 'bg-amber-500/10' 
                            },
                        ].map((stat, i) => (
                            <Card key={i} className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm group hover:scale-[1.02] transition-all duration-300">
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

                    {/* Breakdown Graphs & Details */}
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Project Time Allocation */}
                        <Card className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Project Allocation</CardTitle>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Projects worked on</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {byProject.length > 0 ? (
                                        byProject.map((project, i) => (
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
                                        <div className="p-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest">No project allocation logs</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activity Type Breakdown Pie */}
                        <Card className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                    <Shapes className="w-4 h-4" />
                                    Time Allocation
                                </CardTitle>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Breakdown by activity types</p>
                            </CardHeader>
                            <CardContent className="p-8">
                                {byActivity.length > 0 ? (
                                    <div className="relative">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie
                                                    data={formatChartData(byActivity)}
                                                    dataKey="hours"
                                                    nameKey="type_name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={80}
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
                                        <div className="space-y-2 mt-4 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                                            {byActivity.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-950 p-2.5 rounded-xl">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color || COLORS[i % COLORS.length]}} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{item.type_name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{(item.total_minutes / 60).toFixed(1)}h</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[260px] gap-4 text-slate-300">
                                        <Shapes size={48} strokeWidth={1} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No activity tracking data</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actionable Individual Insights & Diagnostics Banner */}
                    {(() => {
                        const totalMins = summary?.total_minutes || 0;
                        const billableMins = summary?.billable_minutes || 0;
                        const billablePct = totalMins > 0 ? Math.round((billableMins / totalMins) * 100) : 0;
                        const activeDaysCount = dailyTrend.filter(d => d.total_minutes > 0).length || 1;
                        const avgDailyHrs = (totalMins / activeDaysCount / 60).toFixed(1);
                        const topProj = byProject.length > 0 ? byProject[0] : null;
                        const topCust = byCustomer.length > 0 ? byCustomer[0] : null;

                        let billableStatusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                        let billableStatusMsg = "High Billable Density — Optimal revenue generating focus.";
                        if (billablePct < 50) {
                            billableStatusColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                            billableStatusMsg = "Low Billable Density — High non-billable overhead. Review activity categories.";
                        } else if (billablePct < 75) {
                            billableStatusColor = "text-blue-500 bg-blue-500/10 border-blue-500/20";
                            billableStatusMsg = "Balanced Effort — Moderate split between billable and operational tasks.";
                        }

                        return (
                            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
                                <CardHeader className="p-8 pb-4 border-b border-gray-100/60 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                                                <Sparkles className="w-5 h-5 animate-pulse" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                                                    Actionable Performance Diagnostics
                                                </CardTitle>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    Smart analytical insights derived from logged effort data
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="rounded-full border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest px-3 py-1">
                                            Individual Analysis
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 grid gap-6 md:grid-cols-3">
                                    {/* Insight 1: Revenue & Billability Efficiency */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Billability Density</span>
                                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border", billableStatusColor)}>
                                                {billablePct}% Billable
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {formatHours(billableMins)} <span className="text-xs text-slate-400 font-bold">/ {formatHours(totalMins)}</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                                {billableStatusMsg}
                                            </p>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${billablePct}%` }} />
                                        </div>
                                    </div>

                                    {/* Insight 2: Workload & Active Daily Pace */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Workload Pacing</span>
                                            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                                {activeDaysCount} Active Days
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {avgDailyHrs}h <span className="text-xs text-slate-400 font-bold">/ active day</span>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                                {parseFloat(avgDailyHrs) > 8.5 
                                                    ? "High Intensity Alert — Average daily effort exceeds standard 8h/day capacity."
                                                    : parseFloat(avgDailyHrs) >= 6 
                                                    ? "Consistent Momentum — Sustained daily tracker engagement across active days."
                                                    : "Under-logged Potential — Active day average is below 6 hours per day."}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Tracking Frequency</span>
                                            <span className="text-blue-600 dark:text-blue-400 font-bold">{summary?.total_entries || 0} Total Logs</span>
                                        </div>
                                    </div>

                                    {/* Insight 3: Core Focus Anchor */}
                                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Primary Focus Anchor</span>
                                            <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                                Top Impact
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                                                {topProj ? topProj.project_name : 'No project focus'}
                                            </div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mt-0.5">
                                                {topCust ? topCust.customer_name : 'Internal Work'}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                                {topProj ? `${((topProj.total_minutes / (totalMins || 1)) * 100).toFixed(0)}% of total logged time devoted to this project.` : 'No effort logged for projects yet.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Time Invested</span>
                                            <span className="text-slate-900 dark:text-white font-bold">{topProj ? `${(topProj.total_minutes / 60).toFixed(1)}h` : '0h'}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}

                    {/* Monthly / Daily Effort Trend Chart */}
                    <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                        <CardHeader className="p-8 pb-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        {indTrendViewMode === 'monthly' ? 'Monthly Effort & Performance Trend' : 'Daily Hours Trend'}
                                    </CardTitle>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                                        {indTrendViewMode === 'monthly' ? 'Aggregated monthly effort breakdown and billable ratio' : 'Daily hours logged over time'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIndTrendViewMode('monthly')}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                            indTrendViewMode === 'monthly'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Monthly Trend
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIndTrendViewMode('daily')}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                                            indTrendViewMode === 'daily'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        Daily View
                                    </button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-8 overflow-x-auto no-scrollbar space-y-6">
                            <div className="min-w-[500px] h-[320px]">
                                {(() => {
                                    let chartData = [];
                                    if (indTrendViewMode === 'monthly') {
                                        if (summary?.monthlyTrend && summary.monthlyTrend.length > 0) {
                                            chartData = summary.monthlyTrend.map(m => {
                                                const [y, mNum] = (m.month_str || '').split('-');
                                                const dObj = m.month_str ? new Date(parseInt(y), parseInt(mNum) - 1, 1) : new Date();
                                                return {
                                                    date: format(dObj, 'MMM yyyy'),
                                                    total_hours: parseFloat(((m.total_minutes || 0) / 60).toFixed(1)),
                                                    billable_hours: parseFloat(((m.billable_minutes || 0) / 60).toFixed(1)),
                                                    non_billable_hours: parseFloat((Math.max(0, (m.total_minutes || 0) - (m.billable_minutes || 0)) / 60).toFixed(1))
                                                };
                                            });
                                        } else {
                                            // Roll up dailyTrend into monthly buckets client-side
                                            const monthsMap = {};
                                            (dailyTrend || []).forEach(d => {
                                                const dateObj = new Date(d.date);
                                                const mKey = format(dateObj, 'MMM yyyy');
                                                if (!monthsMap[mKey]) {
                                                    monthsMap[mKey] = { total_minutes: 0, billable_minutes: 0 };
                                                }
                                                const tot = Number(d.total_minutes || 0);
                                                const bill = Number(d.billable_minutes || 0);
                                                monthsMap[mKey].total_minutes += tot;
                                                monthsMap[mKey].billable_minutes += bill;
                                            });
                                            chartData = Object.keys(monthsMap).map(mKey => ({
                                                date: mKey,
                                                total_hours: parseFloat((monthsMap[mKey].total_minutes / 60).toFixed(1)),
                                                billable_hours: parseFloat((monthsMap[mKey].billable_minutes / 60).toFixed(1)),
                                                non_billable_hours: parseFloat((Math.max(0, monthsMap[mKey].total_minutes - monthsMap[mKey].billable_minutes) / 60).toFixed(1))
                                            }));
                                        }
                                    } else {
                                        chartData = (dailyTrend || []).map(d => ({
                                            ...d,
                                            date: format(new Date(d.date), 'MMM d'),
                                            total_hours: parseFloat(((d.total_minutes || 0) / 60).toFixed(1)),
                                            billable_hours: parseFloat(((d.billable_minutes || 0) / 60).toFixed(1))
                                        }));
                                    }

                                    return chartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorTotalInd" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                    <linearGradient id="colorBillableInd" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
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
                                                <Area type="monotone" dataKey="total_hours" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorTotalInd)" name="TOTAL HOURS" />
                                                <Area type="monotone" dataKey="billable_hours" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorBillableInd)" name="BILLABLE HOURS" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-300">
                                            <Activity size={48} strokeWidth={1} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">No effort trend logged for this period</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Monthly Breakdown Table for Individual */}
                            {indTrendViewMode === 'monthly' && (
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-3">
                                        Month-by-Month Logged Hours & Billability Analysis
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-[9px] font-black">
                                                <tr>
                                                    <th className="p-2.5 rounded-l-xl">Month</th>
                                                    <th className="p-2.5 text-right">Total Logs</th>
                                                    <th className="p-2.5 text-right">Total Hours</th>
                                                    <th className="p-2.5 text-right">Billable Hours</th>
                                                    <th className="p-2.5 text-right rounded-r-xl">Billable %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                                {(() => {
                                                    const monthlyRows = summary?.monthlyTrend && summary.monthlyTrend.length > 0 
                                                        ? summary.monthlyTrend.map(m => {
                                                            const [y, mNum] = (m.month_str || '').split('-');
                                                            const monthLabel = m.month_str ? format(new Date(parseInt(y), parseInt(mNum) - 1, 1), 'MMMM yyyy') : 'Unknown';
                                                            return {
                                                                key: m.month_str,
                                                                monthLabel,
                                                                total_entries: m.total_entries || 0,
                                                                totalHrs: (m.total_minutes / 60).toFixed(1),
                                                                billableHrs: (m.billable_minutes / 60).toFixed(1),
                                                                billablePct: m.total_minutes > 0 ? Math.round((m.billable_minutes / m.total_minutes) * 100) : 0
                                                            };
                                                        })
                                                        : (() => {
                                                            const monthsMap = {};
                                                            (dailyTrend || []).forEach(d => {
                                                                const dateObj = new Date(d.date);
                                                                const mKey = format(dateObj, 'yyyy-MM');
                                                                const mLabel = format(dateObj, 'MMMM yyyy');
                                                                if (!monthsMap[mKey]) {
                                                                    monthsMap[mKey] = { key: mKey, monthLabel: mLabel, total_minutes: 0, billable_minutes: 0, total_entries: 0 };
                                                                }
                                                                const tot = Number(d.total_minutes || 0);
                                                                const bill = Number(d.billable_minutes || 0);
                                                                monthsMap[mKey].total_minutes += tot;
                                                                monthsMap[mKey].billable_minutes += bill;
                                                                monthsMap[mKey].total_entries += (Number(d.entry_count) || (tot > 0 ? 1 : 0));
                                                            });
                                                            return Object.keys(monthsMap).sort().reverse().map(mKey => {
                                                                const item = monthsMap[mKey];
                                                                return {
                                                                    key: item.key,
                                                                    monthLabel: item.monthLabel,
                                                                    total_entries: item.total_entries,
                                                                    totalHrs: (item.total_minutes / 60).toFixed(1),
                                                                    billableHrs: (item.billable_minutes / 60).toFixed(1),
                                                                    billablePct: item.total_minutes > 0 ? Math.round((item.billable_minutes / item.total_minutes) * 100) : 0
                                                                };
                                                            });
                                                        })();

                                                    return monthlyRows.length > 0 ? (
                                                        monthlyRows.map(row => (
                                                            <tr key={row.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{row.monthLabel}</td>
                                                                <td className="p-2.5 text-right text-slate-500 dark:text-slate-400">{row.total_entries}</td>
                                                                <td className="p-2.5 text-right font-black text-blue-600 dark:text-blue-400">{row.totalHrs}h</td>
                                                                <td className="p-2.5 text-right font-black text-emerald-600 dark:text-emerald-400">{row.billableHrs}h</td>
                                                                <td className="p-2.5 text-right font-bold text-slate-700 dark:text-slate-300">
                                                                    <span className={cn(
                                                                        "px-2 py-0.5 rounded-full text-[9px] font-black",
                                                                        row.billablePct >= 75 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" :
                                                                        row.billablePct >= 50 ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" :
                                                                        "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                                                                    )}>
                                                                        {row.billablePct}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="p-4 text-center text-slate-400 text-[10px] uppercase font-bold">
                                                                No monthly breakdown available
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customers Served & Recent Entries Grid */}
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Clients Served Card */}
                        <Card className="lg:col-span-5 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Clients Served</CardTitle>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Time spent by client</p>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {byCustomer.length > 0 ? (
                                        byCustomer.map((customer, i) => (
                                            <div key={i} className="p-5 flex justify-between items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{customer.customer_name}</h4>
                                                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-950 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 mt-1">
                                                        {customer.entry_count} entries
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white">{(customer.total_minutes / 60).toFixed(1)}h</span>
                                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">
                                                        {(customer.billable_minutes / 60).toFixed(1)}h billable
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest">No customer logs</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity Logs */}
                        <Card className="lg:col-span-7 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="p-8 border-b border-gray-50 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Recent Logs</CardTitle>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Latest logged entries in period</p>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-gray-50 dark:divide-slate-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {loadingLogs ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching logs...</span>
                                        </div>
                                    ) : individualLogs.length > 0 ? (
                                        individualLogs.map((entry, idx) => (
                                            <div key={idx} className="p-6 hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors flex items-center justify-between">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="mt-1 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.activity_color || '#3b82f6' }} />
                                                    <div>
                                                        <h5 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{entry.title}</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {entry.customer_name && (
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest bg-gray-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                                                    {entry.customer_name}
                                                                </span>
                                                            )}
                                                            {entry.project_name && (
                                                                <span className="text-[8px] font-bold text-blue-500/70 uppercase tracking-widest bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                                                                    {entry.project_name}
                                                                </span>
                                                            )}
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-1 self-center">
                                                                {format(new Date(entry.start_time), 'MMM dd')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right pl-4">
                                                    <div className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums">
                                                        {formatHours(entry.duration_minutes)}
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                        {entry.is_billable ? 'Billable' : 'Internal'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-widest">
                                            No time logs registered
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* User Activity Drill-down Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none dark:bg-slate-950 shadow-2xl">
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

            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                users={users}
                customers={customers}
                projects={projects}
                categories={categories}
                currentUser={currentUser}
                hasTeamView={hasTeamView}
                defaultStartDate={startDate}
                defaultEndDate={endDate}
            />
        </div>
    );
};

export default TimeTrackingReports;

