import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ShieldCheck, Calendar as CalendarIcon, Repeat, Plus, Edit2, Trash2 } from 'lucide-react';
import HolidayForm from './HolidayForm';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const HolidayCalendar = ({ holidays = [], canManage = false, onRefresh }) => {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async (holiday) => {
        if (!window.confirm(`Are you sure you want to delete the holiday "${holiday.name}"?`)) return;
        setIsDeleting(true);
        try {
            await leavesService.deleteHoliday(holiday.id);
            toast.success("Holiday removed successfully");
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete holiday");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                <CardHeader className="bg-slate-900 p-6 sm:p-8">
                    <CardTitle className="text-white text-lg sm:text-xl font-black uppercase tracking-tight flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <span>Public Holiday Calendar</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 opacity-60">
                                FY {new Date().getFullYear()} - {new Date().getFullYear() + 1}
                            </span>
                            {canManage && (
                                <Button 
                                    onClick={() => { setEditingHoliday(null); setIsAddOpen(true); }}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-3.5 h-8 shadow-sm flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Holiday
                                </Button>
                            )}
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {holidays.map((holiday, idx) => (
                            <div 
                                key={holiday.id || idx} 
                                className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100">
                                            {format(new Date(holiday.holiday_date), 'MMM')}
                                        </span>
                                        <span className="text-lg font-black leading-none">
                                            {format(new Date(holiday.holiday_date), 'dd')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white truncate">
                                                {holiday.name}
                                            </span>
                                            {holiday.is_recurring === 1 && (
                                                <Badge className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                                                    <Repeat className="w-2.5 h-2.5 mr-0.5 inline" /> Annual
                                                </Badge>
                                            )}
                                            {holiday.is_optional === 1 && (
                                                <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                                                    Optional
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                            {format(new Date(holiday.holiday_date), 'EEEE')}
                                        </span>
                                        {holiday.description && (
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                                                {holiday.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {canManage && (
                                    <div className="flex items-center gap-1 shrink-0 ml-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => { setEditingHoliday(holiday); setIsAddOpen(true); }}
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                            title="Edit Holiday"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(holiday)}
                                            disabled={isDeleting}
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                            title="Delete Holiday"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {holidays.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                                 <CalendarIcon className="w-12 h-12 opacity-20 mb-4" />
                                 <p className="font-black uppercase tracking-widest text-xs opacity-40">Zero holidays listed for this cycle</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Holiday Form Dialog */}
            <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setEditingHoliday(null); } }}>
                <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-slate-200 dark:border-slate-800">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                            {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-2">
                        <HolidayForm 
                            holiday={editingHoliday} 
                            onSuccess={() => {
                                setIsAddOpen(false);
                                setEditingHoliday(null);
                                if (onRefresh) onRefresh();
                            }} 
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default HolidayCalendar;
