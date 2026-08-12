import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Loader2, UserCheck, Plus, Minus } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const BalanceAdjustmentModal = ({ isOpen, onClose, leaveTypes, users, onSuccess, initialUserId = '' }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        userId: initialUserId || '',
        leaveTypeId: '',
        deltaAmount: '',
        operation: 'add', // 'add' or 'subtract'
        reason: '',
        year: new Date().getFullYear()
    });

    React.useEffect(() => {
        if (isOpen && initialUserId) {
            setFormData(prev => ({ ...prev, userId: initialUserId }));
        }
    }, [isOpen, initialUserId]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.userId || !formData.leaveTypeId || !formData.deltaAmount) {
            toast.error("Please fill all required fields");
            return;
        }

        setIsLoading(true);
        try {
            const rawAmount = parseFloat(formData.deltaAmount);
            const deltaAmount = formData.operation === 'subtract' ? -Math.abs(rawAmount) : Math.abs(rawAmount);

            await leavesService.adjustUserBalance({
                userId: formData.userId,
                leaveTypeId: formData.leaveTypeId,
                year: formData.year,
                deltaAmount,
                reason: formData.reason
            });

            toast.success("Balance adjusted successfully");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to adjust balance");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedType = leaveTypes?.find(t => t.id === parseInt(formData.leaveTypeId));
    const unitLabel = selectedType?.unit === 'hours' || selectedType?.code === 'PERM' ? 'Hours' : 'Days';

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden bg-white dark:bg-slate-900">
                <CardHeader className="bg-slate-900 text-white p-6 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-black uppercase tracking-tight flex items-center gap-3">
                        <UserCheck className="w-5 h-5 text-indigo-400" />
                        Manual Balance Adjustment
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/70 hover:text-white rounded-full">
                        <X className="w-4 h-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Employee</Label>
                            <select
                                value={formData.userId}
                                onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                                required
                                className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 font-bold text-xs"
                            >
                                <option value="">Select Employee...</option>
                                {users?.map(u => (
                                    <option key={u.username} value={u.username}>{u.name} ({u.email || u.username})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Leave Type or Permission</Label>
                            <select
                                value={formData.leaveTypeId}
                                onChange={(e) => setFormData(prev => ({ ...prev, leaveTypeId: e.target.value }))}
                                required
                                className="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 font-bold text-xs"
                            >
                                <option value="">Select Leave Type or Permission...</option>
                                {leaveTypes?.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.code}) - {t.unit === 'hours' || t.code === 'PERM' ? 'Hours' : 'Days'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operation</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant={formData.operation === 'add' ? 'default' : 'outline'}
                                        onClick={() => setFormData(prev => ({ ...prev, operation: 'add' }))}
                                        className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest ${formData.operation === 'add' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={formData.operation === 'subtract' ? 'default' : 'outline'}
                                        onClick={() => setFormData(prev => ({ ...prev, operation: 'subtract' }))}
                                        className={`flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest ${formData.operation === 'subtract' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                                    >
                                        <Minus className="w-3.5 h-3.5 mr-1" /> Deduct
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount ({unitLabel})</Label>
                                <Input 
                                    type="number"
                                    step="0.5"
                                    placeholder={`Amount in ${unitLabel}`}
                                    value={formData.deltaAmount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, deltaAmount: e.target.value }))}
                                    required
                                    className="h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason / Notes</Label>
                            <Textarea 
                                placeholder="Audit note for this adjustment..."
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="rounded-xl border-slate-200 dark:border-slate-800 font-medium h-20 text-xs"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose}
                                className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-widest"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Confirm Adjustment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default BalanceAdjustmentModal;
