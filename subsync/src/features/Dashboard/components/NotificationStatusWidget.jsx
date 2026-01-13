import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Mail } from 'lucide-react';
import KPICard from './KPICard.jsx';

function NotificationStatusWidget({ data }) {
    if (!data) return null;

    const { total, sent, failed, queued, success_rate } = data;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Notification Status (Last 24h)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KPICard
                            title="Total"
                            value={total}
                            className="border-gray-200 bg-gray-50"
                        />
                        <KPICard
                            title="Sent"
                            value={sent}
                            className="border-green-200 bg-green-50"
                        />
                        <KPICard
                            title="Failed"
                            value={failed}
                            className="border-red-200 bg-red-50"
                        />
                        <KPICard
                            title="Queued"
                            value={queued}
                            className="border-yellow-200 bg-yellow-50"
                        />
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                        <div className="text-2xl font-bold">{success_rate}%</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default NotificationStatusWidget;

