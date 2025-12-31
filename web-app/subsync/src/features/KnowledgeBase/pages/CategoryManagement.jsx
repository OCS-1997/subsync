import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Edit, Trash2, FolderOpen, ArrowLeft } from "lucide-react";
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

export default function CategoryManagement() {
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const username = location.pathname.split('/')[1] || '';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
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

    if (!hasPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES)) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-500">You don't have permission to manage categories</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto">
            <div className="max-w-[1200px] mx-auto p-6">
                <Breadcrumb
                    items={[
                        { label: "Knowledge Base", href: `/${username}/dashboard/kb` },
                        { label: "Category Management" }
                    ]}
                />

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <FolderOpen className="w-8 h-8 text-blue-600" />
                            Category Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Organize your knowledge base articles into categories
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => navigate(`/${username}/dashboard/kb`)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Articles
                        </Button>
                        <Button onClick={openCreateDialog}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Category
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center my-12">
                        <Hamster />
                    </div>
                ) : categories.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No categories yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Create your first category to organize articles
                            </p>
                            <Button onClick={openCreateDialog}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Category
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map((category) => (
                            <Card key={category.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                <FolderOpen className="w-5 h-5 text-blue-600" />
                                                {category.name}
                                            </CardTitle>
                                            {category.description && (
                                                <CardDescription className="mt-2">
                                                    {category.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">
                                            {category.article_count || 0} articles
                                        </Badge>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(category)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setDeleteDialog({
                                                    open: true,
                                                    categoryId: category.id,
                                                    name: category.name
                                                })}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create/Edit Dialog */}
                <Dialog open={dialog.open} onOpenChange={(open) => !open && setDialog({ open: false, mode: 'create', category: null })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {dialog.mode === 'create' ? 'Create New Category' : 'Edit Category'}
                            </DialogTitle>
                            <DialogDescription>
                                {dialog.mode === 'create'
                                    ? 'Add a new category to organize your knowledge base articles'
                                    : 'Update category details'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="cat-name">Category Name *</Label>
                                    <Input
                                        id="cat-name"
                                        placeholder="e.g., Troubleshooting"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cat-desc">Description</Label>
                                    <Input
                                        id="cat-desc"
                                        placeholder="Optional description"
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="cat-parent">Parent Category</Label>
                                    <select
                                        id="cat-parent"
                                        className="w-full border rounded-md h-10 px-3 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        value={formData.parent_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                                    >
                                        <option value="">None (Top Level)</option>
                                        {categories.filter(c => c.id !== dialog.category?.id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setDialog({ open: false, mode: 'create', category: null });
                                        setFormData({ name: '', description: '', parent_id: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
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
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Category</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "<strong>{deleteDialog.name}</strong>"?
                                Articles in this category will not be deleted, but will become uncategorized.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialog({ open: false, categoryId: null, name: '' })}
                            >
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
