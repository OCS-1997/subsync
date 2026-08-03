import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { toast } from 'react-toastify';
import { Loader2, Plus, Edit2, Trash2, Settings, Shield, Circle, ArrowLeft, MoveUp, MoveDown } from 'lucide-react';
import { goalService } from '../services/goalService';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';

const BADGE_COLORS = [
    { name: 'Slate', hex: '#64748b' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Rose', hex: '#ef4444' },
    { name: 'Violet', hex: '#8b5cf6' },
    { name: 'Cyan', hex: '#06b6d4' }
];

export default function GoalMastersSettings() {
    const navigate = useNavigate();
    const { username } = useParams();
    const { hasPermission } = usePermissions();

    const baseUrl = `/${username || 'admin'}/dashboard`;

    const [activeTab, setActiveTab] = useState('categories');
    const [loading, setLoading] = useState(true);

    const [categories, setCategories] = useState([]);
    const [impacts, setImpacts] = useState([]);
    const [statuses, setStatuses] = useState([]);

    // Modals
    const [catModal, setCatModal] = useState({ open: false, mode: 'add', data: null });
    const [catForm, setCatForm] = useState({ name: '', description: '', is_active: true, display_order: 0 });

    const [impModal, setImpModal] = useState({ open: false, mode: 'add', data: null });
    const [impForm, setImpForm] = useState({ name: '', description: '', is_active: true, display_order: 0 });

    const [statModal, setStatModal] = useState({ open: false, mode: 'add', data: null });
    const [statForm, setStatForm] = useState({
        name: '', code: '', description: '', badge_color: '#3b82f6',
        icon: 'Circle', is_completed_status: false, is_active: true, is_default: false, display_order: 0
    });

    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [c, i, s] = await Promise.all([
                goalService.getCategories(true),
                goalService.getBusinessImpacts(true),
                goalService.getStatuses(true)
            ]);
            setCategories(c || []);
            setImpacts(i || []);
            setStatuses(s || []);
        } catch (error) {
            toast.error('Failed to load goal masters');
        } finally {
            setLoading(false);
        }
    };

    // Category Handlers
    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!catForm.name.trim()) return toast.error('Category Name is required');
        try {
            setSaving(true);
            if (catModal.mode === 'add') {
                await goalService.createCategory(catForm);
                toast.success('Category created');
            } else {
                await goalService.updateCategory(catModal.data.category_id, catForm);
                toast.success('Category updated');
            }
            setCatModal({ open: false, mode: 'add', data: null });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (catId) => {
        if (!confirm('Are you sure you want to delete this Category?')) return;
        try {
            await goalService.deleteCategory(catId);
            toast.success('Category deleted');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || err.message);
        }
    };

    // Impact Handlers
    const handleSaveImpact = async (e) => {
        e.preventDefault();
        if (!impForm.name.trim()) return toast.error('Impact Name is required');
        try {
            setSaving(true);
            if (impModal.mode === 'add') {
                await goalService.createBusinessImpact(impForm);
                toast.success('Business Impact created');
            } else {
                await goalService.updateBusinessImpact(impModal.data.impact_id, impForm);
                toast.success('Business Impact updated');
            }
            setImpModal({ open: false, mode: 'add', data: null });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteImpact = async (impId) => {
        if (!confirm('Are you sure you want to delete this Business Impact?')) return;
        try {
            await goalService.deleteBusinessImpact(impId);
            toast.success('Business Impact deleted');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || err.message);
        }
    };

    // Status Handlers
    const handleSaveStatus = async (e) => {
        e.preventDefault();
        if (!statForm.name.trim()) return toast.error('Status Name is required');
        try {
            setSaving(true);
            if (statModal.mode === 'add') {
                await goalService.createStatus(statForm);
                toast.success('Goal Status created');
            } else {
                await goalService.updateStatus(statModal.data.status_id, statForm);
                toast.success('Goal Status updated');
            }
            setStatModal({ open: false, mode: 'add', data: null });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || err.message || 'Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteStatus = async (statId) => {
        if (!confirm('Are you sure you want to delete this Status?')) return;
        try {
            await goalService.deleteStatus(statId);
            toast.success('Goal Status deleted');
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.error || err.message);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Goal Masters & Configuration"
                description="Configure categories, business impact types, and statuses for organizational goals."
                breadcrumbItems={[
                    { label: 'Goals', href: `${baseUrl}/goals` },
                    { label: 'Settings', href: `${baseUrl}/settings` },
                    { label: 'Goal Masters' }
                ]}
                actions={
                    <button onClick={() => navigate(`${baseUrl}/goals`)} className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back to Goals
                    </button>
                }
            />


            {loading ? (
                <div className="flex justify-center p-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-1 max-w-md">
                        <TabsTrigger value="categories" className="rounded-xl text-xs font-bold">Categories</TabsTrigger>
                        <TabsTrigger value="impacts" className="rounded-xl text-xs font-bold">Business Impacts</TabsTrigger>
                        <TabsTrigger value="statuses" className="rounded-xl text-xs font-bold">Statuses</TabsTrigger>
                    </TabsList>

                    {/* CATEGORIES TAB */}
                    <TabsContent value="categories" className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Categories ({categories.length})</h2>
                            {hasPermission(PERMISSIONS.GOALS_CONFIGURE_CATEGORIES) && (
                                <button
                                    onClick={() => {
                                        setCatForm({ name: '', description: '', is_active: true, display_order: categories.length + 1 });
                                        setCatModal({ open: true, mode: 'add', data: null });
                                    }}
                                    className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md"
                                >
                                    <Plus className="w-4 h-4" /> Add Category
                                </button>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="p-4">Order</th>
                                        <th className="p-4">Category Name</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                                    {categories.map((cat) => (
                                        <tr key={cat.category_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{cat.display_order}</td>
                                            <td className="p-4 font-black text-slate-900 dark:text-white">{cat.name}</td>
                                            <td className="p-4 text-slate-500 font-medium max-w-xs truncate">{cat.description || '-'}</td>
                                            <td className="p-4">
                                                <Badge className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl ${cat.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}`}>
                                                    {cat.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right space-x-1">
                                                {hasPermission(PERMISSIONS.GOALS_CONFIGURE_CATEGORIES) && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setCatForm({
                                                                    name: cat.name,
                                                                    description: cat.description || '',
                                                                    is_active: Boolean(cat.is_active),
                                                                    display_order: cat.display_order || 0
                                                                });
                                                                setCatModal({ open: true, mode: 'edit', data: cat });
                                                            }}
                                                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteCategory(cat.category_id)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* BUSINESS IMPACTS TAB */}
                    <TabsContent value="impacts" className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Business Impact Types ({impacts.length})</h2>
                            {hasPermission(PERMISSIONS.GOALS_CONFIGURE_BUSINESS_IMPACT) && (
                                <button
                                    onClick={() => {
                                        setImpForm({ name: '', description: '', is_active: true, display_order: impacts.length + 1 });
                                        setImpModal({ open: true, mode: 'add', data: null });
                                    }}
                                    className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md"
                                >
                                    <Plus className="w-4 h-4" /> Add Impact Type
                                </button>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="p-4">Order</th>
                                        <th className="p-4">Impact Name</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                                    {impacts.map((imp) => (
                                        <tr key={imp.impact_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{imp.display_order}</td>
                                            <td className="p-4 font-black text-slate-900 dark:text-white">{imp.name}</td>
                                            <td className="p-4 text-slate-500 font-medium max-w-xs truncate">{imp.description || '-'}</td>
                                            <td className="p-4">
                                                <Badge className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl ${imp.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}`}>
                                                    {imp.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right space-x-1">
                                                {hasPermission(PERMISSIONS.GOALS_CONFIGURE_BUSINESS_IMPACT) && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setImpForm({
                                                                    name: imp.name,
                                                                    description: imp.description || '',
                                                                    is_active: Boolean(imp.is_active),
                                                                    display_order: imp.display_order || 0
                                                                });
                                                                setImpModal({ open: true, mode: 'edit', data: imp });
                                                            }}
                                                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteImpact(imp.impact_id)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* STATUSES TAB */}
                    <TabsContent value="statuses" className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Goal Statuses ({statuses.length})</h2>
                            {hasPermission(PERMISSIONS.GOALS_CONFIGURE_STATUS) && (
                                <button
                                    onClick={() => {
                                        setStatForm({
                                            name: '', code: '', description: '', badge_color: '#3b82f6',
                                            icon: 'Circle', is_completed_status: false, is_active: true,
                                            is_default: false, display_order: statuses.length + 1
                                        });
                                        setStatModal({ open: true, mode: 'add', data: null });
                                    }}
                                    className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-md"
                                >
                                    <Plus className="w-4 h-4" /> Add Status
                                </button>
                            )}
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs font-bold text-slate-700 dark:text-slate-200">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="p-4">Order</th>
                                        <th className="p-4">Status Badge</th>
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Flags</th>
                                        <th className="p-4">Active</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
                                    {statuses.map((st) => (
                                        <tr key={st.status_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4 font-mono text-slate-400">{st.display_order}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.badge_color }} />
                                                    <span className="text-slate-900 dark:text-white font-black">{st.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-400">{st.code}</td>
                                            <td className="p-4 space-x-1">
                                                {st.is_completed_status ? <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">Completed Rule</Badge> : null}
                                                {st.is_default ? <Badge className="bg-blue-100 text-blue-800 text-[9px] font-black uppercase">Default</Badge> : null}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl ${st.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}`}>
                                                    {st.is_active ? 'Active' : 'Disabled'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-right space-x-1">
                                                {hasPermission(PERMISSIONS.GOALS_CONFIGURE_STATUS) && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setStatForm({
                                                                    name: st.name,
                                                                    code: st.code,
                                                                    description: st.description || '',
                                                                    badge_color: st.badge_color || '#3b82f6',
                                                                    icon: st.icon || 'Circle',
                                                                    is_completed_status: Boolean(st.is_completed_status),
                                                                    is_active: Boolean(st.is_active),
                                                                    is_default: Boolean(st.is_default),
                                                                    display_order: st.display_order || 0
                                                                });
                                                                setStatModal({ open: true, mode: 'edit', data: st });
                                                            }}
                                                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteStatus(st.status_id)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* CATEGORY MODAL */}
            <Dialog open={catModal.open} onOpenChange={(val) => setCatModal(prev => ({ ...prev, open: val }))}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">{catModal.mode === 'add' ? 'Add Goal Category' : 'Edit Goal Category'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category Name *</Label>
                            <Input
                                value={catForm.name}
                                onChange={(e) => setCatForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Development"
                                className="h-11 rounded-2xl font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                            <Textarea
                                value={catForm.description}
                                onChange={(e) => setCatForm(p => ({ ...p, description: e.target.value }))}
                                rows={2}
                                className="rounded-2xl font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Order</Label>
                                <Input
                                    type="number"
                                    value={catForm.display_order}
                                    onChange={(e) => setCatForm(p => ({ ...p, display_order: e.target.value }))}
                                    className="h-11 rounded-2xl font-bold"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Switch
                                    checked={catForm.is_active}
                                    onCheckedChange={(checked) => setCatForm(p => ({ ...p, is_active: checked }))}
                                />
                                <Label className="text-xs font-bold">Active Status</Label>
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setCatModal(p => ({ ...p, open: false }))} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-blue-600 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Category'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* IMPACT MODAL */}
            <Dialog open={impModal.open} onOpenChange={(val) => setImpModal(prev => ({ ...prev, open: val }))}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">{impModal.mode === 'add' ? 'Add Business Impact' : 'Edit Business Impact'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveImpact} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Impact Name *</Label>
                            <Input
                                value={impForm.name}
                                onChange={(e) => setImpForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Operational Efficiency"
                                className="h-11 rounded-2xl font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                            <Textarea
                                value={impForm.description}
                                onChange={(e) => setImpForm(p => ({ ...p, description: e.target.value }))}
                                rows={2}
                                className="rounded-2xl font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Order</Label>
                                <Input
                                    type="number"
                                    value={impForm.display_order}
                                    onChange={(e) => setImpForm(p => ({ ...p, display_order: e.target.value }))}
                                    className="h-11 rounded-2xl font-bold"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Switch
                                    checked={impForm.is_active}
                                    onCheckedChange={(checked) => setImpForm(p => ({ ...p, is_active: checked }))}
                                />
                                <Label className="text-xs font-bold">Active Status</Label>
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setImpModal(p => ({ ...p, open: false }))} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-blue-600 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Impact'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* STATUS MODAL */}
            <Dialog open={statModal.open} onOpenChange={(val) => setStatModal(prev => ({ ...prev, open: val }))}>
                <DialogContent className="max-w-md rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-black text-lg">{statModal.mode === 'add' ? 'Add Goal Status' : 'Edit Goal Status'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveStatus} className="space-y-4 py-2">
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Name *</Label>
                            <Input
                                value={statForm.name}
                                onChange={(e) => setStatForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. In Progress"
                                className="h-11 rounded-2xl font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Badge Color</Label>
                            <div className="flex items-center gap-2 pt-1">
                                {BADGE_COLORS.map(c => (
                                    <button
                                        type="button"
                                        key={c.hex}
                                        onClick={() => setStatForm(p => ({ ...p, badge_color: c.hex }))}
                                        className={`w-6 h-6 rounded-full border-2 ${statForm.badge_color === c.hex ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={statForm.is_completed_status}
                                onCheckedChange={(checked) => setStatForm(p => ({ ...p, is_completed_status: checked }))}
                            />
                            <Label className="text-xs font-bold">Completed Trigger (Auto Sets 100% Progress)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                checked={statForm.is_default}
                                onCheckedChange={(checked) => setStatForm(p => ({ ...p, is_default: checked }))}
                            />
                            <Label className="text-xs font-bold">Set as Default Status for New Goals</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Order</Label>
                                <Input
                                    type="number"
                                    value={statForm.display_order}
                                    onChange={(e) => setStatForm(p => ({ ...p, display_order: e.target.value }))}
                                    className="h-11 rounded-2xl font-bold"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Switch
                                    checked={statForm.is_active}
                                    onCheckedChange={(checked) => setStatForm(p => ({ ...p, is_active: checked }))}
                                />
                                <Label className="text-xs font-bold">Active</Label>
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setStatModal(p => ({ ...p, open: false }))} className="rounded-xl font-bold">Cancel</Button>
                            <Button type="submit" disabled={saving} className="rounded-xl font-bold bg-blue-600 text-white">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Status'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
