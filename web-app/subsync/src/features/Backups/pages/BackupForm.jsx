import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Loader2, Clock, Database, Mail, Shield, Settings, Info, Bell, Trash2, Plus, Activity, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import api from '@/lib/axiosInstance.js';
import Hamster from '@/components/animations/Hamster.jsx';
import { cn } from "@/lib/utils";

export default function BackupForm() {
    const navigate = useNavigate();
    const { username, id } = useParams();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        enabled: true,
        schedule_type: 'manual',
        schedule_time: '02:00:00',
        schedule_day_of_week: 0,
        schedule_day_of_month: 1,
        timezone: 'Asia/Kolkata',
        retention_days: 30,
        max_backups: 10,
        compression: true,
        email_on_success: false,
        email_on_failure: true,
        email_recipients: []
    });
    const [emailInput, setEmailInput] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchConfig();
        }
    }, [id]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/backups/${id}`);
            const config = response.data.config;

            setFormData({
                name: config.name || '',
                description: config.description || '',
                enabled: config.enabled === 1,
                schedule_type: config.schedule_type || 'manual',
                schedule_time: config.schedule_time || '02:00:00',
                schedule_day_of_week: config.schedule_day_of_week || 0,
                schedule_day_of_month: config.schedule_day_of_month || 1,
                timezone: config.timezone || 'Asia/Kolkata',
                retention_days: config.retention_days || 30,
                max_backups: config.max_backups || 10,
                compression: config.compression === 1,
                email_on_success: config.email_on_success === 1,
                email_on_failure: config.email_on_failure === 1,
                email_recipients: Array.isArray(config.email_recipients) ? config.email_recipients : []
            });

            setEmailInput(Array.isArray(config.email_recipients) ? config.email_recipients.join(', ') : '');
        } catch (error) {
            toast.error('Failed to load backup configuration');
            console.error(error);
            navigate(`/${username}/dashboard/backups`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        const recipients = emailInput
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0);

        const submitData = {
            ...formData,
            enabled: formData.enabled ? 1 : 0,
            compression: formData.compression ? 1 : 0,
            email_on_success: formData.email_on_success ? 1 : 0,
            email_on_failure: formData.email_on_failure ? 1 : 0,
            email_recipients: recipients
        };

        try {
            setSaving(true);
            if (isEditing) {
                await api.put(`/backups/${id}`, submitData);
                toast.success('Backup configuration updated successfully');
            } else {
                await api.post('/backups', submitData);
                toast.success('Backup configuration created successfully');
            }
            navigate(`/${username}/dashboard/backups`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save backup configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[80vh]">
                <Hamster />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-8">
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <PageHeader
                    title={isEditing ? 'Edit Strategy' : 'New Backup Strategy'}
                    description={isEditing ? 'Fine-tune your automated data protection settings' : 'Define a new automated backup workflow'}
                    breadcrumbItems={[
                        { label: "Backups", href: `/${username}/dashboard/backups` },
                        { label: isEditing ? 'Edit Strategy' : 'New Strategy' }
                    ]}
                    actions={
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/${username}/dashboard/backups`)}
                            className="rounded-xl hover:bg-white dark:hover:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Discard Changes
                        </Button>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            {/* Identity Card */}
                            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-blue-600/5 to-indigo-600/5 dark:from-blue-600/10 dark:to-indigo-600/10 border-b border-slate-100 dark:border-slate-800/50 p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
                                            <Database className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold">Strategy Identity</CardTitle>
                                            <CardDescription>How this backup strategy will be identified</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                            Configuration Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Daily Production Cluster Backup"
                                            required
                                            className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all text-base"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the purpose of this backup..."
                                            rows={4}
                                            className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all text-base resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                                        <div className="flex gap-4">
                                            <div className="bg-white dark:bg-slate-800 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm">
                                                <Activity className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <Label className="text-base font-bold">Status</Label>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Toggle whether this strategy is currently active</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={formData.enabled}
                                            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                                            className="data-[state=checked]:bg-blue-600 scale-125"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Execution & Automation Card */}
                            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-purple-600/5 to-pink-600/5 dark:from-purple-600/10 dark:to-pink-600/10 border-b border-slate-100 dark:border-slate-800/50 p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-500/30">
                                            <Clock className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold">Schedule Automation</CardTitle>
                                            <CardDescription>Determine when backups should trigger automatically</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label htmlFor="schedule_type" className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Frequency</Label>
                                            <Select
                                                value={formData.schedule_type}
                                                onValueChange={(value) => setFormData({ ...formData, schedule_type: value })}
                                            >
                                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus:ring-2 focus:ring-purple-500 text-base">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-800">
                                                    <SelectItem value="manual" className="rounded-xl">Manual Trigger Only</SelectItem>
                                                    <SelectItem value="daily" className="rounded-xl">Every Day</SelectItem>
                                                    <SelectItem value="weekly" className="rounded-xl">Weekly Intervals</SelectItem>
                                                    <SelectItem value="monthly" className="rounded-xl">Monthly Intervals</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {formData.schedule_type !== 'manual' && (
                                            <div className="space-y-4">
                                                <Label htmlFor="schedule_time" className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Trigger Time</Label>
                                                <Input
                                                    id="schedule_time"
                                                    type="time"
                                                    value={formData.schedule_time}
                                                    onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                                                    className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-2 focus-visible:ring-purple-500 text-base"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {formData.schedule_type === 'weekly' && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Run on Day</Label>
                                            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, schedule_day_of_week: idx })}
                                                        className={cn(
                                                            "h-12 rounded-xl text-xs font-bold transition-all",
                                                            formData.schedule_day_of_week === idx
                                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                        )}
                                                    >
                                                        {day}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formData.schedule_type === 'monthly' && (
                                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                            <Label htmlFor="schedule_day_of_month" className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Day of the Month (1-31)</Label>
                                            <div className="flex items-center gap-4">
                                                <Input
                                                    id="schedule_day_of_month"
                                                    type="range"
                                                    min="1"
                                                    max="31"
                                                    value={formData.schedule_day_of_month}
                                                    onChange={(e) => setFormData({ ...formData, schedule_day_of_month: parseInt(e.target.value) || 1 })}
                                                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                />
                                                <div className="h-14 w-20 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-xl text-purple-600">
                                                    {formData.schedule_day_of_month}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            {/* Retention & Storage Card */}
                            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-emerald-600/5 to-teal-600/5 dark:from-emerald-600/10 dark:to-teal-600/10 border-b border-slate-100 dark:border-slate-800/50 p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-500/30">
                                            <HardDrive className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold">Storage Policy</CardTitle>
                                            <CardDescription>Retention and optimization</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Keep for (days)</Label>
                                            <Input
                                                type="number"
                                                value={formData.retention_days}
                                                onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) || 30 })}
                                                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none text-center font-bold text-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Max Instances</Label>
                                            <Input
                                                type="number"
                                                value={formData.max_backups}
                                                onChange={(e) => setFormData({ ...formData, max_backups: parseInt(e.target.value) || 10 })}
                                                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none text-center font-bold text-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                        <div className="flex gap-3">
                                            <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <div>
                                                <Label className="text-sm font-bold">Compression</Label>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Reduce disk footprint</p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={formData.compression}
                                            onCheckedChange={(checked) => setFormData({ ...formData, compression: checked })}
                                            className="data-[state=checked]:bg-emerald-600"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Notifications Card */}
                            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-br from-orange-600/5 to-amber-600/5 dark:from-orange-600/10 dark:to-amber-600/10 border-b border-slate-100 dark:border-slate-800/50 p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-orange-600 p-3 rounded-2xl shadow-lg shadow-orange-500/30">
                                            <Bell className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold">Alerting</CardTitle>
                                            <CardDescription>Stay informed on status</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                                                <Label className="text-sm font-medium">Alert on Success</Label>
                                            </div>
                                            <Switch
                                                checked={formData.email_on_success}
                                                onCheckedChange={(checked) => setFormData({ ...formData, email_on_success: checked })}
                                                className="data-[state=checked]:bg-orange-600 h-5"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                                                <Label className="text-sm font-medium">Alert on Failure</Label>
                                            </div>
                                            <Switch
                                                checked={formData.email_on_failure}
                                                onCheckedChange={(checked) => setFormData({ ...formData, email_on_failure: checked })}
                                                className="data-[state=checked]:bg-orange-600 h-5"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recipients (CSV)</Label>
                                        <Input
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            placeholder="admin@example.com, devops@example.com"
                                            className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-none h-12 text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Fixed Actions Footer */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-6 flex justify-end items-center gap-6 z-50">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mr-auto hidden sm:flex">
                            <Info className="h-4 w-4" />
                            <span className="text-xs">Your changes are saved to the cloud instantly once submitted.</span>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate(`/${username}/dashboard/backups`)}
                            className="h-12 rounded-2xl px-8 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={saving}
                            className="h-12 rounded-2xl px-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isEditing ? 'Commit Changes' : 'Initialize Strategy'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

