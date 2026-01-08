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
        <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20">
            <div className="max-w-[1400px] mx-auto p-6 space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                    <Breadcrumb
                        items={[
                            { label: "Knowledge Base", href: `/${username}/dashboard/kb` },
                            { label: "Category Management" }
                        ]}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <FolderOpen className="w-6 h-6 text-white" />
                                </div>
                                Category Management
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                                Organize your knowledge base with {categories.length} categories containing {totalArticles} articles
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/${username}/dashboard/kb`)}
                                className="rounded-xl"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                onClick={openCreateDialog}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Category
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Control Bar */}
                <Card className="border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 w-full md:max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                    className="rounded-lg"
                                >
                                    <Grid3x3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("list")}
                                    className="rounded-lg"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                    : "space-y-4"
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

                {/* Create/Edit Dialog */}
                <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, mode: 'create', category: null })}>
                    <DialogContent className="max-w-lg rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {dialog.mode === 'create' ? (
                                    <>
                                        <Plus className="w-6 h-6 text-blue-600" />
                                        Create New Category
                                    </>
                                ) : (
                                    <>
                                        <Edit className="w-6 h-6 text-amber-600" />
                                        Edit Category
                                    </>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                {dialog.mode === 'create'
                                    ? 'Add a new category to organize your knowledge base articles'
                                    : 'Update category details'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cat-name" className="text-sm font-semibold">
                                        Category Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="cat-name"
                                        placeholder="e.g., Troubleshooting, Getting Started"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cat-desc" className="text-sm font-semibold">Description</Label>
                                    <Input
                                        id="cat-desc"
                                        placeholder="Brief description of this category"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cat-parent" className="text-sm font-semibold">Parent Category</Label>
                                    <select
                                        id="cat-parent"
                                        className="w-full border rounded-xl h-11 px-4 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        value={formData.parent_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                    >
                                        <option value="">None (Top Level)</option>
                                        {categories.filter(c => c.id !== dialog.category?.id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500">Optional: Nest this category under another category</p>
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setDialog({ open: false, mode: 'create', category: null });
                                        setFormData({ name: '', description: '', parent_id: '' });
                                    }}
                                    className="rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                                    {dialog.mode === 'create' ? (
                                        <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Update
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, categoryId: null, name: '' })}>
                    <DialogContent className="max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                Delete Category
                            </DialogTitle>
                            <DialogDescription className="text-base py-2">
                                Are you sure you want to delete <strong className="text-gray-900 dark:text-white">"{deleteDialog.name}"</strong>?
                                <br />
                                <span className="text-amber-600 dark:text-amber-400 font-medium mt-2 block">
                                    ⚠️ Articles in this category will become uncategorized.
                                </span>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialog({ open: false, categoryId: null, name: '' })}
                                className="rounded-xl"
                            >
                                Keep Category
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                className="rounded-xl bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
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
                <Card className="group hover:shadow-lg hover:border-blue-500/50 transition-all duration-300 rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                            {category.description}
                                        </p>
                                    )}
                                    {parentName && (
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                            <ChevronRight className="w-3 h-3" />
                                            <span>Subcategory of {parentName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="outline"
                                    className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    {category.article_count || 0}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        <DropdownMenuItem
                                            onClick={() => navigate(`/${username}/dashboard/kb?category=${category.id}`)}
                                            className="rounded-lg"
                                        >
                                            <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                            View Articles
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onEdit(category)}
                                            className="rounded-lg"
                                        >
                                            <Edit className="mr-2 h-4 w-4 text-amber-500" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => onDelete(category.id, category.name)}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
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
            <Card className="group h-full flex flex-col hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/50 transition-all duration-300 rounded-2xl overflow-hidden relative">
                {/* Accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Folder className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl">
                                <DropdownMenuItem
                                    onClick={() => navigate(`/${username}/dashboard/kb?category=${category.id}`)}
                                    className="rounded-lg"
                                >
                                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                                    View Articles
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onEdit(category)}
                                    className="rounded-lg"
                                >
                                    <Edit className="mr-2 h-4 w-4 text-amber-500" />
                                    Edit Category
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onDelete(category.id, category.name)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mt-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {category.name}
                    </CardTitle>
                    {category.description && (
                        <CardDescription className="line-clamp-2 text-sm">
                            {category.description}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="space-y-3">
                        {parentName && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-2 rounded-lg">
                                <ChevronRight className="w-3 h-3" />
                                <span className="truncate">Subcategory of <strong>{parentName}</strong></span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <Badge
                                variant="outline"
                                className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-sm px-3 py-1"
                            >
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                {category.article_count || 0} {category.article_count === 1 ? 'article' : 'articles'}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/${username}/dashboard/kb?category=${category.id}`)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                View <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
