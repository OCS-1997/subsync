import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LeaveBalanceCard = ({ balance }) => {
    const { leave_type_name, allocated, remaining, leave_type_code } = balance;
    const used = allocated - remaining;
    const usagePercentage = (used / allocated) * 100;

    const getColors = (code) => {
        switch (code?.toUpperCase()) {
            case 'CL': return 'bg-blue-600 text-white';
            case 'SL': return 'bg-amber-500 text-white';
            case 'EL': return 'bg-emerald-600 text-white';
            case 'LOP': return 'bg-slate-600 text-white';
            default: return 'bg-indigo-600 text-white';
        }
    };

    return (
        <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden group transition-all duration-500 hover:scale-[1.02]">
            <CardContent className="p-0">
                <div className={cn("p-6", getColors(leave_type_code))}>
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{leave_type_code}</span>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <span className="text-[10px] font-black">{Math.round(usagePercentage)}%</span>
                        </div>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">{leave_type_name}</h3>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black">{remaining}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Days Left</span>
                    </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Allocated</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{allocated} Days</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Used</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{used} Days</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LeaveBalanceCard;
