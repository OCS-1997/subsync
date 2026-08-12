import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palmtree, Clock, ChevronRight, User } from 'lucide-react';

const EmployeeBalanceCard = ({ employee, onClick }) => {
    const { user_name, user_email, user_gender = 'other', leaves = [], permission } = employee;

    // Calculate totals
    const totalDaysAllocated = leaves.reduce((acc, l) => acc + parseFloat(l.allocated || 0), 0);
    const totalDaysRemaining = leaves.reduce((acc, l) => acc + parseFloat(l.remaining || 0), 0);
    const totalDaysUsed = totalDaysAllocated - totalDaysRemaining;
    const usagePercentage = totalDaysAllocated > 0 ? Math.round((totalDaysUsed / totalDaysAllocated) * 100) : 0;

    const initials = user_name ? user_name.substring(0, 2).toUpperCase() : '??';
    const genderLabel = user_gender.charAt(0).toUpperCase() + user_gender.slice(1);

    return (
        <Card 
            onClick={onClick}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900 cursor-pointer group transition-all duration-300 hover:shadow-md hover:border-blue-500/50 dark:hover:border-blue-500/50 flex flex-col justify-between"
        >
            <CardContent className="p-5 space-y-4">
                {/* Employee Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {user_name}
                                </h3>
                                <Badge variant="secondary" className="text-[8px] font-bold px-1.5 py-0 capitalize">
                                    {genderLabel}
                                </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px]">
                                {user_email || 'No email registered'}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold text-slate-500 border-slate-200 dark:border-slate-800">
                        {leaves.length} Types
                    </Badge>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Palmtree className="w-3 h-3 text-blue-600" />
                            <span>Leaves</span>
                        </div>
                        <div className="text-base font-black text-slate-900 dark:text-white">
                            {totalDaysRemaining} <span className="text-[10px] font-normal text-slate-500">Days</span>
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Clock className="w-3 h-3 text-violet-600" />
                            <span>Permission</span>
                        </div>
                        <div className="text-base font-black text-slate-900 dark:text-white">
                            {permission ? permission.remaining : '0'} <span className="text-[10px] font-normal text-slate-500">Hrs</span>
                        </div>
                    </div>
                </div>

                {/* Leave Usage Capacity Bar */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-slate-500">
                        <span>Overall Leave Usage</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{usagePercentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.max(0, usagePercentage))}%` }}
                        />
                    </div>
                </div>

                {/* Mini Badges Preview */}
                <div className="flex flex-wrap gap-1 pt-1">
                    {leaves.slice(0, 4).map(l => (
                        <span key={l.leave_type_code} className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {l.leave_type_code}: {l.remaining}d
                        </span>
                    ))}
                    {leaves.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                            +{leaves.length - 4} more
                        </span>
                    )}
                </div>

                {/* Card Footer Link */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>View Balances & Adjust</span>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </CardContent>
        </Card>
    );
};

export default EmployeeBalanceCard;
