import { useState } from "react";
import { Briefcase, Settings, LayoutGrid, BarChart3, SlidersHorizontal } from "lucide-react";
import OpportunityList from "../components/OpportunityList.jsx";
import StatusManagement from "../components/StatusManagement.jsx";
import OpportunityDetailedReport from "./OpportunityDetailedReport.jsx";
import { cn } from "@/lib/utils";

const OpportunitiesPage = () => {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-8 py-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Modern Tab Navigation */}
                <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-[2rem] w-fit shadow-sm">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={cn(
                            "flex items-center gap-3 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === "all"
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Pipeline View
                    </button>
                    <button
                        onClick={() => setActiveTab("statuses")}
                        className={cn(
                            "flex items-center gap-3 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === "statuses"
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Stage Definitions
                    </button>
                    <button
                        onClick={() => setActiveTab("reports")}
                        className={cn(
                            "flex items-center gap-3 px-6 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === "reports"
                                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                    >
                        <BarChart3 className="h-4 w-4" />
                        Pipeline Analytics
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === "all" ? (
                        <OpportunityList />
                    ) : activeTab === "statuses" ? (
                        <div className="pt-4">
                            <StatusManagement />
                        </div>
                    ) : (
                        <div className="pt-4">
                            <OpportunityDetailedReport />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpportunitiesPage;
