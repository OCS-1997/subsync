import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, TrendingUp, Clock, Users, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/axiosInstance';
import { toast } from 'react-toastify';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

function DCRWidget() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dcrData, setDcrData] = useState(null);

    useEffect(() => {
        loadDCRData();
    }, []);

    const handleViewAll = () => {
        navigate('dcr/new');
    };

    const loadDCRData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dcr/stats');
            setDcrData(response.data);
        } catch (err) {
            console.error('Error fetching DCR data:', err);
            toast.error('Failed to load DCR statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        DCR Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-48" />
                </CardContent>
            </Card>
        );
    }

    if (!dcrData) {
        return null;
    }

    const { summary, callTypeDistribution, dailyActivity, topDomains } = dcrData;

    return (
        <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Phone className="w-6 h-6" />
                        DCR Overview
                    </CardTitle>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleViewAll}
                        className="bg-white text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                    >
                        New DCR
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg shadow-md hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Total Calls</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                            {summary?.totalCalls || 0}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg shadow-md hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                            <p className="text-xs font-medium text-purple-800 dark:text-purple-200">Total Time</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {summary?.totalHours || 0}h
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 p-4 rounded-lg shadow-md hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-300" />
                            <p className="text-xs font-medium text-green-800 dark:text-green-200">Avg/Day</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {summary?.avgPerDay || 0}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg shadow-md hover:scale-105 transition-transform duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                            <p className="text-xs font-medium text-orange-800 dark:text-orange-200">Contacts</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                            {summary?.uniqueContacts || 0}
                        </p>
                    </div>
                </div>

                {/* Call Type Distribution */}
                {callTypeDistribution && callTypeDistribution.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                            Call Type Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={callTypeDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={800}
                                >
                                    {callTypeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Daily Activity */}
                {dailyActivity && dailyActivity.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                            Daily Activity (Last 7 Days)
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={dailyActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="calls"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    animationBegin={0}
                                    animationDuration={1000}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Top Domains */}
                {topDomains && topDomains.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
                            Top Domains
                        </h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={topDomains}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="domain" />
                                <YAxis />
                                <Tooltip />
                                <Bar
                                    dataKey="count"
                                    fill="#8b5cf6"
                                    radius={[8, 8, 0, 0]}
                                    animationBegin={0}
                                    animationDuration={1000}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default DCRWidget;
