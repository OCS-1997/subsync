import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, Search, Eye, Edit, Trash2, MoreVertical, FolderOpen, BookOpen } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import CategorySidebar from "../components/CategorySidebar.jsx";
import AdvancedFilters from "../components/AdvancedFilters.jsx";
import TagFilter from "../components/TagFilter.jsx";

export default function ArticleListRefactored() {
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const username = location.pathname.split('/')[1] || '';

    // State
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('category') || null);
    const [selectedTags, setSelectedTags] = useState(() => {
        const tags = searchParams.get('tags');
        return tags ? tags.split(',') : [];
    });
    const [advancedFilters, setAdvancedFilters] = useState({
        status: searchParams.get('status') || 'all',
        visibility: searchParams.get('visibility') || 'all',
        createdBy: searchParams.get('createdBy') || 'all',
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || '',
        hasLinkedDCR: searchParams.get('hasLinkedDCR') || 'all'
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, articleId: null, title: "" });
    const [users, setUsers] = useState([]);

    // Fetch articles when filters change
    useEffect(() => {
        fetchArticles();
        updateURLParams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategoryId, selectedTags, advancedFilters, search, page]);

    // Fetch users for filter
    useEffect(() => {
        fetchUsers();
    }, []);

    const updateURLParams = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedCategoryId) params.set('category', selectedCategoryId);
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
        if (advancedFilters.status !== 'all') params.set('status', advancedFilters.status);
        if (advancedFilters.visibility !== 'all') params.set('visibility', advancedFilters.visibility);
        if (advancedFilters.createdBy) params.set('createdBy', advancedFilters.createdBy);
        if (advancedFilters.dateFrom) params.set('dateFrom', advancedFilters.dateFrom);
        if (advancedFilters.dateTo) params.set('dateTo', advancedFilters.dateTo);
        if (advancedFilters.hasLinkedDCR !== 'all') params.set('hasLinkedDCR', advancedFilters.hasLinkedDCR);

        setSearchParams(params, { replace: true });
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data.users || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (search) params.append('search', search);
            if (selectedCategoryId) params.append('category_id', selectedCategoryId);
            if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
            if (advancedFilters.status !== 'all') params.append('status', advancedFilters.status);
            if (advancedFilters.visibility !== 'all') params.append('visibility', advancedFilters.visibility);
            if (advancedFilters.createdBy && advancedFilters.createdBy !== 'all') params.append('author', advancedFilters.createdBy);
            if (advancedFilters.dateFrom) params.append('date_from', advancedFilters.dateFrom);
            if (advancedFilters.dateTo) params.append('date_to', advancedFilters.dateTo);
            if (advancedFilters.hasLinkedDCR === 'yes') params.append('has_dcr', 'true');
            if (advancedFilters.hasLinkedDCR === 'no') params.append('has_dcr', 'false');
            params.append('page', page);
            params.append('limit', 20);

            const res = await api.get(`/kb/articles?${params.toString()}`);
            setArticles(res.data.articles || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalRecords(res.data.totalRecords || 0);
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/kb/articles/${deleteDialog.articleId}`);
            toast.success('Article deleted successfully');
            setDeleteDialog({ open: false, articleId: null, title: "" });
            fetchArticles();
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to delete article');
        }
    };

    const extractTags = (tagsJson) => {
        try {
            if (!tagsJson) return [];
            return typeof tagsJson === 'string' ? JSON.parse(tagsJson) : tagsJson;
        } catch {
            return [];
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getCategoryName = () => {
        // This would need to be fetched from categories state
        return selectedCategoryId ? "Selected Category" : "All Articles";
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left Sidebar - Categories */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Knowledge Base
                    </h2>
                </div>
                <CategorySidebar
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={(categoryId) => {
                        setSelectedCategoryId(categoryId);
                        setPage(1);
                    }}
                    className="p-4"
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-[1400px] mx-auto p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                {selectedCategoryId ? (
                                    <FolderOpen className="w-6 h-6 text-blue-600" />
                                ) : (
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                )}
                                {getCategoryName()}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {totalRecords} {totalRecords === 1 ? 'article' : 'articles'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES) && (
                                <Button variant="outline" size="sm" onClick={() => navigate(`/${username}/dashboard/kb/categories`)}>
                                    <FolderOpen className="w-4 h-4 mr-2" />
                                    Categories
                                </Button>
                            )}
                            {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE) && (
                                <Button size="sm" onClick={() => navigate(`/${username}/dashboard/kb/new`)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Article
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Search and Filters Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                type="text"
                                placeholder="Search articles..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-9 h-9 text-sm"
                            />
                        </div>

                        {/* Tag Filter */}
                        <div className="lg:col-span-2">
                            <TagFilter
                                selectedTags={selectedTags}
                                onTagsChange={(tags) => {
                                    setSelectedTags(tags);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    <div className="mb-4">
                        <AdvancedFilters
                            filters={advancedFilters}
                            onFiltersChange={(filters) => {
                                setAdvancedFilters(filters);
                                setPage(1);
                            }}
                            users={users}
                        />
                    </div>

                    {/* Articles Grid */}
                    {loading ? (
                        <div className="flex flex-col flex-1 justify-center items-center my-12">
                            <Hamster />
                        </div>
                    ) : articles.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    {selectedCategoryId ? 'No articles in this category' : 'No articles found'}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                                    {selectedCategoryId
                                        ? 'This category is empty. Create your first article to get started.'
                                        : 'No articles match your current filters. Try adjusting your search criteria.'}
                                </p>
                                {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE) && (
                                    <Button onClick={() => navigate(`/${username}/dashboard/kb/new`)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Article
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {articles.map((article) => {
                                const tags = extractTags(article.tags);
                                return (
                                    <Card
                                        key={article.id}
                                        className="hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/${username}/dashboard/kb/${article.id}`)}
                                    >
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

                                            {tags.length > 0 && (
                                                <div className="flex items-center gap-2 flex-wrap mb-3">
                                                    {tags.slice(0, 3).map((tag, idx) => (
                                                        <Badge
                                                            key={idx}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {tags.length > 3 && (
                                                        <span className="text-xs text-gray-500">+{tags.length - 3} more</span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t">
                                                <span>By {article.author_name || 'Unknown'}</span>
                                                <span>{formatDate(article.created_at)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}

                    {/* Delete Dialog */}
                    <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
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
        </div>
    );
}
