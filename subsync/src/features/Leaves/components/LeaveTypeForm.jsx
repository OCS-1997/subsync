import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Info } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const LeaveTypeForm = ({ type = null, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: type?.name || '',
        code: type?.code || '',
        description: type?.description || '',
        total_days_per_year: type?.total_days_per_year || 12,
        is_encashable: type?.is_encashable === 1,
        max_carry_forward: type?.max_carry_forward || 0,
        min_service_months: type?.min_service_months || 0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = {
                ...formData,
                is_encashable: formData.is_encashable ? 1 : 0
            };
            if (type) {
                await leavesService.updateLeaveType(type.id, data);
                toast.success("Leave type updated successfully");
            } else {
                await leavesService.createLeaveType(data);
                toast.success("New leave type created");
                setFormData({
                    name: '',
                    code: '',
                    description: '',
                    total_days_per_year: 12,
                    is_encashable: false,
                    max_carry_forward: 0,
                    min_service_months: 0
                });
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to save leave type");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    {type ? 'Edit Leave Type' : 'Create Leave Type'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</Label>
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Sick Leave"
                                required
                                className="h-10 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Code</Label>
                            <Input 
                                value={formData.code}
                                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                placeholder="SL"
                                required
                                className="h-10 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                        <Textarea 
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-medium h-20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Days / Year</Label>
                            <Input 
                                type="number"
                                value={formData.total_days_per_year}
                                onChange={(e) => setFormData(prev => ({ ...prev, total_days_per_year: e.target.value }))}
                                required
                                className="h-10 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Carry Forward</Label>
                            <Input 
                                type="number"
                                value={formData.max_carry_forward}
                                onChange={(e) => setFormData(prev => ({ ...prev, max_carry_forward: e.target.value }))}
                                className="h-10 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Encashable</Label>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Can unused leaves be paid out?</p>
                        </div>
                        <Switch 
                            checked={formData.is_encashable}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_encashable: checked }))}
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {type ? 'Update Leave Type' : 'Save Leave Type'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default LeaveTypeForm;
