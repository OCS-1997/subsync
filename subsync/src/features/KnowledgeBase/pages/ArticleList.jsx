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
import Pagination from "@/components/layouts/Pagination.jsx";
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
    const isSyncingRef = useRef(false);

    // State from URL or defaults
    const [search, setSearch] = useState(searchParams.get('search') || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || "");
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
    const [initError, setInitError] = useState(false);
    const [fetchError, setFetchError] = useState(false);

    // Debounce search input
    const debounceTimeout = useRef();
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [search]);

    // Track previous filter values to detect actual changes and reset page
    const prevSearchRef = useRef(debouncedSearch);
    const prevTagsRef = useRef(selectedTags.join(','));
    const prevCategoryRef = useRef(selectedCategoryId);
    const prevFiltersRef = useRef(JSON.stringify(advancedFilters));

    useEffect(() => {
        const currentTagsString = selectedTags.join(',');
        const currentFiltersString = JSON.stringify(advancedFilters);
        
        const searchChanged = prevSearchRef.current !== debouncedSearch;
        const tagsChanged = prevTagsRef.current !== currentTagsString;
        const categoryChanged = prevCategoryRef.current !== selectedCategoryId;
        const filtersChanged = prevFiltersRef.current !== currentFiltersString;

        if (searchChanged || tagsChanged || categoryChanged || filtersChanged) {
            setPage(1);
            
            // Update refs after resetting page
            prevSearchRef.current = debouncedSearch;
            prevTagsRef.current = currentTagsString;
            prevCategoryRef.current = selectedCategoryId;
            prevFiltersRef.current = currentFiltersString;
        }
    }, [debouncedSearch, selectedTags, selectedCategoryId, advancedFilters]);

    // Create stable reference for filters to prevent infinite loops
    const filterDeps = useMemo(() => ({
        search: debouncedSearch,
        page,
        selectedCategoryId,
        selectedTagsString: selectedTags.join(','),
        statusFilter: advancedFilters.status,
        visibilityFilter: advancedFilters.visibility,
        createdByFilter: advancedFilters.createdBy,
        dateFromFilter: advancedFilters.dateFrom,
        dateToFilter: advancedFilters.dateTo,
        hasLinkedDCRFilter: advancedFilters.hasLinkedDCR
    }), [debouncedSearch, page, selectedCategoryId, selectedTags.join(','), advancedFilters.status, advancedFilters.visibility, advancedFilters.createdBy, advancedFilters.dateFrom, advancedFilters.dateTo, advancedFilters.hasLinkedDCR]);

    // URL Sync: Only update URL when params actually change (prevents infinite loops)
    useEffect(() => {
        const newParams = new URLSearchParams();
        if (debouncedSearch) newParams.set('search', debouncedSearch);
        if (selectedCategoryId) newParams.set('category', selectedCategoryId);
        if (selectedTags.length > 0) newParams.set('tags', selectedTags.join(','));
        if (page > 1) newParams.set('page', page);

        // Advanced filters
        Object.entries(advancedFilters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                newParams.set(key, value);
            }
        });

        // Only update if params are different (critical for preventing loops)
        const newParamsString = newParams.toString();
        const currentParamsString = searchParams.toString();
        
        if (newParamsString !== currentParamsString) {
            setSearchParams(newParams, { replace: true });
        }
    // Use useMemo result as dependency to ensure stability
    }, [filterDeps, searchParams]);

    // Data Fetching
    const fetchArticles = async () => {
        // Don't fetch if there was an initialization error
        if (initError || fetchError) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setFetchError(false);
            const params = new URLSearchParams();

            if (debouncedSearch) params.append('search', debouncedSearch);
            // Ensure category_id is properly stringified
            if (selectedCategoryId) {
                params.append('category_id', String(selectedCategoryId));
            }
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
            setFetchError(false);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
            setFetchError(true);
            // Only show toast for non-auth errors to prevent spam
            if (error.normalizedStatus !== 401 && error.normalizedStatus !== 403) {
                toast.error(error.normalizedMessage || 'Failed to fetch articles');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            setInitError(false);
            const [catRes, userRes] = await Promise.all([
                api.get('/kb/categories'),
                api.get('/users').catch(() => ({ data: { users: [] } }))
            ]);
            setCategories(catRes.data.categories || []);
            setUsers(userRes.data.users || []);
            setInitError(false);
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
            setInitError(true);
            // Only show toast for non-auth errors
            if (error.normalizedStatus !== 401 && error.normalizedStatus !== 403) {
                toast.error('Failed to load initial data');
            }
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    
    useEffect(() => {
        fetchArticles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterDeps]);

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

    // Extract plain text from HTML content for preview
    const getPlainTextPreview = (htmlContent, maxLength = 150) => {
        if (!htmlContent) return 'This article contains technical details and documentation summaries.';

        try {
            // Create a temporary div to decode HTML entities and strip tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Get text content (this automatically strips all HTML tags)
            const plainText = tempDiv.textContent || tempDiv.innerText || '';

            // Clean up whitespace and truncate
            const cleaned = plainText.replace(/\s+/g, ' ').trim();

            if (cleaned.length === 0) {
                return 'This article contains technical details and documentation summaries.';
            }

            return cleaned.length > maxLength
                ? cleaned.substring(0, maxLength) + '...'
                : cleaned;
        } catch (error) {
            console.error('Error extracting plain text:', error);
            return 'This article contains technical details and documentation summaries.';
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
        <div className="w-full h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar - Fixed on desktop */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarCollapsed ? 90 : 340 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="hidden md:flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 relative group"
            >
                {/* Collapse Toggle Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-24 h-6 w-6 rounded-full p-0 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                >
                    {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                </Button>

                <div className={cn(
                    "p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between overflow-hidden transition-all duration-300",
                    isSidebarCollapsed ? "p-6 justify-center" : "p-8"
                )}>
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <h2 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                                <BookOpen className="w-4 h-4" />
                                Repository
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Knowledge Base</p>
                        </motion.div>
                    )}
                    {isSidebarCollapsed && <BookOpen className="w-6 h-6 text-blue-600 shrink-0" />}

                    {!isSidebarCollapsed && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/${username}/dashboard/kb/categories`)}
                            className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 transition-all"
                            title="Manage Hierarchy"
                        >
                            <FolderOpen className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                    <CategorySidebar
                        isCollapsed={isSidebarCollapsed}
                        selectedCategoryId={selectedCategoryId}
                        onCategorySelect={setSelectedCategoryId}
                        className="pb-24"
                    />
                </div>
            </motion.aside>

            {/* Mobile Sidebar */}
            <aside className="md:hidden w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-6">
                <CategorySidebar
                    selectedCategoryId={selectedCategoryId}
                    onCategorySelect={setSelectedCategoryId}
                />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Header / Breadcrumb - High-end look */}
                <header className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <Breadcrumb items={breadcrumbItems} className="mb-2" />
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                                {getCategoryName()}
                                <div className="h-8 w-[2px] bg-slate-200 dark:bg-slate-700 hidden md:block" />
                                <Badge className="bg-blue-600 text-white border-none px-4 py-1 text-xs font-black rounded-full shadow-lg shadow-blue-500/20">
                                    {totalRecords} ARTICLES
                                </Badge>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_CREATE) && (
                                <Button
                                    size="lg"
                                    onClick={() => navigate(`/${username}/dashboard/kb/new`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
                                >
                                    <Plus className="w-5 h-5 mr-3" />
                                    Create New Article
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 scrollbar-thin">
                    <div className="max-w-[1600px] mx-auto space-y-10">
                        {/* Control Bar: Search & Tags Combined */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <div className="lg:col-span-4 relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-all" />
                                <Input
                                    placeholder="Search articles..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-14 h-16 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold text-slate-900 dark:text-white shadow-sm placeholder:text-slate-400 placeholder:font-medium"
                                />
                            </div>
                            <div className="lg:col-span-8">
                                <TagFilter
                                    selectedTags={selectedTags}
                                    onTagsChange={setSelectedTags}
                                />
                            </div>
                        </div>

                        {/* Advanced Filters - Minimalist expandable */}
                        <AdvancedFilters
                            filters={advancedFilters}
                            onFiltersChange={setAdvancedFilters}
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
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
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
                                            getPlainTextPreview={getPlainTextPreview}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination - Modern minimalist */}
                        {!loading && articles.length > 0 && totalPages > 1 && (
                            <Pagination
                                currentPage={page}
                                setCurrentPage={setPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                            />
                        )}
                        <div className="h-24" /> {/* Extra padding for better scroll feel */}
                    </div>
                </div>
            </main>

            {/* Delete Dialog - Premium Styled */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, articleId: null, title: "" })}>
                <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
                    <div className="p-10 bg-red-600">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6">
                            <Trash2 className="w-10 h-10 text-white" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">Purge Document?</DialogTitle>
                            <DialogDescription className="text-red-100 text-sm font-medium leading-relaxed opacity-90">
                                This will irrevocably remove <span className="font-black text-white underline decoration-2 underline-offset-4">"{deleteDialog.title}"</span>. All indices and metadata will be permanently lost.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <DialogFooter className="p-10 pt-0 flex-col sm:flex-row gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteDialog({ open: false, articleId: null, title: "" })}
                            className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Negative, Abort
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-500/30 active:scale-95 transition-all"
                        >
                            Execute Purge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-component for better organization and Framer Motion stagger
function ArticleCard({ article, username, navigate, hasPermission, onDelete, extractTags, formatDate, getPlainTextPreview }) {
    const tags = extractTags(article.tags);

    return (
        <motion.div variants={itemVariants}>
            <Card
                className="group h-[380px] flex flex-col overflow-hidden border-gray-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.08)] cursor-pointer rounded-[2rem] relative bg-white dark:bg-slate-900"
                onClick={() => navigate(`/${username}/dashboard/kb/${article.id}`)}
            >
                {/* Visual Accent */}
                <div className={cn(
                    "absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 opacity-60 group-hover:opacity-100",
                    article.is_published ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                )} />

                <CardHeader className="pb-4 pt-8 px-8">
                    <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center flex-wrap gap-2">
                                {article.is_published ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none dark:bg-emerald-900/40 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                        Verified
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-50 text-amber-700 border-none dark:bg-amber-900/40 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                        Drafting
                                    </Badge>
                                )}
                                {article.category_name && (
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-gray-100 dark:border-slate-800 text-slate-400 py-1 px-3">
                                        {article.category_name}
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-2 leading-[1.2] tracking-tight">
                                {article.title}
                            </CardTitle>
                        </div>
                        {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100">
                                        <MoreVertical className="h-5 w-5 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/${username}/dashboard/kb/${article.id}`); }} className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest">
                                        <Eye className="mr-3 h-4 w-4 text-blue-500" />
                                        <span>Read Asset</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/${username}/dashboard/kb/${article.id}/edit`); }} className="rounded-xl py-3 font-bold text-xs uppercase tracking-widest">
                                        <Edit className="mr-3 h-4 w-4 text-amber-500" />
                                        <span>Modify State</span>
                                    </DropdownMenuItem>
                                    {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                                        <>
                                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-slate-800 my-1" />
                                            <DropdownMenuItem
                                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                                className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-xl py-3 font-bold text-xs uppercase tracking-widest"
                                            >
                                                <Trash2 className="mr-3 h-4 w-4" />
                                                <span>Purge Article</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col px-8 pb-8">
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-8 leading-relaxed font-bold opacity-60 group-hover:opacity-100 transition-all">
                        {getPlainTextPreview ? getPlainTextPreview(article.content, 120) : 'This article contains technical details and documentation summaries.'}
                    </p>

                    <div className="mt-auto space-y-6">
                        {/* Tags with premium look */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.slice(0, 2).map((tag, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-[9px] font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-none hover:bg-blue-600 hover:text-white transition-all rounded-lg px-3 py-1"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                                {tags.length > 2 && (
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">+{tags.length - 2}</span>
                                )}
                            </div>
                        )}

                        {/* Footer Meta */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-slate-800 group-hover:border-blue-500/20 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800 overflow-hidden shadow-sm">
                                    <span className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                                        {(article.author_name || 'S').charAt(0)}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate max-w-[100px]">
                                    {article.author_name || 'System Nucleus'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDate(article.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
