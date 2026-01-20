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
import { Plus, Pencil, Trash2, Tag, LayoutGrid, Clock, DollarSign, ListOrdered } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

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
            <CardHeader className="bg-white dark:bg-slate-800/20 border-b border-gray-50 dark:border-slate-800 p-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            Activity Taxonomy
                        </CardTitle>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Classification Protocols</p>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all duration-300 active:scale-95">
                                <Plus className="mr-2 h-4 w-4" />
                                Register Schema
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800 rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
                                    {editingCategory ? 'Modify Classification' : 'Taxonomy Alignment'}
                                </DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-1">
                                    Define categorization logic for the global ledger
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Functional Designation *</Label>
                                        <Input
                                            value={formData.type_name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, type_name: e.target.value }))}
                                            required
                                            placeholder="e.g., Strategic Planning"
                                            className="h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Semantic Tag/Code *</Label>
                                        <Input
                                            value={formData.type_code}
                                            onChange={(e) => setFormData(prev => ({ ...prev, type_code: e.target.value }))}
                                            placeholder="e.g., dev_ops"
                                            required
                                            className="h-11 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Schema Description</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            rows={2}
                                            className="rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Chroma Signature</Label>
                                            <div className="flex gap-2 items-center h-11 px-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                                                <input
                                                    type="color"
                                                    value={formData.color}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                                    className="w-12 h-6 rounded border-none bg-transparent cursor-pointer"
                                                />
                                                <span className="text-xs font-mono font-bold text-slate-400 uppercase">{formData.color}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Priority Order</Label>
                                            <div className="relative group">
                                                <ListOrdered className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                                <Input
                                                    type="number"
                                                    value={formData.display_order}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) }))}
                                                    className="h-11 pl-10 rounded-xl font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <Label htmlFor="billable-default" className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white cursor-pointer">
                                                    Revenue Mode
                                                </Label>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase">Default to billable entries</span>
                                            </div>
                                        </div>
                                        <Switch
                                            id="billable-default"
                                            checked={formData.is_billable_default}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable_default: checked }))}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest border-slate-100 dark:border-slate-800">
                                        Discard
                                    </Button>
                                    <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                        Commit Alignment
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="rounded-2xl border border-gray-50 dark:border-slate-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/30 dark:bg-slate-800/20">
                            <TableRow className="border-gray-50 dark:border-slate-800">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6">Classification</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Codename</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Global Utilization</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Fiscal Policy</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Status</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right px-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Taxonomy...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4 text-slate-300">
                                            <Tag size={48} strokeWidth={1} />
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Classification Void</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">No taxonomy protocols detected in the cloud</p>
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
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Revenue</span>
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

