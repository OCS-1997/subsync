import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Play, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const TimeTrackingDashboardWidget = () => {
    const [summary, setSummary] = useState(null);
    const [activeTimer, setActiveTimer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const now = new Date();
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

            const [summaryRes, timerRes] = await Promise.all([
                axios.get('/api/time-tracking/reports', {
                    params: {
                        start_date: weekStart.toISOString(),
                        end_date: weekEnd.toISOString()
                    }
                }),
                axios.get('/api/time-tracking/timer/active')
            ]);

            setSummary(summaryRes.data);
            setActiveTimer(timerRes.data.active_timer);
        } catch (error) {
            console.error('Error fetching time tracking data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatHours = (minutes) => {
        if (!minutes) return '0h';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Time Tracking
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Time Tracking
                    </CardTitle>
                    {activeTimer && (
                        <Badge variant="destructive" className="animate-pulse">
                            <Play className="h-3 w-3 mr-1" />
                            Timer Active
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* This Week Summary */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">This Week</span>
                        <span className="text-2xl font-bold">
                            {formatHours(summary?.total_minutes || 0)}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-50 dark:bg-green-950 p-2 rounded">
                            <div className="text-muted-foreground">Billable</div>
                            <div className="font-semibold text-green-700 dark:text-green-400">
                                {formatHours(summary?.billable_minutes || 0)}
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                            <div className="text-muted-foreground">Non-billable</div>
                            <div className="font-semibold">
                                {formatHours(summary?.non_billable_minutes || 0)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Timer Info */}
                {activeTimer && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium mb-1">{activeTimer.title}</div>
                        <div className="text-xs text-muted-foreground">
                            Started {format(new Date(activeTimer.start_time), 'HH:mm')}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="pt-2">
                    <Link to="/time-tracking">
                        <Button className="w-full" size="sm">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View Details
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
};

export default TimeTrackingDashboardWidget;
