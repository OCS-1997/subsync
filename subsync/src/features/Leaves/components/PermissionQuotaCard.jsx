import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, ShieldAlert } from 'lucide-react';

const PermissionQuotaCard = ({ balance, settings, onRequestClick }) => {
    const allocated = balance ? parseFloat(balance.allocated) : (settings?.yearly_hours_quota || 24);
    const used = balance ? parseFloat(balance.used) : 0;
    const remaining = allocated - used;
    const usagePercentage = allocated > 0 ? Math.min(100, Math.round((used / allocated) * 100)) : 0;

    return (
        <Card className="rounded-2xl border border-violet-200 dark:border-violet-900/50 shadow-sm bg-gradient-to-r from-violet-600 to-indigo-700 text-white overflow-hidden group transition-all duration-300">
            <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
                        <span>Permission Quota (Hours)</span>
                    </div>
                    <span className="text-[9px] font-black bg-black/20 px-2 py-0.5 rounded-full border border-white/10">
                        {usagePercentage}% Used
                    </span>
                </div>

                <div className="flex items-baseline justify-between">
                    <div>
                        <span className="text-3xl font-black">{remaining.toFixed(1).replace(/\.0$/, '')}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 ml-1.5">Hours Left</span>
                    </div>
                    <div className="flex gap-3 text-[10px] font-bold opacity-90">
                        <div>
                            <span className="text-white/70">Allocated:</span> <strong>{allocated}h</strong>
                        </div>
                        <div>
                            <span className="text-white/70">Used:</span> <strong>{used}h</strong>
                        </div>
                        {settings?.monthly_hours_quota && (
                            <div>
                                <span className="text-white/70">Monthly Limit:</span> <strong>{settings.monthly_hours_quota}h</strong>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
                    <div className="flex items-center gap-1.5 opacity-80">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>Max {settings?.max_hours_per_request || 2} hours per request</span>
                    </div>
                    {onRequestClick && (
                        <Button 
                            onClick={onRequestClick}
                            size="sm"
                            className="bg-white text-indigo-900 hover:bg-white/90 font-black uppercase tracking-widest text-[9px] h-8 px-4 rounded-lg shadow-sm w-full sm:w-auto"
                        >
                            Request Permission
                            <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default PermissionQuotaCard;
