import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Save, Loader2 } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const PermissionRequestForm = ({ onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        start_time: '',
        end_time: '',
        reason: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await leavesService.applyPermission(formData);
            toast.success("Permission request submitted successfully");
            setFormData({
                date: '',
                start_time: '',
                end_time: '',
                reason: ''
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to submit permission request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-indigo-600 p-8">
                <CardTitle className="text-white text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Clock className="w-6 h-6" />
                    Permission Request
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</Label>
                        <Input 
                            type="date" 
                            value={formData.date}
                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                            required
                            className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Time</Label>
                            <Input 
                                type="time" 
                                value={formData.start_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                required
                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Time</Label>
                            <Input 
                                type="time" 
                                value={formData.end_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                                required
                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason</Label>
                        <Textarea 
                            placeholder="Purpose of short-duration absence..."
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            required
                            className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold resize-none h-24 p-4"
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-5 h-4 mr-2" />
                        )}
                        Request Permission
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default PermissionRequestForm;
