import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { toast } from 'react-toastify';
import {
    Loader2, Target, Save, ArrowLeft, Calendar, Flag, Users, CheckCircle,
    Info, Sparkles, Check
} from 'lucide-react';
import api from '@/lib/axiosInstance';
import { goalService } from '../services/goalService';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';

const FINANCIAL_YEARS = [
    'FY 2024-25',
    'FY 2025-26',
    'FY 2026-27',
    'FY 2027-28'
];
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function AddGoal() {
    const navigate = useNavigate();
    const { id, username } = useParams();
    const isEditMode = Boolean(id);
    const { hasPermission } = usePermissions();

    const baseUrl = `/${username || 'admin'}/dashboard`;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Masters & Users Data
    const [categories, setCategories] = useState([]);
    const [businessImpacts, setBusinessImpacts] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [usersList, setUsersList] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        business_impact_id: '',
        quarter: 'Q1',
        financial_year: 'FY 2025-26',
        owners: [],
        target_date: new Date().toISOString().slice(0, 10),
        status_id: '',
        progress: 0,
        priority: 'Medium',
        remarks: ''
    });

    useEffect(() => {
        loadMastersAndData();
    }, [id]);

    const loadMastersAndData = async () => {
        try {
            setLoading(true);
            const [catRes, impRes, statRes, usersRes] = await Promise.all([
                goalService.getCategories(false),
                goalService.getBusinessImpacts(false),
                goalService.getStatuses(false),
                api.get('/users').catch(() => ({ data: [] }))
            ]);

            setCategories(catRes || []);
            setBusinessImpacts(impRes || []);
            setStatuses(statRes || []);
            const rawUsers = usersRes.data?.users || usersRes.data || [];
            setUsersList(Array.isArray(rawUsers) ? rawUsers : []);

            if (isEditMode) {
                const existingGoal = await goalService.getGoalById(id);
                if (existingGoal) {
                    setFormData({
                        title: existingGoal.title || '',
                        description: existingGoal.description || '',
                        category_id: existingGoal.category_id || '',
                        business_impact_id: existingGoal.business_impact_id || '',
                        quarter: existingGoal.quarter || 'Q1',
                        financial_year: existingGoal.financial_year || 'FY 2025-26',
                        owners: existingGoal.owners ? existingGoal.owners.map(o => o.username) : [],
                        target_date: existingGoal.target_date ? existingGoal.target_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
                        status_id: existingGoal.status_id || '',
                        progress: existingGoal.progress || 0,
                        priority: existingGoal.priority || 'Medium',
                        remarks: existingGoal.remarks || ''
                    });
                }
            } else {
                // Set default status if available
                const defaultStat = statRes.find(s => s.is_default) || statRes[0];
                if (defaultStat) {
                    setFormData(prev => ({
                        ...prev,
                        category_id: catRes[0]?.category_id || '',
                        business_impact_id: impRes[0]?.impact_id || '',
                        status_id: defaultStat.status_id
                    }));
                }
            }
        } catch (error) {
            toast.error('Failed to load goal form requirements');
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerToggle = (userUsername) => {
        setFormData(prev => {
            const exists = prev.owners.includes(userUsername);
            const updated = exists ? prev.owners.filter(u => u !== userUsername) : [...prev.owners, userUsername];
            return { ...prev, owners: updated };
        });
    };

    const handleProgressChange = (val) => {
        const p = Math.min(100, Math.max(0, Number(val) || 0));
        let updatedStatus = formData.status_id;

        if (p === 100) {
            const completedStat = statuses.find(s => s.is_completed_status);
            if (completedStat) {
                updatedStatus = completedStat.status_id;
            }
        }

        setFormData(prev => ({
            ...prev,
            progress: p,
            status_id: updatedStatus
        }));
    };

    const handleStatusChange = (statusId) => {
        const selectedStatus = statuses.find(s => s.status_id === statusId);
        let p = formData.progress;

        if (selectedStatus?.is_completed_status) {
            p = 100;
        }

        setFormData(prev => ({
            ...prev,
            status_id: statusId,
            progress: p
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) return toast.error('Goal Title is required');
        if (!formData.category_id) return toast.error('Category is required');
        if (!formData.business_impact_id) return toast.error('Business Impact is required');
        if (!formData.owners || formData.owners.length === 0) return toast.error('Please select at least one assigned Owner');
        if (!formData.target_date) return toast.error('Target Date is required');

        try {
            setSaving(true);
            if (isEditMode) {
                await goalService.updateGoal(id, formData);
                toast.success('Goal updated successfully');
                navigate(`${baseUrl}/goals/${id}`);
            } else {
                const res = await goalService.createGoal(formData);
                toast.success('Goal created successfully');
                navigate(`${baseUrl}/goals`);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.message || 'Failed to save goal');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-4 sm:py-8 max-w-[1400px] mx-auto space-y-6">
            <PageHeader
                title={isEditMode ? "Edit Goal" : "Create New Goal"}
                description="Define organizational quarterly goals, assign team owners, and establish clear impact criteria."
                breadcrumbItems={[
                    { label: 'Goals', href: `${baseUrl}/goals` },
                    { label: isEditMode ? 'Edit Goal' : 'Add Goal' }
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(`${baseUrl}/goals`)}
                            className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEditMode ? 'Save Changes' : 'Save Goal'}
                        </button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Section 1: Basic Information */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Target className="w-4 h-4 text-blue-500" /> Basic Information
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Goal Title <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Bank Account QR Code Integration"
                                    value={formData.title}
                                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                                    className="h-11 rounded-2xl border-slate-200 dark:border-slate-800 font-bold text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Category <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.category_id}
                                        onValueChange={(val) => setFormData(p => ({ ...p, category_id: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c.category_id} value={c.category_id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Business Impact <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.business_impact_id}
                                        onValueChange={(val) => setFormData(p => ({ ...p, business_impact_id: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Select Business Impact" /></SelectTrigger>
                                        <SelectContent>
                                            {businessImpacts.map(i => <SelectItem key={i.impact_id} value={i.impact_id}>{i.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quarter *</Label>
                                    <Select
                                        value={formData.quarter}
                                        onValueChange={(val) => setFormData(p => ({ ...p, quarter: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Year *</Label>
                                    <Select
                                        value={formData.financial_year}
                                        onValueChange={(val) => setFormData(p => ({ ...p, financial_year: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {FINANCIAL_YEARS.map(fy => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(val) => setFormData(p => ({ ...p, priority: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {PRIORITIES.map(pr => <SelectItem key={pr} value={pr}>{pr}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Description & Remarks */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Description & Deliverables</h3>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Description</Label>
                                <Textarea
                                    rows={4}
                                    placeholder="Describe key objectives, scope, and target outcomes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="rounded-2xl border-slate-200 dark:border-slate-800 font-medium text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Remarks / Next Action</Label>
                                <Textarea
                                    rows={2}
                                    placeholder="Current status notes or upcoming milestones..."
                                    value={formData.remarks}
                                    onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                                    className="rounded-2xl border-slate-200 dark:border-slate-800 font-medium text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Side Sidebar: Owners & Status */}
                    <div className="space-y-6">
                        {/* Status & Progress Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Status & Progress</h3>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Date *</Label>
                                <Input
                                    type="date"
                                    value={formData.target_date}
                                    onChange={(e) => setFormData(p => ({ ...p, target_date: e.target.value }))}
                                    className="h-11 rounded-2xl font-bold text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</Label>
                                <Select
                                    value={formData.status_id}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger className="h-11 rounded-2xl font-bold text-xs"><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(st => (
                                            <SelectItem key={st.status_id} value={st.status_id}>
                                                <div className="flex items-center gap-2 font-bold">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.badge_color }} />
                                                    {st.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress (%)</Label>
                                    <span className="font-black text-sm text-blue-600">{formData.progress}%</span>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => handleProgressChange(e.target.value)}
                                    className="h-11 rounded-2xl font-bold text-xs"
                                />
                                <Progress value={formData.progress} className="h-2 rounded-full mt-2" />
                            </div>
                        </div>

                        {/* Owners Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" /> Assigned Owners <span className="text-rose-500">*</span>
                                </h3>
                                <Badge variant="secondary" className="text-[10px] font-bold">
                                    {formData.owners.length} Selected
                                </Badge>
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                {usersList.map((user) => {
                                    const isSelected = formData.owners.includes(user.username);
                                    return (
                                        <button
                                            type="button"
                                            key={user.username}
                                            onClick={() => handleOwnerToggle(user.username)}
                                            className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all border ${
                                                isSelected
                                                    ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-200'
                                                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="truncate">{user.name || user.username}</span>
                                            {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => navigate(`${baseUrl}/goals`)}
                        className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isEditMode ? 'Save Changes' : 'Save Goal'}
                    </button>
                </div>
            </form>
        </div>
    );
}
