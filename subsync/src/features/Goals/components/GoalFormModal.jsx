import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { Loader2, Calendar, Target, Flag, Users, CheckCircle } from 'lucide-react';
import api from '@/lib/axiosInstance';
import { goalService } from '../services/goalService';

const FINANCIAL_YEARS = [
    'FY 2024-25',
    'FY 2025-26',
    'FY 2026-27',
    'FY 2027-28'
];

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function GoalFormModal({ open, onOpenChange, goalToEdit = null, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Masters Data
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
        target_date: '',
        status_id: '',
        progress: 0,
        priority: 'Medium',
        remarks: ''
    });

    useEffect(() => {
        if (open) {
            loadMastersAndUsers();
        }
    }, [open]);

    useEffect(() => {
        if (open && goalToEdit) {
            setFormData({
                title: goalToEdit.title || '',
                description: goalToEdit.description || '',
                category_id: goalToEdit.category_id || '',
                business_impact_id: goalToEdit.business_impact_id || '',
                quarter: goalToEdit.quarter || 'Q1',
                financial_year: goalToEdit.financial_year || 'FY 2025-26',
                owners: goalToEdit.owners ? goalToEdit.owners.map(o => o.username) : [],
                target_date: goalToEdit.target_date ? goalToEdit.target_date.slice(0, 10) : '',
                status_id: goalToEdit.status_id || '',
                progress: goalToEdit.progress || 0,
                priority: goalToEdit.priority || 'Medium',
                remarks: goalToEdit.remarks || ''
            });
        } else if (open) {
            // Reset to defaults
            setFormData({
                title: '',
                description: '',
                category_id: categories[0]?.category_id || '',
                business_impact_id: businessImpacts[0]?.impact_id || '',
                quarter: 'Q1',
                financial_year: 'FY 2025-26',
                owners: [],
                target_date: new Date().toISOString().slice(0, 10),
                status_id: statuses.find(s => s.is_default)?.status_id || statuses[0]?.status_id || '',
                progress: 0,
                priority: 'Medium',
                remarks: ''
            });
        }
    }, [open, goalToEdit, categories, businessImpacts, statuses]);

    const loadMastersAndUsers = async () => {
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
        } catch (error) {
            toast.error('Failed to load goal metadata masters');
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerToggle = (username) => {
        setFormData(prev => {
            const exists = prev.owners.includes(username);
            const updated = exists ? prev.owners.filter(u => u !== username) : [...prev.owners, username];
            return { ...prev, owners: updated };
        });
    };

    const handleProgressChange = (val) => {
        const p = Math.min(100, Math.max(0, Number(val) || 0));
        let updatedStatus = formData.status_id;

        // Rule: If progress = 100%, suggest/set completed status
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

        // Rule: If status set to Completed, set progress to 100%
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

        if (!formData.title.trim()) {
            return toast.error('Goal Title is required');
        }
        if (!formData.category_id) {
            return toast.error('Category is required');
        }
        if (!formData.business_impact_id) {
            return toast.error('Business Impact is required');
        }
        if (!formData.owners || formData.owners.length === 0) {
            return toast.error('Please assign at least one Owner');
        }
        if (!formData.target_date) {
            return toast.error('Target Date is required');
        }

        try {
            setSubmitting(true);
            if (goalToEdit) {
                await goalService.updateGoal(goalToEdit.goal_id, formData);
                toast.success('Goal updated successfully');
            } else {
                await goalService.createGoal(formData);
                toast.success('Goal created successfully');
            }

            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            toast.error(error.response?.data?.error || error.message || 'Failed to save goal');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-slate-100">
                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        {goalToEdit ? 'Edit Goal' : 'Create New Goal'}
                    </DialogTitle>
                    <DialogDescription>
                        Define organizational quarterly goals, assign team owners, and establish clear impact criteria.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        {/* Title */}
                        <div className="space-y-1">
                            <Label htmlFor="title" className="text-xs font-semibold uppercase text-slate-500">
                                Goal Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="e.g. Bank Account QR Code Integration"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="font-medium text-slate-900 dark:text-slate-100"
                                required
                            />
                        </div>

                        {/* Category & Business Impact */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.category_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, category_id: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.category_id} value={cat.category_id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    Business Impact <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.business_impact_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, business_impact_id: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Business Impact" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessImpacts.map((imp) => (
                                            <SelectItem key={imp.impact_id} value={imp.impact_id}>
                                                {imp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Quarter & Financial Year & Priority */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Quarter *</Label>
                                <Select
                                    value={formData.quarter}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, quarter: val }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Financial Year *</Label>
                                <Select
                                    value={formData.financial_year}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, financial_year: val }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {FINANCIAL_YEARS.map(fy => <SelectItem key={fy} value={fy}>{fy}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Target Date & Status & Progress */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    Target Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.target_date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold uppercase text-slate-500">Status</Label>
                                <Select
                                    value={formData.status_id}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                    <SelectContent>
                                        {statuses.map(st => (
                                            <SelectItem key={st.status_id} value={st.status_id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.badge_color }} />
                                                    {st.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold uppercase text-slate-500">Progress (%)</Label>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{formData.progress}%</span>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => handleProgressChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Owners Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-slate-500">
                                Assigned Owners <span className="text-red-500">*</span>
                            </Label>
                            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-3 max-h-36 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                                {usersList.map((user) => {
                                    const isSelected = formData.owners.includes(user.username);
                                    return (
                                        <button
                                            type="button"
                                            key={user.username}
                                            onClick={() => handleOwnerToggle(user.username)}
                                            className={`flex items-center justify-between p-2 rounded text-xs transition-colors border ${
                                                isSelected
                                                    ? 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/60 dark:border-blue-700 dark:text-blue-300'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                            }`}
                                        >
                                            <span className="truncate font-medium">{user.name || user.username}</span>
                                            {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-1" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Description</Label>
                            <Textarea
                                rows={3}
                                placeholder="Detail the objective, key deliverables, and criteria..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        {/* Remarks */}
                        <div className="space-y-1">
                            <Label className="text-xs font-semibold uppercase text-slate-500">Remarks / Next Action</Label>
                            <Textarea
                                rows={2}
                                placeholder="Latest updates or pending dependencies..."
                                value={formData.remarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {goalToEdit ? 'Save Changes' : 'Create Goal'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
