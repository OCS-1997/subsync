import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, Send, Loader2, Info } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const parts = String(dateStr).split('T')[0].split('-').map(Number);
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
};

const formatLocalYYYYMMDD = (d) => {
    if (!d) return '';
    const date = (d instanceof Date) ? d : parseLocalDate(d);
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const ApplyLeaveModal = ({ isOpen, onClose, onSuccess, holidays = [] }) => {
    const { user } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [holidaysList, setHolidaysList] = useState(holidays || []);
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        is_half_day: false,
        half_day_type: 'first_half',
        reason: ''
    });

    useEffect(() => {
        if (holidays && holidays.length > 0) {
            setHolidaysList(holidays);
        } else if (isOpen) {
            leavesService.getHolidays().then(h => setHolidaysList(h || [])).catch(() => {});
        }
    }, [isOpen, holidays]);

    useEffect(() => {
        if (isOpen) {
            leavesService.getLeaveTypes()
                .then(types => {
                    let filtered = (types || []).filter(t => t.code !== 'PERM' && t.unit !== 'hours');
                    if (user?.gender === 'male') {
                        filtered = filtered.filter(t => t.code !== 'ML');
                    } else if (user?.gender === 'female') {
                        filtered = filtered.filter(t => t.code !== 'PL');
                    }
                    setLeaveTypes(filtered);
                    if (filtered.length > 0 && !formData.leave_type_id) {
                        setFormData(prev => ({ ...prev, leave_type_id: filtered[0].id.toString() }));
                    }
                })
                .catch(err => console.error("Error loading leave types:", err));
        }
    }, [isOpen, user?.gender]);

    // Fast lookup for holiday dates (handles recurring holidays across years)
    const holidayMap = React.useMemo(() => {
        const set = new Set();
        const details = {};
        (holidaysList || []).forEach(h => {
            if (!h.holiday_date) return;
            const dateStr = formatLocalYYYYMMDD(h.holiday_date);
            set.add(dateStr);
            details[dateStr] = h.name;

            if (h.is_recurring) {
                const mmdd = dateStr.substring(5);
                const currentYear = new Date().getFullYear();
                set.add(`${currentYear}-${mmdd}`);
                set.add(`${currentYear + 1}-${mmdd}`);
                details[`${currentYear}-${mmdd}`] = h.name;
                details[`${currentYear + 1}-${mmdd}`] = h.name;
            }
        });
        return { set, details };
    }, [holidaysList]);

    // Accurate working day duration calculation excluding Sundays and Public Holidays
    const durationStats = React.useMemo(() => {
        if (!formData.start_date) {
            return { workingDays: 0, totalCalendarDays: 0, sundaysCount: 0, holidaysCount: 0, excludedDetails: [] };
        }

        const effectiveEndDate = formData.is_half_day ? formData.start_date : (formData.end_date || formData.start_date);
        const start = parseLocalDate(formData.start_date);
        const end = parseLocalDate(effectiveEndDate);

        if (!start || !end || end < start) {
            return { workingDays: 0, totalCalendarDays: 0, sundaysCount: 0, holidaysCount: 0, excludedDetails: [] };
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        let workingCount = 0;
        let sundaysCount = 0;
        let holidaysCount = 0;
        let totalCalendarDays = 0;
        const excludedDetails = [];

        let current = new Date(start);
        while (current <= end) {
            totalCalendarDays++;
            const dayOfWeek = current.getDay();
            const dateStr = formatLocalYYYYMMDD(current);

            const isSunday = (dayOfWeek === 0);
            const isHoliday = holidayMap.set.has(dateStr);

            if (isSunday) {
                sundaysCount++;
                excludedDetails.push({ date: dateStr, reason: 'Sunday' });
            } else if (isHoliday) {
                holidaysCount++;
                excludedDetails.push({ date: dateStr, reason: holidayMap.details[dateStr] || 'Public Holiday' });
            } else {
                workingCount++;
            }
            current.setDate(current.getDate() + 1);
        }

        let finalWorkingDays = workingCount;
        if (formData.is_half_day) {
            finalWorkingDays = workingCount > 0 ? 0.5 : 0;
        }

        return {
            workingDays: finalWorkingDays,
            totalCalendarDays,
            sundaysCount,
            holidaysCount,
            excludedDetails
        };
    }, [formData.start_date, formData.end_date, formData.is_half_day, holidayMap]);

    const calculatedDays = durationStats.workingDays;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leave_type_id) {
            toast.error("Please select a leave type");
            return;
        }
        if (!formData.start_date || (!formData.is_half_day && !formData.end_date)) {
            toast.error("Please select valid dates");
            return;
        }
        if (calculatedDays <= 0) {
            toast.error("Selected dates fall entirely on non-working days (Sundays / Holidays). Please choose working days.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                leave_type_id: parseInt(formData.leave_type_id),
                start_date: formData.start_date,
                end_date: formData.is_half_day ? formData.start_date : formData.end_date,
                duration_days: calculatedDays,
                is_half_day: formData.is_half_day ? 1 : 0,
                half_day_type: formData.is_half_day ? formData.half_day_type : null,
                reason: formData.reason
            };
            await leavesService.applyLeave(payload);
            toast.success("Leave application submitted successfully!");
            setFormData({
                leave_type_id: leaveTypes[0]?.id?.toString() || '',
                start_date: '',
                end_date: '',
                is_half_day: false,
                half_day_type: 'first_half',
                reason: ''
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to submit leave application");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md sm:max-w-lg rounded-[2rem] p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        <Calendar className="w-4 h-4" />
                        Apply for Leave (Days)
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                        Time Off Request
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Submit a full-day or half-day leave request for approval.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Leave Type Selector */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Leave Type</Label>
                        <Select 
                            value={formData.leave_type_id} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, leave_type_id: val }))}
                        >
                            <SelectTrigger className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800">
                                <SelectValue placeholder="Select leave category..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {leaveTypes.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()} className="font-bold">
                                        {t.name} ({t.code}) &bull; {t.total_days_per_year} Days/Yr
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Half Day Toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Half-Day Leave</Label>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Apply for 0.5 day time off</p>
                        </div>
                        <Switch 
                            checked={formData.is_half_day}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_half_day: checked }))}
                        />
                    </div>

                    {/* Date Pickers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Date</Label>
                            <Input 
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData(prev => ({ 
                                    ...prev, 
                                    start_date: e.target.value,
                                    end_date: prev.is_half_day ? e.target.value : prev.end_date 
                                }))}
                                required
                                className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                            />
                        </div>

                        {!formData.is_half_day ? (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Date</Label>
                                <Input 
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                    min={formData.start_date}
                                    required
                                    className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Half-Day Session</Label>
                                <Select 
                                    value={formData.half_day_type} 
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, half_day_type: val }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="first_half" className="font-bold">First Half (Morning)</SelectItem>
                                        <SelectItem value="second_half" className="font-bold">Second Half (Afternoon)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Calculated Days Preview Box & Exclusions */}
                    {formData.start_date && (formData.end_date || formData.is_half_day) && (
                        calculatedDays > 0 ? (
                            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Calculated Duration:</span>
                                    </div>
                                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                        {calculatedDays} {calculatedDays === 1 ? 'Working Day' : 'Working Days'}
                                    </span>
                                </div>
                                {(durationStats.sundaysCount > 0 || durationStats.holidaysCount > 0) && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-blue-100 dark:border-blue-900/40 text-[10px] text-slate-500 font-medium">
                                        <span className="font-bold text-slate-600 dark:text-slate-400">Excluded:</span>
                                        {durationStats.sundaysCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                                {durationStats.sundaysCount} {durationStats.sundaysCount === 1 ? 'Sunday' : 'Sundays'}
                                            </span>
                                        )}
                                        {durationStats.holidaysCount > 0 && (
                                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                                                {durationStats.holidaysCount} {durationStats.holidaysCount === 1 ? 'Public Holiday' : 'Public Holidays'}
                                            </span>
                                        )}
                                        <span className="text-slate-400 text-[9px]">(Not deducted)</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50/80 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/60 flex items-start gap-3">
                                <Info className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5 text-xs text-red-700 dark:text-red-300 font-medium">
                                    <p className="font-bold">Zero working days in selected range</p>
                                    <p className="text-[11px] opacity-90">All selected dates are Sundays or Public Holidays. Please select working days for your leave request.</p>
                                </div>
                            </div>
                        )
                    )}

                    {/* Reason Textarea */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason / Details</Label>
                        <Textarea 
                            placeholder="State purpose of leave application..."
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            required
                            className="rounded-xl font-medium border-slate-200 dark:border-slate-800 h-24 text-xs"
                        />
                    </div>

                    <DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading || (formData.start_date && calculatedDays === 0)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-md disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Submit Leave Application
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ApplyLeaveModal;
