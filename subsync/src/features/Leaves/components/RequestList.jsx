import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import RequestDetailsModal from './RequestDetailsModal';

const RequestList = ({ requests, type = 'leave', onAction }) => {
    const [selectedRequest, setSelectedRequest] = useState(null);

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
        <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((req, idx) => (
                    <div 
                        key={idx} 
                        className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
                        onClick={() => setSelectedRequest(req)}
                    >
                        <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
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
                                    : (() => {
                                        const hrs = req.duration_minutes ? (req.duration_minutes / 60).toFixed(1).replace(/\.0$/, '') : null;
                                        const hrsLabel = hrs ? ` • ${hrs} Hour${hrs !== '1' ? 's' : ''}` : '';
                                        return `${format(new Date(req.date), 'dd MMM yyyy')} (${req.start_time} - ${req.end_time})${hrsLabel}`;
                                    })()
                                }
                            </p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 italic pl-11">
                                &ldquo;{req.reason}&rdquo;
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRequest(req)}
                                className="h-8 px-2.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                            {onAction && req.status === 'pending' && (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedRequest && (
                <RequestDetailsModal 
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    request={selectedRequest}
                    type={type}
                    onAction={onAction}
                />
            )}
        </>
    );
};

export default RequestList;
