import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Plus,
    Edit,
    Trash2,
    FolderOpen,
    ArrowLeft,
    Folder,
    FileText,
    Search,
    MoreVertical,
    ChevronRight,
    Grid3x3,
    List
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu.jsx";
import { cn } from "@/lib/utils.js";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function CategoryManagement() {
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const username = location.pathname.split('/')[1] || '';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid"); // grid or list
    const [dialog, setDialog] = useState({ open: false, mode: 'create', category: null });
    const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, categoryId: null, name: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('/kb/categories');
            setCategories(res.data.categories || []);
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            if (dialog.mode === 'create') {
                await api.post('/kb/categories', formData);
                toast.success('Category created successfully');
            } else {
                await api.put(`/kb/categories/${dialog.category.id}`, formData);
                toast.success('Category updated successfully');
            }
            setDialog({ open: false, mode: 'create', category: null });
            setFormData({ name: '', description: '', parent_id: '' });
            fetchCategories();
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to save category');
        }
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            parent_id: category.parent_id || ''
        });
        setDialog({ open: true, mode: 'edit', category });
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/kb/categories/${deleteDialog.categoryId}`);
            toast.success('Category deleted successfully');
            setDeleteDialog({ open: false, categoryId: null, name: '' });
            fetchCategories();
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to delete category');
        }
    };

    const openCreateDialog = () => {
        setFormData({ name: '', description: '', parent_id: '' });
        setDialog({ open: true, mode: 'create', category: null });
    };

    // Filter categories based on search
    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Get parent category name
    const getParentName = (parentId) => {
        if (!parentId) return null;
        const parent = categories.find(c => c.id === parentId);
        return parent?.name;
    };

    // Calculate total articles
    const totalArticles = categories.reduce((sum, cat) => sum + (cat.article_count || 0), 0);

    if (!hasPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES)) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">You don't have permission to manage categories</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-[1600px] mx-auto p-10 space-y-10">
                {/* Header Section */}
                <div className="space-y-6">
                    <Breadcrumb
                        items={[
                            { label: "Knowledge Base", href: `/${username}/dashboard/kb` },
                            { label: "Hierarchy Management" }
                        ]}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black text-slate-900 dark:text-white flex items-center gap-6 tracking-tight">
                                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    <FolderOpen className="w-8 h-8 text-white" />
                                </div>
                                System Hierarchy
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] opacity-80">
                                Cataloging {categories.length} segments governing {totalArticles} documentation assets
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/${username}/dashboard/kb`)}
                                className="rounded-[1.2rem] px-6 h-14 font-black uppercase tracking-widest text-[11px] border-gray-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm"
                            >
                                <ArrowLeft className="w-4 h-4 mr-3" />
                                Return
                            </Button>
                            <Button
                                onClick={openCreateDialog}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
                            >
                                <Plus className="w-5 h-5 mr-3" />
                                Inject Segment
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Control Bar */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="relative flex-1 w-full lg:max-w-xl group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-all font-black" />
                            <Input
                                placeholder="Search indexing structures..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl border border-gray-100 dark:border-slate-800">
                            <Button
                                variant={viewMode === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className={cn(
                                    "rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest transition-all",
                                    viewMode === "grid" ? "bg-blue-600 text-white shadow-md" : "text-slate-400"
                                )}
                            >
                                <Grid3x3 className="w-4 h-4 mr-2" />
                                Matrix
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className={cn(
                                    "rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest transition-all",
                                    viewMode === "list" ? "bg-blue-600 text-white shadow-md" : "text-slate-400"
                                )}
                            >
                                <List className="w-4 h-4 mr-2" />
                                Index
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Categories Display */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <Hamster />
                            <p className="mt-4 text-sm text-gray-500 animate-pulse">Loading categories...</p>
                        </motion.div>
                    ) : filteredCategories.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
                                <CardContent className="p-12 text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FolderOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                                        {searchQuery ? "No categories found" : "No categories yet"}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                        {searchQuery
                                            ? `No categories match "${searchQuery}". Try a different search term.`
                                            : "Create your first category to organize your knowledge base articles"}
                                    </p>
                                    {!searchQuery && (
                                        <Button onClick={openCreateDialog} className="rounded-xl">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Category
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="grid"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className={cn(
                                viewMode === "grid"
                                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                                    : "space-y-6"
                            )}
                        >
                            {filteredCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    viewMode={viewMode}
                                    onEdit={handleEdit}
                                    onDelete={(id, name) => setDeleteDialog({ open: true, categoryId: id, name })}
                                    getParentName={getParentName}
                                    navigate={navigate}
                                    username={username}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create/Edit Dialog - Premium Styled */}
                <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, mode: 'create', category: null })}>
                    <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
                        <div className="p-10 bg-blue-600">
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        {dialog.mode === 'create' ? <Plus className="w-7 h-7" /> : <Edit className="w-7 h-7" />}
                                    </div>
                                    {dialog.mode === 'create' ? 'Define Segment' : 'Update Index'}
                                </DialogTitle>
                                <DialogDescription className="text-blue-100 text-[11px] font-black uppercase tracking-widest opacity-80 mt-2">
                                    Configuring structural parameters for the indexing engine
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white dark:bg-slate-900">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <Label htmlFor="cat-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Segment Designation <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="cat-name"
                                        placeholder="e.g., PROTOCOL_ZERO, ARCHITECTURE_LOGS"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label htmlFor="cat-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Functional Description</Label>
                                    <Input
                                        id="cat-desc"
                                        placeholder="Briefly state the indexing scope..."
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label htmlFor="cat-parent" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hierarchical Parent</Label>
                                    <div className="relative">
                                        <select
                                            id="cat-parent"
                                            className="w-full h-14 appearance-none rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-6 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                                            value={formData.parent_id}
                                            onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                        >
                                            <option value="">Root Level Architecture</option>
                                            {categories.filter(c => c.id !== dialog.category?.id).map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setDialog({ open: false, mode: 'create', category: null });
                                        setFormData({ name: '', description: '', parent_id: '' });
                                    }}
                                    className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Dismiss
                                </Button>
                                <Button type="submit" className="rounded-2xl bg-blue-600 hover:bg-blue-700 h-14 flex-1 font-black text-[11px] uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                    {dialog.mode === 'create' ? 'Initialize' : 'Update Record'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog - Premium Styled */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, categoryId: null, name: '' })}>
                    <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
                        <div className="p-10 bg-red-600">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 scale-animate">
                                <Trash2 className="w-10 h-10 text-white" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">Purge Segment?</DialogTitle>
                                <DialogDescription className="text-red-100 text-sm font-medium leading-relaxed opacity-90">
                                    Irrevocably removing <span className="font-black text-white underline decoration-2 underline-offset-4">"{deleteDialog.name}"</span>.
                                    <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/80">
                                        Affected articles will be re-indexed as uncategorized orphans.
                                    </div>
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <DialogFooter className="p-10 pt-0 flex-col sm:flex-row gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteDialog({ open: false, categoryId: null, name: '' })}
                                className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                            >
                                Negative
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="bg-white text-red-600 hover:bg-red-50 rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                            >
                                Execute Purge
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

