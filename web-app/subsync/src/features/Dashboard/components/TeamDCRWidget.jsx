import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';

function TeamDCRWidget({ data }) {
    if (!data) return null;

    const { calls_per_user, top_categories } = data;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team DCR Performance (Today)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {calls_per_user && calls_per_user.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Calls by User</h4>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Calls</TableHead>
                                            <TableHead>Time (min)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {calls_per_user.map((user, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{user.user_name || user.username}</TableCell>
                                                <TableCell>{user.call_count}</TableCell>
                                                <TableCell>{user.total_minutes}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {top_categories && top_categories.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Top Categories</h4>
                            <div className="space-y-2">
                                {top_categories.slice(0, 5).map((cat, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span>{cat.category}</span>
                                        <span className="font-medium">{cat.call_count} calls</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default TeamDCRWidget;

