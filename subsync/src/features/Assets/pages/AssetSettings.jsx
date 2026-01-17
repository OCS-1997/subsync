import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Settings, Plus, Trash2, Edit, Save, X, ArrowLeft, Loader2, MoreVertical,
    Laptop, Smartphone, Printer, Monitor, MousePointer, 
    Network, Shield, Cpu, Database, Cloud, Map as MapIcon,
    Table as TableIcon, FileText, Briefcase, Camera, Speaker, HardDrive, Package, Layers
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = {
    Laptop, Smartphone, Printer, Monitor, MousePointer, 
    Network, Shield, Cpu, Database, Cloud, MapIcon,
    TableIcon, FileText, Briefcase, Camera, Speaker, HardDrive, Package, Layers
};

const COLOR_OPTIONS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Orange', value: '#f97316' },
];

function AssetSettings() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    
    const [categoryDialog, setCategoryDialog] = useState({ open: false, mode: 'add', data: null });
    const [typeDialog, setTypeDialog] = useState({ open: false, mode: 'add', data: null });
    const [saving, setSaving] = useState(false);

    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'Package', color: '#3b82f6' });
    const [typeForm, setTypeForm] = useState({ type_name: '', icon: 'HardDrive', description: '' });

    const [confirmDelete, setConfirmDelete] = useState({ open: false, type: null, id: null, name: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [categoriesRes, typesRes] = await Promise.all([
                api.get('/asset-categories'),
                api.get('/asset-types')
            ]);
            setCategories(categoriesRes.data || []);
            setTypes(typesRes.data || []);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (categoryDialog.mode === 'add') {
                await api.post('/asset-categories', categoryForm);
                toast.success('Category created successfully');
            } else {
                await api.put(`/asset-categories/${categoryDialog.data.category_id}`, categoryForm);
                toast.success('Category updated successfully');
            }
            loadData();
            setCategoryDialog({ open: false, mode: 'add', data: null });
            setCategoryForm({ name: '', description: '', icon: 'Package', color: '#3b82f6' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleTypeSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (typeDialog.mode === 'add') {
                await api.post('/asset-types', typeForm);
                toast.success('Type created successfully');
            } else {
                await api.put(`/asset-types/${typeDialog.data.type_id}`, typeForm);
                toast.success('Type updated successfully');
            }
            loadData();
            setTypeDialog({ open: false, mode: 'add', data: null });
            setTypeForm({ type_name: '', icon: 'HardDrive', description: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            if (confirmDelete.type === 'category') {
                await api.delete(`/asset-categories/${confirmDelete.id}`);
                toast.success('Category deleted successfully');
            } else {
                await api.delete(`/asset-types/${confirmDelete.id}`);
                toast.success('Type deleted successfully');
            }
            loadData();
            setConfirmDelete({ open: false, type: null, id: null, name: "" });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Delete failed');
        }
    };

    const openCategoryDialog = (mode, category = null) => {
        if (mode === 'edit' && category) {
            setCategoryForm({
                name: category.category_name,
                description: category.description || '',
                icon: category.icon || 'Package',
                color: category.color || '#3b82f6'
            });
        } else {
            setCategoryForm({ name: '', description: '', icon: 'Package', color: '#3b82f6' });
        }
        setCategoryDialog({ open: true, mode, data: category });
    };

    const openTypeDialog = (mode, type = null) => {
        if (mode === 'edit' && type) {
            setTypeForm({
                type_name: type.type_name,
                icon: type.icon || 'HardDrive',
                description: type.description || ''
            });
        } else {
            setTypeForm({ type_name: '', icon: 'HardDrive', description: '' });
        }
        setTypeDialog({ open: true, mode, data: type });
    };

    const IconComponent = ({ iconName, className }) => {
        const Icon = ICON_OPTIONS[iconName] || Package;
        return <Icon className={className} />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="container py-8 max-w-7xl mx-auto px-4">
            <PageHeader
                title="Asset Settings"
                description="Configure asset categories and types for better organization"
                breadcrumbItems={[
                    { label: "Assets", href: `/${user.username}/dashboard/assets` },
                    { label: "Settings" }
                ]}
            />

            <Tabs defaultValue="categories" className="mt-8">
                <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
                    <TabsTrigger value="categories" className="text-sm font-bold">Categories</TabsTrigger>
                    <TabsTrigger value="types" className="text-sm font-bold">Types</TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories" className="mt-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Asset Categories</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{categories.length} categories configured</p>
                        </div>
                        <Button onClick={() => openCategoryDialog('add')} className="rounded-xl h-11 px-6 font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {categories.length === 0 ? (
                            <div className="p-12 text-center">
                                <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">No categories yet</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first category to get started</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {categories.map((category) => (
                                    <div 
                                        key={category.category_id} 
                                        className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div 
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${category.color}20` }}
                                                >
                                                    <IconComponent 
                                                        iconName={category.icon} 
                                                        className="w-6 h-6"
                                                        style={{ color: category.color }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                            {category.category_name}
                                                        </h3>
                                                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold">
                                                            {category.asset_count || 0} assets
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                        {category.description || 'No description provided'}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => openCategoryDialog('edit', category)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => setConfirmDelete({ 
                                                            open: true, 
                                                            type: 'category', 
                                                            id: category.category_id, 
                                                            name: category.category_name 
                                                        })}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Types Tab */}
                <TabsContent value="types" className="mt-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Asset Types</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{types.length} types configured</p>
                        </div>
                        <Button onClick={() => openTypeDialog('add')} className="rounded-xl h-11 px-6 font-bold">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Type
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {types.length === 0 ? (
                            <div className="p-12 text-center">
                                <HardDrive className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                                <p className="text-slate-500 dark:text-slate-400 font-medium">No types yet</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first type to get started</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                {types.map((type) => (
                                    <div 
                                        key={type.type_id} 
                                        className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                                                    <IconComponent 
                                                        iconName={type.icon} 
                                                        className="w-6 h-6 text-slate-600 dark:text-slate-400" 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                                                            {type.type_name}
                                                        </h3>
                                                        <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-bold">
                                                            {type.asset_count || 0} assets
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                                        {type.description || 'No description provided'}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40">
                                                    <DropdownMenuItem onClick={() => openTypeDialog('edit', type)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => setConfirmDelete({ 
                                                            open: true, 
                                                            type: 'type', 
                                                            id: type.type_id, 
                                                            name: type.type_name 
                                                        })}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Category Dialog */}
            <Dialog open={categoryDialog.open} onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            {categoryDialog.mode === 'add' ? 'Add New Category' : 'Edit Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {categoryDialog.mode === 'add' ? 'Create a new asset category with custom icon and color' : 'Update category details'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCategorySubmit}>
                        <div className="space-y-5 py-4">
                            <div>
                                <Label className="text-sm font-bold">Category Name *</Label>
                                <Input
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    placeholder="e.g., IT Equipment"
                                    className="mt-2"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold">Description</Label>
                                <Textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    placeholder="Brief description of this category"
                                    className="mt-2"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold mb-3 block">Select Icon</Label>
                                <div className="grid grid-cols-9 gap-2">
                                    {Object.keys(ICON_OPTIONS).map((iconName) => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setCategoryForm({ ...categoryForm, icon: iconName })}
                                            className={cn(
                                                "p-3 rounded-lg border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all",
                                                categoryForm.icon === iconName 
                                                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500" 
                                                    : "border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            <IconComponent iconName={iconName} className="w-5 h-5 mx-auto" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-bold mb-3 block">Select Color</Label>
                                <div className="flex gap-3">
                                    {COLOR_OPTIONS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setCategoryForm({ ...categoryForm, color: color.value })}
                                            className={cn(
                                                "w-10 h-10 rounded-lg border-2 transition-all hover:scale-110",
                                                categoryForm.color === color.value 
                                                    ? "border-slate-900 dark:border-white scale-110" 
                                                    : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setCategoryDialog({ open: false, mode: 'add', data: null })}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="rounded-xl">
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Category
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Type Dialog */}
            <Dialog open={typeDialog.open} onOpenChange={(open) => setTypeDialog({ ...typeDialog, open })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                            {typeDialog.mode === 'add' ? 'Add New Type' : 'Edit Type'}
                        </DialogTitle>
                        <DialogDescription>
                            {typeDialog.mode === 'add' ? 'Create a new asset type with custom icon' : 'Update type details'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTypeSubmit}>
                        <div className="space-y-5 py-4">
                            <div>
                                <Label className="text-sm font-bold">Type Name *</Label>
                                <Input
                                    value={typeForm.type_name}
                                    onChange={(e) => setTypeForm({ ...typeForm, type_name: e.target.value })}
                                    placeholder="e.g., Laptop"
                                    className="mt-2"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold">Description</Label>
                                <Textarea
                                    value={typeForm.description}
                                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                                    placeholder="Brief description of this type"
                                    className="mt-2"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label className="text-sm font-bold mb-3 block">Select Icon</Label>
                                <div className="grid grid-cols-9 gap-2">
                                    {Object.keys(ICON_OPTIONS).map((iconName) => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setTypeForm({ ...typeForm, icon: iconName })}
                                            className={cn(
                                                "p-3 rounded-lg border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all",
                                                typeForm.icon === iconName 
                                                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500" 
                                                    : "border-slate-200 dark:border-slate-700"
                                            )}
                                        >
                                            <IconComponent iconName={iconName} className="w-5 h-5 mx-auto" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setTypeDialog({ open: false, mode: 'add', data: null })}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving} className="rounded-xl">
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Type
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={confirmDelete.open} onOpenChange={(open) => setConfirmDelete({ ...confirmDelete, open })}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-red-600">Confirm Deletion</DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{confirmDelete.name}"</span>? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setConfirmDelete({ open: false, type: null, id: null, name: "" })}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete}
                            className="rounded-xl"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AssetSettings;
