import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Eye,
    Tag,
    Calendar,
    User,
    Clock,
    History,
    FileText,
    ExternalLink,
    ChevronRight,
    Share2,
    BookOpen
} from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";

import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";

export default function ArticleView({ publicView = false }) {
    const { id, slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const username = location.pathname.split('/')[1] || '';

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState([]);
    const [showVersions, setShowVersions] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [categoryPath, setCategoryPath] = useState([]);

    const contentRef = useRef(null);
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    useEffect(() => {
        fetchArticle();
        if (!publicView) fetchVersions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, slug]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const endpoint = publicView ? `/kb/public/articles/${slug}` : `/kb/articles/${id}`;
            const res = await api.get(endpoint);
            setArticle(res.data.article);

            if (res.data.article.category_id && !publicView) {
                await fetchCategoryPath(res.data.article.category_id);
            }
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch article');
            if (publicView) {
                // For public view, maybe just show the error in UI or home
                setArticle(null);
            } else {
                navigate(`/${username}/dashboard/kb`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoryPath = async (categoryId) => {
        try {
            const res = await api.get('/kb/categories');
            const categories = res.data.categories || [];
            const path = [];
            let currentId = categoryId;

            while (currentId) {
                const category = categories.find(c => c.id === currentId);
                if (category) {
                    path.unshift(category);
                    currentId = category.parent_id;
                } else {
                    break;
                }
            }
            setCategoryPath(path);
        } catch (error) {
            console.error('Failed to fetch category path:', error);
        }
    };

    const fetchVersions = async () => {
        try {
            const res = await api.get(`/kb/articles/${id}/versions`);
            setVersions(res.data.versions || []);
        } catch (error) {
            console.error('Failed to fetch versions:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/kb/articles/${id}`);
            toast.success('Article removed from knowledge base');
            navigate(`/${username}/dashboard/kb`);
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to delete article');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const extractTags = (tagsJson) => {
        try {
            if (!tagsJson) return [];
            return typeof tagsJson === 'string' ? JSON.parse(tagsJson) : tagsJson;
        } catch {
            return [];
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]">
                <Hamster />
                <p className="mt-4 text-sm font-medium text-gray-500 animate-pulse">Loading technical documentation...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8fafc] dark:bg-[#0f172a]">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Article Not Found</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">The document you are looking for might have been moved or deleted.</p>
                <Button onClick={() => navigate(`/${username}/dashboard/kb`)} className="rounded-full px-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Knowledge Base
                </Button>
            </div>
        );
    }

    const tags = extractTags(article.tags);

    return (
        <div className="w-full h-full bg-[#f8fafc] dark:bg-[#0f172a] overflow-x-hidden relative scrollbar-thin">
            {/* Print Only Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    nav, aside, footer, .reading-progress, .action-buttons, .sticky-nav { 
                        display: none !important; 
                    }
                    .main-content {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .prose {
                        max-width: none !important;
                    }
                }
            ` }} />

            {/* Reading Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-[100] origin-left reading-progress"
                style={{ scaleX }}
            />

            {/* Sticky Navigation / Header Bar */}
            <nav className="sticky top-0 w-full bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50 px-6 py-3 sticky-nav">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => publicView ? navigate('/') : navigate(`/${username}/dashboard/kb`)}
                            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 group"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-1.5 overflow-hidden text-xs text-gray-500">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[100px] hover:text-blue-600 transition-colors cursor-pointer" onClick={() => publicView ? navigate('/') : navigate(`/${username}/dashboard/kb`)}>Knowledge Base</span>
                            {!publicView && categoryPath.map(cat => (
                                <div key={cat.id} className="flex items-center gap-1.5 shrink-0">
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="truncate max-w-[100px] hover:text-blue-600 transition-colors cursor-pointer" onClick={() => navigate(`/${username}/dashboard/kb?category=${cat.id}`)}>
                                        {cat.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!publicView && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/${username}/dashboard/kb/${id}/edit`)}
                                className="rounded-full border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all"
                            >
                                <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Edit Article</span>
                                <span className="sm:hidden">Edit</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const url = article.visibility !== 'internal'
                                    ? `${window.location.origin}/kb/p/${article.slug}`
                                    : window.location.href;
                                navigator.clipboard.writeText(url);
                                toast.success(article.visibility !== 'internal' ? "Shareable link copied!" : "Link copied!");
                            }}
                            className="rounded-full h-8 w-8 p-0"
                            title={article.visibility !== 'internal' ? "Copy shareable public link" : "Copy dashboard link"}
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                        {!publicView && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteDialog(true)}
                                className="rounded-full h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="w-full pt-12 pb-8 px-6 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-6xl mx-auto"
                >
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        {article.is_published ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                <Eye className="w-3 h-3 mr-1.5" />
                                Official Publication
                            </Badge>
                        ) : (
                            <Badge className="bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                Draft in Review
                            </Badge>
                        )}
                        {article.category_name && (
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-3 py-1">
                                {article.category_name}
                            </Badge>
                        )}
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1e293b] dark:text-white leading-[1.1] mb-8 tracking-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between flex-wrap gap-6 py-6 border-y border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-md">
                                <span className="text-blue-600 dark:text-blue-400 font-bold text-lg uppercase">
                                    {(article.author_name || 'U').charAt(0)}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                    {article.author_name || 'System User'}
                                </p>
                                <p className="text-xs text-gray-500 font-medium">Author</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                    {formatDate(article.created_at)}
                                </p>
                                <p className="text-xs text-gray-500 font-medium flex items-center justify-end gap-1">
                                    <Calendar className="w-3 h-3" /> Published Date
                                </p>
                            </div>
                            {article.updated_at !== article.created_at && (
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                                        {formatDate(article.updated_at)}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium flex items-center justify-end gap-1">
                                        <Clock className="w-3 h-3" /> Last Revision
                                    </p>
                                </div>
                            )}
                            {/* <div className="text-right">
                                <p className="text-sm font-bold text-blue-600 mb-0.5">
                                    {article.views || 0}
                                </p>
                                <p className="text-xs text-gray-500 font-medium flex items-center justify-end gap-1">
                                    <Eye className="w-3 h-3" /> Reader Views
                                </p>
                            </div> */}
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 pb-24 main-content">
                {/* Left Side: Article Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="lg:col-span-8"
                >
                    <article className="bg-white dark:bg-gray-800/20 rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 dark:border-gray-800 relative">
                        {/* Content Header Source Link */}
                        {article.source_type && (
                            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                        <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-widest">Linked Resource</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">This document is paired with {article.source_type} #{article.source_reference_id}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600">
                                    View Source
                                </Button>
                            </div>
                        )}

                        <div
                            ref={contentRef}
                            className="prose prose-md sm:prose-lg lg:prose-xl dark:prose-invert max-w-none 
                                selection:bg-blue-500/30
                                [&_p]:leading-relaxed [&_p]:text-[#334155] dark:[&_p]:text-gray-300 [&_p]:mb-6
                                [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:border-b [&_h2]:pb-2 [&_h2]:border-gray-100 dark:[&_h2]:border-gray-800
                                [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:mt-10 [&_h3]:mb-4
                                [&_ul]:my-6 [&_ul]:list-none [&_ul_li]:relative [&_ul_li]:pl-7 [&_ul_li]:mb-4 
                                [&_ul_li::before]:content-[''] [&_ul_li::before]:absolute [&_ul_li::before]:left-0 [&_ul_li::before]:top-[0.6em] [&_ul_li::before]:w-2 [&_ul_li::before]:h-2 [&_ul_li::before]:bg-blue-500 [&_ul_li::before]:rounded-full
                                [&_ol]:my-6 [&_ol]:ml-6 [&_ol_li]:mb-4 [&_ol_li]:pl-2 [&_ol_li]:marker:text-blue-600 [&_ol_li]:marker:font-black
                                [&_blockquote]:border-l-8 [&_blockquote]:border-blue-500/20 [&_blockquote]:bg-blue-50/30 dark:[&_blockquote]:bg-blue-900/10 [&_blockquote]:p-8 [&_blockquote]:rounded-r-3xl [&_blockquote]:italic [&_blockquote]:text-xl [&_blockquote]:my-10 [&_blockquote]:font-serif
                                [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_code]:text-red-600 dark:[&_code]:text-red-400 before:[&_code]:content-none after:[&_code]:content-none
                                [&_pre]:p-6 [&_pre]:rounded-2xl [&_pre]:bg-[#0f172a] [&_pre]:shadow-xl [&_pre]:border [&_pre]:border-gray-800
                                [&_img]:rounded-2xl [&_img]:shadow-2xl [&_img]:border [&_img]:border-gray-200 dark:[&_img]:border-gray-800 [&_img]:my-12
                                [&_a]:text-blue-600 [&_a]:underline-offset-4 [&_a]:decoration-2 hover:[&_a]:text-blue-700
                                [&_hr]:my-16 [&_hr]:border-gray-100 dark:[&_hr]:border-gray-800
                            "
                            dangerouslySetInnerHTML={{ __html: article.content || '<p class="text-gray-500">No content available</p>' }}
                        />

                        {/* Article Footer Tags */}
                        {tags.length > 0 && (
                            <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Related Topics</p>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="px-4 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-blue-600 hover:text-white transition-all cursor-pointer border border-gray-100 dark:border-gray-700 font-bold"
                                            onClick={() => {
                                                const params = new URLSearchParams();
                                                params.set('tags', tag);
                                                if (article.category_id) params.set('category', article.category_id);
                                                navigate(`/${username}/dashboard/kb?${params.toString()}`);
                                            }}
                                        >
                                            <Tag className="w-3.5 h-3.5 mr-2 opacity-50" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </article>
                </motion.div>

                {/* Right Side: Meta Sidebar */}
                <aside className="lg:col-span-4 space-y-8 print:hidden">
                    {/* Action Card */}
                    <Card className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden bg-white dark:bg-gray-800/40">
                        <CardHeader className="bg-blue-600 py-6">
                            <CardTitle className="text-white flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Article Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {versions.length > 0 && (
                                <div
                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700"
                                    onClick={() => setShowVersions(true)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                                            <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Vers. {versions.length}</p>
                                            <p className="text-xs text-gray-500 font-medium">Full History</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                </div>
                            )}

                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{article.author_name || 'System'}</p>
                                    <p className="text-xs text-gray-500 font-medium">Created By</p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Quick Actions</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {!publicView && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-gray-200 dark:border-gray-700 h-11 font-bold"
                                            onClick={() => navigate(`/${username}/dashboard/kb/${id}/edit`)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className={`rounded-xl border-gray-200 dark:border-gray-700 h-11 font-bold ${publicView ? 'col-span-2' : ''}`}
                                        onClick={() => window.print()}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Print Article
                                    </Button>
                                    {!publicView && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                                        <Button
                                            variant="ghost"
                                            className="rounded-xl h-11 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 col-span-2"
                                            onClick={() => setDeleteDialog(true)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remove Document
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table of Contents - Skeleton/Placeholder */}
                    <div className="p-8 rounded-3xl bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800">
                        <h4 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Reader Info</h4>
                        <div className="space-y-4 text-sm font-medium text-gray-500">
                            <div className="flex items-center justify-between">
                                <span>Reading Time</span>
                                <span className="text-gray-900 dark:text-white">~4 mins</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Word Count</span>
                                <span className="text-gray-900 dark:text-white">{article.content?.split(' ').length || 0} words</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Visibility</span>
                                <span className="capitalize text-blue-600">{article.visibility || 'All'}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Version History Dialog - Premium Styled */}
            <Dialog open={showVersions} onOpenChange={setShowVersions}>
                <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
                    <div className="p-8 bg-blue-600 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1">Article Version Control</h2>
                            <p className="text-blue-100 text-sm font-medium">Review and compare previous iterations of this document.</p>
                        </div>
                        {/* <Button variant="ghost" className="text-white hover:bg-white/20 rounded-full h-10 w-10 p-0" onClick={() => setShowVersions(false)}>
                            <X className="w-6 h-6" />
                        </Button> */}
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-[#f8fafc] dark:bg-[#0f172a] space-y-8 scrollbar-thin">
                        <AnimatePresence>
                            {versions.map((version, idx) => (
                                <motion.div
                                    key={version.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className={`relative border-l-4 pl-8 pb-10 ${idx === 0 ? 'border-blue-500' : 'border-gray-200 dark:border-gray-800'}`}>
                                        <div className={`absolute -left-2.5 top-0 w-4 h-4 rounded-full border-4 border-[#f8fafc] dark:border-[#0f172a] ${idx === 0 ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50' : 'bg-gray-300 dark:bg-gray-700'}`} />

                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-black text-[#1e293b] dark:text-white flex items-center gap-3">
                                                    Version {version.version_number}
                                                    {idx === 0 && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-none font-bold px-3">CURRENT LIVE VERSION</Badge>}
                                                </h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm font-medium text-gray-500">
                                                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {version.editor_name || version.changed_by}</span>
                                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(version.created_at)}</span>
                                                </div>
                                            </div>
                                            <Button variant="outline" className="rounded-xl border-gray-200 dark:border-gray-700 h-9 font-bold px-4 hover:bg-white dark:hover:bg-gray-800">
                                                Restore This
                                            </Button>
                                        </div>

                                        <Card className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-800/40">
                                            <CardContent className="p-6">
                                                <div
                                                    className="prose prose-sm dark:prose-invert max-w-none max-h-48 overflow-y-auto scrollbar-hide text-gray-600 dark:text-gray-400"
                                                    dangerouslySetInnerHTML={{ __html: version.content_snapshot }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-8">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900 dark:text-white mb-2">Delete Permanently?</DialogTitle>
                        <DialogDescription className="text-base text-gray-500 font-medium leading-relaxed">
                            You are about to remove <span className="font-black text-gray-900 dark:text-white italic">"{article.title}"</span> from the knowledge base. This action will also purge all version history and linked feedback.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialog(false)}
                            className="rounded-2xl h-12 flex-1 font-bold border-gray-200 dark:border-gray-700"
                        >
                            No, Keep it safely
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 flex-1 font-bold shadow-lg shadow-red-600/30"
                        >
                            Yes, Purge Document
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Minimalist X Icon for dialogs since it's missing in some contexts
function X({ className, ...props }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    );
}
