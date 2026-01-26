import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Filter, ArrowUpRight, Clock, Phone, Activity, ChevronRight } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const UserPerformanceList = ({ type = 'individual', period = 'monthly' }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        team_id: 'all',
        role_id: 'all',
        activity_level: 'all'
    });
    const [teams, setTeams] = useState([]);

    const getTitle = () => {
        const p = period.charAt(0).toUpperCase() + period.slice(1);
        return `${p} view for ${type === 'individual' ? 'one user' : 'all users'}`;
    };

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data.data || []);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                search: filters.search,
                team_id: filters.team_id === 'all' ? undefined : filters.team_id,
                role_id: filters.role_id === 'all' ? undefined : filters.role_id
            };
            const response = await api.get('/reports-360/users', { params });
            setUsers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching user performance list:', error);
            toast.error('Failed to load user list');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        fetchUsers();
    };

    const formatHours = (minutes) => {
        const hrs = Math.floor(minutes / 60);
        return `${hrs}h`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Users className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">{getTitle()}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">User Performance & Activity 360</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Search users..." 
                            className="pl-10 h-11 w-full md:w-64 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 font-bold text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm overflow-hidden">
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filters:</span>
                    </div>

                    <Select value={filters.team_id} onValueChange={(v) => handleFilterChange('team_id', v)}>
                        <SelectTrigger className="h-9 w-40 rounded-xl border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 font-black text-[9px] uppercase tracking-widest">
                            <SelectValue placeholder="Team" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Teams</SelectItem>
                            {teams.map(t => (
                                <SelectItem key={t.id} value={t.id.toString()}>{t.team_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button 
                        onClick={applyFilters}
                        className="h-9 px-6 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        Apply Filters
                    </Button>
                </CardContent>
            </Card>

            {/* User List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="h-48 animate-pulse bg-gray-50 dark:bg-slate-900/50 rounded-[2rem] border-none" />
                    ))
                ) : users.length > 0 ? (
                    users.map((user) => (
                        <Card 
                            key={user.username} 
                            className="group hover:scale-[1.02] transition-all duration-300 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm cursor-pointer"
                            onClick={() => navigate(`../user/${user.username}?period=${period}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                                            {user.name?.[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">@{user.username}</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="rounded-lg bg-gray-100 dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest px-2 py-1">
                                        {user.role}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <div className="bg-blue-50/50 dark:bg-blue-500/5 p-3 rounded-2xl text-center">
                                        <Clock className="w-3 h-3 text-blue-500 mx-auto mb-1" />
                                        <div className="text-xs font-black text-slate-900 dark:text-white leading-none">{formatHours(user.total_time_minutes)}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Work</div>
                                    </div>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-3 rounded-2xl text-center">
                                        <Phone className="w-3 h-3 text-emerald-500 mx-auto mb-1" />
                                        <div className="text-xs font-black text-slate-900 dark:text-white leading-none">{user.total_calls}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Calls</div>
                                    </div>
                                    <div className="bg-indigo-50/50 dark:bg-indigo-500/5 p-3 rounded-2xl text-center">
                                        <Activity className="w-3 h-3 text-indigo-500 mx-auto mb-1" />
                                        <div className="text-xs font-black text-slate-900 dark:text-white leading-none">{Math.round(user.billable_ratio * 100)}%</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Billable</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">View Detailed 360 Report</span>
                                    <div className="h-8 w-8 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center">
                        <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No users found</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPerformanceList;
