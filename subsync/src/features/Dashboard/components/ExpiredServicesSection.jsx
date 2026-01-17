import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

function ExpiredServicesSection() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [expiredServices, setExpiredServices] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadExpiredServices();
    }, []);

    const loadExpiredServices = async () => {
        try {
            setLoading(true);
            const params = {};
            if (startDate) params.expiredStartDate = startDate;
            if (endDate) params.expiredEndDate = endDate;

            const response = await api.get('/dashboard/expired-services', { params });
            setExpiredServices(response.data);
        } catch (error) {
            console.error('Error loading expired services:', error);
            toast.error(error.normalizedMessage || 'Failed to load expired services');
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (subId) => {
        navigate(`/${user.username}/dashboard/subscriptions/${subId}`);
    };

    const handleFilter = () => {
        loadExpiredServices();
    };

    const handleClearFilter = () => {
        setStartDate('');
        setEndDate('');
        setTimeout(loadExpiredServices, 100);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Expired Services (Date Wise Filter)
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadExpiredServices}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {/* Date Filters */}
                <div className="mb-4 space-y-2">
                    <div className="flex gap-2 items-center">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            placeholder="Start Date"
                            className="w-40"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            placeholder="End Date"
                            className="w-40"
                        />
                        <Button size="sm" onClick={handleFilter}>
                            Filter
                        </Button>
                        {(startDate || endDate) && (
                            <Button size="sm" variant="outline" onClick={handleClearFilter}>
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Expired Services List */}
                {loading ? (
                    <div className="space-y-4">
                         <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                         </div>
                         <div className="space-y-2">
                             {[1, 2, 3].map((i) => (
                                 <Skeleton key={i} className="h-12 w-full" />
                             ))}
                         </div>
                    </div>
                ) : expiredServices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No expired services found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Expired Date</TableHead>
                                    <TableHead>Days Expired</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expiredServices.map((service) => (
                                    <TableRow
                                        key={service.sub_id}
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => handleRowClick(service.sub_id)}
                                    >
                                        <TableCell className="font-medium">{service.customer_name}</TableCell>
                                        <TableCell>{service.domain_name}</TableCell>
                                        <TableCell>{new Date(service.end_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className="text-red-600 font-semibold">
                                                {service.days_expired} {service.days_expired === 1 ? 'day' : 'days'}
                                            </span>
                                        </TableCell>
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

export default ExpiredServicesSection;

