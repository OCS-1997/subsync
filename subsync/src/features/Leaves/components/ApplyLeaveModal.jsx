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
import { format, differenceInBusinessDays, addDays } from 'date-fns';

const ApplyLeaveModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        is_half_day: false,
        half_day_type: 'first_half',
        reason: ''
    });

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

    // Duration calculation
    const calculatedDays = React.useMemo(() => {
        if (formData.is_half_day) return 0.5;
        if (!formData.start_date || !formData.end_date) return 0;
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end < start) return 0;
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }, [formData.start_date, formData.end_date, formData.is_half_day]);

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

                    {/* Calculated Days Preview Box */}
                    {calculatedDays > 0 && (
                        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Calculated Duration:</span>
                            </div>
                            <span className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
                            </span>
                        </div>
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
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-md"
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
