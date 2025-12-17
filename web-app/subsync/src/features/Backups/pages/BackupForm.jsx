import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Loader2, Clock, Database, Mail, Shield, Settings } from 'lucide-react';
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

        // Parse email recipients
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
        return <Hamster />;
    }

    return (
        <div className="p-6">
            <PageHeader
                title={isEditing ? 'Edit Backup Configuration' : 'New Backup Configuration'}
                description={isEditing ? 'Update backup configuration settings' : 'Create a new backup configuration'}
                breadcrumbItems={[
                    { label: "Backups", href: `/${username}/dashboard/backups` },
                    { label: isEditing ? 'Edit Configuration' : 'New Configuration' }
                ]}
                actions={
                    <Button variant="ghost" onClick={() => navigate(`/${username}/dashboard/backups`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Backups
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information Card */}
                    <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-blue-500">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <CardTitle>Basic Information</CardTitle>
                            </div>
                            <CardDescription>Configure the basic settings for this backup</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Daily Production Backup"
                                    required
                                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                    rows={3}
                                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enable Configuration</Label>
                                    <p className="text-sm text-muted-foreground">Activate or deactivate this backup schedule</p>
                                </div>
                                <Switch
                                    checked={formData.enabled}
                                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule Card */}
                    <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-purple-500">
                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                            <div className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <CardTitle>Schedule</CardTitle>
                            </div>
                            <CardDescription>Configure when backups should run</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="schedule_type">Schedule Type</Label>
                                <Select
                                    value={formData.schedule_type}
                                    onValueChange={(value) => setFormData({ ...formData, schedule_type: value })}
                                >
                                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-purple-500">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual Only</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.schedule_type !== 'manual' && (
                                <div className="space-y-4 p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-800">
                                    <div className="space-y-2">
                                        <Label htmlFor="schedule_time">Time</Label>
                                        <Input
                                            id="schedule_time"
                                            type="time"
                                            value={formData.schedule_time}
                                            onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                                            className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    {formData.schedule_type === 'weekly' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="schedule_day_of_week">Day of Week</Label>
                                            <Select
                                                value={formData.schedule_day_of_week.toString()}
                                                onValueChange={(value) => setFormData({ ...formData, schedule_day_of_week: parseInt(value) })}
                                            >
                                                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-purple-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="0">Sunday</SelectItem>
                                                    <SelectItem value="1">Monday</SelectItem>
                                                    <SelectItem value="2">Tuesday</SelectItem>
                                                    <SelectItem value="3">Wednesday</SelectItem>
                                                    <SelectItem value="4">Thursday</SelectItem>
                                                    <SelectItem value="5">Friday</SelectItem>
                                                    <SelectItem value="6">Saturday</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {formData.schedule_type === 'monthly' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="schedule_day_of_month">Day of Month (1-31)</Label>
                                            <Input
                                                id="schedule_day_of_month"
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.schedule_day_of_month}
                                                onChange={(e) => setFormData({ ...formData, schedule_day_of_month: parseInt(e.target.value) || 1 })}
                                                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Retention Policy Card */}
                    <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-green-500">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <CardTitle>Retention Policy</CardTitle>
                            </div>
                            <CardDescription>Configure how long backups are kept</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="retention_days">Retention Days</Label>
                                    <Input
                                        id="retention_days"
                                        type="number"
                                        min="1"
                                        value={formData.retention_days}
                                        onChange={(e) => setFormData({ ...formData, retention_days: parseInt(e.target.value) || 30 })}
                                        className="transition-all duration-200 focus:ring-2 focus:ring-green-500"
                                    />
                                    <p className="text-xs text-muted-foreground">Number of days to keep backups</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_backups">Max Backups</Label>
                                    <Input
                                        id="max_backups"
                                        type="number"
                                        min="1"
                                        value={formData.max_backups}
                                        onChange={(e) => setFormData({ ...formData, max_backups: parseInt(e.target.value) || 10 })}
                                        className="transition-all duration-200 focus:ring-2 focus:ring-green-500"
                                    />
                                    <p className="text-xs text-muted-foreground">Maximum number to keep</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 transition-all duration-200 hover:bg-green-100 dark:hover:bg-green-900/30">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Compression</Label>
                                    <p className="text-sm text-muted-foreground">Compress backup files to save storage space</p>
                                </div>
                                <Switch
                                    checked={formData.compression}
                                    onCheckedChange={(checked) => setFormData({ ...formData, compression: checked })}
                                    className="data-[state=checked]:bg-green-600"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Email Notifications Card */}
                    <Card className="transition-all duration-300 hover:shadow-lg border-l-4 border-l-orange-500">
                        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                <CardTitle>Email Notifications</CardTitle>
                            </div>
                            <CardDescription>Configure email notifications for backup events</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 transition-all duration-200 hover:bg-orange-100 dark:hover:bg-orange-900/30">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email on Success</Label>
                                    <p className="text-sm text-muted-foreground">Send email when backup completes successfully</p>
                                </div>
                                <Switch
                                    checked={formData.email_on_success}
                                    onCheckedChange={(checked) => setFormData({ ...formData, email_on_success: checked })}
                                    className="data-[state=checked]:bg-orange-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/30">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email on Failure</Label>
                                    <p className="text-sm text-muted-foreground">Send email when backup fails (recommended)</p>
                                </div>
                                <Switch
                                    checked={formData.email_on_failure}
                                    onCheckedChange={(checked) => setFormData({ ...formData, email_on_failure: checked })}
                                    className="data-[state=checked]:bg-red-600"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email_recipients">Email Recipients</Label>
                                <Input
                                    id="email_recipients"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    placeholder="email1@example.com, email2@example.com"
                                    className="transition-all duration-200 focus:ring-2 focus:ring-orange-500"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter email addresses separated by commas
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/${username}/dashboard/backups`)}
                        className="min-w-[100px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditing ? 'Update Configuration' : 'Create Configuration'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

