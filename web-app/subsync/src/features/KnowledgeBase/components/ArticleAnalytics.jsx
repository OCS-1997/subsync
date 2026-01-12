import { useState, useEffect } from 'react';
import { BarChart3, Eye, Users, Clock, MousePointerClick, TrendingUp, ExternalLink } from 'lucide-react';
import api from '../../../lib/axiosInstance';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { toast } from 'react-toastify';

export default function ArticleAnalytics({ articleId }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [articleId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/kb/articles/${articleId}/analytics`);
            setAnalytics(res.data.analytics);
        } catch (error) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading analytics...</div>;
    }

    if (!analytics) {
        return <div className="text-center py-8 text-gray-500">No analytics data available</div>;
    }

    const stats = [
        { label: 'Cumulative Reads', value: analytics.totalReads || 0, icon: Eye, color: 'blue', accent: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Unique Readers', value: analytics.uniqueReads || 0, icon: Users, color: 'emerald', accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Reading Velocity', value: `${Math.round((analytics.avgDuration || 0) / 60)}m`, icon: Clock, color: 'purple', accent: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Engagement Depth', value: `${analytics.avgScrollDepth || 0}%`, icon: MousePointerClick, color: 'orange', accent: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <Card key={index} className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-sm border-gray-100 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                                    <stat.icon className={`w-7 h-7 ${stat.accent}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Referrers */}
                {analytics.topReferrers && analytics.topReferrers.length > 0 && (
                    <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-3">
                                <ExternalLink className="w-4 h-4" />
                                Traffic Referrals
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                {analytics.topReferrers.map((ref, index) => (
                                    <div key={index} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{ref.referrer || 'Direct Entry'}</p>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ref.count} interactions</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 overflow-hidden border border-gray-100 dark:border-slate-800">
                                            <div
                                                className="bg-blue-600 h-full rounded-full shadow-lg shadow-blue-500/20 transition-all duration-1000"
                                                style={{ width: `${(ref.count / analytics.totalReads) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Reads Over Time */}
                {analytics.readsOverTime && analytics.readsOverTime.length > 0 && (
                    <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 flex items-center gap-3">
                                <BarChart3 className="w-4 h-4" />
                                Velocity Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                {analytics.readsOverTime.slice(-7).map((day, index) => (
                                    <div key={index} className="flex items-center gap-4 group">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">{day.date}</span>
                                        <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-xl h-8 relative overflow-hidden border border-gray-100 dark:border-slate-800">
                                            <div
                                                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full flex items-center justify-end pr-3 transition-all duration-1000 group-hover:scale-[1.02] origin-left"
                                                style={{ width: `${Math.min((day.read_count / Math.max(...analytics.readsOverTime.map(d => d.read_count))) * 100, 100)}%` }}
                                            >
                                                <span className="text-white text-[10px] font-black uppercase tracking-widest">{day.read_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* UTM Campaigns */}
            {analytics.utmCampaigns && analytics.utmCampaigns.length > 0 && (
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-sm border-gray-100 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                            <TrendingUp className="w-4 h-4" />
                            Campaign Optimization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {analytics.utmCampaigns.map((campaign, index) => (
                                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] space-y-4 hover:shadow-lg transition-all hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{campaign.campaign}</p>
                                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-none font-black text-[10px]">
                                            {campaign.read_count} VISITS
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.source && (
                                            <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-bold text-slate-500 border border-gray-100 dark:border-slate-800">
                                                SRC: {campaign.source}
                                            </span>
                                        )}
                                        {campaign.medium && (
                                            <span className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-bold text-slate-500 border border-gray-100 dark:border-slate-800">
                                                MED: {campaign.medium}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
