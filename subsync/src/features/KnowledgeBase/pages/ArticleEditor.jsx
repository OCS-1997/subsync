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
import ImageUploader from "../components/ImageUploader.jsx";
import ImageGallery from "../components/ImageGallery.jsx";

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

    const [images, setImages] = useState([]);

    useEffect(() => {
        //console.log('ArticleEditor - ID:', id, 'isEditMode:', isEditMode);
        fetchCategories();
        if (isEditMode) {
            fetchArticle();
            fetchImages();
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

    const fetchImages = async () => {
        try {
            const res = await api.get(`/kb/articles/${id}/images`);
            //console.log('Fetched images response:', res.data);
            //console.log('Images array:', res.data.images);
            setImages(res.data.images || []);
        } catch (error) {
            console.error('Failed to fetch images:', error);
        }
    };

    const handleDeleteImage = async (imageId) => {
        try {
            await api.delete(`/kb/articles/${id}/images/${imageId}`);
            await fetchImages();
        } catch (error) {
            toast.error('Failed to delete image');
        }
    };

    const handleSetFeatured = async (imageId) => {
        try {
            await api.put(`/kb/articles/${id}/images/${imageId}/featured`);
            await fetchImages();
        } catch (error) {
            toast.error('Failed to set featured image');
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
                <div className="w-16 h-16">
                    <Hamster />
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0">
            <div className="mb-6">
                <Breadcrumb
                    items={[
                        { label: "Knowledge Base", href: `/${username}/dashboard/kb` },
                        { label: isEditMode ? "Edit Article" : "New Article" }
                    ]}
                />
                <div className="flex items-center justify-between mt-2">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isEditMode ? 'Edit Article' : 'New Article'}
                    </h1>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(`/${username}/dashboard/kb`)}
                        className="rounded-xl font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Title */}
                        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                    Article Metadata
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Choose a clear, descriptive title</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <Input
                                    placeholder="e.g., How to Reset Your Password"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="text-2xl font-black h-16 rounded-2xl bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-inner px-6 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-slate-700"
                                    required
                                />
                            </CardContent>
                        </Card>

                        {/* Content with Rich Text Editor */}
                        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                                    Body Content
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Use the toolbar to format your documentation</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8 p-0">
                                <div className="px-8 pb-8">
                                    <RichTextEditor
                                        value={formData.content}
                                        onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                        placeholder="Write your article content here..."
                                        articleId={id}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Image Attachments - Only show in edit mode */}
                        {isEditMode && (
                            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                                <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                                        Visual Assets
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">Upload and manage images for this article</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-8 space-y-6">
                                    <div className="bg-gray-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-gray-100 dark:border-white/5">
                                        <ImageUploader
                                            articleId={id}
                                            onUploadComplete={fetchImages}
                                            maxFiles={10}
                                        />
                                    </div>
                                    <ImageGallery
                                        images={images}
                                        onDelete={handleDeleteImage}
                                        onSetFeatured={handleSetFeatured}
                                        editable={true}
                                    />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Quick Controls */}
                        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    Publishing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/50 transition-all hover:border-blue-500/30">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="is_published" className="text-xs font-black uppercase tracking-widest cursor-pointer text-gray-700 dark:text-slate-300">
                                            Live Status
                                        </Label>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            {formData.is_published ? 'Publicly Visible' : 'Draft Mode'}
                                        </p>
                                    </div>
                                    <Switch
                                        id="is_published"
                                        checked={formData.is_published}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-black uppercase tracking-widest text-[11px] text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all" disabled={saving}>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? 'Processing...' : (isEditMode ? 'Update Article' : 'Launch Article')}
                                    </Button>

                                    {isEditMode && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[11px] border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-95 transition-all"
                                            onClick={() => navigate(`/${username}/dashboard/kb/${id}`)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Content
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Taxonomy */}
                        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
                                    Categorization
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Article Folder / Category</Label>
                                    <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isCategoryPopoverOpen}
                                                className="w-full justify-between h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                            >
                                                {formData.category_id
                                                    ? categories.find((cat) => cat.id.toString() === formData.category_id.toString())?.name
                                                    : "Search categories..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                            <Command className="dark:bg-slate-900">
                                                <CommandInput placeholder="Search..." className="font-bold border-none focus:ring-0 h-11" />
                                                <CommandList className="max-h-64 overflow-auto p-2 scrollbar-thin">
                                                    <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No results</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="none"
                                                            onSelect={() => {
                                                                setFormData(prev => ({ ...prev, category_id: "" }));
                                                                setIsCategoryPopoverOpen(false);
                                                            }}
                                                            className="rounded-lg mb-1 data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-400 cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.category_id === "" ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <span className="font-bold text-xs uppercase tracking-widest">Uncategorized</span>
                                                        </CommandItem>
                                                        {categories.map((cat) => (
                                                            <CommandItem
                                                                key={cat.id}
                                                                value={cat.name}
                                                                onSelect={() => {
                                                                    setFormData(prev => ({ ...prev, category_id: cat.id.toString() }));
                                                                    setIsCategoryPopoverOpen(false);
                                                                }}
                                                                className="rounded-lg mb-1 data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-400 cursor-pointer"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        formData.category_id.toString() === cat.id.toString() ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <span className="font-bold text-sm">{cat.name}</span>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCategoryDialog(true)}
                                    className="w-full h-11 rounded-xl border-dashed border-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold text-xs uppercase tracking-widest"
                                >
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    New Collection
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Visibility & Access */}
                        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-pink-600 dark:text-pink-400">
                                    Access Control
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Visibility Scope</Label>
                                    <select
                                        className="w-full h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-pink-500/20 appearance-none"
                                        value={formData.visibility}
                                        onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                                    >
                                        <option value="internal" className="dark:bg-slate-950">Staff Vault (Internal)</option>
                                        <option value="customer" className="dark:bg-slate-950">Client Portal (Public)</option>
                                        <option value="both" className="dark:bg-slate-950">Hybrid Access (Universal)</option>
                                    </select>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-relaxed">
                                        {formData.visibility === 'internal'
                                            ? '🔒 Restricted to authorized employees only.'
                                            : '🌐 Accessible to clients via public documentation links.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Search Optimization */}
                        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
                                    Discoverability
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1 block">Index Tags</Label>
                                    <TagInput
                                        tags={formData.tags}
                                        onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </form>

            {/* Premium Styled Dialogs */}
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
                    <div className="p-8 bg-blue-600">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-white">Create Category</DialogTitle>
                            <DialogDescription className="text-blue-100 font-medium text-sm">
                                Define a new organizational bucket for your knowledge assets.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Identity Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="cat-name"
                                placeholder="e.g., Troubleshooting Protocols"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                                className="h-11 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-desc" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Internal Description</Label>
                            <Input
                                id="cat-desc"
                                placeholder="Describe use-case for this category..."
                                value={newCategory.description}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                className="h-11 rounded-xl bg-gray-50 dark:bg-slate-950 border-gray-100 dark:border-slate-800 font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-8 pt-0 gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowCategoryDialog(false);
                                setNewCategory({ name: '', description: '' });
                            }}
                            className="rounded-xl h-11 font-bold text-gray-500"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={handleCreateCategory}
                            className="bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-black uppercase tracking-widest text-[10px] text-white px-8"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Initialize Collection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
