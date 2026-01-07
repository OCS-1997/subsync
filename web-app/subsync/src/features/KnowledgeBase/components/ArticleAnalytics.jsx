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
        { label: 'Total Reads', value: analytics.totalReads || 0, icon: Eye, color: 'blue' },
        { label: 'Unique Visitors', value: analytics.uniqueReads || 0, icon: Users, color: 'green' },
        { label: 'Avg. Read Time', value: `${Math.round((analytics.avgDuration || 0) / 60)}m`, icon: Clock, color: 'purple' },
        { label: 'Avg. Scroll Depth', value: `${analytics.avgScrollDepth || 0}%`, icon: MousePointerClick, color: 'orange' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                                    <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Top Referrers */}
            {analytics.topReferrers && analytics.topReferrers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ExternalLink className="w-5 h-5" />
                            Top Referrers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.topReferrers.map((ref, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{ref.referrer || 'Direct'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{ref.count} visits</span>
                                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${(ref.count / analytics.totalReads) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* UTM Campaigns */}
            {analytics.utmCampaigns && analytics.utmCampaigns.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Campaign Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.utmCampaigns.map((campaign, index) => (
                                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium">{campaign.campaign}</p>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{campaign.read_count} visits</span>
                                    </div>
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        {campaign.source && <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Source: {campaign.source}</span>}
                                        {campaign.medium && <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded">Medium: {campaign.medium}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reads Over Time */}
            {analytics.readsOverTime && analytics.readsOverTime.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Reads Over Time (Last 30 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.readsOverTime.map((day, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 w-24">{day.date}</span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full flex items-center justify-end pr-2"
                                            style={{ width: `${Math.min((day.read_count / Math.max(...analytics.readsOverTime.map(d => d.read_count))) * 100, 100)}%` }}
                                        >
                                            <span className="text-white text-xs font-medium">{day.read_count}</span>
                                        </div>
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
