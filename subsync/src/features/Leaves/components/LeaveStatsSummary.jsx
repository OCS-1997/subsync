import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2, History } from 'lucide-react';
import { cn } from "@/lib/utils";

const LeaveStatsSummary = ({ leaves, permissions }) => {
    const stats = {
        totalLeaves: leaves.filter(l => l.status === 'approved').length,
        totalLeaveDays: leaves.filter(l => l.status === 'approved').reduce((acc, l) => acc + parseFloat(l.duration_days), 0),
        totalPermissions: permissions.filter(p => p.status === 'approved').length,
        totalPermissionHours: permissions.filter(p => p.status === 'approved').reduce((acc, p) => acc + (p.duration_minutes / 60), 0),
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        pendingPermissions: permissions.filter(p => p.status === 'pending').length
    };

    const StatItem = ({ icon: Icon, label, value, subValue, color }) => (
        <Card className="rounded-[2rem] border-none bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{value}</span>
                            {subValue && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subValue}</span>}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatItem 
                icon={History} 
                label="Total Takes" 
                value={stats.totalLeaves + stats.totalPermissions}
                subValue="Approvals"
                color="bg-blue-600 shadow-lg shadow-blue-500/30" 
            />
            <StatItem 
                icon={Calendar} 
                label="Leaves Used" 
                value={stats.totalLeaveDays}
                subValue="Days"
                color="bg-emerald-600 shadow-lg shadow-emerald-500/30" 
            />
             <StatItem 
                icon={Clock} 
                label="Permissions" 
                value={stats.totalPermissionHours.toFixed(1)}
                subValue="Hours"
                color="bg-amber-500 shadow-lg shadow-amber-500/30" 
            />
            <StatItem 
                icon={CheckCircle2} 
                label="Pending" 
                value={stats.pendingLeaves + stats.pendingPermissions}
                subValue="Requests"
                color="bg-indigo-600 shadow-lg shadow-indigo-500/30" 
            />
        </div>
    );
};

export default LeaveStatsSummary;
