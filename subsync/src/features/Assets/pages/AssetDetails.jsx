import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    HardDrive, ArrowLeft, Edit, Trash2, User, Calendar, MapPin,
    Clock, DollarSign, Shield, History, Paperclip, Loader2, UserPlus, UserMinus,
    Package, Info, Activity, AlertCircle, FileText, ChevronRight, Building2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import BentoGrid from '@/features/Dashboard/components/BentoGrid';
import BentoCard from '@/features/Dashboard/components/BentoCard';

function AssetDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useSelector((state) => state.auth);
    const { hasPermission } = usePermissions();

    const [loading, setLoading] = useState(true);
    const [asset, setAsset] = useState(null);
    const [users, setUsers] = useState([]);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    
    // Custom Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
    const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadAsset();
        loadUsers();
    }, [id]);

    const loadAsset = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/assets/${id}`);
            setAsset(response.data);
        } catch (error) {
            toast.error('Failed to load asset');
            navigate(`/${user.username}/dashboard/assets`);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data?.users || response.data || []);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const handleRestore = async (assetId) => {
        try {
            await api.post(`/assets/${assetId}/restore`);
            toast.success('Asset restored successfully');
            loadAsset(); // Reload the asset now that it's restored
        } catch (error) {
            toast.error('Failed to restore asset');
        }
    };

    const handleDelete = async () => {
        const assetName = asset.asset_name;
        try {
            await api.delete(`/assets/${id}`);
            toast.success(
                <div className="flex items-center justify-between gap-4">
                    <span>Asset "{assetName}" deleted</span>
                    <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => handleRestore(id)}
                        className="text-blue-500 font-black uppercase text-[10px] tracking-widest p-0 h-auto hover:text-blue-600"
                    >
                        Undo
                    </Button>
                </div>,
                { autoClose: 5000 }
            );
            setDeleteDialogOpen(false);
            navigate(`/${user.username}/dashboard/assets`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete asset');
        }
    };

    const handleAssign = async () => {
        if (!selectedUser) {
            toast.error('Please select a user');
            return;
        }
        try {
            setAssigning(true);
            await api.post(`/assets/${id}/assign`, { username: selectedUser });
            toast.success('Asset assigned successfully');
            setAssignDialogOpen(false);
            loadAsset();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to assign asset');
        } finally {
            setAssigning(false);
        }
    };

    const handleUnassign = async () => {
        try {
            await api.post(`/assets/${id}/unassign`);
            toast.success('Asset unassigned successfully');
            setUnassignDialogOpen(false);
            loadAsset();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to unassign asset');
        }
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return `₹${parseFloat(value).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return '-';
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            ...(includeTime && { hour: '2-digit', minute: '2-digit' })
        };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    if (loading) {
        return (
            <div className="container py-8 max-w mx-auto px-4 md:px-0 space-y-8">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                        <div className="h-4 w-40 bg-slate-100 dark:bg-slate-900 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <BentoCard loading size="lg" className="h-[400px] rounded-[2.5rem]" />
                        <BentoCard loading size="md" className="h-[300px] rounded-[2.5rem]" />
                    </div>
                    <div className="space-y-8">
                        <BentoCard loading size="sm" className="h-[200px] rounded-[2.5rem]" />
                        <BentoCard loading size="sm" className="h-[200px] rounded-[2.5rem]" />
                    </div>
                </div>
            </div>
        );
    }

    if (!asset) return null;

    const breadcrumbItems = [
        { label: 'Assets', href: `/${user.username}/dashboard/assets` },
        { label: asset.asset_name }
    ];

    const statusConfig = {
        'Active': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        'Inactive': { color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' },
        'Maintenance': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        'Retired': { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
    };

    const currentStatus = statusConfig[asset.status] || statusConfig['Active'];

    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0">
            <PageHeader
                title={asset.asset_name}
                description={`Asset ID: ${asset.asset_id}`}
                breadcrumbItems={breadcrumbItems}
                actions={
                    <div className="flex gap-4">
                        {hasPermission(PERMISSIONS.ASSETS_UPDATE) && (
                            <Button 
                                variant="outline" 
                                onClick={() => navigate(`/${user.username}/dashboard/assets/${id}/edit`)}
                                className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[1.2rem] px-6 h-14 font-black uppercase tracking-widest text-[11px] transition-all"
                            >
                                <Edit className="h-5 w-5 mr-3 text-slate-500" />
                                Edit Asset
                            </Button>
                        )}
                        {hasPermission(PERMISSIONS.ASSETS_DELETE) && (
                            <Button 
                                variant="destructive" 
                                onClick={() => {
                                    setDeleteDialogOpen(true);
                                    setDeleteConfirmValue("");
                                }}
                                className="bg-rose-600 hover:bg-rose-700 rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-rose-500/25 active:scale-95 transition-all"
                            >
                                <Trash2 className="h-5 w-5 mr-3" />
                                Delete Asset
                            </Button>
                        )}
                    </div>
                }
            />

            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12"
            >
                {/* Main Identity Segment */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4" style={{ borderLeftColor: asset.category_color || '#3b82f6' }}>
                        <CardHeader className="p-8 pb-0">
                            <div className="flex items-center justify-between mb-4">
                                <Badge className={cn("rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest", currentStatus.bg, currentStatus.color, currentStatus.border)}>
                                    {asset.status}
                                </Badge>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Clock className="h-3 w-3" /> Last Updated: {formatDate(asset.updated_at)}
                                </span>
                            </div>
                            <CardTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <HardDrive className="h-8 w-8 text-blue-500" />
                                Asset Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailItem icon={Package} label="Category" value={asset.category_name} accentColor={asset.category_color} />
                            <DetailItem icon={Info} label="Asset Type" value={asset.type_name} fallback="Generic Component" />
                            <DetailItem icon={Activity} label="Asset ID" value={asset.asset_id} isMono />
                            <DetailItem icon={FileText} label="Model" value={asset.model} />
                            <DetailItem icon={Building2} label="Manufacturer" value={asset.manufacturer} />
                            <DetailItem icon={MapPin} label="Location" value={asset.location} />
                            <div className="md:col-span-2">
                                <DetailItem icon={Shield} label="Serial Number" value={asset.serial_number} isMono largeValue />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fiscal Segment */}
                    <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <DollarSign className="h-6 w-6 text-emerald-500" />
                                Purchase & Value
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            <DetailItem label="Purchase Price" value={formatCurrency(asset.purchase_price)} valueColor="text-emerald-500" />
                            <DetailItem label="Purchase Date" value={formatDate(asset.purchase_date)} />
                            <DetailItem label="Warranty Expiration" value={formatDate(asset.warranty_expiry)} isWarranty warrantyExpired={asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date()} />
                            <Separator className="col-span-full opacity-50" />
                            <DetailItem label="Expected Life" value={asset.expected_life_years ? `${asset.expected_life_years} Years` : 'Endless'} />
                            <DetailItem label="Salvage Value" value={formatCurrency(asset.salvage_value)} />
                            <DetailItem label="Depreciation Method" value={asset.depreciation_method || 'Straight-Line'} />
                        </CardContent>
                    </Card>

                    {/* Custom Attributes Segment */}
                    {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
                        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <Sparkles className="h-6 w-6 text-amber-500" />
                                    Custom Specifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Object.entries(asset.custom_fields).map(([key, value]) => (
                                    <DetailItem key={key} label={key.replace(/_/g, ' ')} value={value} />
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Narrative Segment */}
                    {asset.notes && (
                        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <History className="h-6 w-6 text-blue-500" />
                                    Additional Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-6">
                                <p className="text-sm font-bold leading-relaxed text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                                    {asset.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Operational History */}
                    {asset.history && asset.history.length > 0 && (
                        <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <Activity className="h-6 w-6 text-purple-500" />
                                    Asset History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-6">
                                <div className="space-y-4">
                                    {asset.history.map((entry, i) => (
                                        <div key={entry.id || i} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50/30 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                    <ChevronRight className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                        {entry.action.replace(/_/g, ' ')}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 capitalize">
                                                        By: {entry.changed_by_name || entry.changed_by || 'System'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="ghost" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {formatDate(entry.created_at, true)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Vertical Governance Segment */}
                <div className="space-y-8">
                    {/* Stewardship Segment */}
                    <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <User className="h-6 w-6 text-blue-500" />
                                Assigned User
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-6 text-center">
                            {asset.assigned_to ? (
                                <div className="space-y-6">
                                    <div className="relative inline-block pb-4">
                                        <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/20 mx-auto">
                                            {(asset.assigned_to_name || asset.assigned_to).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-4 border-white dark:border-slate-900 h-6 w-6 rounded-full" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                            {asset.assigned_to_name || asset.assigned_to}
                                        </h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                            Assigned Date: {formatDate(asset.assigned_date)}
                                        </p>
                                    </div>
                                    {hasPermission(PERMISSIONS.ASSETS_ASSIGN) && (
                                        <Dialog open={unassignDialogOpen} onOpenChange={setUnassignDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                                                >
                                                    <UserMinus className="h-3.5 w-3.5 mr-2" />
                                                    Unassign
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2.5rem] dark:bg-slate-900 dark:border-slate-800 p-8">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-black tracking-tight">Unassign Asset</DialogTitle>
                                                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        Are you sure you want to unassign this asset from {asset.assigned_to_name || asset.assigned_to}?
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter className="gap-4 mt-8">
                                                    <Button variant="ghost" onClick={() => setUnassignDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                                                    <Button onClick={handleUnassign} className="bg-rose-600 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">
                                                        Unassign Asset
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            ) : (
                                <div className="py-8">
                                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-slate-700">
                                        <UserPlus className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">Not Assigned</p>
                                    {hasPermission(PERMISSIONS.ASSETS_ASSIGN) && (
                                        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
                                                    Assign Asset
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[2.5rem] dark:bg-slate-900 dark:border-slate-800 p-8">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-black tracking-tight">Assign User</DialogTitle>
                                                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        Select a user to assign this asset to.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="py-8">
                                                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                                                        <SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border-transparent transition-all font-bold px-5">
                                                            <SelectValue placeholder="Select User" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800">
                                                            {users.map(u => (
                                                                <SelectItem key={u.username} value={u.username} className="font-bold text-xs tracking-tight">
                                                                    {u.display_name || u.username}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <DialogFooter className="gap-4">
                                                    <Button variant="ghost" onClick={() => setAssignDialogOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                                                    <Button onClick={handleAssign} disabled={assigning} className="bg-blue-600 h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px]">
                                                        {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Assign Asset'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Metadata Summary */}
                    <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                        <CardHeader className="p-8 pb-0">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Other Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-6 space-y-4">
                            <MetaRow label="Created On" value={formatDate(asset.created_at)} />
                            <MetaRow label="Last Updated" value={formatDate(asset.updated_at)} />
                            {asset.attachments && asset.attachments.length > 0 && (
                                <MetaRow label="Attachments" value={asset.attachments.length} hasIcon={<Paperclip className="h-3 w-3" />} />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md dark:bg-slate-950 dark:border-slate-800 rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-rose-500 p-8 flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                            <Trash2 className="w-10 h-10 text-white" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Purge Asset?</DialogTitle>
                            <DialogDescription className="text-rose-100 text-sm font-medium leading-relaxed opacity-90">
                                This will irrevocably remove <span className="font-black text-white underline decoration-2 underline-offset-4">"{asset.asset_name}"</span>. All history and attachments will be permanently lost.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="delete-confirm-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Challenge</Label>
                            <Input
                                id="delete-confirm-input"
                                value={deleteConfirmValue}
                                onChange={(e) => setDeleteConfirmValue(e.target.value)}
                                placeholder={`Type "${asset.asset_name}" to confirm`}
                                className="h-14 px-5 rounded-2xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 focus:ring-rose-500/20"
                            />
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteDialogOpen(false)}
                                className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-widest text-slate-500"
                            >
                                Abort
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={
                                    deleteConfirmValue.trim().toLowerCase() !== asset.asset_name.trim().toLowerCase()
                                }
                                className="rounded-2xl h-14 flex-1 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 font-black text-[11px] uppercase tracking-widest"
                            >
                                Confirm Purge
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value, isMono = false, largeValue = false, accentColor, valueColor, isWarranty = false, warrantyExpired = false, fallback = '-' }) {
    const displayValue = (value === null || value === undefined || value === '') ? fallback : value;
    
    return (
        <div className="group">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5 opacity-50" />}
                {label}
            </p>
            <div className="flex items-center gap-2">
                {accentColor && (
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                )}
                <span className={cn(
                    "font-black tracking-tight transition-colors",
                    largeValue ? "text-xl" : "text-[15px]",
                    isMono && "font-mono",
                    valueColor || "text-slate-800 dark:text-slate-200",
                    isWarranty && warrantyExpired ? "text-rose-500 font-black" : isWarranty ? "text-emerald-500 font-black" : "",
                    displayValue === fallback && "text-slate-400 font-bold"
                )}>
                    {displayValue}
                </span>
            </div>
        </div>
    );
}

function MetaRow({ label, value, hasIcon }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <div className="flex items-center gap-2">
                {hasIcon}
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{value}</span>
            </div>
        </div>
    );
}

export default AssetDetails;
