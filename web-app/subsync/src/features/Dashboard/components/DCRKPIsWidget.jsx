import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Phone } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

function DCRKPIsWidget({ data }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    if (!data) return null;

    const { total_calls, total_time_hours, calls_per_user, calls_per_category, time_per_company } = data;

    const categoryData = (calls_per_category || []).slice(0, 10).map(cat => ({
        name: cat.category,
        calls: cat.call_count,
        minutes: cat.total_minutes
    }));

    const userData = (calls_per_user || []).slice(0, 10).map(user => ({
        name: user.user_name || user.username,
        calls: user.call_count,
        minutes: user.total_minutes
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    DCR - All KPIs (Today)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Calls</div>
                            <div className="text-2xl font-bold">{total_calls}</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Time</div>
                            <div className="text-2xl font-bold">{total_time_hours.toFixed(1)}h</div>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Active Users</div>
                            <div className="text-2xl font-bold">{calls_per_user?.length || 0}</div>
                        </div>
                    </div>

                    {/* Charts */}
                    {categoryData.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Calls by Category</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="calls" fill="#8884d8" name="Calls" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {userData.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Calls by User</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={userData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="calls" fill="#82CA9D" name="Calls" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Top Categories Pie Chart */}
                    {categoryData.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Category Distribution</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="calls"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Top Companies */}
                    {time_per_company && time_per_company.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Top Companies by Time</h4>
                            <div className="space-y-2">
                                {time_per_company.slice(0, 10).map((company, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                        <span>{company.company}</span>
                                        <span className="font-medium">{company.total_minutes} min ({company.call_count} calls)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => navigate(`/${user.username}/dashboard/dcr`)}
                        className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        View All DCR Entries →
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

export default DCRKPIsWidget;

