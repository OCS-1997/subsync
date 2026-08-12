import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Save, Loader2, ShieldCheck, Info } from 'lucide-react';
import leavesService from '../leavesService';
import { toast } from 'react-toastify';

const PermissionSettingsForm = ({ onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [settings, setSettings] = useState({
        yearly_hours_quota: 24.00,
        monthly_hours_quota: 4.00,
        max_hours_per_request: 2.00,
        max_requests_per_month: 2,
        is_active: 1
    });

    const loadSettings = async () => {
        setIsFetching(true);
        try {
            const data = await leavesService.getPermissionSettings();
            if (data) {
                setSettings({
                    yearly_hours_quota: data.yearly_hours_quota || 24.00,
                    monthly_hours_quota: data.monthly_hours_quota || 4.00,
                    max_hours_per_request: data.max_hours_per_request || 2.00,
                    max_requests_per_month: data.max_requests_per_month || 2,
                    is_active: data.is_active === 1
                });
            }
        } catch (error) {
            toast.error("Failed to load permission settings");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await leavesService.updatePermissionSettings(settings);
            toast.success("Permission module settings updated");
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update permission settings");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">Loading settings...</p>
            </Card>
        );
    }

    return (
        <Card className="rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        Permission Module Quotas & Policy Rules
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-full border border-indigo-200 dark:border-indigo-800">
                        Hours Tracking
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Enable Permission Module</Label>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Allow employees to request short-duration workday permissions</p>
                        </div>
                        <Switch 
                            checked={settings.is_active}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_active: checked }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Yearly Hour Quota (Per Employee)</Label>
                            <Input 
                                type="number"
                                step="0.5"
                                value={settings.yearly_hours_quota}
                                onChange={(e) => setSettings(prev => ({ ...prev, yearly_hours_quota: e.target.value }))}
                                required
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Default total permission hours allocated per year (e.g. 24 Hours)</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Hour Cap</Label>
                            <Input 
                                type="number"
                                step="0.5"
                                value={settings.monthly_hours_quota}
                                onChange={(e) => setSettings(prev => ({ ...prev, monthly_hours_quota: e.target.value }))}
                                required
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Max permission hours an employee can use in a single month</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Duration per Request (Hours)</Label>
                            <Input 
                                type="number"
                                step="0.5"
                                value={settings.max_hours_per_request}
                                onChange={(e) => setSettings(prev => ({ ...prev, max_hours_per_request: e.target.value }))}
                                required
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Maximum hours allowed in a single permission application (e.g. 2 Hours)</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Requests Per Month</Label>
                            <Input 
                                type="number"
                                value={settings.max_requests_per_month}
                                onChange={(e) => setSettings(prev => ({ ...prev, max_requests_per_month: e.target.value }))}
                                required
                                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 font-bold"
                            />
                            <p className="text-[9px] text-slate-400 font-medium">Max count of permission applications allowed per month</p>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 flex items-center gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tight">
                            Permissions are distinct from Leaves. Changing quotas will automatically reflect on employee permission meters.
                        </p>
                    </div>

                    <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-md"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Permission Policy Settings
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default PermissionSettingsForm;
