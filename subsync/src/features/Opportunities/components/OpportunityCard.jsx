import { Eye, Edit, Trash2, User, Calendar, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { cn } from '@/lib/utils';

export default function OpportunityCard({ opportunity, onView, onEdit, onDelete }) {
    const formattedValue = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(opportunity.opportunity_value);

    const formattedDate = new Date(opportunity.opportunity_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <Card
            className="group cursor-grab active:cursor-grabbing hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 border-slate-100 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900/40 backdrop-blur-md overflow-hidden relative"
        >
            {/* Status Accent Glow */}
            <div
                className="absolute top-0 left-0 right-0 h-1 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: opportunity.status_color || '#3b82f6', boxShadow: `0 0 10px ${opportunity.status_color || '#3b82f6'}` }}
            />

            <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="space-y-1">
                    <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                        {opportunity.customer_name}
                    </h3>
                    {opportunity.company_name && (
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                            {opportunity.company_name}
                        </p>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Value</span>
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-black text-sm">
                            <IndianRupee className="h-3 w-3" />
                            {formattedValue}
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Date</span>
                        <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-tighter">
                            {formattedDate}
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <User className="h-3 w-3 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate max-w-[120px]">
                            {opportunity.owner_name || opportunity.owner}
                        </span>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={(e) => { e.stopPropagation(); onView(opportunity.opportunity_id); }}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={(e) => { e.stopPropagation(); onEdit(opportunity.opportunity_id); }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            onClick={(e) => { e.stopPropagation(); onDelete(opportunity.opportunity_id); }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
