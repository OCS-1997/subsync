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
    RotateCcw,
    ChevronRight,
    Share2,
    BookOpen,
    BarChart3,
    Copy,
    Check,
    X,
    Globe
} from "lucide-react";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";

import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// SEO and Tracking components
import SEOMetaTags from "../components/SEOMetaTags";
import { useReadTracking, ReadCounter } from "../components/ReadTracking";
import ArticleAnalytics from "../components/ArticleAnalytics";

export default function ArticleView({ publicView = false }) {
    const { id, slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = usePermissions();
    const username = location.pathname.split('/')[1] || '';

    const [article, setArticle] = useState(null);
    const [seoData, setSeoData] = useState(null);
    const [structuredData, setStructuredData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState([]);
    const [showVersions, setShowVersions] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [categoryPath, setCategoryPath] = useState([]);
    const [isCopied, setIsCopied] = useState(false);

    // Enable read tracking for public view
    useReadTracking(slug, publicView);

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

            // Set SEO data for public view
            if (publicView && res.data.seo) {
                setSeoData(res.data.seo);
                setStructuredData(res.data.structuredData);
            }

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

    // Decode HTML entities and ensure proper rendering
    const decodeHTMLContent = (content) => {
        if (!content) return '<p class="text-gray-500">No content available</p>';

        // Create a temporary div to decode HTML entities
        const txt = document.createElement('textarea');
        txt.innerHTML = content;
        const decoded = txt.value;

        // Return the decoded content
        return decoded || '<p class="text-gray-500">No content available</p>';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]">
                <Hamster />
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 animate-pulse">Loading technical documentation...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-[#f8fafc] dark:bg-[#0f172a]">
                <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Article Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">The document you are looking for might have been moved or deleted.</p>
                <Button onClick={() => navigate(`/${username}/dashboard/kb`)} className="rounded-full px-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Knowledge Base
                </Button>
            </div>
        );
    }

    const tags = extractTags(article.tags);

    return (
        <>
            {/* SEO Meta Tags for public view */}
            {publicView && seoData && (
                <SEOMetaTags seo={seoData} structuredData={structuredData} />
            )}

            <div className="w-full h-full bg-white dark:bg-slate-950 overflow-x-hidden relative scrollbar-thin">
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
                <nav className="sticky top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 z-50 px-6 py-3 sticky-nav">
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
                            <div className="flex items-center gap-1.5 overflow-hidden text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
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
                                <>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAnalytics(true)}
                                        className="rounded-full border-gray-200 dark:border-gray-700 hover:border-purple-500 hover:text-purple-600 transition-all"
                                    >
                                        <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                                        <span className="hidden sm:inline">Analytics</span>
                                        <span className="sm:hidden">Stats</span>
                                    </Button>
                                </>
                            )}
                            <Popover onOpenChange={(open) => { if (!open) setIsCopied(false); }}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-full h-8 w-8 p-0"
                                        title={article.visibility !== 'internal' ? "Shareable public link" : "Link options"}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 rounded-2xl border-none shadow-2xl overflow-hidden bg-white dark:bg-gray-900" align="end" sideOffset={10}>
                                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                <Share2 className="w-3.5 h-3.5" />
                                                Share Article
                                            </h4>
                                            <div className="flex items-center gap-1">
                                                <Badge className="bg-white/20 text-white border-none text-[9px] px-1.5 font-black uppercase tracking-widest leading-none h-4">
                                                    {article.visibility}
                                                </Badge>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-blue-100/80 font-medium">Anyone with this link can view the article.</p>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="relative group">
                                            <Input
                                                readOnly
                                                value={article.visibility !== 'internal'
                                                    ? `${window.location.origin}/kb/p/${article.slug}`
                                                    : window.location.href}
                                                className="pr-20 bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 rounded-xl text-xs h-10 font-medium"
                                            />
                                            <Button
                                                size="sm"
                                                variant={isCopied ? "success" : "default"}
                                                onClick={() => {
                                                    const url = article.visibility !== 'internal'
                                                        ? `${window.location.origin}/kb/p/${article.slug}`
                                                        : window.location.href;
                                                    navigator.clipboard.writeText(url);
                                                    setIsCopied(true);
                                                    // toast.success("Link copied!");
                                                    setTimeout(() => setIsCopied(false), 2000);
                                                }}
                                                className={`absolute right-1 top-1 h-8 rounded-lg px-3 transition-all duration-300 ${isCopied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                                            >
                                                {isCopied ? (
                                                    <Check className="w-3.5 h-3.5" />
                                                ) : (
                                                    <div className="flex items-center gap-1.5">
                                                        <Copy className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold">COPY</span>
                                                    </div>
                                                )}
                                            </Button>
                                        </div>

                                        {article.visibility !== 'internal' && (
                                            <div className="pt-2">
                                                <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                                                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center shrink-0">
                                                        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 leading-tight">Public URL</p>
                                                        <p className="text-[9px] text-blue-600 dark:text-blue-400 truncate opacity-80 font-medium">/{article.slug}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </PopoverContent>
                            </Popover>
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
                <header className="w-full pt-12 pb-8 px-6 bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-500/5 dark:to-transparent">
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
                            {publicView && (
                                <Badge className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                                    Public Article
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight">
                            {article.title}
                        </h1>

                        <div className="flex items-center justify-between flex-wrap gap-6 py-8 border-y border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-md">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg uppercase">
                                        {(article.author_name || 'U').charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                                        {article.author_name || 'System User'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Author</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                                        {formatDate(article.created_at)}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest flex items-center justify-end gap-1">
                                        <Calendar className="w-3 h-3" /> Published Date
                                    </p>
                                </div>
                                {article.updated_at !== article.created_at && (
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">
                                            {formatDate(article.updated_at)}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest flex items-center justify-end gap-1">
                                            <Clock className="w-3 h-3" /> Last Revision
                                        </p>
                                    </div>
                                )}
                                {/* Read Counter - Show for all users */}
                                {article.total_reads > 0 && (
                                    <div className="text-right">
                                        <ReadCounter
                                            totalReads={article.total_reads}
                                            uniqueReads={article.unique_reads}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* Main Content Area */}
                <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 pb-24 main-content">
                    {/* Left Side: Article Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="lg:col-span-9"
                    >
                        <article className="bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none rounded-[2.5rem] p-8 sm:p-16 border border-gray-100 dark:border-slate-800 relative transition-all">
                            {/* Content Header Source Link */}
                            {article.source_type && (
                                <div className="mb-12 p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[1.5rem] flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                            <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest">Linked Resource</p>
                                            <p className="text-sm text-blue-600 dark:text-blue-500 font-bold">This document is paired with {article.source_type} #{article.source_reference_id}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 font-bold">
                                        View Source
                                    </Button>
                                </div>
                            )}

                            <div
                                ref={contentRef}
                                className="prose prose-md sm:prose-lg lg:prose-xl dark:prose-invert max-w-none 
                                selection:bg-blue-500/30
                                [&_p]:leading-relaxed [&_p]:text-slate-600 dark:[&_p]:!text-slate-300 [&_p]:mb-8
                                [&_h2]:text-4xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:mt-16 [&_h2]:mb-8 [&_h2]:border-b [&_h2]:pb-4 [&_h2]:border-gray-100 dark:[&_h2]:border-slate-800 [&_h2]:text-slate-900 dark:[&_h2]:!text-white
                                [&_h3]:text-2xl [&_h3]:font-black [&_h3]:mt-12 [&_h3]:mb-6 [&_h3]:text-slate-800 dark:[&_h3]:!text-slate-100
                                [&_span]:inherit dark:[&_span]:!text-inherit
                                [&_ul]:my-8 [&_ul]:list-none [&_ul_li]:relative [&_ul_li]:pl-8 [&_ul_li]:mb-4 
                                [&_ul_li::before]:content-[''] [&_ul_li::before]:absolute [&_ul_li::before]:left-0 [&_ul_li::before]:top-[0.6em] [&_ul_li::before]:w-2.5 [&_ul_li::before]:h-2.5 [&_ul_li::before]:bg-blue-600 [&_ul_li::before]:rounded-full
                                [&_ol]:my-8 [&_ol]:ml-8 [&_ol_li]:mb-4 [&_ol_li]:pl-2 [&_ol_li]:marker:text-blue-600 [&_ol_li]:marker:font-black
                                [&_blockquote]:border-l-[10px] [&_blockquote]:border-blue-500/20 [&_blockquote]:bg-blue-50/20 dark:[&_blockquote]:bg-blue-900/10 [&_blockquote]:p-10 [&_blockquote]:rounded-r-[2rem] [&_blockquote]:italic [&_blockquote]:text-2xl [&_blockquote]:my-12 [&_blockquote]:font-serif [&_blockquote]:text-slate-700 dark:[&_blockquote]:!text-slate-300
                                [&_code]:bg-slate-100 dark:[&_code]:bg-slate-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded-lg [&_code]:text-sm [&_code]:font-bold [&_code]:text-indigo-600 dark:[&_code]:!text-indigo-400 before:[&_code]:content-none after:[&_code]:content-none
                                [&_pre]:p-8 [&_pre]:rounded-3xl [&_pre]:bg-slate-950 [&_pre]:shadow-2xl [&_pre]:border [&_pre]:border-white/5
                                [&_img]:rounded-[2rem] [&_img]:shadow-2xl [&_img]:border [&_img]:border-gray-100 dark:[&_img]:border-slate-800 [&_img]:my-16
                                [&_a]:text-blue-600 [&_a]:underline-offset-8 [&_a]:decoration-2 hover:[&_a]:text-blue-700 hover:[&_a]:decoration-blue-700 transition-all font-bold
                                [&_hr]:my-20 [&_hr]:border-gray-100 dark:[&_hr]:border-slate-800
                            "
                                dangerouslySetInnerHTML={{ __html: decodeHTMLContent(article.content) }}
                            />

                            {/* Article Footer Tags */}
                            {tags.length > 0 && (
                                <div className="mt-24 pt-12 border-t border-gray-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Article Taxonomy</p>
                                    <div className="flex flex-wrap gap-3">
                                        {tags.map((tag, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="secondary"
                                                className="px-5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-600 hover:text-white transition-all cursor-pointer border border-gray-100 dark:border-slate-800 font-bold text-xs"
                                                onClick={() => {
                                                    const params = new URLSearchParams();
                                                    params.set('tags', tag);
                                                    if (article.category_id) params.set('category', article.category_id);
                                                    navigate(`/${username}/dashboard/kb?${params.toString()}`);
                                                }}
                                            >
                                                <Tag className="w-3.5 h-3.5 mr-2 opacity-60" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </article>
                    </motion.div>

                    {/* Right Side: Meta Sidebar */}
                    <aside className="lg:col-span-3 space-y-8 print:hidden">
                        {/* Action Card */}
                        <Card className="rounded-[2rem] border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader className="bg-blue-600 py-6">
                                <CardTitle className="text-white flex items-center gap-2 text-sm font-black uppercase tracking-widest">
                                    <FileText className="w-4 h-4" />
                                    Review Document
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-8 space-y-6">
                                {versions.length > 0 && (
                                    <div
                                        className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all cursor-pointer border border-gray-100 dark:border-slate-800/50 group"
                                        onClick={() => setShowVersions(true)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                                                <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">Revision {versions.length}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Version Control</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/50">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                                        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{article.author_name || 'System'}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Document Lead</p>
                                    </div>
                                </div>

                                <Separator className="bg-gray-100 dark:bg-slate-800" />

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Operations</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {!publicView && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                                            <Button
                                                variant="outline"
                                                className="rounded-xl border-gray-100 dark:border-slate-800 h-11 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95 transition-all text-slate-600 dark:text-slate-300"
                                                onClick={() => navigate(`/${username}/dashboard/kb/${id}/edit`)}
                                            >
                                                <Edit className="w-3.5 h-3.5 mr-2" />
                                                Edit
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className={`rounded-xl border-gray-100 dark:border-slate-800 h-11 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-600 dark:text-slate-300 ${publicView ? 'col-span-2' : ''}`}
                                            onClick={() => window.print()}
                                        >
                                            <Share2 className="w-3.5 h-3.5 mr-2" />
                                            Print
                                        </Button>
                                        {!publicView && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                                            <Button
                                                variant="ghost"
                                                className="rounded-xl h-11 font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 col-span-2 active:scale-95 transition-all"
                                                onClick={() => setDeleteDialog(true)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                Remove Permanently
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Metadata Details */}
                        <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 shadow-inner">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-8">Reading Metadata</h4>
                            <div className="space-y-6 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                <div className="flex items-center justify-between">
                                    <span>Pace</span>
                                    <span className="text-slate-900 dark:text-white">~4 mins</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Quantity</span>
                                    <span className="text-slate-900 dark:text-white">{article.content?.split(' ').length || 0} words</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Scope</span>
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-none px-3 py-1 text-[9px] font-black">{article.visibility || 'All'}</Badge>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Version History Dialog - Premium Styled */}
                <Dialog open={showVersions} onOpenChange={setShowVersions}>
                    <DialogContent className="max-w-5xl h-[85vh] overflow-hidden flex flex-col p-0 rounded-[2.5rem] border-none shadow-2xl dark:bg-slate-900">
                        <div className="p-10 bg-blue-600 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Article Revision Engine</h2>
                                <p className="text-blue-100 text-sm font-bold uppercase tracking-widest opacity-80">Chronological Archive & State Recovery</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 bg-white dark:bg-slate-950 space-y-10 scrollbar-thin">
                            <AnimatePresence>
                                {versions.map((version, idx) => (
                                    <motion.div
                                        key={version.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <div className={`relative border-l-4 pl-10 pb-12 ${idx === 0 ? 'border-blue-600' : 'border-gray-100 dark:border-slate-800'}`}>
                                            <div className={`absolute -left-2.5 top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-950 ${idx === 0 ? 'bg-blue-600 scale-150 shadow-lg shadow-blue-500/50' : 'bg-gray-200 dark:bg-slate-700'}`} />

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                                                        Revision Layer {version.version_number}
                                                        {idx === 0 && <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">Active Snapshot</Badge>}
                                                    </h3>
                                                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                                        <span className="flex items-center gap-2"><User className="w-4 h-4 text-blue-500/80" /> {version.editor_name || version.changed_by}</span>
                                                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-500/80" /> {formatDate(version.created_at)}</span>
                                                    </div>
                                                </div>
                                                <Button variant="outline" className="rounded-xl border-gray-100 dark:border-slate-800 h-10 font-black text-[10px] uppercase tracking-widest px-6 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm active:scale-95 transition-all text-slate-600 dark:text-slate-300">
                                                    <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                                    Restore
                                                </Button>
                                            </div>

                                            <div className="rounded-3xl border border-gray-100 dark:border-slate-800 shadow-inner bg-slate-50/50 dark:bg-slate-900/40 p-8 overflow-hidden">
                                                <div
                                                    className="prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto scrollbar-hide text-slate-600 dark:text-slate-400 leading-relaxed font-medium"
                                                    dangerouslySetInnerHTML={{ __html: version.content_snapshot }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Analytics Dialog - Premium Styled */}
                <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[2.5rem] border-none shadow-2xl dark:bg-slate-900">
                        <div className="p-10 bg-indigo-600">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-4 text-white text-3xl font-black tracking-tight">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <BarChart3 className="w-7 h-7" />
                                    </div>
                                    Discovery Insights
                                </DialogTitle>
                                <DialogDescription className="text-indigo-100 text-sm font-bold uppercase tracking-widest opacity-80 mt-2">
                                    Comprehensive Traffic Distribution & User Interaction Analytics
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 bg-white dark:bg-slate-950 scrollbar-thin">
                            <ArticleAnalytics articleId={id} />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation - Premium Styled */}
                <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                    <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
                        <div className="p-10 bg-red-600">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 scale-animate">
                                <Trash2 className="w-10 h-10 text-white" />
                            </div>
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">Purge Document?</DialogTitle>
                                <DialogDescription className="text-red-100 text-sm font-medium leading-relaxed opacity-90">
                                    This will irrevocably remove <span className="font-black text-white underline decoration-2 underline-offset-4">"{article.title}"</span>. All indices, metadata, and version snapshots will be lost.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <DialogFooter className="p-10 pt-0 flex-col sm:flex-row gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteDialog(false)}
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
        </>
    );
}