// Category Card Component
function CategoryCard({ category, viewMode, onEdit, onDelete, getParentName, navigate, username }) {
    const parentName = getParentName(category.parent_id);

    if (viewMode === "list") {
        return (
            <motion.div variants={itemVariants}>
                <Card className="group hover:shadow-2xl hover:border-blue-500/20 transition-all duration-500 rounded-[2rem] overflow-hidden border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <CardContent className="p-8">
                        <div className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-slate-800 shadow-sm">
                                    <Folder className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate tracking-tight">
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-sm font-bold text-slate-400 truncate opacity-80 uppercase tracking-widest">
                                            {category.description}
                                        </p>
                                    )}
                                    {parentName && (
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-950 px-3 py-1 rounded-full w-fit">
                                            <ChevronRight className="w-3 h-3" />
                                            <span>Primary: {parentName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <Badge
                                    variant="outline"
                                    className="bg-blue-600 dark:bg-blue-600 border-none text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20"
                                >
                                    {category.article_count || 0} Assets
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-12 w-12 p-0 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                            <MoreVertical className="h-6 w-6 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                                        <DropdownMenuItem
                                            onClick={() => navigate(`/${username}/dashboard/kb?category=${category.id}`)}
                                            className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                        >
                                            <FileText className="mr-3 h-4 w-4 text-blue-500" />
                                            Sweep Assets
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onEdit(category)}
                                            className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                        >
                                            <Edit className="mr-3 h-4 w-4 text-amber-500" />
                                            Adjust Structure
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800 my-1" />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(category.id, category.name)}
                                            className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                        >
                                            <Trash2 className="mr-3 h-4 w-4" />
                                            Purge
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div variants={itemVariants}>
            <Card className="group h-full flex flex-col hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden relative border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 opacity-60 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]" />

                <CardHeader className="pb-4 pt-10 px-10">
                    <div className="flex items-start justify-between gap-6">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-3xl flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-slate-800 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <Folder className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <MoreVertical className="h-5 w-5 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                                <DropdownMenuItem
                                    onClick={() => navigate(`/${username}/dashboard/kb?category=${category.id}`)}
                                    className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                >
                                    <FileText className="mr-3 h-4 w-4 text-blue-500" />
                                    Sweep Assets
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onEdit(category)}
                                    className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                >
                                    <Edit className="mr-3 h-4 w-4 text-amber-500" />
                                    Adjust Structure
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800 my-1" />
                                <DropdownMenuItem
                                    onClick={() => onDelete(category.id, category.name)}
                                    className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                >
                                    <Trash2 className="mr-3 h-4 w-4" />
                                    Purge
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-white mt-8 mb-2 line-clamp-2 leading-[1.1] tracking-tight group-hover:text-blue-600 transition-colors">
                        {category.name}
                    </CardTitle>
                    {category.description && (
                        <CardDescription className="line-clamp-2 text-xs font-bold text-slate-400 uppercase tracking-widest opacity-80 italic">
                            {category.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end px-10 pb-10">
                    <div className="space-y-6">
                        {parentName && (
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-950 px-4 py-3 rounded-2xl border border-gray-100 dark:border-slate-800">
                                <ChevronRight className="w-3.5 h-3.5" />
                                <span className="truncate">Inherited From <strong>{parentName}</strong></span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800 group-hover:border-blue-500/20 transition-all">
                            <Badge
                                variant="outline"
                                className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20"
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" />
                                {category.article_count || 0}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/${username}/dashboard/kb?category=${category.id}`)}
                                className="h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-600 hover:text-white hover:bg-blue-600 transition-all group/btn"
                            >
                                Sweep <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
