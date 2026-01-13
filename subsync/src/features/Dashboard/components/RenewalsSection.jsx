import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

function RenewalsSection() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [renewals, setRenewals] = useState([]);
    const [expiringTodayCount, setExpiringTodayCount] = useState(0);
    const [filterType, setFilterType] = useState('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        loadRenewals();
    }, [filterType, customStartDate, customEndDate]);

    const loadRenewals = async () => {
        try {
            setLoading(true);
            const params = { filterType };
            if (filterType === 'custom' && customStartDate && customEndDate) {
                params.startDate = customStartDate;
                params.endDate = customEndDate;
            }
            const response = await api.get('/dashboard/renewals', { params });
            setRenewals(response.data);

            // Get expiring today count
            const dashboardResponse = await api.get('/dashboard');
            setExpiringTodayCount(dashboardResponse.data.renewals?.expiringTodayCount || 0);
        } catch (error) {
            console.error('Error loading renewals:', error);
            toast.error(error.normalizedMessage || 'Failed to load renewals');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (subId) => {
        navigate(`/${user.username}/dashboard/subscriptions/${subId}`);
    };

    const getStatusBadge = (renewal) => {
        if (renewal.renewal_status === 'expired') {
            return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Expired</span>;
        }
        if (renewal.renewal_status === 'today') {
            return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">Today</span>;
        }
        if (renewal.renewal_status === 'soon') {
            return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">Soon</span>;
        }
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Upcoming</span>;
    };

    return (
        <Card className="col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Renewals
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={loadRenewals}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Filters */}
                <div className="mb-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filterType === 'today' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('today')}
                        >
                            Expiring Today ({expiringTodayCount})
                        </Button>
                        <Button
                            variant={filterType === 'expired' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('expired')}
                        >
                            Expired
                        </Button>
                        <Button
                            variant={filterType === 'current' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('current')}
                        >
                            Current Due Date
                        </Button>
                        <Button
                            variant={filterType === 'custom' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterType('custom')}
                        >
                            Custom Date
                        </Button>
                    </div>

                    {filterType === 'custom' && (
                        <div className="flex gap-2 items-center">
                            <Input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                placeholder="Start Date"
                                className="w-40"
                            />
                            <span>to</span>
                            <Input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                placeholder="End Date"
                                className="w-40"
                            />
                            <Button
                                size="sm"
                                onClick={loadRenewals}
                                disabled={!customStartDate || !customEndDate}
                            >
                                Apply
                            </Button>
                        </div>
                    )}
                </div>

                {/* Renewals List */}
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : renewals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No renewals found for the selected filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Days Left</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {renewals.map((renewal) => (
                                    <TableRow
                                        key={renewal.sub_id}
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => handleRowClick(renewal.sub_id)}
                                    >
                                        <TableCell className="font-medium">{renewal.customer_name}</TableCell>
                                        <TableCell>{renewal.domain_name}</TableCell>
                                        <TableCell>{new Date(renewal.end_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={renewal.days_left < 0 ? 'text-red-600 font-semibold' : renewal.days_left === 0 ? 'text-yellow-600 font-semibold' : ''}>
                                                {renewal.days_left < 0 ? `${Math.abs(renewal.days_left)} days ago` : renewal.days_left === 0 ? 'Today' : `${renewal.days_left} days`}
                                            </span>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(renewal)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default RenewalsSection;

