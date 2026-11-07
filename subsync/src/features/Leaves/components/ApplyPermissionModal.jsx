import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Send, Loader2, Info, AlertTriangle } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';
import { PERMISSIONS } from '@/constants/permissions';
import axiosInstance from '@/lib/axiosInstance';

const ApplyPermissionModal = ({ isOpen, onClose, onSuccess, settings }) => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.roleKey === 'admin' || user?.role?.toLowerCase() === 'admin';
    const canApplyForOthers = isAdmin || user?.permissions?.includes(PERMISSIONS.PERMISSIONS_APPROVE) || user?.permissions?.includes(PERMISSIONS.LEAVES_APPROVE);
    const [employeeList, setEmployeeList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        target_user_id: '',
        date: '',
        start_time: '09:00',
        end_time: '11:00',
        reason: ''
    });

    useEffect(() => {
        if (isOpen && canApplyForOthers) {
            axiosInstance.get('/users')
                .then(res => setEmployeeList(res.data || []))
                .catch(() => {});
        }
    }, [isOpen, canApplyForOthers]);

    // Real-time duration calculation in minutes & hours
    const durationMinutes = useMemo(() => {
        if (!formData.start_time || !formData.end_time) return 0;
        const [sH, sM] = formData.start_time.split(':').map(Number);
        const [eH, eM] = formData.end_time.split(':').map(Number);
        const startTotal = sH * 60 + sM;
        const endTotal = eH * 60 + eM;
        return Math.max(0, endTotal - startTotal);
    }, [formData.start_time, formData.end_time]);

    const durationHours = (durationMinutes / 60).toFixed(1).replace(/\.0$/, '');

    const maxHoursPerRequest = settings?.max_hours_per_request ? parseFloat(settings.max_hours_per_request) : 2.0;
    const isExceedingLimit = durationMinutes > (maxHoursPerRequest * 60);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.date) {
            toast.error("Please select a date");
            return;
        }
        if (durationMinutes <= 0) {
            toast.error("End time must be after start time");
            return;
        }
        if (isExceedingLimit) {
            toast.error(`Permission request cannot exceed ${maxHoursPerRequest} hours per request`);
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                target_user_id: (formData.target_user_id && formData.target_user_id !== user?.username) ? formData.target_user_id : undefined,
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                duration_minutes: durationMinutes,
                reason: formData.reason
            };
            await leavesService.applyPermission(payload);
            toast.success("Permission request submitted successfully!");
            setFormData({
                target_user_id: '',
                date: '',
                start_time: '09:00',
                end_time: '11:00',
                reason: ''
            });
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to submit permission request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md sm:max-w-lg rounded-[2rem] p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                        <Clock className="w-4 h-4" />
                        Request Permission (Hours)
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                        Workday Short Absence
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Request short-duration time permission during your workday (Max {maxHoursPerRequest} hrs).
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Employee Selector (Admins / Approvers only) */}
                    {canApplyForOthers && employeeList.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Request For Employee
                            </Label>
                            <Select 
                                value={formData.target_user_id || user?.username || ''} 
                                onValueChange={(val) => setFormData(prev => ({ ...prev, target_user_id: val }))}
                            >
                                <SelectTrigger className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800">
                                    <SelectValue placeholder="Select employee..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value={user?.username || 'self'} className="font-bold">
                                        Myself ({user?.name || user?.username})
                                    </SelectItem>
                                    {employeeList.filter(e => e.username !== user?.username).map(emp => (
                                        <SelectItem key={emp.username} value={emp.username} className="font-bold">
                                            {emp.name || emp.username} ({emp.username})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Date Picker */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</Label>
                        <Input 
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                            className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                        />
                    </div>

                    {/* Time Pickers */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Time</Label>
                            <Input 
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                required
                                className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Time</Label>
                            <Input 
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                required
                                className="h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                            />
                        </div>
                    </div>

                    {/* Duration Preview Box */}
                    {durationMinutes > 0 && (
                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                            isExceedingLimit 
                                ? 'bg-red-50/60 text-red-600 border-red-200 dark:bg-red-950/30 dark:border-red-900/40'
                                : 'bg-violet-50/60 text-violet-600 border-violet-200 dark:bg-violet-950/30 dark:border-violet-900/40'
                        }`}>
                            <div className="flex items-center gap-2">
                                {isExceedingLimit ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <Info className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                                <span className="text-xs font-bold">Calculated Duration:</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black uppercase tracking-widest">
                                    {durationHours} {parseFloat(durationHours) === 1 ? 'Hour' : 'Hours'}
                                </span>
                                {isExceedingLimit && (
                                    <div className="text-[9px] font-bold text-red-500">Exceeds max limit ({maxHoursPerRequest}h)</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reason Textarea */}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason / Purpose</Label>
                        <Textarea 
                            placeholder="State reason for workday permission (e.g., Doctor appointment, Personal emergency)..."
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
                            disabled={isLoading || isExceedingLimit}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-md"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Submit Permission Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ApplyPermissionModal;
