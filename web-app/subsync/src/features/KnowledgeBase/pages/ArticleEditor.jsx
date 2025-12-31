import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Save, Eye, Plus, FolderPlus, Check, ChevronsUpDown } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";
import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { RichTextEditor } from "@/components/ui/rich-text-editor.jsx";
import { TagInput } from "@/components/ui/tag-input.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command.jsx";
import { cn } from "@/lib/utils.js";

export default function ArticleEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const username = location.pathname.split('/')[1] || '';
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category_id: "",
        is_published: false,
        visibility: "internal",
        tags: []
    });

    useEffect(() => {
        fetchCategories();
        if (isEditMode) {
            fetchArticle();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/kb/categories');
            setCategories(res.data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/kb/articles/${id}`);
            const article = res.data.article;

            // Parse tags
            let tags = [];
            try {
                tags = article.tags ? (typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags) : [];
            } catch (e) {
                console.error('Failed to parse tags:', e);
            }

            setFormData({
                title: article.title || "",
                content: article.content || "",
                category_id: article.category_id || "",
                is_published: !!article.is_published,
                visibility: article.visibility || "internal",
                tags: tags || []
            });
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch article');
            navigate(`/${username}/dashboard/kb`);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        try {
            const res = await api.post('/kb/categories', newCategory);
            toast.success('Category created successfully');
            setShowCategoryDialog(false);
            setNewCategory({ name: '', description: '' });
            await fetchCategories();
            setFormData(prev => ({ ...prev, category_id: res.data.id }));
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to create category');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...formData,
                category_id: formData.category_id || null
            };

            if (isEditMode) {
                await api.put(`/kb/articles/${id}`, payload);
                toast.success('Article updated successfully');
            } else {
                const res = await api.post('/kb/articles', payload);
                toast.success('Article created successfully');
                navigate(`/${username}/dashboard/kb/${res.data.id}`);
            }
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to save article');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <Hamster />
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto">
            <div className="max-w-[1400px] mx-auto p-6">
                <Breadcrumb
                    items={[
                        { label: "Knowledge Base", href: `/${username}/dashboard/kb` },
                        { label: isEditMode ? "Edit Article" : "New Article" }
                    ]}
                />

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">
                        {isEditMode ? 'Edit Article' : 'Create New Article'}
                    </h1>
                    <Button variant="ghost" onClick={() => navigate(`/${username}/dashboard/kb`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Title */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Article Title</CardTitle>
                                    <CardDescription>Choose a clear, descriptive title</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Input
                                        placeholder="e.g., How to Reset Your Password"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        className="text-2xl font-semibold h-14"
                                        required
                                    />
                                </CardContent>
                            </Card>

                            {/* Content with Rich Text Editor */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content</CardTitle>
                                    <CardDescription>Use the toolbar to format your content</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                        placeholder="Write your article content here..."
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Visibility Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Article Visibility</CardTitle>
                                    <CardDescription>Determine who can access this article</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <select
                                        className="w-full border rounded-md h-10 px-3 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        value={formData.visibility}
                                        onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                                    >
                                        <option value="internal">Internal Only (Staff Only)</option>
                                        <option value="customer">Customer Only (Public Link)</option>
                                        <option value="both">Both (Staff & Public)</option>
                                    </select>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        {formData.visibility === 'internal'
                                            ? '🔒 Only authenticated staff can view this document.'
                                            : '🌐 Anyone with the link can view this document if published.'}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Publish Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Publishing</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="is_published" className="cursor-pointer">
                                            Live Status
                                        </Label>
                                        <Switch
                                            id="is_published"
                                            checked={formData.is_published}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {formData.is_published
                                            ? '✅ This article is live and accessible.'
                                            : '📝 This article is saved as a draft (Staff only).'}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Category */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Category</CardTitle>
                                    <CardDescription>Organize your articles</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isCategoryPopoverOpen}
                                                className="w-full justify-between font-normal h-10 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                            >
                                                {formData.category_id
                                                    ? categories.find((cat) => cat.id.toString() === formData.category_id.toString())?.name
                                                    : "Select category..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search categories..." />
                                                <CommandList>
                                                    <CommandEmpty>No category found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="none"
                                                            onSelect={() => {
                                                                setFormData(prev => ({ ...prev, category_id: "" }));
                                                                setIsCategoryPopoverOpen(false);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.category_id === "" ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            No Category
                                                        </CommandItem>
                                                        {categories.map((cat) => (
                                                            <CommandItem
                                                                key={cat.id}
                                                                value={cat.name}
                                                                onSelect={() => {
                                                                    setFormData(prev => ({ ...prev, category_id: cat.id.toString() }));
                                                                    setIsCategoryPopoverOpen(false);
                                                                }}
                                                                className="cursor-pointer"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.category_id.toString() === cat.id.toString() ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {cat.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowCategoryDialog(true)}
                                        className="w-full border-dashed border-2 hover:border-blue-500 hover:text-blue-500 transition-all"
                                    >
                                        <FolderPlus className="w-4 h-4 mr-2" />
                                        Create New Category
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Tags with Enhanced Input */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tags</CardTitle>
                                    <CardDescription>Help users find this article</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TagInput
                                        tags={formData.tags}
                                        onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                                    />
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-6 space-y-3">
                                    <Button type="submit" className="w-full" disabled={saving}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Saving...' : (isEditMode ? 'Update Article' : 'Create Article')}
                                    </Button>

                                    {isEditMode && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => navigate(`/${username}/dashboard/kb/${id}`)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Article
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* Create Category Dialog */}
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Category</DialogTitle>
                            <DialogDescription>
                                Add a new category to organize your knowledge base articles
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="cat-name">Category Name *</Label>
                                <Input
                                    id="cat-name"
                                    placeholder="e.g., Troubleshooting"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="cat-desc">Description</Label>
                                <Input
                                    id="cat-desc"
                                    placeholder="Optional description"
                                    value={newCategory.description}
                                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setShowCategoryDialog(false);
                                setNewCategory({ name: '', description: '' });
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateCategory}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Category
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
