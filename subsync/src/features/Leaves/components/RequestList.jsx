import React from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RequestList = ({ requests, type = 'leave', onAction }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'rejected': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
        }
    };

    if (requests.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No {type} requests found</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((req, idx) => (
                <div key={idx} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                    {req.user_name ? req.user_name.substring(0, 2) : '??'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">
                                    {req.user_name || 'Unknown User'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                        {type === 'leave' ? req.leave_type_name : 'Short Permission'}
                                    </span>
                                    <Badge className={cn("text-[8px] font-black uppercase tracking-widest border px-2 py-0.5", getStatusColor(req.status))}>
                                        {req.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter pl-11">
                            {type === 'leave' 
                                ? `${format(new Date(req.start_date), 'dd MMM')} - ${format(new Date(req.end_date), 'dd MMM yyyy')} (${req.duration_days} Days)`
                                : `${format(new Date(req.date), 'dd MMM yyyy')} (${req.start_time} - ${req.end_time})`
                            }
                        </p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic pl-11">
                            &ldquo;{req.reason}&rdquo;
                        </p>
                        {req.status !== 'pending' && (
                            <div className="mt-2 pl-11 flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    {req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.actioned_by_name || 'System'}
                                </span>
                                {req.comments && (
                                    <p className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                        Note: {req.comments}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {onAction && req.status === 'pending' && (
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onAction(req.request_id || req.id, 'approved')}
                                className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                            >
                                Approve
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onAction(req.request_id || req.id, 'rejected')}
                                className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-red-500/30 text-red-600 hover:bg-red-50"
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default RequestList;
