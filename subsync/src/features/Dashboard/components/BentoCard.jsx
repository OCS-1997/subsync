import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

/**
 * BentoCard - Individual card component for bento grid layout
 * Supports various sizes: sm (1x1), md (2x1), lg (1x2), xl (2x2), full (4x1)
 */
function BentoCard({
    children,
    className,
    size = "sm",
    title,
    icon: Icon,
    action,
    draggable = false,
    dragHandleProps = {},
    noPadding = false,
    loading = false,
    titleClassName,
    iconClassName
}) {
    const sizeClasses = {
        sm: "col-span-1 row-span-1",
        md: "col-span-1 sm:col-span-2 row-span-1",
        lg: "col-span-1 row-span-2",
        xl: "col-span-1 sm:col-span-2 row-span-2",
        full: "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 row-span-1",
        wide: "col-span-1 sm:col-span-2 lg:col-span-3 row-span-1",
    };

    return (
        <div
            className={cn(
                "relative group rounded-[2rem] overflow-hidden transition-all duration-500",
                "bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50",
                "hover:border-slate-300 dark:hover:border-slate-700/50 hover:shadow-xl dark:hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-blue-500/5",
                "hover:scale-[1.01] active:scale-[0.99]",
                sizeClasses[size] || sizeClasses.sm,
                className
            )}
        >
            {/* Glassmorphic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 dark:from-white/[0.02] to-transparent pointer-events-none" />

            {/* Header */}
            {(title || Icon || action || draggable) && (
                <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <div className="flex items-center gap-3">
                        {draggable && (
                            <div
                                {...dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            </div>
                        )}
                        {Icon && (
                            <div className={cn(
                                "h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 dark:from-blue-500/20 to-purple-100 dark:to-purple-500/20 flex items-center justify-center border border-blue-200 dark:border-blue-500/20",
                                iconClassName
                            )}>
                                <Icon className={cn("w-5 h-5 text-blue-600 dark:text-blue-400", iconClassName?.includes('text-') && iconClassName.match(/text-[^ ]+/)[0])} />
                            </div>
                        )}
                        {title && (
                            <h3 className={cn(
                                "text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400",
                                titleClassName
                            )}>
                                {title}
                            </h3>
                        )}
                    </div>
                    {action && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {action}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={cn(
                "relative z-10 touch-pan-y",
                !noPadding && "px-6 pb-6",
                title && !noPadding && "pt-2"
            )}>
                {loading ? (
                    <div className="animate-pulse space-y-3">
                        <div className="h-8 bg-slate-200 dark:bg-slate-800/50 rounded-xl w-1/2" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800/50 rounded-lg w-3/4" />
                    </div>
                ) : (
                    children
                )}
            </div>

            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500/5 dark:from-blue-500/10 via-transparent to-purple-500/5 dark:to-purple-500/10 rounded-[2rem]" />
            </div>
        </div>
    );
}

export default BentoCard;
