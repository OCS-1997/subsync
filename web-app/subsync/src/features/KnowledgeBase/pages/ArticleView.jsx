import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Edit, Trash2, Eye, Tag, Calendar, User, Clock, History } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { Separator } from "@/components/ui/separator.jsx";

export default function ArticleView() {
    const { id } = useParams();
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

    useEffect(() => {
        fetchArticle();
        fetchVersions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/kb/articles/${id}`);
            setArticle(res.data.article);

            // Fetch category path if article has a category
            if (res.data.article.category_id) {
                await fetchCategoryPath(res.data.article.category_id);
            }
        } catch (error) {
            toast.error(error.normalizedMessage || 'Failed to fetch article');
            navigate(`/${username}/dashboard/kb`);
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

            // Build path from current category to root
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
            toast.success('Article deleted successfully');
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
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
            <div className="flex-col flex flex-1 items-center justify-center">
                <Hamster />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex-col flex flex-1 items-center justify-center">
                <p>Article not found</p>
            </div>
        );
    }

    const tags = extractTags(article.tags);

    // Build breadcrumb items
    const breadcrumbItems = [
        { label: "Knowledge Base", href: `/${username}/dashboard/kb` }
    ];

    // Add category path
    categoryPath.forEach(category => {
        breadcrumbItems.push({
            label: category.name,
            href: `/${username}/dashboard/kb?category=${category.id}`
        });
    });

    // Add current article
    breadcrumbItems.push({ label: article.title });

    return (
        <div className="w-full h-full overflow-auto ">
            <div className="max-w-[1200px] mx-auto p-6">
                <Breadcrumb
                    items={breadcrumbItems}
                />

                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => navigate(`/${username}/dashboard/kb`)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Articles
                    </Button>

                    <div className="flex items-center gap-2">
                        {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_UPDATE) && (
                            <Button variant="outline" onClick={() => navigate(`/${username}/dashboard/kb/${id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        )}
                        {versions.length > 0 && (
                            <Button variant="outline" onClick={() => setShowVersions(true)}>
                                <History className="w-4 h-4 mr-2" />
                                Version History ({versions.length})
                            </Button>
                        )}
                        {hasPermission(PERMISSIONS.KNOWLEDGE_BASE_DELETE) && (
                            <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>

                {/* Article Content */}
                <Card className="mb-6">
                    <CardHeader className="pb-4">
                        {/* Status Badge */}
                        <div className="mb-3">
                            {article.is_published ? (
                                <Badge variant="secondary" className="text-sm">
                                    <Eye className="w-3 h-3 mr-1" />
                                    Published
                                </Badge>
                            ) : (
                                <Badge variant="default" className="text-sm">Draft</Badge>
                            )}
                        </div>

                        {/* Title */}
                        <CardTitle className="text-4xl font-bold mb-4">
                            {article.title}
                        </CardTitle>

                        {/* Meta Information */}
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>By {article.author_name || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Created {formatDate(article.created_at)}</span>
                            </div>
                            {article.updated_at !== article.created_at && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>Updated {formatDate(article.updated_at)}</span>
                                </div>
                            )}
                            {article.views > 0 && (
                                <div className="flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    <span>{article.views} views</span>
                                </div>
                            )}
                        </div>

                        {/* Category */}
                        {article.category_name && (
                            <div className="mt-4">
                                <Badge variant="outline" className="text-sm">
                                    {article.category_name}
                                </Badge>
                            </div>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-4">
                                <Tag className="w-4 h-4 text-gray-400" />
                                {tags.map((tag, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                                        onClick={() => {
                                            const params = new URLSearchParams();
                                            params.set('tags', tag);
                                            if (article.category_id) {
                                                params.set('category', article.category_id);
                                            }
                                            navigate(`/${username}/dashboard/kb?${params.toString()}`);
                                        }}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Source Info */}
                        {article.source_type && (
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    📋 This article was created from a {article.source_type} entry (ID: {article.source_reference_id})
                                </p>
                            </div>
                        )}
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        {/* Article Content with proper list styling */}
                        <div
                            className="prose prose-lg dark:prose-invert max-w-none
                                [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-4
                                [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-4
                                [&_li]:my-1 [&_li]:display-list-item
                                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-4
                                [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-3
                                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:my-2
                                [&_p]:my-3 [&_p]:leading-relaxed
                                [&_blockquote]:border-l-4 [&_blockquote]:border-blue-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
                                [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800
                                [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm
                                [&_hr]:my-6 [&_hr]:border-t-2"
                            dangerouslySetInnerHTML={{ __html: article.content || '<p class="text-gray-500">No content available</p>' }}
                        />
                    </CardContent>
                </Card>

                {/* Version History Dialog */}
                <Dialog open={showVersions} onOpenChange={setShowVersions}>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Version History</DialogTitle>
                            <DialogDescription>
                                View all changes made to this article
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-4">
                            {versions.map((version, idx) => (
                                <Card key={version.id} className={idx === 0 ? 'border-blue-500' : ''}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">
                                                    Version {version.version_number}
                                                    {idx === 0 && <Badge variant="secondary" className="ml-2">Current</Badge>}
                                                </CardTitle>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    Modified by {version.editor_name || version.changed_by} on {formatDate(version.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none max-h-60 overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: version.content_snapshot }}
                                        />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Article</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "<strong>{article.title}</strong>"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
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
