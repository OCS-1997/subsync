import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';

const AdminDCRActions = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastReport, setLastReport] = useState(null);

    const handleSendReport = async () => {
        if (!reportDate) {
            toast.error('Please select a date');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/dcr/send-daily-report', { date: reportDate });
            toast.success(`Report sent successfully! Total calls: ${res.data.totalCalls}, Total time: ${res.data.totalTime} hours`);
            setLastReport({
                date: reportDate,
                totalCalls: res.data.totalCalls,
                totalTime: res.data.totalTime
            });
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to send report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">DCR Admin Actions</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Send Daily Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="reportDate">Report Date</Label>
                        <Input
                            id="reportDate"
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Select the date for which you want to generate and send the report
                        </p>
                    </div>

                    <Button
                        onClick={handleSendReport}
                        disabled={loading}
                        className="w-full"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {loading ? 'Sending...' : 'Send Report Now'}
                    </Button>

                    {lastReport && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="font-semibold mb-2">Last Report Sent:</h3>
                            <p><strong>Date:</strong> {lastReport.date}</p>
                            <p><strong>Total Calls:</strong> {lastReport.totalCalls}</p>
                            <p><strong>Total Time:</strong> {lastReport.totalTime} hours</p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="font-semibold mb-2">Automatic Reports</h3>
                        <p className="text-sm">
                            Daily reports are automatically sent at 6 PM IST (12:00 UTC) to{' '}
                            <strong>hari@ocsindia.net</strong>
                        </p>
                        <p className="text-sm mt-2">
                            Use this manual trigger to send reports for specific dates or to resend reports.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDCRActions;

