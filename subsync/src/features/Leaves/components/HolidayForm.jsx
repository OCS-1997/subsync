import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Calendar } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const HolidayForm = ({ holiday = null, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: holiday?.name || '',
        holiday_date: holiday?.holiday_date ? holiday.holiday_date.split('T')[0] : '',
        description: holiday?.description || '',
        is_optional: holiday?.is_optional === 1
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = {
                ...formData,
                is_optional: formData.is_optional ? 1 : 0
            };
            if (holiday) {
                await leavesService.updateHoliday(holiday.id, data);
                toast.success("Holiday updated successfully");
            } else {
                await leavesService.createHoliday(data);
                toast.success("New holiday added to system");
                setFormData({
                    name: '',
                    holiday_date: '',
                    description: '',
                    is_optional: false
                });
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to save holiday");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {holiday ? 'Edit Holiday' : 'Add New Holiday'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Holiday Name</Label>
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="New Year's Day"
                            required
                            className="h-10 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</Label>
                        <Input 
                            type="date"
                            value={formData.holiday_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, holiday_date: e.target.value }))}
                            required
                            className="h-10 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                        <Textarea 
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-medium h-20"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-0.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Optional Holiday</Label>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Is this a restricted/optional holiday?</p>
                        </div>
                        <Switch 
                            checked={formData.is_optional}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_optional: checked }))}
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest transition-all"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {holiday ? 'Update Holiday' : 'Save Holiday'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default HolidayForm;
