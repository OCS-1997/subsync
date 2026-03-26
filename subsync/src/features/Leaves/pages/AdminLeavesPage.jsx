import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Calendar, Settings2, ShieldCheck } from 'lucide-react';
import leavesService from '../leavesService';
import LeaveTypeForm from '../components/LeaveTypeForm';
import HolidayForm from '../components/HolidayForm';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const AdminLeavesPage = () => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingType, setEditingType] = useState(null);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [isAddingType, setIsAddingType] = useState(false);
    const [isAddingHoliday, setIsAddingHoliday] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [types, hols] = await Promise.all([
                leavesService.getLeaveTypes(),
                leavesService.getHolidays()
            ]);
            setLeaveTypes(types);
            setHolidays(hols);
        } catch (error) {
            toast.error("Failed to load administration data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteType = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave type? It might affect existing requests.")) return;
        try {
            await leavesService.deleteLeaveType(id);
            toast.success("Leave type deleted");
            fetchData();
        } catch (error) {
            toast.error("Cannot delete leave type in use");
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm("Remove this holiday from the system?")) return;
        try {
            await leavesService.deleteHoliday(id);
            toast.success("Holiday removed");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete holiday");
        }
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        Leave <span className="text-indigo-600">Administration</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                        System-wide configuration for leaves and holidays
                    </p>
                </div>
            </div>

            <Tabs defaultValue="leave-types" className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="leave-types" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        <Settings2 className="w-3.5 h-3.5 mr-2" />
                        Leave Types
                    </TabsTrigger>
                    <TabsTrigger value="holidays" className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 py-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
                        <Calendar className="w-3.5 h-3.5 mr-2" />
                        Holidays
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="leave-types" className="space-y-6">
                    <div className="flex justify-end">
                        <Button 
                            onClick={() => { setIsAddingType(true); setEditingType(null); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Leave Type
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Leave Types</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {leaveTypes.map(type => (
                                            <div key={type.id} className="p-6 flex justify-between items-center hover:bg-slate-50/30 transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{type.name}</span>
                                                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{type.code}</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                                                        {type.total_days_per_year} Days/Year • {type.is_encashable ? 'Encashable' : 'Non-Encashable'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingType(type); setIsAddingType(false); }} className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-lg">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteType(type.id)} className="h-9 w-9 text-slate-400 hover:text-red-600 rounded-lg">
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
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select a type to edit or add a new one</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="holidays" className="space-y-6">
                    <div className="flex justify-end">
                        <Button 
                            onClick={() => { setIsAddingHoliday(true); setEditingHoliday(null); }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] h-10 px-6"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Holiday
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                                <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 p-6 border-b border-slate-100 dark:border-slate-800">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Holiday Calendar</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {holidays.map(hol => (
                                            <div key={hol.id} className="p-6 flex justify-between items-center hover:bg-slate-50/30 transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{hol.name}</span>
                                                        {hol.is_optional === 1 && <span className="text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-0.5 rounded">Optional</span>}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">
                                                        {format(new Date(hol.holiday_date), 'EEEE, dd MMMM yyyy')}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingHoliday(hol); setIsAddingHoliday(false); }} className="h-9 w-9 text-slate-400 hover:text-indigo-600 rounded-lg">
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(hol.id)} className="h-9 w-9 text-slate-400 hover:text-red-600 rounded-lg">
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
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select a holiday to edit or add a new one</p>
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminLeavesPage;
