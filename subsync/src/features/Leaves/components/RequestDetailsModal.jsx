import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, CheckCircle2, XCircle, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const RequestDetailsModal = ({ isOpen, onClose, request, type = 'leave', onAction }) => {
    const [actionComments, setActionComments] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!request) return null;

    const isLeave = type === 'leave';
    const status = request.status || 'pending';

    const getStatusBadge = (st) => {
        switch (st) {
            case 'approved':
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 font-bold uppercase text-[10px]">Approved</Badge>;
            case 'rejected':
                return <Badge className="bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-300 font-bold uppercase text-[10px]">Rejected</Badge>;
            default:
                return <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 font-bold uppercase text-[10px]">Pending Approval</Badge>;
        }
    };

    const handleActionClick = async (actionStatus) => {
        if (!onAction) return;
        setIsSubmitting(true);
        try {
            await onAction(request.request_id || request.id, actionStatus, actionComments);
            setActionComments('');
            onClose();
        } catch (error) {
            console.error("Action error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate duration display
    let durationDisplay = '';
    if (isLeave) {
        durationDisplay = `${request.duration_days} Day${parseFloat(request.duration_days) !== 1 ? 's' : ''}`;
    } else {
        const hrs = request.duration_minutes ? (request.duration_minutes / 60).toFixed(1).replace(/\.0$/, '') : '1';
        durationDisplay = `${hrs} Hour${hrs !== '1' ? 's' : ''} (${request.duration_minutes || 60} mins)`;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md sm:max-w-lg rounded-[2rem] p-0 overflow-hidden border-slate-200 dark:border-slate-800">
                <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            {isLeave ? 'Leave Request Details' : 'Short Permission Details'}
                        </span>
                        {getStatusBadge(status)}
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                        {isLeave ? (request.leave_type_name || 'Leave Request') : 'Workday Permission'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Request ID: <span className="font-mono text-slate-700 dark:text-slate-300">{request.request_id || request.id}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* User Info Card */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center border border-blue-200 dark:border-blue-800">
                            {request.user_name ? request.user_name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{request.user_name || 'Employee'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{request.user_id}</span>
                        </div>
                    </div>

                    {/* Request Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                {isLeave ? <Calendar className="w-3.5 h-3.5 text-blue-600" /> : <Clock className="w-3.5 h-3.5 text-purple-600" />}
                                {isLeave ? 'Dates' : 'Date & Time'}
                            </div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {isLeave ? (
                                    request.start_date && request.end_date ? (
                                        `${format(new Date(request.start_date), 'dd MMM yyyy')} - ${format(new Date(request.end_date), 'dd MMM yyyy')}`
                                    ) : 'N/A'
                                ) : (
                                    request.date ? (
                                        `${format(new Date(request.date), 'dd MMM yyyy')} (${request.start_time} - ${request.end_time})`
                                    ) : 'N/A'
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                Duration Unit
                            </div>
                            <div className="text-xs font-black text-slate-900 dark:text-white">
                                {durationDisplay}
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason / Purpose</Label>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            &ldquo;{request.reason || 'No reason specified'}&rdquo;
                        </div>
                    </div>

                    {/* Audit Timeline / Status Notes */}
                    {status !== 'pending' && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                <span>{status === 'approved' ? 'Approved By' : 'Rejected By'}</span>
                                <span>{request.actioned_on ? format(new Date(request.actioned_on), 'dd MMM yyyy, HH:mm') : ''}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {request.actioned_by_name || request.actioned_by || 'System Administrator'}
                            </div>
                            {request.comments && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2">
                                    Note: {request.comments}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Action Form if Pending & onAction provided */}
                    {onAction && status === 'pending' && (
                        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Approver Notes (Optional)</Label>
                            <Textarea 
                                placeholder="Add comments or approval conditions..."
                                value={actionComments}
                                onChange={(e) => setActionComments(e.target.value)}
                                className="rounded-xl text-xs font-medium border-slate-200 dark:border-slate-800 h-20"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-row items-center justify-end gap-2">
                    <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
                        Close
                    </Button>
                    {onAction && status === 'pending' && (
                        <>
                            <Button 
                                variant="outline" 
                                onClick={() => handleActionClick('rejected')}
                                disabled={isSubmitting}
                                className="rounded-xl text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
                                Reject
                            </Button>
                            <Button 
                                onClick={() => handleActionClick('approved')}
                                disabled={isSubmitting}
                                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                Approve Request
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RequestDetailsModal;
