import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Clock, Phone, Activity, Target } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const AllUsersReports = () => {
    const [searchParams] = useSearchParams();
    const period = searchParams.get('period') || 'weekly';
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([]);

    useEffect(() => {
        fetchGlobalStats();
    }, [period]);

    const fetchGlobalStats = async () => {
        setLoading(true);
        try {
            // Reusing existing performance list endpoint for summary
            const response = await api.get('/reports-360/users', { params: { period } });
            setStats(response.data.data || []);
        } catch (error) {
            console.error('Error fetching global stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        const p = period.charAt(0).toUpperCase() + period.slice(1);
        return `${p} view for all users`;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                        <Users className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">{getTitle()}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global Team Performance Summary</p>
                    </div>
                </div>
            </div>

            {/* Global Stats Chart */}
            <Card className="dark:bg-slate-900 border-none rounded-[3rem] shadow-sm overflow-hidden">
                <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-pink-600">Productivity Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="p-10">
                    <div className="h-[400px]">
                        {!loading && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '16px', border: 'none', shadow: 'none'}}
                                        itemStyle={{fontWeight: 900, fontSize: '12px'}}
                                    />
                                    <Bar dataKey="total_time_minutes" name="Work Minutes" fill="#ec4899" radius={[12, 12, 0, 0]} />
                                    <Bar dataKey="billable_minutes" name="Billable Minutes" fill="#4f46e5" radius={[12, 12, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Top Performers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.slice(0, 4).map((user, i) => (
                    <Card key={i} className="dark:bg-slate-900 border-none rounded-[2rem] shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center text-white font-black text-xs">
                                    {user.name?.[0]}
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h4>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{user.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-200">
                                <span>{Math.round(user.total_time_minutes / 60)}h tracked</span>
                                <span className="text-pink-600">{user.total_calls} calls</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AllUsersReports;
