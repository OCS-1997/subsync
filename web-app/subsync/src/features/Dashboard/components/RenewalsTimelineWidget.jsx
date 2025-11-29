import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Calendar } from 'lucide-react';
import KPICard from './KPICard.jsx';

function RenewalsTimelineWidget({ data }) {
    if (!data) return null;

    const { next_30_days, next_60_days, next_90_days } = data;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Renewals Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                        title="Next 30 Days"
                        value={next_30_days}
                        subtitle="Renewals due soon"
                        className="border-blue-200 bg-blue-50"
                    />
                    <KPICard
                        title="Next 60 Days"
                        value={next_60_days}
                        subtitle="Upcoming renewals"
                        className="border-purple-200 bg-purple-50"
                    />
                    <KPICard
                        title="Next 90 Days"
                        value={next_90_days}
                        subtitle="Future renewals"
                        className="border-indigo-200 bg-indigo-50"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export default RenewalsTimelineWidget;

