import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/axiosInstance.js';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const DCRStats = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [dateRange, setDateRange] = useState({
        start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadStats();
    }, [dateRange]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: dateRange.start_date,
                end_date: dateRange.end_date
            };
            const res = await api.get('/dcr/stats', { params });
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load stats', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-4">Loading stats...</div>;
    }

    if (!stats) {
        return <div className="p-4">No data available</div>;
    }

    const categoryTimeData = stats.callsPerCategory.map(cat => ({
        name: cat.category,
        value: cat.total_minutes
    }));

    const categoryCallsData = stats.callsPerCategory.map(cat => ({
        name: cat.category,
        calls: cat.call_count
    }));

    const userTimeData = stats.callsPerUser.map(user => ({
        name: user.user_name,
        minutes: user.total_minutes
    }));

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">DCR Statistics</h1>

            {/* Date Range Filter */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-md">
                <div>
                    <label className="text-sm font-medium mb-1 block">Start Date</label>
                    <Input
                        type="date"
                        value={dateRange.start_date}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">End Date</label>
                    <Input
                        type="date"
                        value={dateRange.end_date}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalCalls}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalTimeHours} hours</div>
                        <div className="text-sm text-gray-500">{stats.totalTimeMinutes} minutes</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.callsPerUser.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Time Spent per Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryTimeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryTimeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Calls per Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryCallsData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="calls" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Time Spent per User</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={userTimeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="minutes" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default DCRStats;

