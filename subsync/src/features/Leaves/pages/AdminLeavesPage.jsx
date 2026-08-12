import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { 
    Plus, Edit2, Trash2, Calendar, Settings2, ShieldCheck, Clock, 
    Users, Search, RefreshCw, SlidersHorizontal, UserPlus, Repeat, Copy 
} from 'lucide-react';
import leavesService from '../leavesService';
import LeaveTypeForm from '../components/LeaveTypeForm';
import HolidayForm from '../components/HolidayForm';
import PermissionSettingsForm from '../components/PermissionSettingsForm';
import BalanceAdjustmentModal from '../components/BalanceAdjustmentModal';
import EmployeeBalanceCard from '../components/EmployeeBalanceCard';
import EmployeeBalanceDetailsModal from '../components/EmployeeBalanceDetailsModal';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const AdminLeavesPage = () => {
    const location = useLocation();
    const username = location.pathname.split('/')[1] || '';

    const [activeTab, setActiveTab] = useState('leave-types');
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [permissionSettings, setPermissionSettings] = useState(null);
    const [userBalances, setUserBalances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingType, setEditingType] = useState(null);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [isAddingType, setIsAddingType] = useState(false);
    const [isAddingHoliday, setIsAddingHoliday] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [targetAdjustUserId, setTargetAdjustUserId] = useState('');
    const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [types, hols, permSets, balances] = await Promise.all([
                leavesService.getLeaveTypes(),
                leavesService.getHolidays(),
                leavesService.getPermissionSettings().catch(() => null),
                leavesService.getAllUserBalances().catch(() => [])
            ]);
            setLeaveTypes(types || []);
            setHolidays(hols || []);
            setPermissionSettings(permSets);
            setUserBalances(balances || []);
        } catch (error) {
            console.error("Error loading admin data:", error);
            toast.error("Failed to load administration data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteType = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave type?")) return;
        try {
            await leavesService.deleteLeaveType(id);
            toast.success("Leave type deleted");
            fetchData();
        } catch (error) {
            toast.error("Cannot delete leave type currently in use");
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm("Are you sure you want to delete this holiday?")) return;
        try {
            await leavesService.deleteHoliday(id);
            toast.success("Holiday deleted successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete holiday");
        }
    };

    const handleCopyHolidaysToNextYear = async () => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        if (!window.confirm(`Copy non-recurring holidays from ${currentYear} to ${nextYear}? (Annual recurring holidays repeat automatically).`)) return;
        
        try {
            const res = await leavesService.copyHolidaysToNextYear(currentYear, nextYear);
            toast.success(res.message || `Holidays copied to ${nextYear}`);
            fetchData();
        } catch (error) {
            toast.error("Failed to copy holidays to next year");
        }
    };

    // Group user balances by user_id
    const groupedEmployeeBalances = React.useMemo(() => {
        const map = {};
        (userBalances || []).forEach(b => {
            const uid = b.user_id;
            if (!map[uid]) {
                map[uid] = {
                    user_id: uid,
                    user_name: b.user_name || `User #${uid}`,
                    user_email: b.user_email || '',
                    leaves: [],
                    permission: null
                };
            }
            const isHours = b.unit === 'hours' || b.leave_type_code === 'PERM';
            if (isHours) {
                map[uid].permission = b;
            } else {
                map[uid].leaves.push(b);
            }
        });
        return Object.values(map);
    }, [userBalances]);

    const filteredEmployeeBalances = React.useMemo(() => {
        if (!searchTerm) return groupedEmployeeBalances;
        const lower = searchTerm.toLowerCase();
        return groupedEmployeeBalances.filter(e => 
            (e.user_name || '').toLowerCase().includes(lower) ||
            (e.user_email || '').toLowerCase().includes(lower) ||
            e.user_id.toString().toLowerCase().includes(lower)
        );
    }, [groupedEmployeeBalances, searchTerm]);

    // Extract unique users for adjustment modal
    const userMap = new Map();
    userBalances.forEach(b => {
        if (b.user_id && !userMap.has(b.user_id)) {
            userMap.set(b.user_id, { username: b.user_id, name: b.user_name || b.user_id, email: b.user_email });
        }
    });
    const uniqueUsers = Array.from(userMap.values());

    const breadcrumbItems = [
        { label: 'Dashboard', href: `/${username}/dashboard` },
        { label: 'Leave Administration' }
    ];

    const actions = (
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                onClick={fetchData} 
                className="rounded-xl text-xs font-black uppercase tracking-widest border-slate-200 dark:border-slate-800 h-10"
            >
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Refresh
            </Button>
            <Button 
                onClick={() => setIsAdjustModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-4 shadow-sm"
            >
                <UserPlus className="w-3.5 h-3.5 mr-2" />
                Adjust Balance
            </Button>
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Leave & Permission Administration"
                description="Configure leave type policies (Days), permission quotas (Hours), company holidays, and employee balance adjustments."
                breadcrumbItems={breadcrumbItems}
                actions={actions}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Policies</p>
                            <h3 className="text-xl font-black">{leaveTypes.length} Active Types</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-indigo-500 bg-indigo-600 text-white shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Permission Quota</p>
                            <h3 className="text-xl font-black">{permissionSettings?.yearly_hours_quota || '24'} Hours/Yr</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Holidays</p>
                            <h3 className="text-xl font-black">{holidays.length} Days</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border border-slate-800 bg-slate-900 text-white shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Managed Balances</p>
                            <h3 className="text-xl font-black">{uniqueUsers.length} Employees</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="border-b border-slate-200 dark:border-slate-800 bg-transparent p-0 h-auto justify-start gap-2 sm:gap-6 rounded-none mb-6 w-full flex-wrap">
                    <TabsTrigger 
                        value="leave-types" 
                        className="border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
                        Leave Types
                    </TabsTrigger>
                    <TabsTrigger 
                        value="permissions" 
                        className="border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <Clock className="w-4 h-4 mr-1.5 text-violet-600" />
                        Permission Rules
                    </TabsTrigger>
                    <TabsTrigger 
                        value="holidays" 
                        className="border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <Calendar className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Holidays
                    </TabsTrigger>
                    <TabsTrigger 
                        value="balances" 
                        className="border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400"
                    >
                        <Users className="w-4 h-4 mr-1.5 text-blue-600" />
                        Employee Balances
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leave-types" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Leave Types</h2>
                            <p className="text-xs text-slate-500 font-medium">Manage leave rules, days per year, and carry forward</p>
                        </div>
                        <Button 
                            onClick={() => { setIsAddingType(true); setEditingType(null); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-md"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Leave Type
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Leave Policies</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {leaveTypes.map(type => (
                                            <div key={type.id} className="p-6 flex justify-between items-center hover:bg-slate-50/30 transition-all">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">{type.name}</span>
                                                        <Badge variant="outline" className="text-[9px] font-black uppercase border-indigo-200 text-indigo-600">{type.code}</Badge>
                                                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[9px] font-black uppercase">Days</Badge>
                                                        {type.is_encashable === 1 && (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-bold uppercase">Encashable</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{type.description || 'No description provided'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingType(type); setIsAddingType(false); }} className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-xl">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteType(type.id)} className="h-9 w-9 text-slate-400 hover:text-red-600 rounded-xl">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                             </Card>
                        </div>
                        <div className="lg:col-span-1">
                            {(isAddingType || editingType) ? (
                                <LeaveTypeForm 
                                    type={editingType} 
                                    onSuccess={() => { fetchData(); setEditingType(null); setIsAddingType(false); }} 
                                />
                            ) : (
                                <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select a leave type to edit or click &ldquo;Create Leave Type&rdquo;</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="permissions" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <PermissionSettingsForm onSuccess={fetchData} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="holidays" className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-black uppercase text-slate-900 dark:text-white tracking-tight">Company Holiday Schedule</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Public & company paid holidays calendar</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline"
                                onClick={handleCopyHolidaysToNextYear}
                                className="rounded-xl font-black uppercase tracking-widest text-[10px] h-10 border-slate-200 dark:border-slate-800"
                            >
                                <Copy className="w-3.5 h-3.5 mr-2 text-purple-600" />
                                Copy to Next Year
                            </Button>
                            <Button 
                                onClick={() => { setIsAddingHoliday(true); setEditingHoliday(null); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6 shadow-md"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Holiday
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Scheduled Holidays</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {holidays.map(hol => (
                                            <div key={hol.id} className="p-6 flex justify-between items-center hover:bg-slate-50/30 transition-all">
                                                <div>
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="font-black text-base text-slate-900 dark:text-white uppercase tracking-tight">{hol.name}</span>
                                                        {hol.is_recurring === 1 && (
                                                            <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[9px] font-black uppercase flex items-center gap-1">
                                                                <Repeat className="w-2.5 h-2.5" /> Annual
                                                            </Badge>
                                                        )}
                                                        {hol.is_optional === 1 ? (
                                                            <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[9px] font-black uppercase">Optional</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[9px] font-black uppercase">Mandatory</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mt-1 tracking-widest">
                                                        {format(new Date(hol.holiday_date), 'EEEE, dd MMMM yyyy')}
                                                    </p>
                                                    {hol.description && <p className="text-xs text-slate-500 font-medium mt-1">{hol.description}</p>}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingHoliday(hol); setIsAddingHoliday(false); }} className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-xl">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(hol.id)} className="h-9 w-9 text-slate-400 hover:text-red-600 rounded-xl">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                             </Card>
                        </div>
                        <div className="lg:col-span-1">
                            {(isAddingHoliday || editingHoliday) ? (
                                <HolidayForm 
                                    holiday={editingHoliday} 
                                    onSuccess={() => { fetchData(); setEditingHoliday(null); setIsAddingHoliday(false); }} 
                                />
                            ) : (
                                <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select a holiday to edit or click &ldquo;Add Holiday&rdquo;</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 4: Employee Balances */}
                <TabsContent value="balances" className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">Employee Balances</h2>
                            <p className="text-xs text-slate-500 font-medium">Click any employee card to inspect leave & permission entitlements in detail</p>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input 
                                    placeholder="Search employee..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 h-10 w-full sm:w-64 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800"
                                />
                            </div>
                            <Button 
                                onClick={() => { setTargetAdjustUserId(''); setIsAdjustModalOpen(true); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold h-10 px-5 shadow-sm shrink-0"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Adjust Balance
                            </Button>
                        </div>
                    </div>

                    {/* Responsive Grid of Clickable Employee Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredEmployeeBalances.map((emp, idx) => (
                            <EmployeeBalanceCard 
                                key={idx} 
                                employee={emp}
                                onClick={() => setSelectedEmployeeForModal(emp)}
                            />
                        ))}
                    </div>

                    {filteredEmployeeBalances.length === 0 && (
                        <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs text-slate-500 font-bold">No employee balance records found matching your search</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Employee Balance Details Modal */}
            <EmployeeBalanceDetailsModal 
                isOpen={!!selectedEmployeeForModal}
                onClose={() => setSelectedEmployeeForModal(null)}
                employee={selectedEmployeeForModal}
                settings={permissionSettings}
                onAdjustClick={(uid) => {
                    setTargetAdjustUserId(uid);
                    setIsAdjustModalOpen(true);
                }}
            />

            {/* Manual Balance Adjustment Modal */}
            <BalanceAdjustmentModal 
                isOpen={isAdjustModalOpen}
                onClose={() => { setIsAdjustModalOpen(false); setTargetAdjustUserId(''); }}
                leaveTypes={leaveTypes}
                users={uniqueUsers}
                onSuccess={fetchData}
                initialUserId={targetAdjustUserId}
            />
        </div>
    );
};

export default AdminLeavesPage;
