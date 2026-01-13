import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axiosInstance.js";
import { toast } from "react-toastify";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip.jsx";

export default function CategorySidebar({ isCollapsed = false, selectedCategoryId, onCategorySelect, className }) {
    const [categories, setCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await api.get('/kb/categories');
            // console.log('Categories fetched:', res.data); // Debug log
            const cats = res.data.categories || [];
            setCategories(cats);

            // Auto-expand selected category's parents
            if (selectedCategoryId && cats.length > 0) {
                const category = cats.find(c => c.id === parseInt(selectedCategoryId));
                if (category?.parent_id) {
                    setExpandedCategories(prev => new Set([...prev, category.parent_id]));
                }
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (categoryId) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const buildCategoryTree = (parentId = null) => {
        return categories
            .filter(cat => {
                // Handle both null and undefined for root categories
                if (parentId === null) {
                    return cat.parent_id === null || cat.parent_id === undefined;
                }
                return cat.parent_id === parentId;
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const renderCategory = (category, level = 0) => {
        const hasChildren = categories.some(c => c.parent_id === category.id);
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategoryId === category.id || selectedCategoryId === category.id.toString();
        const children = buildCategoryTree(category.id);

        const content = (
            <div
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group relative",
                    isSelected
                        ? "bg-blue-600 dark:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400",
                    isCollapsed && "px-0 justify-center h-12 w-12 mx-auto mb-2"
                )}
                style={!isCollapsed ? { paddingLeft: `${level * 16 + 16}px` } : {}}
                onClick={() => onCategorySelect(String(category.id))}
            >
                {!isCollapsed && hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(category.id);
                        }}
                        className={cn(
                            "p-1 rounded-lg transition-all",
                            isSelected ? "hover:bg-white/20" : "hover:bg-slate-100 dark:hover:bg-slate-700"
                        )}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}

                {!isCollapsed && !hasChildren && <div className="w-5" />}

                {isExpanded || isSelected ? (
                    <FolderOpen className={cn(
                        "w-4 h-4 flex-shrink-0 transition-all",
                        isCollapsed && "w-6 h-6",
                        isSelected ? "text-white" : "text-blue-600 dark:text-blue-400"
                    )} />
                ) : (
                    <Folder className={cn(
                        "w-4 h-4 flex-shrink-0 transition-all opacity-60 group-hover:opacity-100",
                        isCollapsed && "w-6 h-6"
                    )} />
                )}

                {!isCollapsed && (
                    <>
                        <span className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-widest truncate",
                            isSelected ? "text-white" : "text-inherit"
                        )}>
                            {category.name}
                        </span>

                        {(category.article_count !== undefined && category.article_count > 0) && (
                            <span className={cn(
                                "text-[9px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 transition-colors",
                                isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 dark:bg-slate-950 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                            )}>
                                {category.article_count}
                            </span>
                        )}
                    </>
                )}
            </div>
        );

        return (
            <div key={category.id}>
                {isCollapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            {content}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                            <span>{category.name}</span>
                            {category.article_count > 0 && (
                                <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight">
                                    {category.article_count}
                                </span>
                            )}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    content
                )}

                {!isCollapsed && hasChildren && isExpanded && (
                    <div className="mt-0.5">
                        {children.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className={cn("p-4", className)}>
                <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    const rootCategories = buildCategoryTree(null);
    const totalArticles = categories.reduce((sum, cat) => sum + (cat.article_count || 0), 0);

    return (
        <TooltipProvider>
            <div className={cn("overflow-y-auto", className)}>
                {/* All Articles Option */}
                {isCollapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div
                                className={cn(
                                    "flex items-center justify-center h-12 w-12 mx-auto mb-6 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm",
                                    !selectedCategoryId
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                        : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                                )}
                                onClick={() => onCategorySelect(null)}
                            >
                                <FileText className="w-6 h-6 flex-shrink-0" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-3">
                            <span className="font-black text-[10px] uppercase tracking-widest">Master Archive</span>
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-tight">
                                {totalArticles}
                            </span>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <div
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 mb-4 rounded-2xl cursor-pointer transition-all duration-300 group",
                            !selectedCategoryId
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        )}
                        onClick={() => onCategorySelect(null)}
                    >
                        <FileText className={cn(
                            "w-4 h-4 flex-shrink-0",
                            !selectedCategoryId ? "text-white" : "text-blue-600 dark:text-blue-400"
                        )} />
                        <span className={cn(
                            "flex-1 text-[11px] font-black uppercase tracking-widest truncate",
                            !selectedCategoryId ? "text-white" : "text-inherit"
                        )}>
                            Master Archive
                        </span>
                        <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-lg flex-shrink-0 transition-colors",
                            !selectedCategoryId
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 dark:bg-slate-950 text-slate-400 group-hover:bg-blue-600 group-hover:text-white"
                        )}>
                            {totalArticles}
                        </span>
                    </div>
                )}

                {!isCollapsed && <div className="h-px bg-slate-100 dark:bg-slate-800 my-6 mx-2" />}

                {/* Category Tree */}
                <div className={cn("space-y-1", isCollapsed && "space-y-2")}>
                    {rootCategories.length === 0 ? (
                        !isCollapsed && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                                No categories yet
                            </p>
                        )
                    ) : (
                        rootCategories.map(category => renderCategory(category, 0))
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
