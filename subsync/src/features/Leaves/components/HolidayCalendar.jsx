import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ShieldCheck, Calendar as CalendarIcon, Repeat } from 'lucide-react';

const HolidayCalendar = ({ holidays }) => {
    return (
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="bg-slate-900 p-8">
                <CardTitle className="text-white text-xl font-black uppercase tracking-tight flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        Public Holiday Calendar
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 opacity-60">FY {new Date().getFullYear()} - {new Date().getFullYear() + 1}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {holidays.map((holiday, idx) => (
                        <div 
                            key={idx} 
                            className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/30 transition-all"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <span className="text-[8px] font-black uppercase tracking-tighter opacity-70 group-hover:opacity-100">{format(new Date(holiday.holiday_date), 'MMM')}</span>
                                <span className="text-lg font-black leading-none">{format(new Date(holiday.holiday_date), 'dd')}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">{holiday.name}</span>
                                    {holiday.is_recurring === 1 && (
                                        <Badge className="bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                                            <Repeat className="w-2.5 h-2.5 mr-0.5 inline" /> Annual
                                        </Badge>
                                    )}
                                    {holiday.is_optional === 1 && (
                                        <Badge className="bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                                            Optional
                                        </Badge>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    {format(new Date(holiday.holiday_date), 'EEEE')}
                                </span>
                            </div>
                        </div>
                    ))}
                    {holidays.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                             <CalendarIcon className="w-12 h-12 opacity-20 mb-4" />
                             <p className="font-black uppercase tracking-widest text-xs opacity-40">Zero holidays listed for this cycle</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default HolidayCalendar;
