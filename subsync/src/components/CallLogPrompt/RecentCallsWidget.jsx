import React, { useState, useEffect } from 'react';
import { Phone, Clock, User, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRecentCalls, removeRecentCall, clearRecentCalls } from './services/callLogService';
import CallLogPrompt from './CallLogPrompt';

/**
 * RecentCallsWidget - Displays skipped/missed calls for later logging
 * Shows in dashboard or a dedicated section
 */
export default function RecentCallsWidget() {
    const [recentCalls, setRecentCalls] = useState([]);
    const [selectedCall, setSelectedCall] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    // Load recent calls
    useEffect(() => {
        loadRecentCalls();

        // Listen for updates
        const handleUpdate = () => loadRecentCalls();
        window.addEventListener('recentCallsUpdated', handleUpdate);
        window.addEventListener('callLogged', handleUpdate);

        return () => {
            window.removeEventListener('recentCallsUpdated', handleUpdate);
            window.removeEventListener('callLogged', handleUpdate);
        };
    }, []);

    const loadRecentCalls = () => {
        const calls = getRecentCalls();
        // Filter out already logged calls
        const unlogged = calls.filter(call => !call.logged);
        setRecentCalls(unlogged);
    };

    const handleLogCall = (call) => {
        setSelectedCall(call);
        setShowPrompt(true);
    };

    const handleRemoveCall = (callId) => {
        removeRecentCall(callId);
    };

    const handleClearAll = () => {
        if (confirm('Clear all recent calls?')) {
            clearRecentCalls();
        }
    };

    if (recentCalls.length === 0) {
        return null; // Don't show widget if no recent calls
    }

    return (
        <>
            <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                <CardHeader className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-500/20 p-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Recent Calls ({recentCalls.length})
                        </CardTitle>
                        {recentCalls.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAll}
                                className="text-xs font-bold text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="space-y-2">
                        {recentCalls.map((call) => (
                            <div
                                key={call.id}
                                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                            >
                                <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                        call.callType === 'incoming' 
                                            ? 'bg-green-100 dark:bg-green-900/20' 
                                            : 'bg-blue-100 dark:bg-blue-900/20'
                                    }`}>
                                        <Phone className={`w-5 h-5 ${
                                            call.callType === 'incoming' 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-blue-600 dark:text-blue-400'
                                        } ${call.callType === 'outgoing' ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {call.contactName || call.phoneNumber}
                                        </p>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase">
                                            {call.callType}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {Math.floor(call.duration / 60)}m {call.duration % 60}s
                                        </span>
                                        <span>
                                            {new Date(call.timestamp).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-shrink-0 flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleLogCall(call)}
                                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                        Log
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemoveCall(call.id)}
                                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Call Log Prompt */}
            {selectedCall && (
                <CallLogPrompt
                    callData={selectedCall}
                    open={showPrompt}
                    onClose={() => {
                        setShowPrompt(false);
                        setSelectedCall(null);
                    }}
                    onSkip={(call) => {
                        // Already in recent calls, just close
                        setShowPrompt(false);
                        setSelectedCall(null);
                    }}
                />
            )}
        </>
    );
}
