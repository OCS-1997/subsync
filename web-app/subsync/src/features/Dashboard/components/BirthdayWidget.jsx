import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';

function BirthdayWidget({ data }) {
    if (!data) return null;

    const { today, upcoming } = data;

    const allBirthdays = [
        ...(today || []).map(b => ({ ...b, isToday: true })),
        ...(upcoming || []).map(b => ({ ...b, isToday: false }))
    ];

    if (allBirthdays.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Birthdays
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No birthdays in the next 7 days.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Birthdays
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {allBirthdays.map((person, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-lg border ${person.isToday
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-blue-50 border-blue-200'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-semibold">{person.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {person.type === 'user' ? 'Team Member' : 'Customer'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    {person.isToday ? (
                                        <Badge variant="default" className="bg-yellow-500">Today!</Badge>
                                    ) : (
                                        <Badge variant="outline">
                                            {person.days_until === 0
                                                ? 'Tomorrow'
                                                : `${person.days_until} ${person.days_until === 1 ? 'day' : 'days'}`}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default BirthdayWidget;

