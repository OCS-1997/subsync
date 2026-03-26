import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Save, Loader2 } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const LeaveRequestForm = ({ onSuccess }) => {
    const [types, setTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        half_day_type: 'none',
        reason: ''
    });

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const data = await leavesService.getLeaveTypes();
                setTypes(data);
            } catch (error) {
                console.error("Error fetching leave types:", error);
            }
        };
        fetchTypes();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await leavesService.applyLeave(formData);
            toast.success("Leave request submitted successfully");
            setFormData({
                leave_type_id: '',
                start_date: '',
                end_date: '',
                half_day_type: 'none',
                reason: ''
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to submit leave request");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="bg-blue-600 p-8">
                <CardTitle className="text-white text-xl font-black uppercase tracking-tight flex items-center gap-3">
                    <Calendar className="w-6 h-6" />
                    New Leave Application
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Leave Type</Label>
                        <Select 
                            value={formData.leave_type_id} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, leave_type_id: val }))}
                            required
                        >
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                {types.map(type => (
                                    <SelectItem key={type.id} value={String(type.id)} className="font-bold py-3 uppercase text-[10px] tracking-widest">
                                        {type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Start Date</Label>
                            <Input 
                                type="date" 
                                value={formData.start_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                required
                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">End Date</Label>
                            <Input 
                                type="date" 
                                value={formData.end_date}
                                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                required
                                className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Half Day Option</Label>
                        <Select 
                            value={formData.half_day_type} 
                            onValueChange={(val) => setFormData(prev => ({ ...prev, half_day_type: val }))}
                        >
                            <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold">
                                <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <SelectItem value="none" className="font-bold py-3 uppercase text-[10px] tracking-widest">Full Day(s)</SelectItem>
                                <SelectItem value="first_half" className="font-bold py-3 uppercase text-[10px] tracking-widest">First Half</SelectItem>
                                <SelectItem value="second_half" className="font-bold py-3 uppercase text-[10px] tracking-widest">Second Half</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reason</Label>
                        <Textarea 
                            placeholder="Briefly explain the purpose of leave..."
                            value={formData.reason}
                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                            required
                            className="rounded-2xl border-slate-200 dark:border-slate-800 dark:bg-slate-950 font-bold resize-none h-24 p-4"
                        />
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-5 h-4 mr-2" />
                        )}
                        Submit Application
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default LeaveRequestForm;
