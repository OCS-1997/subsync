import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { RefreshCw } from 'lucide-react';
import { useSelector } from 'react-redux';
import SplitText from '@/components/animations/SplitText.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

import RenewalsSection from '../components/RenewalsSection.jsx';
import ExpiredServicesSection from '../components/ExpiredServicesSection.jsx';
import BirthdayAlertsWidget from '../components/BirthdayAlertsWidget.jsx';
import DCRWidget from '../components/DCRWidget.jsx';

function DashboardHome() {
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/dashboard');
            setDashboardData(response.data);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(err.normalizedMessage || 'Failed to load dashboard data');
            toast.error(err.normalizedMessage || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="bg-blue-500 text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">
                            <SplitText text={`Hello ${user.name}!`} />
                        </CardTitle>
                    </CardHeader>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Card className="bg-blue-500 text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold">
                            <SplitText text={`Hello ${user.name}!`} />
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Error Loading Dashboard</CardTitle>
                    </CardHeader>
                    <CardHeader>
                        <p className="text-red-600">{error}</p>
                        <Button onClick={loadDashboardData} className="mt-4">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </Button>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-blue-500 text-primary-foreground">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-3xl font-bold">
                        <SplitText text={`Hello ${user.name}!`} />
                    </CardTitle>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadDashboardData}
                        className="text-blue-500"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </CardHeader>
            </Card>

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Renewals (Main Panel) */}
                <div className="lg:col-span-2 space-y-6">
                    <RenewalsSection />
                    <ExpiredServicesSection />
                </div>

                {/* Right Column - Alerts & DCR */}
                <div className="space-y-6">
                    <BirthdayAlertsWidget data={dashboardData?.birthdays} />
                    <DCRWidget />
                </div>
            </div>
        </div>
    );
}

export default DashboardHome;
