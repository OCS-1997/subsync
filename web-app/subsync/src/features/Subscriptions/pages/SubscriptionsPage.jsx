import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import ListSubscriptions from "./ListSubscriptions.jsx";
import ArchivedSubscriptions from "./ArchivedSubscriptions.jsx";
import { cn } from "@/lib/utils";
import { LayoutGrid, Archive } from "lucide-react";

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isArchived = location.pathname.includes('/archived');
  const username = location.pathname.split('/')[1] || '';

  const activeTab = isArchived ? "archived" : "active";

  const handleTabChange = (tab) => {
    if (tab === "active") {
      navigate(`/${username}/dashboard/subscriptions`);
    } else {
      navigate(`/${username}/dashboard/subscriptions/archived`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-8 py-8">
      <div className="max-w-[1700px] mx-auto space-y-8">
        {/* Premium Floating Pill Switcher */}
        <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.8rem] w-fit shadow-sm">
          <button
            onClick={() => handleTabChange("active")}
            className={cn(
              "flex items-center gap-2 px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === "active"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Active Subscriptions
          </button>
          <button
            onClick={() => handleTabChange("archived")}
            className={cn(
              "flex items-center gap-2 px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeTab === "archived"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Archive className="h-4 w-4" />
            Archived Subscriptions
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Routes>
            <Route
              path="archived"
              element={
                <ArchivedSubscriptions
                  onEdit={(id) => navigate(`${id}/edit`)}
                />
              }
            />
            <Route
              index
              element={
                <ListSubscriptions
                  onAddNew={() => navigate("add")}
                  onEdit={(id) => navigate(`${id}/edit`)}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
