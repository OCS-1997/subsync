import { useState } from 'react';
import { Target, LayoutGrid, SlidersHorizontal, BarChart3, Settings } from 'lucide-react';
import GoalsDashboard from './GoalsDashboard.jsx';
import GoalMastersSettings from './GoalMastersSettings.jsx';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/context/PermissionsContext';
import { PERMISSIONS } from '@/constants/permissions';

export default function GoalsPage() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const { hasPermission } = usePermissions();

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-4 sm:py-8">
            <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
                {/* Modern Pill Tab Navigation matching OCS365 System Pattern */}
                <div className="flex items-center p-1.5 bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-[2rem] w-full sm:w-fit shadow-sm overflow-x-auto no-scrollbar">
                    <div className="flex items-center min-w-max">
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            className={cn(
                                "flex items-center gap-2.5 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                activeTab === "dashboard"
                                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Goals Dashboard
                        </button>

                        {hasPermission(PERMISSIONS.GOALS_CONFIGURE_CATEGORIES) && (
                            <button
                                onClick={() => setActiveTab("masters")}
                                className={cn(
                                    "flex items-center gap-2.5 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                    activeTab === "masters"
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Goal Masters & Statuses
                            </button>
                        )}
                    </div>
                </div>

                {/* Animated Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === "dashboard" ? (
                        <GoalsDashboard />
                    ) : (
                        <div className="pt-2">
                            <GoalMastersSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
