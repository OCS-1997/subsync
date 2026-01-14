import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * StatCard - Compact stat display for bento grid
 * Shows value, label, icon and optional trend indicator
 */
function StatCard({
    value,
    label,
    icon: Icon,
    trend,
    trendValue,
    variant = "default",
    size = "default",
    className
}) {
    const variants = {
        default: "from-slate-100 dark:from-slate-800/50 to-slate-50 dark:to-slate-900/50 border-slate-200 dark:border-slate-700/30",
        blue: "from-blue-50 dark:from-blue-500/10 to-blue-100/50 dark:to-blue-600/5 border-blue-200 dark:border-blue-500/20",
        emerald: "from-emerald-50 dark:from-emerald-500/10 to-emerald-100/50 dark:to-emerald-600/5 border-emerald-200 dark:border-emerald-500/20",
        amber: "from-amber-50 dark:from-amber-500/10 to-amber-100/50 dark:to-amber-600/5 border-amber-200 dark:border-amber-500/20",
        rose: "from-rose-50 dark:from-rose-500/10 to-rose-100/50 dark:to-rose-600/5 border-rose-200 dark:border-rose-500/20",
        purple: "from-purple-50 dark:from-purple-500/10 to-purple-100/50 dark:to-purple-600/5 border-purple-200 dark:border-purple-500/20",
    };

    const iconColors = {
        default: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50",
        blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20",
        emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20",
        amber: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20",
        rose: "text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20",
        purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20",
    };

    const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor = trend === "up" ? "text-emerald-600 dark:text-emerald-400" : trend === "down" ? "text-rose-600 dark:text-rose-400" : "text-slate-500";

    return (
        <div className={cn(
            "h-full flex flex-col justify-between",
            className
        )}>
            <div className="flex items-start justify-between">
                {Icon && (
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center",
                        iconColors[variant]
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
                {trend && (
                    <div className={cn("flex items-center gap-1 text-xs font-bold", trendColor)}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>

            <div className="mt-4">
                <p className={cn(
                    "font-black tracking-tight text-slate-900 dark:text-white",
                    size === "lg" ? "text-4xl" : "text-3xl"
                )}>
                    {value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-500 mt-1">
                    {label}
                </p>
            </div>
        </div>
    );
}

export default StatCard;
