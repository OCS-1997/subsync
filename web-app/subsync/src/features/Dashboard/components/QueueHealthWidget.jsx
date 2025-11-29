import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';

function QueueHealthWidget({ data }) {
    if (!data) return null;

    if (data.error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Queue Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-600">{data.error}</p>
                </CardContent>
            </Card>
        );
    }

    const queues = [
        { name: 'Subscription Reminders', data: data.subscription_reminders },
        { name: 'DCR Daily Report', data: data.dcr_daily_report },
        { name: 'PDF Generation', data: data.pdf_generation }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Queue Health
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {queues.map((queue, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                            <h4 className="font-semibold mb-2">{queue.name}</h4>
                            <div className="grid grid-cols-5 gap-2 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Active</div>
                                    <Badge variant="default">{queue.data.active}</Badge>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Waiting</div>
                                    <Badge variant="secondary">{queue.data.waiting}</Badge>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Completed</div>
                                    <Badge variant="outline" className="bg-green-50">{queue.data.completed}</Badge>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Failed</div>
                                    <Badge variant="destructive">{queue.data.failed}</Badge>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Delayed</div>
                                    <Badge variant="outline" className="bg-yellow-50">{queue.data.delayed}</Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default QueueHealthWidget;

