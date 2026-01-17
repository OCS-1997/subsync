import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Calendar, RefreshCw, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

function RenewalsSection() {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [renewals, setRenewals] = useState([]);
    const [expiringTodayCount, setExpiringTodayCount] = useState(0);
    const [filterType, setFilterType] = useState('today');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [sendingReminder, setSendingReminder] = useState(null);



    // Send reminder email for a subscription
    const sendReminder = async (subId, e) => {
        e.stopPropagation(); // Prevent navigation
        try {
            setSendingReminder(subId);
            const response = await api.post(`/subscription/${subId}/reminder`);
            if (response.data.success) {
                toast.success('Reminder email sent successfully!');
            } else {
                toast.error(response.data.error || 'Failed to send reminder');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            toast.error(error.response?.data?.error || 'Failed to send reminder email');
        } finally {
            setSendingReminder(null);
        }
    };

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
                    <div className="space-y-4">
                         <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-full" />
                         </div>
                         <div className="space-y-2">
                             {[1, 2, 3, 4, 5].map((i) => (
                                 <Skeleton key={i} className="h-12 w-full" />
                             ))}
                         </div>
                    </div>
                ) : renewals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No renewals found for the selected filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <TooltipProvider delayDuration={200}>
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
                                        <Tooltip key={renewal.sub_id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
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
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="left"
                                                align="center"
                                                sideOffset={8}
                                                collisionPadding={20}
                                                className="max-w-sm bg-slate-900 dark:bg-slate-800 border-slate-700 p-4 rounded-xl z-50 shadow-xl"
                                            >
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm font-bold text-white">{renewal.domain_name}</p>
                                                        <p className="text-[10px] text-slate-400">{renewal.customer_name}</p>
                                                    </div>

                                                    {/* Services List */}
                                                    {renewal.services && renewal.services.length > 0 && (
                                                        <div>
                                                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">Services</p>
                                                            <div className="space-y-1">
                                                                {renewal.services.slice(0, 4).map((service, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-slate-800/50">
                                                                        <span className="text-slate-300 truncate max-w-[140px]">{service.service_name || 'Unnamed Service'}</span>
                                                                        <span className="text-emerald-400 font-bold shrink-0 ml-2">₹{service.amount || service.rate || 0}</span>
                                                                    </div>
                                                                ))}
                                                                {renewal.services.length > 4 && (
                                                                    <p className="text-[9px] text-slate-500 text-center">+{renewal.services.length - 4} more services</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Status & Dates */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="p-2 rounded-lg bg-slate-800/50">
                                                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Start</p>
                                                            <p className="text-xs text-slate-300">{renewal.start_date ? new Date(renewal.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-slate-800/50">
                                                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">End</p>
                                                            <p className={cn(
                                                                "text-xs font-bold",
                                                                renewal.days_left < 0 ? "text-rose-400" : renewal.days_left <= 7 ? "text-amber-400" : "text-blue-400"
                                                            )}>
                                                                {renewal.end_date ? new Date(renewal.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Total Info */}
                                                    {renewal.total && (
                                                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                                                            <div>
                                                                <span className="text-[9px] text-slate-500 block">Total Value</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-emerald-400">₹{parseFloat(renewal.total).toLocaleString('en-IN')}</span>
                                                        </div>
                                                    )}

                                                    {/* Send Reminder Button */}
                                                    <Button
                                                        size="sm"
                                                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg h-8"
                                                        onClick={(e) => sendReminder(renewal.sub_id, e)}
                                                        disabled={sendingReminder === renewal.sub_id}
                                                    >
                                                        {sendingReminder === renewal.sub_id ? (
                                                            <>
                                                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                                Sending...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Mail className="w-3 h-3 mr-2" />
                                                                Send Reminder Email
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </TableBody>
                            </Table>
                        </TooltipProvider>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default RenewalsSection;

