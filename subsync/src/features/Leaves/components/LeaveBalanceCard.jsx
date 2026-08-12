import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LeaveBalanceCard = ({ balance }) => {
    const { leave_type_name, allocated, remaining, leave_type_code, unit } = balance;
    const used = allocated - remaining;
    const usagePercentage = allocated > 0 ? (used / allocated) * 100 : 0;
    const isHours = unit === 'hours' || leave_type_code?.toUpperCase() === 'PERM';
    const unitLabel = isHours ? 'Hours' : 'Days';
    const unitLeftLabel = isHours ? 'Hours Left' : 'Days Left';

    const getColors = (code) => {
        switch (code?.toUpperCase()) {
            case 'CL': return 'bg-blue-600 text-white';
            case 'SL': return 'bg-amber-500 text-white';
            case 'EL': return 'bg-emerald-600 text-white';
            case 'LOP': return 'bg-slate-600 text-white';
            case 'PERM': return 'bg-violet-600 text-white';
            default: return 'bg-indigo-600 text-white';
        }
    };

    return (
        <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-md">
            <CardContent className="p-0">
                <div className={cn("p-4", getColors(leave_type_code))}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{leave_type_code}</span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                            {Math.round(usagePercentage)}% Used
                        </span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight mb-1">{leave_type_name}</h3>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black">{remaining}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{unitLeftLabel}</span>
                    </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    {/* Visual Capacity Bar */}
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, usagePercentage))}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Allocated: <strong className="text-slate-900 dark:text-white font-bold">{allocated} {unitLabel}</strong></span>
                        <span className="text-slate-500">Used: <strong className="text-slate-900 dark:text-white font-bold">{used} {unitLabel}</strong></span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LeaveBalanceCard;
