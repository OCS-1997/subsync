import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar as CalendarIcon, Clock, ShieldCheck, Info } from 'lucide-react';
import LeaveRequestForm from '../components/LeaveRequestForm';
import PermissionRequestForm from '../components/PermissionRequestForm';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import HolidayCalendar from '../components/HolidayCalendar';
import LeaveStatsSummary from '../components/LeaveStatsSummary';
import RequestList from '../components/RequestList';
import leavesService from '../leavesService';
import { fetchPendingCounts } from '../leavesSlice';
import { PERMISSIONS } from '@/constants/permissions';

const LeavesPage = () => {
    const { user } = useSelector((state) => state.auth);
    const { pendingCounts } = useSelector((state) => state.leaves);
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('my-leaves');
    const [balances, setBalances] = useState([]);
    const [myLeaves, setMyLeaves] = useState([]);
    const [myPermissions, setMyPermissions] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [allLeaves, setAllLeaves] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [balanceData, leavesData, permissionsData, holidayData, allLeavesData, allPermissionsData] = await Promise.all([
                leavesService.getMyBalances(),
                leavesService.getMyLeaves(),
                leavesService.getMyPermissions(),
                leavesService.getHolidays(),
                user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) ? leavesService.getAllLeaves() : Promise.resolve([]),
                user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE) ? leavesService.getAllPermissions() : Promise.resolve([])
            ]);
            
            if (user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE)) {
                dispatch(fetchPendingCounts());
            }

            setBalances(balanceData);
            setMyLeaves(leavesData);
            setMyPermissions(permissionsData);
            setHolidays(holidayData);
            setAllLeaves(allLeavesData);
            setAllPermissions(allPermissionsData);
        } catch (error) {
            console.error("Error fetching leave data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (requestId, status, type) => {
        try {
            if (type === 'leave') {
                await leavesService.actionLeave(requestId, status);
            } else {
                await leavesService.actionPermission(requestId, status);
            }
            fetchData();
        } catch (error) {
            console.error("Error actioning request:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        Leaves & <span className="text-blue-600">Permissions</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Manage your time off and short-duration absences
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200 dark:border-slate-800">
                        <Info className="w-4 h-4 mr-2" />
                        Leave Policy
                    </Button>
                </div>
            </div>

            {/* Quick Stats Summary (Employee Side) */}
            {!isLoading && <LeaveStatsSummary leaves={myLeaves} permissions={myPermissions} />}

            {/* Balances Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {balances.map(balance => (
                    <LeaveBalanceCard key={balance.id} balance={balance} />
                ))}
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="my-leaves" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                        My Leaves
                    </TabsTrigger>
                    <TabsTrigger value="permissions" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        <Clock className="w-3.5 h-3.5 mr-2" />
                        Permissions
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                        Holiday Calendar
                    </TabsTrigger>
                    {(user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE)) && (
                        <TabsTrigger value="approvals" className="relative rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            Approvals
                            {pendingCounts?.total > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-black animate-pulse">
                                    {pendingCounts.total}
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="my-leaves" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <LeaveRequestForm onSuccess={fetchData} />
                        </div>
                        <div className="lg:col-span-2">
                            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                        Recent Leave Requests
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <RequestList requests={myLeaves} type="leave" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <PermissionRequestForm onSuccess={fetchData} />
                        </div>
                        <div className="lg:col-span-2">
                             <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                        Recent Permission Requests
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <RequestList requests={myPermissions} type="permission" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="holidays">
                    <HolidayCalendar holidays={holidays} />
                </TabsContent>

                {(user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE)) && (
                    <TabsContent value="approvals" className="space-y-8">
                        {user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE) && (
                            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center justify-between gap-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                            Pending Leave Approvals
                                        </div>
                                        {pendingCounts?.leaves > 0 && (
                                            <Badge className="bg-emerald-500 text-white border-0 font-black text-[10px]">
                                                {pendingCounts.leaves}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <RequestList 
                                        requests={allLeaves.filter(r => r.status === 'pending')} 
                                        type="leave" 
                                        onAction={(id, status) => handleAction(id, status, 'leave')} 
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE) && (
                            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 p-6">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center justify-between gap-2 w-full">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-500" />
                                            Pending Permission Approvals
                                        </div>
                                        {pendingCounts?.permissions > 0 && (
                                            <Badge className="bg-indigo-500 text-white border-0 font-black text-[10px]">
                                                {pendingCounts.permissions}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <RequestList 
                                        requests={allPermissions.filter(r => r.status === 'pending')} 
                                        type="permission" 
                                        onAction={(id, status) => handleAction(id, status, 'permission')} 
                                    />
                                </CardContent>
                            </Card>
                        )}
                        
                        {(allLeaves.filter(r => r.status === 'pending').length === 0 && 
                          allPermissions.filter(r => r.status === 'pending').length === 0) && (
                            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">All Caught Up!</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No pending requests to process</p>
                            </div>
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default LeavesPage;
