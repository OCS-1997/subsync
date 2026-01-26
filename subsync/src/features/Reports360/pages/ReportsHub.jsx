import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
    User, Users, Briefcase, FileBarChart, 
    Calendar, ClipboardList, Activity, Clock, 
    ChevronRight, LayoutDashboard, Database, Phone
} from 'lucide-react';

const ReportsHub = () => {
    const navigate = useNavigate();
    const { username } = useParams();

    const reportCards = [
        {
            id: 'weekly-user',
            title: 'Weekly view for one user',
            icon: User,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            path: 'user/weekly',
            category: 'user'
        },
        {
            id: 'monthly-user',
            title: 'Monthly view for one user',
            icon: User,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            path: 'user/monthly',
            category: 'user'
        },
        {
            id: 'yearly-user',
            title: 'Yearly view for one user',
            icon: User,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            path: 'user/yearly',
            category: 'user'
        },
        {
            id: 'weekly-all',
            title: 'Weekly view for all users',
            icon: Users,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            path: 'all/weekly',
            category: 'all-users'
        },
        {
            id: 'monthly-all',
            title: 'Monthly view for all users',
            icon: Users,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            path: 'all/monthly',
            category: 'all-users'
        },
        {
            id: 'yearly-all',
            title: 'Yearly view for all users',
            icon: Users,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            path: 'all/yearly',
            category: 'all-users'
        },
        {
            id: 'project-details',
            title: 'Project details',
            icon: Briefcase,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            path: 'project/details',
            category: 'projects'
        },
        {
            id: 'project-overview',
            title: 'Project overview',
            icon: Briefcase,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            path: 'project/overview',
            category: 'projects'
        },
        {
            id: 'monthly-report',
            title: 'Monthly report',
            icon: Briefcase,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            path: 'project/monthly-report',
            category: 'projects'
        },
        {
            id: 'inactive-projects',
            title: 'Inactive projects',
            icon: Briefcase,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            path: 'project/inactive',
            category: 'projects'
        },
        {
            id: 'project-user-month',
            title: 'Projects by month, activity and user',
            icon: User,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            path: 'advanced/project-user-month',
            category: 'advanced'
        },
        {
            id: 'dcr-detailed',
            title: 'DCR Performance Analytics',
            icon: Phone,
            color: 'text-blue-600',
            bg: 'bg-blue-600/10',
            path: 'dcr/detailed',
            category: 'general'
        },
        {
            id: 'opportunity-detailed',
            title: 'Opportunity Pipeline Analytics',
            icon: Activity,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            path: 'opportunities/detailed',
            category: 'general'
        }
    ];

    return (
        <div className="min-h-screen space-y-12 p-8 animate-in fade-in duration-1000">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="h-16 w-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 rotate-3">
                        <FileBarChart className="text-white w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic">Reports Hub</h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Comprehensive Data Analytics Suite</p>
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportCards.map((card) => (
                    <Card 
                        key={card.id}
                        className="group relative h-28 bg-white dark:bg-slate-900 border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl"
                        onClick={() => navigate(`/${username}/dashboard/reports-360/${card.path}`)}
                    >
                        {/* Interactive Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        
                        <CardContent className="h-full p-6 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className={`h-14 w-14 rounded-2xl ${card.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <card.icon className={`${card.color} w-6 h-6`} />
                                </div>
                                <div>
                                    <h3 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight pr-4">
                                        {card.title}
                                    </h3>
                                    <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${card.color}`}>Launch Report</span>
                                        <ChevronRight className={`w-3 h-3 ${card.color}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Background Icon */}
                            <card.icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.03] text-slate-900 dark:text-white rotate-12 group-hover:rotate-0 transition-all duration-500`} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Hub Footer / Stats Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                <div className="bg-indigo-600/5 p-6 rounded-[2.5rem] border border-indigo-500/10">
                    <div className="flex items-center gap-4 mb-3">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Data Sync</h4>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                        All reports are generated from real-time database transactions ensuring 100% accuracy.
                    </p>
                </div>
                <div className="bg-pink-600/5 p-6 rounded-[2.5rem] border border-pink-500/10">
                    <div className="flex items-center gap-4 mb-3">
                        <Users className="w-5 h-5 text-pink-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team Insights</h4>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                        Analyze productivity trends and collaboration metrics across all organizational units.
                    </p>
                </div>
                <div className="bg-emerald-600/5 p-6 rounded-[2.5rem] border border-emerald-500/10">
                    <div className="flex items-center gap-4 mb-3">
                        <Activity className="w-5 h-5 text-emerald-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Health</h4>
                    </div>
                    <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                        Identify inactive projects and monitor resource allocation for maximum efficiency.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReportsHub;
