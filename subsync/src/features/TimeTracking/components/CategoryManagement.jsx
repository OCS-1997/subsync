import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Tag, LayoutGrid, Clock, DollarSign, ListOrdered, Eye, ShieldCheck, History } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from "@/lib/utils";

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        type_name: '',
        type_code: '',
        description: '',
        color: '#6b7280',
        icon: 'Clock',
        is_billable_default: false,
        is_active: true,
        display_order: 0
    });
    
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewingCategory, setViewingCategory] = useState(null);
    
    // Predefined vibrant colors for categories
    const colorPresets = [
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
        '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', 
        '#f43f5e', '#64748b'
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/time-tracking/categories');
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/time-tracking/categories/${editingCategory.id}`, formData);
                toast.success('Category updated successfully');
            } else {
                await api.post('/time-tracking/categories', formData);
                toast.success('Category created successfully');
            }
            setDialogOpen(false);
            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error('Failed to save category');
        }
    };

    const handleDelete = async (categoryId) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            await api.delete(`/time-tracking/categories/${categoryId}`);
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            type_name: category.type_name,
            type_code: category.type_code,
            description: category.description || '',
            color: category.color || '#6b7280',
            icon: category.icon || 'Clock',
            is_billable_default: category.is_billable_default,
            is_active: category.is_active,
            display_order: category.display_order || 0
        });
        setDialogOpen(true);
    };

    const handleView = (category) => {
        setViewingCategory(category);
        setViewDialogOpen(true);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            type_name: '',
            type_code: '',
            description: '',
            color: '#6b7280',
            icon: 'Clock',
            is_billable_default: false,
            is_active: true,
            display_order: 0
        });
    };

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm transition-all duration-300">
            <CardHeader className="bg-white dark:bg-slate-800/20 border-b border-gray-50 dark:border-slate-800 p-5 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            Activity Categories
                        </CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage your work categories</p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-12 w-full sm:w-auto px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-95">
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl p-0 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                            
                            <DialogHeader className="p-6 sm:p-10 pb-2">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Tag className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {editingCategory ? 'Edit Category' : 'New Category'}
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-1">
                                            Define a high-level activity bucket
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="px-6 sm:px-10 pb-10 space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                    {/* Left Column: Core Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                                <LayoutGrid className="w-3 h-3 text-blue-500" />
                                                Category Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={formData.type_name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, type_name: e.target.value }))}
                                                required
                                                placeholder="e.g., Development"
                                                className="h-12 rounded-2xl font-bold bg-gray-50/50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                                <Tag className="w-3 h-3 text-blue-500" />
                                                Category Code <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={formData.type_code}
                                                onChange={(e) => setFormData(prev => ({ ...prev, type_code: e.target.value }))}
                                                placeholder="e.g., DEV_CORE"
                                                required
                                                className="h-12 rounded-2xl font-bold bg-gray-50/50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                                <ListOrdered className="w-3 h-3 text-blue-500" />
                                                Display Order
                                            </Label>
                                            <Input
                                                type="number"
                                                value={formData.display_order}
                                                onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                                                className="h-12 rounded-2xl font-bold bg-gray-50/50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: Style & Behavior */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                                Brand Color
                                            </Label>
                                            <div className="p-4 rounded-[1.5rem] bg-gray-50/50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 space-y-4">
                                                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                                    {colorPresets.map(presetColor => (
                                                        <button
                                                            key={presetColor}
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, color: presetColor }))}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full transition-all hover:scale-125 duration-300",
                                                                formData.color === presetColor ? "ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-lg" : "opacity-60"
                                                            )}
                                                            style={{ backgroundColor: presetColor }}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex gap-3 items-center pt-2 border-t border-gray-100 dark:border-slate-800">
                                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-inner border border-gray-200 dark:border-slate-800">
                                                        <input
                                                            type="color"
                                                            value={formData.color}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                            className="absolute -inset-2 w-14 h-14 cursor-pointer"
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono font-black text-slate-400 uppercase tracking-tighter">{formData.color}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-5 bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] dark:from-emerald-500/10 dark:to-transparent rounded-[1.5rem] border border-emerald-500/10 dark:border-emerald-500/20 group hover:border-emerald-500/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <Label htmlFor="billable-default" className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white cursor-pointer">
                                                        Billable
                                                    </Label>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Affects new entries</span>
                                                </div>
                                            </div>
                                            <Switch
                                                id="billable-default"
                                                checked={formData.is_billable_default}
                                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable_default: checked }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                                        <Clock className="w-3 h-3 text-blue-500" />
                                        Contextual Description
                                    </Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Add some details about this category..."
                                        rows={2}
                                        className="rounded-2xl font-bold bg-gray-50/50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm min-h-[100px]"
                                    />
                                </div>

                                <DialogFooter className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row gap-3">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => setDialogOpen(false)} 
                                        className="h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                    >
                                        Discard Changes
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
                                    >
                                        {editingCategory ? 'Update Category' : 'Create Category'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* View Category Detail Dialog */}
                    <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl p-0 dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
                            {viewingCategory && (
                                <>
                                    <div 
                                        className="h-32 w-full relative"
                                        style={{ backgroundColor: viewingCategory.color }}
                                    >
                                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
                                        <div className="absolute -bottom-10 left-10 h-20 w-20 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-xl">
                                            <div 
                                                className="w-full h-full rounded-[1.25rem] flex items-center justify-center"
                                                style={{ backgroundColor: `${viewingCategory.color}20` }}
                                            >
                                                <Tag className="w-8 h-8" style={{ color: viewingCategory.color }} />
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setViewDialogOpen(false)}
                                            className="absolute top-6 right-6 h-8 w-8 p-0 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md"
                                        >
                                            <Plus className="rotate-45 h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="p-6 sm:p-10 pt-16 space-y-6 sm:space-y-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {viewingCategory.type_name}
                                                </h2>
                                                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none font-mono text-[10px] h-6">
                                                    {viewingCategory.type_code}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {viewingCategory.is_active ? (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest">
                                                        <ShieldCheck className="w-3 h-3" /> Active Category
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Inactive
                                                    </span>
                                                )}
                                                <span className="text-slate-300">|</span>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    Order: {viewingCategory.display_order}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 rounded-3xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Usage</p>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">
                                                        {viewingCategory.total_minutes ? 
                                                            `${Math.floor(viewingCategory.total_minutes / 60)}h ${viewingCategory.total_minutes % 60}m` : 
                                                            '0h 00m'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-3xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 space-y-1">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Policy</p>
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className={cn("w-4 h-4", viewingCategory.is_billable_default ? "text-emerald-500" : "text-slate-400")} />
                                                    <p className="text-xl font-black text-slate-900 dark:text-white">
                                                        {viewingCategory.is_billable_default ? 'Billable' : 'Non-Billable'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <ListOrdered className="w-3 h-3 text-blue-500" />
                                                Description & Guidelines
                                            </Label>
                                            <div className="p-6 rounded-[2rem] bg-gray-50/50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    {viewingCategory.description || 'No description provided for this category.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                <History className="w-3.5 h-3.5" />
                                                Created {viewingCategory.created_at ? new Date(viewingCategory.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setViewDialogOpen(false);
                                                        handleEdit(viewingCategory);
                                                    }}
                                                    className="rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 border-slate-200"
                                                >
                                                    Modify
                                                </Button>
                                                <Button 
                                                    size="sm"
                                                    onClick={() => setViewDialogOpen(false)}
                                                    className="rounded-xl font-black text-[9px] uppercase tracking-widest h-10 px-6 bg-slate-900 text-white"
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="p-5 sm:p-8">
                <div className="rounded-2xl border border-gray-50 dark:border-slate-800 overflow-x-auto no-scrollbar">
                    <Table>
                        <TableHeader className="bg-gray-50/30 dark:bg-slate-800/20">
                            <TableRow className="border-gray-50 dark:border-slate-800">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6">Category</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Code</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Total Time</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Billing Type</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading Categories...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <Tag size={48} strokeWidth={1} />
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">No Categories Found</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Create your first category to get started</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map(category => (
                                    <TableRow key={category.id} className="group border-gray-50 dark:border-slate-800 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:scale-125 transition-transform" style={{ backgroundColor: category.color }}></div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{category.type_name}</span>
                                                    {category.description && <span className="text-[10px] font-bold text-slate-400 truncate max-w-[200px] leading-tight">{category.description}</span>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest">
                                                {category.type_code}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10">
                                                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                </div>
                                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                                    {category.total_minutes ? 
                                                        `${Math.floor(category.total_minutes / 60)}h ${category.total_minutes % 60}m` : 
                                                        '0h 00m'
                                                    }
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            {category.is_billable_default ? (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full w-fit">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Billable</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full w-fit">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 uppercase">Non-Billable</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            {category.is_active ? (
                                                <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase tracking-widest shadow-sm">Active</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5 text-right px-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleView(category)}
                                                    className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                                >
                                                    <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleEdit(category)}
                                                    className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(category.id)}
                                                    className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-950 border-gray-100 dark:border-slate-800 hover:border-red-100 transition-all shadow-sm"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default CategoryManagement;
