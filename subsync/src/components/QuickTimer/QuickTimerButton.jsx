import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Timer, PlayCircle, Square, Clock } from 'lucide-react';
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer group shadow-sm"
                    onClick={() => setDialogOpen(true)}
                >
                    <div className="relative">
                        <Timer className="h-4 w-4 text-blue-500" />
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-black text-blue-600 dark:text-blue-400 tabular-nums uppercase tracking-tighter">
                            {formatTime(elapsedTime)}
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-red-500/20 rounded-full transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleStopTimer();
                        }}
                    >
                        <Square className="h-2.5 w-2.5 text-red-500 fill-current" />
                    </Button>
                </div>
            ) : (
                // Start timer button (when no active timer)
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-emerald-500/10 group active:scale-95 shrink-0"
                    onClick={() => setDialogOpen(true)}
                    title="Quick Launch Timer"
                >
                    <PlayCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-emerald-500/10 group-hover:fill-emerald-500/20 group-hover:scale-110 transition-all" />
                </Button>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-5xl p-0 overflow-hidden dark:bg-slate-950 border-none shadow-2xl rounded-[2.5rem]">
                    <div className="flex flex-col h-full max-h-[90vh]">
                        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white">
                                    <div className="h-10 w-10 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Timer className="h-5 w-5 text-white" />
                                    </div>
                                    Sync Hub
                                </DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {activeTimer ? 'Mission in progress' : 'Ready for deployment'}
                                </DialogDescription>
                            </div>
                            
                            {activeTimer && (
                                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-6 py-3 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Runtime</span>
                                        <span className="text-xl font-mono font-black text-blue-500 tabular-nums">
                                            {formatTime(elapsedTime)}
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleStopTimer}
                                        className="h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-red-500/20 transition-all"
                                    >
                                        <Square className="h-3 w-3 mr-2 fill-current" />
                                        Stop / Log Session
                                    </Button>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar-minimal bg-slate-50/30 dark:bg-slate-900/10">
                            {activeTimer ? (
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm">
                                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Target Objective</p>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{activeTimer.title}</h3>
                                                {activeTimer.description && (
                                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-4 leading-relaxed line-clamp-3">
                                                        {activeTimer.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-6">
                                                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                                                    <Clock className="h-6 w-6 text-indigo-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Assignment</p>
                                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                                        {activeTimer.project_name || 'Individual Task'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 flex items-center gap-6">
                                                <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                                                    <Timer className="h-6 w-6 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Client Entity</p>
                                                    <p className="text-base font-black text-slate-900 dark:text-white">
                                                        {activeTimer.customer_name || 'Internal Operations'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-100 dark:border-slate-800">
                                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                            System Status: Live Tracking
                                        </p>
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
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default QuickTimerButton;
