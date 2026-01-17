import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    HardDrive, Plus, Search, Filter, RefreshCw, MoreVertical,
    Package, Wrench, AlertTriangle, Archive, ChevronDown, Settings, Trash2, Eye, Edit,
    Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions';
import BentoGrid from '@/features/Dashboard/components/BentoGrid';
import BentoCard from '@/features/Dashboard/components/BentoCard';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";

const headers = [
    { key: "asset_info", label: "Asset Details" },
    { key: "category_info", label: "Category" },
    { key: "type_name", label: "Type" },
    { key: "serial_model", label: "Serial / Model" },
    { key: "assigned_to_name", label: "Assigned To" },
    { key: "status", label: "Status" },
    { key: "value", label: "Value" },
    { key: "actions", label: "Actions" },
];

function Assets() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { hasPermission } = usePermissions();
    
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [stats, setStats] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    
    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);

    // Delete Dialog State
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
    const [deleteConfirmValue, setDeleteConfirmValue] = useState("");

    // Debounce search
    const debounceTimeout = useRef();
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => clearTimeout(debounceTimeout.current);
    }, [search]);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadAssets();
    }, [page, debouncedSearch, categoryFilter, typeFilter, statusFilter, sortBy, sortOrder]);

    const loadInitialData = async () => {
        try {
            const [categoriesRes, typesRes, statsRes] = await Promise.all([
                api.get('/asset-categories'),
                api.get('/asset-types'),
                api.get('/assets/stats')
            ]);
            setCategories(categoriesRes.data || []);
            setTypes(typesRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    };

    const loadAssets = async () => {
        try {
            setLoading(true);
            const sortMap = {
                'asset_info': 'asset_name',
                'category_info': 'category_name',
                'serial_model': 'serial_number',
                'value': 'purchase_price'
            };

            const params = {
                page,
                limit,
                search: debouncedSearch,
                ...(categoryFilter !== 'all' && { category_id: categoryFilter }),
                ...(typeFilter !== 'all' && { type_id: typeFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(sortBy && { sort: sortMap[sortBy] || sortBy }),
                ...(sortOrder && { order: sortOrder })
            };
            const response = await api.get('/assets', { params });
            setAssets(response.data.assets || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalRecords || 0);
        } catch (error) {
            console.error('Error loading assets:', error);
            toast.error('Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = (asset) => {
        setDeleteDialog({ open: true, id: asset.asset_id, name: asset.asset_name });
        setDeleteConfirmValue("");
    };

    const closeDeleteDialog = () => {
        setDeleteDialog({ open: false, id: null, name: "" });
        setDeleteConfirmValue("");
    };

    const handleUndo = async (assetId) => {
        try {
            await api.post(`/assets/${assetId}/restore`);
            toast.success('Asset restored successfully');
            loadAssets();
            loadInitialData();
        } catch (error) {
            toast.error('Failed to restore asset');
        }
    };

    const handleDelete = async () => {
        if (!deleteDialog.id) return;
        const assetId = deleteDialog.id;
        const assetName = deleteDialog.name;
        try {
            await api.delete(`/assets/${assetId}`);
            toast.success(
                <div className="flex items-center justify-between gap-4">
                    <span>Asset "{assetName}" deleted</span>
                    <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => handleUndo(assetId)}
                        className="text-blue-500 font-black uppercase text-[10px] tracking-widest p-0 h-auto hover:text-blue-600"
                    >
                        Undo
                    </Button>
                </div>,
                { autoClose: 5000 }
            );
            closeDeleteDialog();
            loadAssets();
            loadInitialData(); // Refresh stats
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete asset');
        }
    };

    const handleSort = (key) => {
        if (key === 'actions') return;

        if (sortBy === key && sortOrder === "asc") {
            setSortOrder("desc");
        } else if (sortBy === key && sortOrder === "desc") {
            setSortBy(null);
            setSortOrder(null);
        } else {
            setSortBy(key);
            setSortOrder("asc");
        }
    };

    const formatCurrency = (value) => {
        if (!value) return '₹0';
        return `₹${parseFloat(value).toLocaleString('en-IN')}`;
    };

    const breadcrumbItems = [
        { label: 'Assets' }
    ];

    const renderActions = (asset) => (
        <div className="flex items-center justify-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <MoreVertical className="w-4 h-4 text-slate-400 hover:text-blue-600 transition-colors" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-2 dark:bg-slate-900 dark:border-slate-800 rounded-2xl min-w-[160px]">
                    <DropdownMenuItem 
                        onClick={() => navigate(`/${user.username}/dashboard/assets/${asset.asset_id}`)}
                        className="rounded-xl p-3 font-bold text-xs gap-3"
                    >
                        <Eye className="h-4 w-4 text-blue-500" /> View Details
                    </DropdownMenuItem>
                    {hasPermission(PERMISSIONS.ASSETS_UPDATE) && (
                        <DropdownMenuItem 
                            onClick={() => navigate(`/${user.username}/dashboard/assets/${asset.asset_id}/edit`)}
                            className="rounded-xl p-3 font-bold text-xs gap-3"
                        >
                            <Edit className="h-4 w-4 text-emerald-500" /> Edit Asset
                        </DropdownMenuItem>
                    )}
                    {hasPermission(PERMISSIONS.ASSETS_DELETE) && (
                        <DropdownMenuItem 
                            className="rounded-xl p-3 font-bold text-xs gap-3 text-destructive"
                            onClick={() => openDeleteDialog(asset)}
                        >
                            <Trash2 className="h-4 w-4" /> Delete Asset
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0">
            <PageHeader
                title="Asset Management"
                description="Manage and track all company assets and hardware inventory."
                breadcrumbItems={breadcrumbItems}
                actions={
                    <div className="flex gap-3">
                        {hasPermission(PERMISSIONS.ASSETS_MANAGE_CATEGORIES) && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/${user.username}/dashboard/assets/settings`)}
                                className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[1.2rem] px-6 h-14 font-black uppercase tracking-widest text-[11px] transition-all"
                            >
                                <Settings2 className="h-5 w-5 mr-3 text-slate-500" />
                                Settings
                            </Button>
                        )}
                        {hasPermission(PERMISSIONS.ASSETS_CREATE) && (
                            <Button 
                                onClick={() => navigate(`/${user.username}/dashboard/assets/add`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
                            >
                                <Plus className="h-5 w-5 mr-3" />
                                Add Asset
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Premium Stats Grid */}
            <AnimatePresence>
                {stats && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mt-12"
                    >
                        <StatSummaryCard 
                            title="Total Assets" 
                            count={stats.counts?.total || 0} 
                            icon={HardDrive} 
                            color="blue"
                            subtitle="All registered assets"
                        />
                        <StatSummaryCard 
                            title="Active Use" 
                            count={stats.counts?.active || 0} 
                            icon={Package} 
                            color="emerald"
                            subtitle="Used by employees"
                        />
                        <StatSummaryCard 
                            title="Maintenance" 
                            count={stats.counts?.maintenance || 0} 
                            icon={Wrench} 
                            color="amber"
                            subtitle="Under repair"
                        />
                        <StatSummaryCard 
                            title="Expiring Warranty" 
                            count={stats.warranty_expiring?.next_30_days || 0} 
                            icon={AlertTriangle} 
                            color="rose"
                            subtitle="Next 30 Days"
                        />
                        <StatSummaryCard 
                            title="Total Value" 
                            count={formatCurrency(stats.value?.total_value)} 
                            icon={Archive} 
                            color="purple"
                            subtitle="Purchase cost"
                        />
                        <StatSummaryCard 
                            title="Book Value" 
                            count={formatCurrency(stats.depreciation?.current_book_value)} 
                            icon={TrendingDown} 
                            color="cyan"
                            subtitle="Current value"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-8 mt-12">
                {/* Control Bar */}
                <div className="flex flex-col xl:flex-row items-center gap-6">
                    <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
                        <SearchFilterForm
                            search={search}
                            setSearch={setSearch}
                            placeholder="Search by ID, Name, Serial, Model..."
                            className="w-full"
                        />
                        <div className="h-10 w-[1px] bg-gray-100 dark:bg-slate-800 mx-4 hidden md:block" />
                        
                        <div className="hidden md:flex items-center gap-4">
                            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                                <SelectTrigger className="border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 h-10 w-[140px] font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:ring-0">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest">All Categories</SelectItem>
                                    {categories.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)} className="text-xs font-bold uppercase tracking-widest">{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                                <SelectTrigger className="border-none bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 h-10 w-[120px] font-bold text-[10px] uppercase tracking-widest text-slate-500 focus:ring-0">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 dark:border-slate-800">
                                    <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest">All Status</SelectItem>
                                    <SelectItem value="Active" className="text-xs font-bold uppercase tracking-widest">Active</SelectItem>
                                    <SelectItem value="Inactive" className="text-xs font-bold uppercase tracking-widest">Inactive</SelectItem>
                                    <SelectItem value="Maintenance" className="text-xs font-bold uppercase tracking-widest">Maintenance</SelectItem>
                                    <SelectItem value="Retired" className="text-xs font-bold uppercase tracking-widest">Retired</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={loadAssets} 
                                className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-8">
                        <BentoGrid columns={4}>
                            {[...Array(4)].map((_, i) => (
                                <BentoCard key={i} loading size="sm" />
                            ))}
                        </BentoGrid>
                        <div className="h-96 w-full bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 animate-pulse" />
                    </div>
                ) : assets.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <GenericTable
                            headers={headers}
                            data={assets.map((asset) => ({
                                ...asset,
                                asset_info: (
                                    <Link to={`${asset.asset_id}`} className="block">
                                        <div className="flex flex-col min-w-[200px]">
                                            <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight hover:underline">
                                                {asset.asset_name}
                                            </span>
                                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">ID: {asset.asset_id}</span>
                                        </div>
                                    </Link>
                                ),
                                category_info: (
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-2 h-2 rounded-full" 
                                            style={{ backgroundColor: asset.category_color || '#94a3b8' }} 
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {asset.category_name || 'Uncategorized'}
                                        </span>
                                    </div>
                                ),
                                type_name: (
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {asset.type_name || '—'}
                                    </span>
                                ),
                                serial_model: (
                                    <div className="flex flex-col min-w-[140px]">
                                        <span className="text-[11px] font-black font-mono text-slate-700 dark:text-slate-300">
                                            {asset.serial_number || 'NO_SERIAL'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                            {asset.model || 'Generic Model'}
                                        </span>
                                    </div>
                                ),
                                assigned_to_name: (
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                        {asset.assigned_to_name || 'Unassigned'}
                                    </span>
                                ),
                                status: asset.status,
                                value: (
                                    <span className="text-[15px] font-black text-slate-700 dark:text-slate-300 tabular-nums">
                                        {formatCurrency(asset.purchase_price)}
                                    </span>
                                ),
                                actions: renderActions(asset),
                            }))}
                            primaryKey="asset_id"
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={handleSort}
                        />
                        <Pagination
                            currentPage={page}
                            setCurrentPage={setPage}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                        />
                    </motion.div>
                ) : (
                    <div className="py-40 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <HardDrive className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Assets Found</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto mb-8">
                            You haven't added any assets yet. Click the button below to get started.
                        </p>
                        {!debouncedSearch && (
                            <Link to="add">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[11px]">
                                    Add Your First Asset
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => {
                if (!open) closeDeleteDialog();
            }}>
                <DialogContent className="max-w-md dark:bg-slate-950 dark:border-slate-800 rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-rose-500 p-8 flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                            <Trash2 className="w-10 h-10 text-white" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Delete Asset?</DialogTitle>
                            <DialogDescription className="text-rose-100 text-sm font-medium leading-relaxed opacity-90">
                                This will irrevocably remove <span className="font-black text-white underline decoration-2 underline-offset-4">"{deleteDialog.name}"</span> from the inventory. All history and attachments will be lost.
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
                                placeholder={`Type "${deleteDialog.name}" to confirm`}
                                className="h-14 px-5 rounded-2xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 focus:ring-rose-500/20"
                            />
                        </div>
                        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                variant="ghost"
                                onClick={closeDeleteDialog}
                                className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Abort
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={
                                    !deleteDialog.name ||
                                    deleteConfirmValue.trim().toLowerCase() !== deleteDialog.name.trim().toLowerCase()
                                }
                                className="rounded-2xl h-14 flex-1 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 font-black text-[11px] uppercase tracking-widest transition-all"
                            >
                                Confirm Delete
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatSummaryCard({ title, count, icon: Icon, color, subtitle }) {
    const colorVariants = {
        blue: "text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5",
        emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
        amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
        rose: "text-rose-500 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5",
        purple: "text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5",
        cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/5",
    };

    return (
        <div className={cn(
            "p-6 rounded-[2rem] border transition-all duration-300 hover:scale-[1.02] cursor-default bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl",
            colorVariants[color]
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl bg-current")}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{count}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{title}</span>
                <span className="text-[9px] font-bold text-slate-400/60 mt-0.5 whitespace-nowrap">{subtitle}</span>
            </div>
        </div>
    );
}

const TrendingDown = (props) => (
    <svg 
        {...props} 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

export default Assets;
