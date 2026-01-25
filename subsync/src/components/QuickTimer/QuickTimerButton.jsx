import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Timer, Play, Square, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import TimeEntryForm from '@/features/TimeTracking/components/TimeEntryForm';
import api from '@/lib/axiosInstance.js';

const QuickTimerButton = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const intervalRef = useRef(null);
    const lastSyncRef = useRef(null);

    // Check for active timer on mount and when dialog opens
    useEffect(() => {
        checkActiveTimer();
        
        // Refresh timer every 30 seconds in background
        const refreshInterval = setInterval(() => {
            if (!dialogOpen) {
                checkActiveTimer();
            }
        }, 30000);

        const handleCustomUpdate = () => {
            checkActiveTimer();
        };

        window.addEventListener('timeTrackingUpdated', handleCustomUpdate);
        return () => {
            clearInterval(refreshInterval);
            window.removeEventListener('timeTrackingUpdated', handleCustomUpdate);
        };
    }, []);

    useEffect(() => {
        if (dialogOpen) {
            fetchData();
            checkActiveTimer();
        }
    }, [dialogOpen]);

    // Handle Page Visibility API - sync when page becomes visible
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && activeTimer) {
                // Page became visible again, sync with server
                checkActiveTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [activeTimer]);

    // Live timer countdown
    useEffect(() => {
        if (activeTimer) {
            // Calculate initial elapsed time
            const startTime = new Date(activeTimer.start_time).getTime();
            const now = Date.now();
            const initialElapsed = Math.max(0, Math.floor((now - startTime) / 1000)); // in seconds, never negative
            
            setElapsedTime(initialElapsed);
            lastSyncRef.current = now;

            // Update timer every second
            intervalRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
                
                // Sync with server every 5 minutes
                const timeSinceSync = Date.now() - lastSyncRef.current;
                if (timeSinceSync >= 300000) { // 5 minutes
                    checkActiveTimer();
                }
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setElapsedTime(0);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [activeTimer]);

    const fetchData = async () => {
        try {
            const [customersRes, projectsRes, categoriesRes] = await Promise.all([
                api.get('/all-customers?limit=1000'),
                api.get('/time-tracking/projects'),
                api.get('/time-tracking/categories')
            ]);
            setCustomers(customersRes.data.customers || []);
            setProjects(projectsRes.data.projects || []);
            setCategories(categoriesRes.data.categories || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const checkActiveTimer = async () => {
        try {
            const response = await api.get('/time-tracking/timer/active');
            setActiveTimer(response.data.active_timer);
            if (response.data.active_timer) {
                lastSyncRef.current = Date.now();
            }
        } catch (error) {
            console.error('Error checking active timer:', error);
        }
    };

    const handleStopTimer = async () => {
        if (!activeTimer) return;

        try {
            await api.post(`/time-tracking/timer/stop/${activeTimer.entry_id}`);
            toast.success('Timer stopped!');
            setActiveTimer(null);
            setElapsedTime(0);
            checkActiveTimer(); // Refresh
            window.dispatchEvent(new CustomEvent('timeTrackingUpdated'));
        } catch (error) {
            console.error('Error stopping timer:', error);
            toast.error('Failed to stop timer');
        }
    };

    const handleSubmit = async (entryData, isTimer = false) => {
        try {
            if (isTimer) {
                await api.post('/time-tracking/timer/start', entryData);
                toast.success('Timer started!');
                await checkActiveTimer(); // Refresh active timer
            } else {
                await api.post('/time-tracking/entries', entryData);
                toast.success('Time entry saved!');
            }
            setDialogOpen(false);
        } catch (error) {
            console.error('Error saving time entry:', error);
            toast.error(error.response?.data?.error || 'Failed to save time entry');
        }
    };

    // Format seconds to HH:MM:SS
    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {activeTimer ? (
                // Active timer display
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer group"
                    onClick={() => setDialogOpen(true)}
                >
                    <div className="relative">
                        <Timer className="h-4 w-4 text-blue-500" />
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                            {formatTime(elapsedTime)}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-500/20 rounded-full"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStopTimer();
                        }}
                    >
                        <Square className="h-3 w-3 text-red-500" />
                    </Button>
                </div>
            ) : (
                // Start timer button (when no active timer)
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-colors border border-transparent hover:border-green-500/20"
                    onClick={() => setDialogOpen(true)}
                    title="Start Time Tracking"
                >
                    <Play className="h-5 w-5" />
                </Button>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-slate-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Time Tracker
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {activeTimer ? 'Manage your running timer' : 'Start tracking time or log manually'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    {activeTimer ? (
                        <div className="space-y-4">
                            {/* Active Timer Display */}
                            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Currently Tracking</p>
                                        <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeTimer.title}</h3>
                                        {activeTimer.description && (
                                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{activeTimer.description}</p>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-full bg-white dark:bg-blue-950 border-4 border-blue-500 flex items-center justify-center shadow-lg">
                                            <Timer className="h-8 w-8 text-blue-500 animate-pulse" />
                                        </div>
                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse"></span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Elapsed Time</p>
                                        <p className="text-3xl font-mono font-bold text-blue-900 dark:text-blue-100 tabular-nums">
                                            {formatTime(elapsedTime)}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleStopTimer}
                                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
                                    >
                                        <Square className="h-4 w-4 mr-2" />
                                        Stop Timer
                                    </Button>
                                </div>
                            </div>

                            {/* Timer Details */}
                            <div className="grid grid-cols-2 gap-4">
                                {activeTimer.project_name && (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Project</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activeTimer.project_name}</p>
                                    </div>
                                )}
                                {activeTimer.customer_name && (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Customer</p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{activeTimer.customer_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <TimeEntryForm
                            onSubmit={handleSubmit}
                            customers={customers}
                            projects={projects}
                            categories={categories}
                            compact={true}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default QuickTimerButton;
