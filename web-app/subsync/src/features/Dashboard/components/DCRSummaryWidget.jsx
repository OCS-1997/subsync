import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function DCRSummaryWidget({ data }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    if (!data) return null;

    const { total_calls, total_time_hours, top_categories } = data;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    DCR Summary (Today)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total Calls</div>
                            <div className="text-2xl font-bold">{total_calls}</div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-sm text-muted-foreground">Time Spent</div>
                            <div className="text-2xl font-bold">{total_time_hours.toFixed(1)}h</div>
                        </div>
                    </div>

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

                    <button
                        onClick={() => navigate(`/${user.username}/dashboard/dcr`)}
                        className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        View All DCR Entries →
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}

export default DCRSummaryWidget;

