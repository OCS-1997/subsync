import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    BookOpen, FileText, FolderOpen, Eye,
    ArrowRight, Plus, TrendingUp, Star
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';
import BentoGrid from '../BentoGrid';
import BentoCard from '../BentoCard';
import StatCard from '../widgets/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function KnowledgeBaseTab({ visibleWidgets }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);

    // Helper to check if widget is visible
    const isWidgetVisible = (widgetKey) => {
        if (visibleWidgets === undefined || visibleWidgets === null) return true;
        return visibleWidgets.has(widgetKey);
    };

    const [stats, setStats] = useState({
        totalArticles: 0,
        totalCategories: 0,
        publishedArticles: 0,
        draftArticles: 0,
        totalViews: 0
    });
    const [recentArticles, setRecentArticles] = useState([]);
    const [popularArticles, setPopularArticles] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadKBData();
    }, []);

    const loadKBData = async () => {
        try {
            setLoading(true);

            const [articlesRes, categoriesRes] = await Promise.all([
                api.get('/kb/articles'),
                api.get('/kb/categories')
            ]);

            const articles = (articlesRes.data.articles || []).map(a => ({
                ...a,
                status: a.is_published ? 'published' : 'draft'
            }));
            const cats = categoriesRes.data.categories || [];

            const published = articles.filter(a => a.status === 'published');
            const drafts = articles.filter(a => a.status === 'draft');
            const totalViews = articles.reduce((sum, a) => sum + (a.total_reads || 0), 0);

            setStats({
                totalArticles: articles.length,
                totalCategories: cats.length,
                publishedArticles: published.length,
                draftArticles: drafts.length,
                totalViews
            });

            // Recent articles
            const recent = [...articles]
                .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                .slice(0, 5);
            setRecentArticles(recent);

            // Popular articles by views
            const popular = [...articles]
                .sort((a, b) => (b.total_reads || 0) - (a.total_reads || 0))
                .slice(0, 5);
            setPopularArticles(popular);

            setCategories(cats.slice(0, 6));

        } catch (err) {
            console.error('Error loading KB data:', err);
            // Don't show error toast as KB might not be available
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num;
    };

    if (loading) {
        return (
            <BentoGrid columns={4}>
                {[...Array(6)].map((_, i) => (
                    <BentoCard key={i} loading size={i < 4 ? "sm" : "md"} />
                ))}
            </BentoGrid>
        );
    }

    return (
        <BentoGrid columns={4}>
            {/* Stats Row */}
            <BentoCard size="sm" icon={FileText} title="Articles">
                <StatCard
                    value={stats.totalArticles}
                    label="Total Articles"
                    variant="blue"
                />
            </BentoCard>

            <BentoCard size="sm" icon={FolderOpen} title="Categories">
                <StatCard
                    value={stats.totalCategories}
                    label="Total Categories"
                    variant="purple"
                />
            </BentoCard>

            <BentoCard size="sm" icon={BookOpen} title="Published">
                <StatCard
                    value={stats.publishedArticles}
                    label="Live Articles"
                    variant="emerald"
                />
            </BentoCard>

            <BentoCard size="sm" icon={Eye} title="Views">
                <StatCard
                    value={formatNumber(stats.totalViews)}
                    label="Total Views"
                    variant="amber"
                />
            </BentoCard>

            {/* Recent Articles */}
            <BentoCard
                size="md"
                icon={FileText}
                title="Recent Articles"
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => navigate(`/${user.username}/dashboard/kb`)}
                    >
                        View All <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                }
            >
                {recentArticles.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No articles yet
                    </div>
                ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {recentArticles.map((article, i) => (
                            <div
                                key={article.id || i}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                onClick={() => navigate(`/${user.username}/dashboard/kb/article/${article.id}`)}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{article.title}</p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                        {article.category_name || 'Uncategorized'}
                                    </p>
                                </div>
                                <Badge variant="outline" className={`ml-2 text-[9px] shrink-0 ${article.status === 'published'
                                    ? 'border-emerald-500/50 text-emerald-400'
                                    : 'border-amber-500/50 text-amber-400'
                                    }`}>
                                    {article.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </BentoCard>

            {/* Popular Articles */}
            <BentoCard
                size="md"
                icon={Star}
                title="Popular Articles"
            >
                {popularArticles.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No articles yet
                    </div>
                ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                        {popularArticles.map((article, i) => (
                            <div
                                key={article.id || i}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                onClick={() => navigate(`/${user.username}/dashboard/kb/${article.id}`)}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-[10px] font-black text-slate-500 w-5">#{i + 1}</span>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{article.title}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-2 text-slate-400">
                                    <Eye className="w-3 h-3" />
                                    <span className="text-xs font-bold">{article.total_reads || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </BentoCard>

            {/* Categories */}
            <BentoCard size="md" icon={FolderOpen} title="Categories">
                {categories.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                        No categories yet
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat, i) => (
                            <div
                                key={cat.id || i}
                                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                onClick={() => navigate(`/${user.username}/dashboard/kb?category=${cat.id}`)}
                            >
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{cat.name}</p>
                                <p className="text-[10px] text-slate-500">
                                    {cat.article_count || 0} articles
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </BentoCard>

            {/* Draft Articles */}
            <BentoCard size="sm" icon={FileText} title="Drafts">
                <StatCard
                    value={stats.draftArticles}
                    label="Pending Review"
                    variant={stats.draftArticles > 0 ? "amber" : "default"}
                />
            </BentoCard>

            {/* Quick Action */}
            <BentoCard size="full" icon={BookOpen} title="Knowledge Base Management">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black text-slate-900 dark:text-white">Knowledge Base</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-1">
                            Create and manage your documentation and help articles
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => navigate(`/${user.username}/dashboard/kb/new`)}
                            className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4 mr-2" /> New Article
                        </Button>
                        <Button
                            onClick={() => navigate(`/${user.username}/dashboard/kb`)}
                            variant="outline"
                            className="rounded-2xl px-6 h-12 font-black text-[10px] uppercase tracking-widest border-slate-700 hover:bg-slate-800"
                        >
                            Browse KB <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </BentoCard>
        </BentoGrid>
    );
}

export default KnowledgeBaseTab;
