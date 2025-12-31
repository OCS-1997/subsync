import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
    Search,
    Plus,
    BookOpen,
    FolderOpen,
    Eye,
    Edit,
    Trash2,
    MoreVertical,
    Filter,
    X,
    ChevronRight,
    ChevronLeft,
    Calendar,
    User,
    Clock,
    Globe,
    Tag as TagIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog.jsx";

// Import the components we built earlier
import CategorySidebar from "../components/CategorySidebar.jsx";
import AdvancedFilters from "../components/AdvancedFilters.jsx";
import TagFilter from "../components/TagFilter.jsx";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function ArticleList() {
    const { hasPermission } = usePermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const username = location.pathname.split('/')[1] || '';

    // State from URL or defaults
    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
    const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('category') || null);
    const [selectedTags, setSelectedTags] = useState(searchParams.get('tags')?.split(',').filter(Boolean) || []);

    const [advancedFilters, setAdvancedFilters] = useState({
        status: searchParams.get('status') || 'all',
        visibility: searchParams.get('visibility') || 'all',
        createdBy: searchParams.get('createdBy') || 'all',
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || '',
        hasLinkedDCR: searchParams.get('hasLinkedDCR') || 'all'
    });

    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, articleId: null, title: "" });
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    // Synchronization: State to URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedCategoryId) params.set('category', selectedCategoryId);
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
        if (page > 1) params.set('page', page);

        // Advanced filters
        Object.entries(advancedFilters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.set(key, value);
            }
        });

        setSearchParams(params, { replace: true });
    }, [search, selectedCategoryId, selectedTags, advancedFilters, page, setSearchParams]);

    // Data Fetching
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
            params.append('limit', 12);

            const res = await api.get(`/kb/articles?${params.toString()}`);
            setArticles(res.data.articles || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalRecords(res.data.totalRecords || res.data.total || 0);
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch articles');
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [catRes, userRes] = await Promise.all([
                api.get('/kb/categories'),
                api.get('/users').catch(() => ({ data: { users: [] } }))
            ]);
            setCategories(catRes.data.categories || []);
            setUsers(userRes.data.users || []);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, selectedCategoryId, selectedTags, advancedFilters]);

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

    const getCategoryName = () => {
        if (!selectedCategoryId) return "All Articles";
        const cat = categories.find(c => c.id.toString() === selectedCategoryId.toString());
        return cat ? cat.name : "Category";
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

    const breadcrumbItems = useMemo(() => {
        const items = [{
            label: "Knowledge Base",
            href: selectedCategoryId ? `/${username}/dashboard/kb` : undefined
        }];
        if (selectedCategoryId) {
            items.push({ label: getCategoryName() });
        }
        return items;
    }, [selectedCategoryId, categories, username]);

    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden">
            {/* Sidebar - Fixed on desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarCollapsed ? 80 : 320 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden md:flex flex-col h-full bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-gray-800 shadow-sm z-30 relative group"
            >
                {/* Collapse Toggle Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-20 h-6 w-6 rounded-full p-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800 shadow-sm z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </Button>

                <div className={cn(
                    "p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between overflow-hidden transition-all duration-300",
                    isSidebarCollapsed ? "p-4 justify-center" : "p-6"
                )}>
                    {!isSidebarCollapsed && (
                        <motion.h2
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xl font-bold text-[#1e293b] dark:text-white flex items-center gap-2 whitespace-nowrap"
                        >
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            Knowledge
                        </motion.h2>
                    )}
                    {isSidebarCollapsed && <BookOpen className="w-6 h-6 text-blue-600 shrink-0" />}

                    {!isSidebarCollapsed && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/${username}/dashboard/kb/categories`)}
                            className="h-8 w-8 p-0"
                            title="Manage Categories"
                        >
                            <FolderOpen className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                    <CategorySidebar
                        isCollapsed={isSidebarCollapsed}
                        selectedCategoryId={selectedCategoryId}
                        onCategorySelect={(id) => {
                            setSelectedCategoryId(id);
                            setPage(1);
                        }}
                        className="pb-20"
                    />
                </div>
            </motion.aside>

            {/* Mobile Sidebar (Always narrow or different logic, but for simplicity let's keep it desktop only toggle for now) */}
            <aside className="md:hidden w-full bg-white dark:bg-[#1e293b] border-b border-gray-200 dark:border-gray-800 p-4">
                <CategorySidebar
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={(id) => {
                        setSelectedCategoryId(id);
                        setPage(1);
                    }}
                />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#0f172a]">
                {/* Header / Breadcrumb - High-end look */}
                <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <Breadcrumb items={breadcrumbItems} className="mb-1" />
                            <h1 className="text-2xl font-extrabold text-[#1e293b] dark:text-white flex items-center gap-2">
                                {getCategoryName()}
                                <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                    {totalRecords}
                                </Badge>
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE) && (
                                <Button
                                    size="sm"
                                    onClick={() => navigate(`/${username}/dashboard/kb/new`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Article
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    <div className="max-w-[1400px] mx-auto space-y-6">
                        {/* Control Bar: Search & Tags Combined */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                            <div className="lg:col-span-4 relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Search in documentation..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    className="pl-10 h-11 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>
                            <div className="lg:col-span-8">
                                <TagFilter
                                    selectedTags={selectedTags}
                                    onTagsChange={(tags) => { setSelectedTags(tags); setPage(1); }}
                                />
                            </div>
                        </div>

                        {/* Advanced Filters - Minimalist expandable */}
                        <AdvancedFilters
                            filters={advancedFilters}
                            onFiltersChange={(filters) => { setAdvancedFilters(filters); setPage(1); }}
                            users={users}
                        />

                        {/* Articles Grid */}
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
                                    <p className="mt-4 text-sm text-gray-500 animate-pulse">Scanning knowledge base...</p>
                                </motion.div>
                            ) : articles.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="py-20 flex flex-col items-center justify-center text-center bg-gray-50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800"
                                >
                                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg mb-4">
                                        <BookOpen className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">No results found</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                                        We couldn't find any articles matching your search or filters.
                                        Try adjusting your criteria or explore other categories.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch("");
                                            setSelectedTags([]);
                                            setAdvancedFilters({
                                                status: 'all', visibility: 'all', createdBy: 'all',
                                                dateFrom: '', dateTo: '', hasLinkedDCR: 'all'
                                            });
                                        }}
                                        className="rounded-full px-6"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Reset All Filters
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="grid"
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {articles.map((article) => (
                                        <ArticleCard
                                            key={article.id}
                                            article={article}
                                            username={username}
                                            navigate={navigate}
                                            hasPermission={hasPermission}
                                            onDelete={() => setDeleteDialog({ open: true, articleId: article.id, title: article.title })}
                                            extractTags={extractTags}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination - Modern minimalist */}
                        {!loading && articles.length > 0 && totalPages > 1 && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 border-t border-gray-200 dark:border-gray-800">
                                <p className="text-sm font-medium text-gray-500">
                                    Showing <span className="text-gray-900 dark:text-white">{((page - 1) * 12) + 1}</span> to <span className="text-gray-900 dark:text-white">{Math.min(page * 12, totalRecords)}</span> of <span className="text-blue-600 font-bold">{totalRecords}</span> articles
                                </p>
                                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="h-10 px-4 rounded-lg font-bold disabled:opacity-30"
                                    >
                                        Prev
                                    </Button>
                                    <div className="flex items-center px-4 h-10 bg-white dark:bg-gray-700 rounded-lg text-sm font-bold text-blue-600 shadow-sm border border-gray-200 dark:border-gray-600">
                                        {page} / {totalPages}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="h-10 px-4 rounded-lg font-bold disabled:opacity-30"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="h-20" /> {/* Extra padding for better scroll feel */}
                    </div>
                </div>
            </main>

            {/* Delete Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, articleId: null, title: "" })}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="text-base py-4">
                            Are you sure you want to delete the article
                            <span className="block font-bold text-gray-900 dark:text-white mt-1">"{deleteDialog.title}"</span>
                            This action is permanent and will remove all version history.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 font-medium">
                        <Button variant="outline" onClick={() => setDeleteDialog({ open: false, articleId: null, title: "" })} className="rounded-xl">
                            Keep Article
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className="bg-red-600 rounded-xl px-6">
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-component for better organization and Framer Motion stagger
function ArticleCard({ article, username, navigate, hasPermission, onDelete, extractTags, formatDate }) {
    const tags = extractTags(article.tags);

    return (
        <motion.div variants={itemVariants}>
            <Card
                className="group h-full flex flex-col overflow-hidden border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 cursor-pointer rounded-2xl relative bg-white dark:bg-gray-800/40"
                onClick={() => navigate(`/${username}/dashboard/kb/${article.id}`)}
            >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 opacity-0 group-hover:opacity-100 ${article.is_published ? 'bg-blue-500' : 'bg-amber-500'}`} />

                <CardHeader className="pb-3 pt-6 px-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                {article.is_published ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Published
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                        Draft
                                    </Badge>
                                )}
                                {article.category_name && (
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                        {article.category_name}
                                    </Badge>
                                )}
                                {article.visibility !== 'internal' && (
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider border-blue-200 text-blue-600 dark:border-blue-900 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                                        <Globe className="w-2.5 h-2.5 mr-1" />
                                        {article.visibility}
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl font-bold text-[#1e293b] dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                                {article.title}
                            </CardTitle>
                        </div>
                        {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-2xl">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/${username}/dashboard/kb/${article.id}`); }} className="rounded-lg py-2">
                                        <Eye className="mr-3 h-4 w-4 text-blue-500" />
                                        <span>View Reader</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/${username}/dashboard/kb/${article.id}/edit`); }} className="rounded-lg py-2">
                                        <Edit className="mr-3 h-4 w-4 text-amber-500" />
                                        <span>Edit Content</span>
                                    </DropdownMenuItem>
                                    {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                                        <>
                                            <DropdownMenuSeparator className="my-1" />
                                            <DropdownMenuItem
                                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                                className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg py-2"
                                            >
                                                <Trash2 className="mr-3 h-4 w-4" />
                                                <span>Delete Article</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-6 leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                        {article.content ? article.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...' : 'This article contains technical details and documentation summaries.'}
                    </p>

                    <div className="mt-auto">
                        {/* Tags with premium look */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-5">
                                {tags.slice(0, 3).map((tag, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-[10px] font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-none hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 transition-all rounded-md px-2 py-0.5"
                                    >
                                        #{tag}
                                    </Badge>
                                ))}
                                {tags.length > 3 && (
                                    <span className="text-[10px] text-gray-400 font-bold">+{tags.length - 3} more</span>
                                )}
                            </div>
                        )}

                        {/* Footer Meta */}
                        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800 group-hover:border-blue-100 dark:group-hover:border-blue-900/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border border-blue-200 dark:border-blue-800 overflow-hidden">
                                    <span className="text-blue-600 dark:text-blue-400 text-[10px] uppercase font-bold">
                                        {(article.author_name || 'U').charAt(0)}
                                    </span>
                                </div>
                                <span className="hover:text-blue-600 transition-colors truncate max-w-[80px]">
                                    {article.author_name || 'System User'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(article.created_at)}</span>
                                </div>
                                {article.views > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {article.views}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
