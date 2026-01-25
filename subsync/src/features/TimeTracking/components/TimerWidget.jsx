import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Clock, ArrowRight, Timer } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

const TimerWidget = ({ onTimerUpdate }) => {
    const [activeTimer, setActiveTimer] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch active timer on mount
    useEffect(() => {
        fetchActiveTimer();

        const handleCustomUpdate = () => {
            fetchActiveTimer();
        };

        window.addEventListener('timeTrackingUpdated', handleCustomUpdate);
        return () => window.removeEventListener('timeTrackingUpdated', handleCustomUpdate);
    }, []);

    // Update elapsed time every second
    useEffect(() => {
        let interval;
        if (activeTimer) {
            interval = setInterval(() => {
                const start = new Date(activeTimer.start_time);
                const now = new Date();
                const elapsed = Math.floor((now - start) / 1000); // seconds
                setElapsedTime(elapsed);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTimer]);

    const fetchActiveTimer = async () => {
        try {
            const response = await api.get('/time-tracking/timer/active');
            if (response.data.active_timer) {
                setActiveTimer(response.data.active_timer);
                const start = new Date(response.data.active_timer.start_time);
                const now = new Date();
                setElapsedTime(Math.floor((now - start) / 1000));
            } else {
                setActiveTimer(null);
                setElapsedTime(0);
            }
        } catch (error) {
            console.error('Error fetching active timer:', error);
        }
    };

    const handleStopTimer = async () => {
        if (!activeTimer) return;

        setIsLoading(true);
        try {
            const response = await api.post(`/time-tracking/timer/stop/${activeTimer.entry_id}`);
            toast.success(`Timer stopped! Duration: ${formatDuration(response.data.duration_minutes * 60)}`);
            setActiveTimer(null);
            setElapsedTime(0);
            if (onTimerUpdate) onTimerUpdate();
            window.dispatchEvent(new CustomEvent('timeTrackingUpdated'));
        } catch (error) {
            console.error('Error stopping timer:', error);
            toast.error('Failed to stop timer');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!activeTimer) {
        return (
            <Card className="dark:bg-slate-900/50 dark:border-slate-800 rounded-[2rem] border-dashed border-gray-200 shadow-sm overflow-hidden">
                <CardContent className="pt-10 pb-10">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
                            <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">Standby Mode</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">No active tracking sessions</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-blue-600 to-blue-800 relative group animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Timer size={120} className="text-white" />
            </div>
            
            <CardHeader className="pb-0 relative z-10 p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/80">Live Session</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1 border border-white/20">
                        <span className="text-xs font-black text-white font-mono tracking-widest">
                            {formatDuration(elapsedTime)}
                        </span>
                    </div>
                </div>
                <CardTitle className="text-2xl font-black text-white mt-4 leading-tight">
                    {activeTimer.title}
                </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10 p-8 pt-4">
                <div className="space-y-4">
                    {activeTimer.description && (
                        <p className="text-sm text-blue-100/70 font-medium line-clamp-2 leading-relaxed">
                            {activeTimer.description}
                        </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                        {activeTimer.activity_type_name && (
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/10 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTimer.activity_color || '#fff' }}></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{activeTimer.activity_type_name}</span>
                            </div>
                        )}
                        {activeTimer.customer_name && (
                            <div className="bg-blue-900/40 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-white/5 flex items-center gap-2">
                                <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">{activeTimer.customer_name}</span>
                            </div>
                        )}
                        {activeTimer.is_billable && (
                            <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-emerald-500/30 flex items-center gap-2">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Billable</span>
                            </div>
                        )}
                    </div>
                </div>

                <Button 
                    onClick={handleStopTimer} 
                    disabled={isLoading}
                    className="w-full h-14 bg-white hover:bg-red-50 text-blue-900 hover:text-red-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all duration-300 active:scale-95 group"
                >
                    <Square className="mr-3 h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
                    Terminate Session
                </Button>
            </CardContent>
        </Card>
    );
};

export default TimerWidget;

