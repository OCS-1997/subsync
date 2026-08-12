import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { 
    Calendar as CalendarIcon, Clock, ShieldCheck, Plus, Info, 
    CheckCircle2, AlertCircle, Sparkles, Layers, Search, Filter, Palmtree
} from 'lucide-react';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import PermissionQuotaCard from '../components/PermissionQuotaCard';
import HolidayCalendar from '../components/HolidayCalendar';
import RequestList from '../components/RequestList';
import ApplyLeaveModal from '../components/ApplyLeaveModal';
import ApplyPermissionModal from '../components/ApplyPermissionModal';
import leavesService from '../leavesService';
import { fetchPendingCounts } from '../leavesSlice';
import { PERMISSIONS } from '@/constants/permissions';

const LeavesPage = () => {
    const { user } = useSelector((state) => state.auth);
    const { pendingCounts } = useSelector((state) => state.leaves);
    const dispatch = useDispatch();
    const location = useLocation();
    const username = location.pathname.split('/')[1] || '';

    const [activeTab, setActiveTab] = useState('leaves');
    const [statusFilter, setStatusFilter] = useState('all');
    const [balances, setBalances] = useState([]);
    const [permissionSettings, setPermissionSettings] = useState(null);
    const [myLeaves, setMyLeaves] = useState([]);
    const [myPermissions, setMyPermissions] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
    const [isApplyPermissionOpen, setIsApplyPermissionOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [balanceData, permSets, leavesData, permissionsData, holidayData, allLeavesData, allPermissionsData] = await Promise.all([
                leavesService.getMyBalances().catch(() => []),
                leavesService.getPermissionSettings().catch(() => null),
                leavesService.getMyLeaves().catch(() => []),
                leavesService.getMyPermissions().catch(() => []),
                leavesService.getHolidays().catch(() => []),
                user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) ? leavesService.getAllLeaves().catch(() => []) : Promise.resolve([]),
                user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE) ? leavesService.getAllPermissions().catch(() => []) : Promise.resolve([])
            ]);
            
            if (user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE)) {
                dispatch(fetchPendingCounts());
            }

            setBalances(balanceData || []);
            setPermissionSettings(permSets);
            setMyLeaves(leavesData || []);
            setMyPermissions(permissionsData || []);
            setHolidays(holidayData || []);
            setAllLeaves(allLeavesData || []);
            setAllPermissions(allPermissionsData || []);
        } catch (error) {
            console.error("Error fetching leave data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (requestId, status, type, comments) => {
        try {
            if (type === 'leave') {
                await leavesService.actionLeave(requestId, status, comments);
            } else {
                await leavesService.actionPermission(requestId, status, comments);
            }
            fetchData();
        } catch (error) {
            console.error("Error actioning request:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Separate Leave Balances (Days) from Permission Balance (Hours)
    const dayBalances = balances.filter(b => b.leave_type_code !== 'PERM' && b.unit !== 'hours');
    const permBalance = balances.find(b => b.leave_type_code === 'PERM' || b.unit === 'hours');

    // Filter requests by status
    const filterRequests = (list) => {
        if (statusFilter === 'all') return list;
        return list.filter(r => r.status === statusFilter);
    };

    const breadcrumbItems = [
        { label: 'Dashboard', href: `/${username}/dashboard` },
        { label: 'Leaves & Permissions' }
    ];

    const actions = (
        <div className="flex flex-wrap gap-2">
            <Button 
                onClick={() => setIsApplyLeaveOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 h-10 shadow-sm"
            >
                <Plus className="w-4 h-4 mr-2" />
                Apply Leave (Days)
            </Button>
            <Button 
                onClick={() => setIsApplyPermissionOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold px-4 h-10 shadow-sm"
            >
                <Clock className="w-4 h-4 mr-2" />
                Request Permission (Hours)
            </Button>
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Standard PageHeader */}
            <PageHeader 
                title="Leaves & Permissions"
                description="Manage full-day & multi-day leaves (Days) and short-duration workday permissions (Hours)."
                breadcrumbItems={breadcrumbItems}
                actions={actions}
            />

            {/* Modern Clean Underline Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="border-b border-slate-200 dark:border-slate-800 bg-transparent p-0 h-auto justify-start gap-2 sm:gap-6 rounded-none mb-6 w-full flex-wrap">
                    <TabsTrigger 
                        value="leaves" 
                        className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <Palmtree className="w-4 h-4 mr-1.5 text-blue-600" />
                        Leaves (Days)
                    </TabsTrigger>
                    <TabsTrigger 
                        value="permissions" 
                        className="border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <Clock className="w-4 h-4 mr-1.5 text-violet-600" />
                        Permissions (Hours)
                    </TabsTrigger>
                    <TabsTrigger 
                        value="holidays" 
                        className="border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Holidays
                    </TabsTrigger>
                    {(user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE)) && (
                        <TabsTrigger 
                            value="approvals" 
                            className="border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 relative"
                        >
                            <Plus className="w-4 h-4 mr-1.5 text-indigo-600" />
                            Approvals
                            {pendingCounts?.total > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {pendingCounts.total}
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Tab 1: Leaves (Days) */}
                <TabsContent value="leaves" className="space-y-6">
                    {/* Day Balances Overview Cards */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Leave Balances</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsApplyLeaveOpen(true)}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 p-0 h-auto"
                            >
                                + Apply for Leave
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dayBalances.map(balance => (
                                <LeaveBalanceCard key={balance.id || balance.leave_type_id} balance={balance} />
                            ))}
                        </div>
                    </div>

                    {/* History List with Status Filter */}
                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-blue-600" />
                                Leave History
                            </CardTitle>
                            
                            {/* Filter Pills */}
                            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                                {['all', 'pending', 'approved', 'rejected'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                            statusFilter === st 
                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <RequestList requests={filterRequests(myLeaves)} type="leave" />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Permissions Hub (Hours) */}
                <TabsContent value="permissions" className="space-y-6">
                    {/* Permission Quota & Guidance Banner */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <PermissionQuotaCard 
                                balance={permBalance} 
                                settings={permissionSettings}
                                onRequestClick={() => setIsApplyPermissionOpen(true)}
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 h-full flex flex-col justify-between p-5">
                                <div>
                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-600 mb-1.5">
                                        <Clock className="w-4 h-4" />
                                        Short Workday Absence Policy
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                                        Need a short break during work hours?
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                                        Permission requests allow short absences during your workday (e.g. medical appointment, late arrival, or early exit) up to <strong>{permissionSettings?.max_hours_per_request || 2} hours</strong> per request.
                                    </p>
                                </div>
                                <div className="flex justify-end">
                                    <Button 
                                        onClick={() => setIsApplyPermissionOpen(true)}
                                        size="sm"
                                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold px-5 h-9 shadow-sm"
                                    >
                                        + Request Permission Now
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* History List */}
                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                <Clock className="w-4 h-4 text-violet-600" />
                                My Permission History (Hours & Mins)
                            </CardTitle>

                            {/* Filter Pills */}
                            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                                {['all', 'pending', 'approved', 'rejected'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setStatusFilter(st)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                            statusFilter === st 
                                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' 
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {st}
                                    </button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <RequestList requests={filterRequests(myPermissions)} type="permission" />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 3: Company Holidays */}
                <TabsContent value="holidays">
                    <HolidayCalendar holidays={holidays} />
                </TabsContent>

                {/* Tab 4: Approvals Hub */}
                {(user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE)) && (
                    <TabsContent value="approvals" className="space-y-8">
                        {user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) && (
                            <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center justify-between gap-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            Pending Leave Approvals (Days)
                                        </div>
                                        {pendingCounts?.leaves > 0 && (
                                            <Badge className="bg-emerald-500 text-white border-0 font-black text-[10px]">
                                                {pendingCounts.leaves} Pending
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <RequestList 
                                        requests={allLeaves.filter(r => r.status === 'pending')} 
                                        type="leave" 
                                        onAction={(id, status, comments) => handleAction(id, status, 'leave', comments)} 
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE) && (
                            <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center justify-between gap-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            Pending Permission Approvals (Hours)
                                        </div>
                                        {pendingCounts?.permissions > 0 && (
                                            <Badge className="bg-indigo-500 text-white border-0 font-black text-[10px]">
                                                {pendingCounts.permissions} Pending
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <RequestList 
                                        requests={allPermissions.filter(r => r.status === 'pending')} 
                                        type="permission" 
                                        onAction={(id, status, comments) => handleAction(id, status, 'permission', comments)} 
                                    />
                                </CardContent>
                            </Card>
                        )}
                        
                        {(allLeaves.filter(r => r.status === 'pending').length === 0 && 
                          allPermissions.filter(r => r.status === 'pending').length === 0) && (
                            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">All Caught Up!</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">No pending leave or permission requests to process</p>
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>

            {/* Quick Modals */}
            <ApplyLeaveModal 
                isOpen={isApplyLeaveOpen}
                onClose={() => setIsApplyLeaveOpen(false)}
                onSuccess={fetchData}
            />

            <ApplyPermissionModal 
                isOpen={isApplyPermissionOpen}
                onClose={() => setIsApplyPermissionOpen(false)}
                onSuccess={fetchData}
                settings={permissionSettings}
            />
        </div>
    );
};

export default LeavesPage;
