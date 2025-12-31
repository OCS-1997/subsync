import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Search, Filter, Tag, BookOpen, Eye, Edit, Trash2, MoreVertical, FileText, FolderOpen } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { Label } from "@/components/ui/label.jsx";

export default function ArticleList() {
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const username = location.pathname.split('/')[1] || '';

    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, articleId: null, title: "" });
    const debounceTimeout = useRef();

    // Read tag from URL params on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tagParam = params.get('tag');
        if (tagParam) {
            setSelectedTag(tagParam);
        }
    }, [location.search]);

    // Debounce search
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [search]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/kb/categories');
            setCategories(res.data.categories || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page.toString());
            params.set('limit', '12');
            if (debouncedSearch) params.set('search', debouncedSearch);
            if (selectedCategory) params.set('categoryId', selectedCategory);
            if (selectedTag) params.set('tag', selectedTag);
            if (statusFilter) params.set('status', statusFilter);

            const res = await api.get(`/kb/articles?${params.toString()}`);
            setArticles(res.data.articles || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalRecords(res.data.total || 0);
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch articles');
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, selectedCategory, selectedTag, statusFilter]);

    const handleDelete = async () => {
        if (!deleteDialog.articleId) return;
        try {
            await api.delete(`/kb/articles/${deleteDialog.articleId}`);
            toast.success('Article deleted successfully');
            setDeleteDialog({ open: false, articleId: null, title: "" });
            fetchArticles();
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to delete article');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const extractTags = (tagsJson) => {
        try {
            if (!tagsJson) return [];
            return typeof tagsJson === 'string' ? JSON.parse(tagsJson) : tagsJson;
        } catch {
            return [];
        }
    };

    return (
        <div className="w-full h-full overflow-auto">
            <div className="max-w-[1800px] mx-auto p-6">
                <Breadcrumb items={[{ label: "Knowledge Base" }]} />

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                            Knowledge Base
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Browse and search documentation articles
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES) && (
                            <Button variant="outline" onClick={() => navigate(`/${username}/dashboard/kb/categories`)}>
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Manage Categories
                            </Button>
                        )}
                        {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE) && (
                            <Button onClick={() => navigate(`/${username}/dashboard/kb/new`)} size="lg">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Article
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="lg:col-span-2">
                                <Label className="mb-2 block">Search Articles</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by title or content..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <Label className="mb-2 block">Category</Label>
                                <select
                                    className="w-full border rounded-md h-10 px-3 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={selectedCategory}
                                    onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <Label className="mb-2 block">Status</Label>
                                <select
                                    className="w-full border rounded-md h-10 px-3 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                >
                                    <option value="">All</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Drafts</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(search || selectedCategory || selectedTag || (statusFilter && statusFilter !== 'all')) && (
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                                {search && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: {search}
                                        <button onClick={() => setSearch("")} className="ml-1 hover:text-red-600">×</button>
                                    </Badge>
                                )}
                                {selectedCategory && (
                                    <Badge variant="secondary" className="gap-1">
                                        Category: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                                        <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-600">×</button>
                                    </Badge>
                                )}
                                {selectedTag && (
                                    <Badge variant="secondary" className="gap-1">
                                        Tag: {selectedTag}
                                        <button onClick={() => setSelectedTag("")} className="ml-1 hover:text-red-600">×</button>
                                    </Badge>
                                )}
                                {statusFilter && statusFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        Status: {statusFilter}
                                        <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-red-600">×</button>
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearch("");
                                        setSelectedCategory("");
                                        setSelectedTag("");
                                        setStatusFilter("all");
                                        setPage(1);
                                    }}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Articles Grid */}
                {loading ? (
                    <div className="flex flex-col flex-1 justify-center items-center my-12">
                        <Hamster />
                    </div>
                ) : articles.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {search || selectedCategory ? 'Try adjusting your filters' : 'Create your first article to get started'}
                            </p>
                            {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE) && !search && !selectedCategory && (
                                <Button onClick={() => navigate(`/${username}/dashboard/kb/new`)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Article
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map((article) => {
                                const tags = extractTags(article.tags);
                                return (
                                    <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/${username}/dashboard/kb/${article.id}`)}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {article.is_published ? (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <Eye className="w-3 h-3 mr-1" />
                                                                Published
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="default" className="text-xs">Draft</Badge>
                                                        )}
                                                        {article.category_name && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {article.category_name}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-xl mb-2 hover:text-blue-600 transition-colors">
                                                        {article.title}
                                                    </CardTitle>
                                                </div>
                                                {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/${username}/dashboard/kb/${article.id}`); }}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/${username}/dashboard/kb/${article.id}/edit`); }}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, articleId: article.id, title: article.title }); }}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                                                {article.content ? article.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...' : 'No content'}
                                            </p>

                                            {/* Tags */}
                                            {tags.length > 0 && (
                                                <div className="flex items-center gap-2 flex-wrap mb-3">
                                                    <Tag className="w-3 h-3 text-gray-400" />
                                                    {tags.slice(0, 3).map((tag, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-500 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTag(tag);
                                                                setPage(1);
                                                            }}
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {tags.length > 3 && (
                                                        <span className="text-xs text-gray-500">+{tags.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Meta */}
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t">
                                                <span>By {article.author_name || 'Unknown'}</span>
                                                <span>{formatDate(article.created_at)}</span>
                                            </div>

                                            {article.views > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                                    <Eye className="w-3 h-3" />
                                                    {article.views} views
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-8">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, totalRecords)} of {totalRecords} articles
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm px-3">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Delete Dialog */}
                <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, articleId: null, title: "" })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Article</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "<strong>{deleteDialog.title}</strong>"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, articleId: null, title: "" })}>
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
