import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    HardDrive, ArrowLeft, Save, Loader2, Sparkles, Building2, Calendar, 
    Banknote, MapPin, ClipboardList, Info, FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import { parseISO, format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import BentoCard from '@/features/Dashboard/components/BentoCard';

function AddAsset() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { id } = useParams(); // For edit mode
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        asset_name: '',
        category_id: '',
        type_id: '',
        serial_number: '',
        model: '',
        manufacturer: '',
        purchase_date: new Date().toISOString().slice(0, 10),
        purchase_price: '',
        warranty_expiry: '',
        assigned_to: '',
        location: '',
        status: 'Active',
        expected_life_years: '',
        salvage_value: '',
        depreciation_method: 'Straight-Line',
        notes: ''
    });

    useEffect(() => {
        loadInitialData();
        if (isEditMode) {
            loadAsset();
        }
    }, [id]);

    const loadInitialData = async () => {
        try {
            const [categoriesRes, typesRes, usersRes] = await Promise.all([
                api.get('/asset-categories'),
                api.get('/asset-types'),
                api.get('/users')
            ]);
            setCategories(categoriesRes.data || []);
            setTypes(typesRes.data || []);
            setUsers(usersRes.data?.users || usersRes.data || []);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const loadAsset = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/assets/${id}`);
            const asset = response.data;
            setFormData({
                asset_name: asset.asset_name || '',
                category_id: String(asset.category_id) || '',
                type_id: String(asset.type_id) || '',
                serial_number: asset.serial_number || '',
                model: asset.model || '',
                manufacturer: asset.manufacturer || '',
                purchase_date: asset.purchase_date ? asset.purchase_date.split('T')[0] : '',
                purchase_price: asset.purchase_price || '',
                warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
                assigned_to: asset.assigned_to || '',
                location: asset.location || '',
                status: asset.status || 'Active',
                expected_life_years: asset.expected_life_years || '',
                salvage_value: asset.salvage_value || '',
                depreciation_method: asset.depreciation_method || 'Straight-Line',
                notes: asset.notes || ''
            });
        } catch (error) {
            toast.error('Failed to load asset');
            navigate(`/${user.username}/dashboard/assets`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.asset_name) {
            toast.error('Asset name is required');
            return;
        }
        if (!formData.category_id) {
            toast.error('Category is required');
            return;
        }
        if (!formData.type_id) {
            toast.error('Asset type is required');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                category_id: parseInt(formData.category_id),
                type_id: parseInt(formData.type_id),
                purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : 0,
                salvage_value: formData.salvage_value ? parseFloat(formData.salvage_value) : 0,
                expected_life_years: formData.expected_life_years ? parseInt(formData.expected_life_years) : null
            };

            if (isEditMode) {
                await api.put(`/assets/${id}`, payload);
                toast.success('Asset updated successfully');
            } else {
                await api.post('/assets', payload);
                toast.success('Asset created successfully');
            }
            navigate(`/${user.username}/dashboard/assets`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save asset');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-8 max-w mx-auto px-4 md:px-0 space-y-8">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <BentoCard loading size="lg" className="h-[400px] rounded-[2.5rem]" />
                    <BentoCard loading size="lg" className="h-[400px] rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    const breadcrumbItems = [
        { label: 'Assets', href: `/${user.username}/dashboard/assets` },
        { label: isEditMode ? 'Edit Asset' : 'Add Asset' }
    ];

    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0">
            <PageHeader
                title={isEditMode ? 'Edit Asset' : 'Add New Asset'}
                description={isEditMode ? 'Update the details of the existing asset.' : 'Fill in the details below to add a new asset to your inventory.'}
                breadcrumbItems={breadcrumbItems}
                actions={
                    <Button 
                        variant="outline" 
                        onClick={() => navigate(`/${user.username}/dashboard/assets`)}
                        className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[1.2rem] px-6 h-12 font-black uppercase tracking-widest text-[11px] transition-all"
                    >
                        <ArrowLeft className="h-5 w-5 mr-3 text-slate-500" />
                        Back to Assets
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-8 mt-12 mb-20">
                {/* 01. Asset Information */}
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-8 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Info className="h-4 w-4 text-blue-600" />
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
                                01. Basic Identity
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider opacity-70">
                            Enter the core identification details for this hardware node.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block" htmlFor="asset_name">
                                Asset Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="asset_name"
                                value={formData.asset_name}
                                onChange={(e) => handleChange('asset_name', e.target.value)}
                                placeholder="e.g., MacBook Pro 16 Inch"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category <span className="text-rose-500">*</span></Label>
                            <Select value={formData.category_id} onValueChange={(v) => handleChange('category_id', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)} className="font-bold text-xs uppercase tracking-widest">{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asset Type <span className="text-rose-500">*</span></Label>
                            <Select value={formData.type_id} onValueChange={(v) => handleChange('type_id', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                    {types.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)} className="font-bold text-xs uppercase tracking-widest">{t.type_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="serial_number">Serial Number</Label>
                            <Input
                                id="serial_number"
                                value={formData.serial_number}
                                onChange={(e) => handleChange('serial_number', e.target.value)}
                                placeholder="e.g., SN-12345678"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5 font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="model">Model</Label>
                            <Input
                                id="model"
                                value={formData.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder="e.g., 2023 Edition"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="manufacturer">Manufacturer</Label>
                            <Input
                                id="manufacturer"
                                value={formData.manufacturer}
                                onChange={(e) => handleChange('manufacturer', e.target.value)}
                                placeholder="e.g., Apple"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</Label>
                            <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="Active" className="font-bold text-xs uppercase tracking-widest text-emerald-500">Active</SelectItem>
                                    <SelectItem value="Inactive" className="font-bold text-xs uppercase tracking-widest text-slate-400">Inactive</SelectItem>
                                    <SelectItem value="Maintenance" className="font-bold text-xs uppercase tracking-widest text-amber-500">Maintenance</SelectItem>
                                    <SelectItem value="Retired" className="font-bold text-xs uppercase tracking-widest text-rose-500">Retired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 02. Value & Location */}
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-8 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Banknote className="h-4 w-4 text-emerald-600" />
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
                                02. Value & Location
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider opacity-70">
                            Enter the financial details and where this asset is located.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="purchase_date">Purchase Date</Label>
                            <DatePicker
                                date={formData.purchase_date ? parseISO(formData.purchase_date) : null}
                                setDate={(date) => handleChange('purchase_date', date ? format(date, 'yyyy-MM-dd') : '')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="purchase_price">Purchase Cost (₹)</Label>
                            <Input
                                id="purchase_price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.purchase_price}
                                onChange={(e) => handleChange('purchase_price', e.target.value)}
                                placeholder="0.00"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="warranty_expiry">Warranty End Date</Label>
                            <DatePicker
                                date={formData.warranty_expiry ? parseISO(formData.warranty_expiry) : null}
                                setDate={(date) => handleChange('warranty_expiry', date ? format(date, 'yyyy-MM-dd') : '')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="e.g., Main Office"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 03. Life Cycle */}
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-8 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
                                03. Life Cycle
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider opacity-70">
                            Configure asset lifespan and depreciation details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="expected_life_years">Expected Life (Years)</Label>
                            <Input
                                id="expected_life_years"
                                type="number"
                                min="1"
                                value={formData.expected_life_years}
                                onChange={(e) => handleChange('expected_life_years', e.target.value)}
                                placeholder="e.g., 5"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="salvage_value">Salvage Value (₹)</Label>
                            <Input
                                id="salvage_value"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.salvage_value}
                                onChange={(e) => handleChange('salvage_value', e.target.value)}
                                placeholder="0.00"
                                className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Depreciation Method</Label>
                            <Select value={formData.depreciation_method} onValueChange={(v) => handleChange('depreciation_method', v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="Straight-Line" className="font-bold text-xs uppercase tracking-widest">Straight-Line</SelectItem>
                                    <SelectItem value="Declining Balance" className="font-bold text-xs uppercase tracking-widest">Declining Balance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 04. Assignment */}
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-8 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-4 w-4 text-slate-600" />
                            <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                                04. Assignment
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs font-bold text-slate-500 uppercase tracking-wider opacity-70">
                            Assign this asset to a user and add any additional notes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign To</Label>
                            <Select value={formData.assigned_to} onValueChange={(v) => handleChange('assigned_to', v === 'none' ? '' : v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold px-5 text-blue-600">
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="none" className="font-bold text-xs uppercase tracking-widest opacity-50 text-slate-400">Unassigned</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.username} value={u.username} className="font-bold text-xs tracking-tight">
                                            {u.display_name || u.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor="notes">Additional Notes</Label>
                            <Textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                placeholder="Enter any additional details or history..."
                                className="min-h-[160px] rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent focus:border-blue-500/50 transition-all font-bold p-6 resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Final Actions */}
                <div className="flex flex-col md:flex-row justify-end items-center gap-6 pt-12 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => navigate(`/${user.username}/dashboard/assets`)}
                        className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={saving}
                        className="h-12 px-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-3 min-w-[200px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                {isEditMode ? 'Save Changes' : 'Save Asset'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default AddAsset;
