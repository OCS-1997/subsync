import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    HardDrive, Package, Wrench, AlertTriangle, Archive, ArrowRight,
    Plus, User, Clock, MousePointer2
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions';
import { cn } from '@/lib/utils';

function AssetsTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { hasPermission } = usePermissions();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/assets/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching asset stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const isWidgetVisible = (widgetId) => {
        if (!visibleWidgets || visibleWidgets.size === 0) return true;
        return visibleWidgets.has(widgetId);
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return `₹${parseFloat(value).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short'
        });
    };

    // Premium theme-aware colors
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    const categoryData = stats?.by_category?.filter(c => c.count > 0) || [];

    if (loading && !stats) {
        return (
            <BentoGrid columns={4}>
                {[...Array(6)].map((_, i) => (
                    <BentoCard key={i} loading size={i < 4 ? "sm" : "md"} />
                ))}
            </BentoGrid>
        );
    }

    return (
        <BentoGrid columns={4}>
            {/* Main Stats Row */}
            {isWidgetVisible('assets_total') && (
                <BentoCard size="sm" loading={loading} icon={HardDrive} title="Total Assets">
                    <StatCard
                        label="Inventory Size"
                        value={stats?.counts?.total || 0}
                        variant="blue"
                        onClick={() => navigate(`/${user.username}/dashboard/assets`)}
                    />
                </BentoCard>
            )}

            {isWidgetVisible('assets_active') && (
                <BentoCard size="sm" loading={loading} icon={Package} title="Active Use">
                    <StatCard
                        label="Assigned Assets"
                        value={stats?.counts?.active || 0}
                        variant="emerald"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('assets_maintenance') && (
                <BentoCard size="sm" loading={loading} icon={Wrench} title="Maintenance">
                    <StatCard
                        label="Under Repair"
                        value={stats?.counts?.maintenance || 0}
                        variant="amber"
                    />
                </BentoCard>
            )}

            {isWidgetVisible('assets_warranty') && (
                <BentoCard size="sm" loading={loading} icon={AlertTriangle} title="Warranty">
                    <StatCard
                        label="Due (30 Days)"
                        value={stats?.warranty_expiring?.next_30_days || 0}
                        variant="rose"
                    />
                </BentoCard>
            )}

            {/* Asset Distribution - Middle Large Card */}
            {isWidgetVisible('assets_by_category') && (
                <BentoCard
                    size="md"
                    icon={Package}
                    title="Category Distribution"
                    loading={loading}
                >
                    {categoryData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-40">
                            <Archive className="h-10 w-10 mb-2" />
                            <p className="text-[10px] uppercase font-black tracking-widest">No Categories</p>
                        </div>
                    ) : (
                        <div className="h-[180px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="count"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color || COLORS[index % COLORS.length]} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                            fontSize: '11px',
                                            fontWeight: 'bold'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </BentoCard>
            )}

            {/* Recent Assignments List */}
            {isWidgetVisible('assets_recent_assignments') && (
                <BentoCard
                    size="md"
                    icon={User}
                    title="Recent Assignments"
                    loading={loading}
                    action={
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/${user.username}/dashboard/assets`)}
                            className="h-8 text-blue-600 text-[10px] font-black uppercase tracking-widest"
                        >
                            All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                    }
                >
                    {!stats?.recent_assignments?.length ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-40">
                            <Clock className="h-10 w-10 mb-2" />
                            <p className="text-[10px] uppercase font-black tracking-widest">No Activity</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mt-4">
                            {stats.recent_assignments.slice(0, 3).map((assignment, i) => (
                                <div 
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    onClick={() => navigate(`/${user.username}/dashboard/assets/${assignment.asset_id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <MousePointer2 className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-[120px]">
                                                {assignment.asset_name}
                                            </p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">
                                                {assignment.assigned_to_name}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 tabular-nums">
                                        {formatDate(assignment.assigned_date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </BentoCard>
            )}

            {/* Asset Value / Financial Summary - FULL WIDTH */}
            {isWidgetVisible('assets_value') && (
                <BentoCard
                    size="wide"
                    icon={Archive}
                    title="Inventory Valuation"
                    loading={loading}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4">
                        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Original Cost</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatCurrency(stats?.value?.total_value)}
                            </p>
                        </div>
                        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Current Value</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {formatCurrency(stats?.depreciation?.current_book_value)}
                            </p>
                        </div>
                        <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Net Depreciated</p>
                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                                {formatCurrency(parseFloat(stats?.value?.total_value || 0) - parseFloat(stats?.depreciation?.current_book_value || 0))}
                            </p>
                        </div>
                    </div>
                </BentoCard>
            )}

            {/* Quick Actions */}
            {isWidgetVisible('assets_quick_actions') && hasPermission(PERMISSIONS.ASSETS_CREATE) && (
                <BentoCard
                    size="sm"
                    icon={Plus}
                    title="Inventory Actions"
                    loading={false}
                    className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-blue-500/20"
                    titleClassName="text-white opacity-90"
                    iconClassName="bg-white/20 border-white/30 text-white"
                >
                    <div className="space-y-3 mt-4">
                        <Button 
                            className="w-full justify-between bg-white text-indigo-600 hover:bg-indigo-50 rounded-[1.2rem] h-12 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                            onClick={() => navigate(`/${user.username}/dashboard/assets/add`)}
                        >
                            Add New Asset
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                            className="w-full justify-between bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-[1.2rem] h-12 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            onClick={() => navigate(`/${user.username}/dashboard/assets`)}
                        >
                            Full Inventory
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </BentoCard>
            )}
        </BentoGrid>
    );
}

export default AssetsTab;
