import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { toast } from 'react-toastify';
import {
    Loader2, Plus, Download, Search, Filter, RefreshCw, Target, CheckCircle2,
    Clock, AlertTriangle, XCircle, TrendingUp, Calendar, User, Eye, Edit, Trash2, ChevronRight, Settings, SlidersHorizontal
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
    PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { goalService } from '../services/goalService';
import GoalFormModal from '../components/GoalFormModal';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';
import api from '@/lib/axiosInstance';
import { cn } from '@/lib/utils';

const FINANCIAL_YEARS = ['FY 2024-25', 'FY 2025-26', 'FY 2026-27', 'FY 2027-28'];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function GoalsDashboard() {
    const navigate = useNavigate();
    const { username } = useParams();
    const { hasPermission } = usePermissions();

    const baseUrl = `/${username || 'admin'}/dashboard`;

    // Data State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [goals, setGoals] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    // Masters & Users lists for filters
    const [categories, setCategories] = useState([]);
    const [businessImpacts, setBusinessImpacts] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [users, setUsers] = useState([]);

    // Filters & Pagination State
    const [filters, setFilters] = useState({
        quarter: '',
        financial_year: 'FY 2025-26',
        category_id: '',
        business_impact_id: '',
        owner: '',
        status_id: '',
        priority: '',
        search: ''
    });

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadFiltersData();
    }, []);

    useEffect(() => {
        loadDashboardAndGoals();
    }, [filters, page, limit]);

    const loadFiltersData = async () => {
        try {
            const [c, i, s, uRes] = await Promise.all([
                goalService.getCategories(false),
                goalService.getBusinessImpacts(false),
                goalService.getStatuses(false),
                api.get('/users').catch(() => ({ data: [] }))
            ]);
            setCategories(c || []);
            setBusinessImpacts(i || []);
            setStatuses(s || []);
            const uData = uRes.data?.users || uRes.data || [];
            setUsers(Array.isArray(uData) ? uData : []);
        } catch (error) {
            toast.error('Failed to load goal filter options');
        }
    };

    const loadDashboardAndGoals = async () => {
        try {
            setLoading(true);
            const offset = (page - 1) * limit;

            const [statsRes, listRes] = await Promise.all([
                goalService.getDashboardStats({
                    financial_year: filters.financial_year,
                    quarter: filters.quarter
                }),
                goalService.getGoals({
                    ...filters,
                    limit,
                    offset
                })
            ]);

            setStats(statsRes);
            setGoals(listRes.data || []);
            setTotalCount(listRes.total || 0);
        } catch (error) {
            toast.error('Failed to load goals dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val === 'ALL' ? '' : val }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters({
            quarter: '',
            financial_year: 'FY 2025-26',
            category_id: '',
            business_impact_id: '',
            owner: '',
            status_id: '',
            priority: '',
            search: ''
        });
        setPage(1);
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await goalService.exportGoals(filters);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Goals_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Goals report exported successfully');
        } catch (error) {
            toast.error('Failed to export goals report');
        } finally {
            setExporting(false);
        }
    };

    const summary = stats?.summary || {
        totalGoals: 0, completed: 0, inProgress: 0, atRisk: 0, overdue: 0, completionPercentage: 0
    };

    const charts = stats?.charts || {
        byStatus: [], byCategory: [], byQuarter: [], byBusinessImpact: [], monthlyTrend: []
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Goals Management"
                description="Create, track, and align organizational goals on a quarterly and annual basis."
                breadcrumbItems={[
                    { label: 'HR' },
                    { label: 'Goals' }
                ]}
                actions={
                    <div className="flex items-center gap-3 flex-wrap">
                        {hasPermission(PERMISSIONS.GOALS_CONFIGURE_CATEGORIES) && (
                            <button
                                onClick={() => navigate(`${baseUrl}/settings/goal-masters`)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all"
                            >
                                <Settings className="w-4 h-4 text-blue-500" /> Goal Masters
                            </button>
                        )}
                        {hasPermission(PERMISSIONS.GOALS_EXPORT) && (
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-black uppercase tracking-wider shadow-sm transition-all"
                            >
                                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-500" />}
                                Export Report
                            </button>
                        )}
                        {hasPermission(PERMISSIONS.GOALS_CREATE) && (
                            <button
                                onClick={() => navigate(`${baseUrl}/goals/add`)}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02]"
                            >
                                <Plus className="w-4 h-4" /> Add Goal
                            </button>
                        )}
                    </div>
                }
            />


            {/* DASHBOARD BENTO STAT CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Goals</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{summary.totalGoals}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </p>
                    <p className="text-3xl font-black text-emerald-600">{summary.completed}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> In Progress
                    </p>
                    <p className="text-3xl font-black text-blue-600">{summary.inProgress}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> At Risk
                    </p>
                    <p className="text-3xl font-black text-amber-600">{summary.atRisk}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Overdue
                    </p>
                    <p className="text-3xl font-black text-rose-600">{summary.overdue}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Completion
                    </p>
                    <p className="text-3xl font-black text-indigo-600">{summary.completionPercentage}%</p>
                </div>
            </div>

            {/* DASHBOARD CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Status Breakdown Pie */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Goals by Status</h3>
                    <div className="h-56 flex items-center justify-center">
                        {charts.byStatus.length === 0 ? (
                            <p className="text-xs text-slate-400 font-bold">No data recorded</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.byStatus}
                                        dataKey="count"
                                        nameKey="label"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={75}
                                        innerRadius={45}
                                    >
                                        {charts.byStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Goals by Category Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Goals by Category</h3>
                    <div className="h-56">
                        {charts.byCategory.length === 0 ? (
                            <p className="text-xs text-slate-400 font-bold text-center pt-20">No data recorded</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.byCategory.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold' }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} allowDecimals={false} />
                                    <RechartsTooltip />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Goals by Business Impact Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Goals by Business Impact</h3>
                    <div className="h-56">
                        {charts.byBusinessImpact.length === 0 ? (
                            <p className="text-xs text-slate-400 font-bold text-center pt-20">No data recorded</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.byBusinessImpact.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 'bold' }} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 'bold' }} allowDecimals={false} />
                                    <RechartsTooltip />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                        <Input
                            placeholder="Search goal title, remarks..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="h-11 pl-11 rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-xs"
                        />
                    </div>

                    {/* Financial Year Filter */}
                    <div className="w-40">
                        <Select
                            value={filters.financial_year}
                            onValueChange={(val) => handleFilterChange('financial_year', val)}
                        >
                            <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Financial Year" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All FYs</SelectItem>
                                {FINANCIAL_YEARS.map(fy => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quarter Filter */}
                    <div className="w-32">
                        <Select
                            value={filters.quarter || 'ALL'}
                            onValueChange={(val) => handleFilterChange('quarter', val)}
                        >
                            <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Quarter" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Qtrs</SelectItem>
                                {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category Filter */}
                    <div className="w-40">
                        <Select
                            value={filters.category_id || 'ALL'}
                            onValueChange={(val) => handleFilterChange('category_id', val)}
                        >
                            <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                {categories.map(c => <SelectItem key={c.category_id} value={c.category_id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Impact Filter */}
                    <div className="w-44">
                        <Select
                            value={filters.business_impact_id || 'ALL'}
                            onValueChange={(val) => handleFilterChange('business_impact_id', val)}
                        >
                            <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Impact" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Impact Types</SelectItem>
                                {businessImpacts.map(b => <SelectItem key={b.impact_id} value={b.impact_id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="w-40">
                        <Select
                            value={filters.status_id || 'ALL'}
                            onValueChange={(val) => handleFilterChange('status_id', val)}
                        >
                            <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                {statuses.map(s => <SelectItem key={s.status_id} value={s.status_id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <button onClick={resetFilters} className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-600 px-3 py-2">
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* GOALS SYSTEM-MATCHING DATA TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : goals.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                            <Target className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">No Active Goals Match Filters</p>
                        <p className="text-xs text-slate-400 font-medium">Try resetting your filter parameters or create a goal.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <tr>
                                    <th className="p-4">#</th>
                                    <th className="p-4">Goal Title</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Business Impact</th>
                                    <th className="p-4">Quarter</th>
                                    <th className="p-4">Owner(s)</th>
                                    <th className="p-4">Target Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 w-36">Progress</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                                {goals.map((goal, index) => {
                                    const serialNum = (page - 1) * limit + index + 1;
                                    return (
                                        <tr key={goal.goal_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{serialNum}</td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={() => navigate(`${baseUrl}/goals/${goal.goal_id}`)}
                                                        className="font-black text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left line-clamp-1 text-xs"
                                                    >
                                                        {goal.title}
                                                    </button>
                                                    <p className="text-[10px] font-mono text-slate-400">{goal.goal_id}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{goal.category_name}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400">{goal.business_impact_name}</td>
                                            <td className="p-4">
                                                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] border-0">
                                                    {goal.quarter}
                                                </Badge>
                                            </td>
                                            <td className="p-4 max-w-[150px] truncate text-slate-700 dark:text-slate-300">
                                                {goal.owners_text || 'Unassigned'}
                                            </td>
                                            <td className="p-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                                        {format(new Date(goal.target_date), 'dd-MMM')}
                                                    </span>
                                                    {goal.is_overdue === 1 ? (
                                                        <Badge className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5">Overdue</Badge>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl"
                                                    style={{ backgroundColor: goal.status_badge_color || '#64748b', color: '#ffffff' }}
                                                >
                                                    {goal.status_name}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-slate-400">
                                                        <span>{goal.progress}%</span>
                                                    </div>
                                                    <Progress value={goal.progress} className="h-2 rounded-full" />
                                                </div>
                                            </td>
                                            <td className="p-4 text-right space-x-1">
                                                <button
                                                    onClick={() => navigate(`${baseUrl}/goals/${goal.goal_id}`)}
                                                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PAGINATION FOOTER */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                        Showing {goals.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} goals
                    </span>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="rounded-xl font-bold text-xs"
                        >
                            Previous
                        </Button>
                        <span className="font-black text-slate-900 dark:text-white px-2">Page {page}</span>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page * limit >= totalCount}
                            onClick={() => setPage(p => p + 1)}
                            className="rounded-xl font-bold text-xs"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* CREATE GOAL MODAL */}
            <GoalFormModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onSuccess={loadDashboardAndGoals}
            />
        </div>
    );
}
