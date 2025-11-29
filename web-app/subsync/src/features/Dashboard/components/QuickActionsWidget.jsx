import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

function QuickActionsWidget({ data }) {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    if (!data || !data.actions || data.actions.length === 0) {
        return null;
    }

    const handleAction = async (action) => {
        if (action.path) {
            navigate(action.path);
        } else if (action.action === 'sendDcrReport') {
            try {
                const today = new Date().toISOString().split('T')[0];
                await api.post('/dcr/send-daily-report', { date: today });
                toast.success('DCR report sent successfully');
            } catch (error) {
                toast.error(error.normalizedMessage || 'Failed to send DCR report');
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-2">
                    {data.actions.map((action, idx) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleAction(action)}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default QuickActionsWidget;

