import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { 
    Clock, Phone, Activity, Target, ArrowLeft, 
    Download, Calendar, User, Briefcase, TrendingUp,
    Shield, Globe, Database, List, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { format, subDays } from 'date-fns';

const UserPerformanceDetail = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [dateRange, setDateRange] = useState({
        start: subDays(new Date(), 30),
        end: new Date()
    });

    useEffect(() => {
        fetchReport();
    }, [username]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/reports-360/user/${username}`, {
                params: {
                    startDate: dateRange.start.toISOString(),
                    endDate: dateRange.end.toISOString()
                }
            });
            setReport(response.data.data);
        } catch (error) {
            console.error('Error fetching performance report:', error);
            toast.error('Failed to load user report');
        } finally {
            setLoading(false);
        }
    };

    const formatHours = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };

    const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading User 360...</span>
            </div>
        );
    }

    if (!report) return null;

    const { profile, timeTracking, dcr, activity } = report;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Nav & Action Bar */}
            <div className="flex items-center justify-between gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(`/${username}/dashboard/reports-360/users`)}
                    className="group flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 h-11 transition-all"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Back to Users</span>
                </Button>

                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => window.print()}
                        className="h-11 px-6 bg-slate-900 border-none text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </div>
            </div>

            {/* Profile Header Card */}
            <Card className="dark:bg-indigo-900/10 dark:border-indigo-500/20 rounded-[2.5rem] border-indigo-50 shadow-xl shadow-indigo-500/5 overflow-hidden">
                <CardContent className="p-10 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative">
                        <div className="flex items-center gap-8">
                            <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-400 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-indigo-500/40 border-4 border-white dark:border-slate-900">
                                {profile.name?.[0]}
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Active</Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <User className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-bold">@{profile.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Shield className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{profile.role_name || profile.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar className="w-4 h-4 text-indigo-500" />
                                        <span className="text-xs font-bold uppercase tracking-widest italic">{profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {profile.teams?.map(t => (
                                <Badge key={t.id} style={{ backgroundColor: t.color + '15', color: t.color, borderColor: t.color + '30' }} variant="outline" className="rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest border-2">
                                    {t.team_name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Work Time', value: formatHours(timeTracking.summary.total_minutes), sub: `${timeTracking.summary.total_entries} tracking entries`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Call Volume', value: dcr.total_calls, sub: `${dcr.unique_contacts} unique contacts`, icon: Phone, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'System Engagement', value: activity.summary?.length || 0, sub: 'Distinct actions performed', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Billable Ratio', value: `${timeTracking.summary.total_minutes > 0 ? Math.round((timeTracking.summary.billable_minutes / timeTracking.summary.total_minutes) * 100) : 0}%`, sub: `${formatHours(timeTracking.summary.billable_minutes)} billable`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="dark:bg-slate-900 border-none rounded-[2.5rem] shadow-sm hover:translate-y-[-4px] transition-all duration-300">
                        <CardContent className="p-8">
                            <div className={cn("inline-flex p-4 rounded-3xl mb-6", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
                            <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{stat.value}</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                {stat.sub}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Top Projects Chart */}
                <Card className="lg:col-span-8 dark:bg-slate-900 border-none rounded-[3rem] shadow-sm overflow-hidden">
                    <CardHeader className="p-10 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Project Focus
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="h-[300px]">
                            {timeTracking.topProjects?.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={timeTracking.topProjects.map(p => ({ ...p, hours: (p.minutes / 60).toFixed(1) }))}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="project_name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                                            itemStyle={{color: '#4f46e5', fontWeight: 900, fontSize: '12px'}}
                                        />
                                        <Bar dataKey="hours" fill="#4f46e5" radius={[12, 12, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-300 font-bold uppercase text-xs tracking-widest">No project data available</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed / List */}
                <Card className="lg:col-span-4 dark:bg-slate-900 border-none rounded-[3rem] shadow-sm overflow-hidden">
                    <CardHeader className="p-10 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Action Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="space-y-4">
                            {activity.summary?.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-gray-50 dark:bg-slate-950 border border-transparent hover:border-indigo-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{item.action.replace(/_/g, ' ')}</span>
                                    </div>
                                    <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 text-[10px] font-black px-3 rounded-xl border-none">{item.count}</Badge>
                                </div>
                            ))}
                            {(!activity.summary || activity.summary.length === 0) && (
                                <div className="text-center py-10 text-slate-300 uppercase font-bold text-[10px] tracking-widest mt-12">No recent activity detected</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Reports Section */}
            <Card className="dark:bg-slate-900 border-none rounded-[3rem] shadow-lg overflow-hidden">
                <CardHeader className="p-10 pb-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                            <List className="w-5 h-5" />
                            Detailed Performance Breakdowns
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-10">
                    <Tabs defaultValue="time" className="w-full">
                        <TabsList className="bg-gray-50 dark:bg-slate-950 p-1 rounded-2xl mb-8">
                            <TabsTrigger value="time" className="rounded-xl px-8 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                                Work History
                            </TabsTrigger>
                            <TabsTrigger value="dcr" className="rounded-xl px-8 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                                Communication Logs
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="rounded-xl px-8 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                                System Activity
                            </TabsTrigger>
                            <TabsTrigger value="opportunities" className="rounded-xl px-8 py-3 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                                Opportunities
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="time" className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Title</th>
                                            <th className="px-6 py-4">Project / Customer</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeTracking.entries?.map((entry, i) => (
                                            <tr key={i} className="group bg-gray-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
                                                <td className="px-6 py-5 rounded-l-3xl">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white">{format(new Date(entry.start_time), 'MMM d, yyyy')}</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">{format(new Date(entry.start_time), 'hh:mm a')}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-300 max-w-xs truncate">{entry.title}</div>
                                                    <div className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-widest">{entry.activity_type}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{entry.project_name || 'Internal'}</div>
                                                    <div className="text-[9px] font-bold text-indigo-500 uppercase mt-1 tracking-widest">{entry.customer_name || 'General'}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge className="bg-blue-600/10 text-blue-600 border-none rounded-lg text-[10px] font-black">{formatHours(entry.duration_minutes)}</Badge>
                                                </td>
                                                <td className="px-6 py-5 rounded-r-3xl">
                                                    {entry.is_billable ? (
                                                        <Badge className="bg-emerald-500 text-white border-none rounded-lg text-[8px] font-black uppercase tracking-widest px-2">Billable</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[8px] font-black uppercase tracking-widest px-2">Non-Billable</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!timeTracking.entries || timeTracking.entries.length === 0) && (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center text-slate-300 uppercase font-black text-[10px] tracking-[0.2em]">No work history found for this period</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="dcr" className="space-y-4">
                            <div className="grid gap-4">
                                {dcr.entries?.map((entry, i) => (
                                    <div key={i} className="bg-gray-50/50 dark:bg-slate-950/50 p-6 rounded-[2rem] border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-all group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                                    <Phone className="w-5 h-5 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{entry.contact_name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {entry.company_name || 'Private Contact'} • {entry.domain_name || 'Direct Call'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase">{entry.call_type}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">{format(new Date(entry.timestamp), 'MMM d • hh:mm a')}</div>
                                                </div>
                                                <Badge className="bg-indigo-600 text-white rounded-xl h-10 px-4 font-black">{entry.time_spent_minutes}m</Badge>
                                            </div>
                                        </div>
                                        {entry.notes && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 text-[11px] font-medium text-slate-500 leading-relaxed italic">
                                                "{entry.notes}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!dcr.entries || dcr.entries.length === 0) && (
                                    <div className="py-20 text-center text-slate-300 uppercase font-black text-[10px] tracking-[0.2em]">No communication logs found</div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="activity" className="space-y-4">
                            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                                {activity.logs?.map((log, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-8 top-1 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-500 z-10" />
                                        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] shadow-sm border border-gray-50 dark:border-slate-800 group hover:border-indigo-100 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">{log.action.replace(/_/g, ' ')}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(log.timestamp), 'MMM d, yyyy • hh:mm a')}</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                                                On <span className="text-slate-900 dark:text-white">{log.resource_type}</span> (ID: {log.resource_id})
                                            </p>
                                            {log.details && (
                                                <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-950 rounded-xl text-[10px] font-mono text-slate-400 overflow-hidden truncate">
                                                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!activity.logs || activity.logs.length === 0) && (
                                    <div className="py-12 text-center text-slate-300 uppercase font-black text-[10px] tracking-[0.2em] ml-[-32px]">No recent system activity</div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="opportunities" className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Value (₹)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.opportunities?.entries?.map((opp, i) => (
                                            <tr key={i} className="group bg-gray-50/50 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300">
                                                <td className="px-6 py-5 rounded-l-3xl">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white">{format(new Date(opp.opportunity_date), 'MMM d, yyyy')}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-300">{opp.customer_name || 'N/A'}</div>
                                                    <div className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-widest">{opp.product_services}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <Badge style={{ backgroundColor: opp.status_color + '20', color: opp.status_color, borderColor: opp.status_color + '40' }} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 border">
                                                        {opp.status_name}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-5 rounded-r-3xl text-right">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white">
                                                        {new Intl.NumberFormat('en-IN').format(opp.opportunity_value)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!report.opportunities?.entries || report.opportunities.entries.length === 0) && (
                                            <tr>
                                                <td colSpan="4" className="py-20 text-center text-slate-300 uppercase font-black text-[10px] tracking-[0.2em]">No opportunities assigned to this user</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default UserPerformanceDetail;
