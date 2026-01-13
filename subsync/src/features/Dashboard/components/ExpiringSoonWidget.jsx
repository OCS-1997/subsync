import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function ExpiringSoonWidget({ data }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        Expiring Soon
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No subscriptions expiring in the next 7 days.</p>
                </CardContent>
            </Card>
        );
    }

    const handleRowClick = (subId) => {
        navigate(`/${user.username}/dashboard/subscriptions/${subId}`);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Expiring Soon (Next 7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Domain</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Days Left</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((sub) => (
                                <TableRow
                                    key={sub.sub_id}
                                    className="cursor-pointer hover:bg-muted"
                                    onClick={() => handleRowClick(sub.sub_id)}
                                >
                                    <TableCell className="font-medium">{sub.customer_name}</TableCell>
                                    <TableCell>{sub.domain_name}</TableCell>
                                    <TableCell>{new Date(sub.end_date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <span className={sub.days_left <= 3 ? 'text-red-600 font-semibold' : 'text-yellow-600'}>
                                            {sub.days_left} {sub.days_left === 1 ? 'day' : 'days'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default ExpiringSoonWidget;

