import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Package } from 'lucide-react';
import KPICard from './KPICard.jsx';

function SubscriptionStatusWidget({ data }) {
    if (!data) return null;

    const { active, soon_expiring, expired } = data;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Subscription Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                        title="Active"
                        value={active}
                        className="border-green-200 bg-green-50"
                    />
                    <KPICard
                        title="Expiring Soon"
                        value={soon_expiring}
                        className="border-yellow-200 bg-yellow-50"
                    />
                    <KPICard
                        title="Expired"
                        value={expired}
                        className="border-red-200 bg-red-50"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

export default SubscriptionStatusWidget;

