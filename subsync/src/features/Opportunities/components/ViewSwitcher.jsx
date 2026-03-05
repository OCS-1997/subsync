import { Table2, Kanban } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function ViewSwitcher({ viewMode, onViewChange }) {
    return (
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button
                onClick={() => onViewChange('table')}
                className={cn(
                    "flex items-center gap-2 h-10 px-5 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    viewMode === 'table'
                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-md scale-100"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
            >
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
            </button>
            <button
                onClick={() => onViewChange('pipeline')}
                className={cn(
                    "flex items-center gap-2 h-10 px-5 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    viewMode === 'pipeline'
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-100"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
            >
                <Kanban className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
            </button>
        </div>
    );
}
