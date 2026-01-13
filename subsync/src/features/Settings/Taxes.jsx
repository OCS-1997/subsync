import { ChevronRight, Settings2, Receipt, ShieldCheck } from "lucide-react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils";

const categories = [
    { name: "Tax Rates", path: "tax-rates", icon: <Receipt size={16} />, description: "Manage rates and groups" },
    { name: "Tax Preference", path: "default-tax-pref", icon: <ShieldCheck size={16} />, description: "Default tax settings" },
    { name: "GST Settings", path: "gst-settings", icon: <Settings2 size={16} />, description: "GSTIN and treatment" }
];

function Taxes() {
    const location = useLocation();
    const [selectedCategory, setSelectedCategory] = useState(
        categories.find(cat => location.pathname.endsWith(cat.path)) || categories[0]
    );

    useEffect(() => {
        const currentCategory = categories.find(cat => location.pathname.endsWith(cat.path));
        if (currentCategory) setSelectedCategory(currentCategory);
    }, [location.pathname]);

    return (
        <div className="flex flex-col lg:flex-row h-full w-full min-h-[calc(100vh-200px)]">
            {/* Premium Sidebar */}
            <div className="w-full lg:w-60 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-6 space-y-8 bg-slate-50/50 dark:bg-slate-900/20">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-4">Taxes</h3>
                    <nav className="space-y-2">
                        {categories.map((category) => {
                            const isActive = location.pathname.endsWith(category.path);
                            return (
                                <Link
                                    key={category.path}
                                    to={category.path}
                                    className={cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative overflow-hidden",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-xl transition-colors",
                                        isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                                    )}>
                                        {category.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black uppercase tracking-wider">{category.name}</p>
                                        <p className={cn(
                                            "text-[10px] font-bold opacity-60 uppercase tracking-tight",
                                            isActive ? "text-blue-100" : "text-slate-400"
                                        )}>{category.description}</p>
                                    </div>
                                    {isActive && <ChevronRight size={14} className="opacity-60" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow flex flex-col bg-white dark:bg-slate-950/20 overflow-hidden">
                <main className="flex-grow p-4 lg:p-10">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Taxes;
