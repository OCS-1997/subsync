import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function DCRTrendsWidget({ data }) {
    if (!data) return null;

    const { calls_per_category } = data;

    const chartData = calls_per_category?.slice(0, 10).map(cat => ({
        name: cat.category,
        calls: cat.call_count,
        minutes: cat.total_minutes
    })) || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    DCR Trends (Last 30 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Calls</div>
                            <div className="text-2xl font-bold">{data.total_calls}</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Time</div>
                            <div className="text-2xl font-bold">{data.total_time_hours.toFixed(1)}h</div>
                        </div>
                    </div>

                    {chartData.length > 0 && (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="calls" fill="#8884d8" name="Calls" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default DCRTrendsWidget;

