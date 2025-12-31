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
            console.log('Categories fetched:', res.data); // Debug log
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
                    "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all group",
                    isSelected
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800",
                    isCollapsed && "px-0 justify-center h-10 w-10 mx-auto mb-1"
                )}
                style={!isCollapsed ? { paddingLeft: `${level * 16 + 12}px` } : {}}
                onClick={() => onCategorySelect(category.id)}
            >
                {!isCollapsed && hasChildren && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(category.id);
                        }}
                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-transform"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                )}

                {!isCollapsed && !hasChildren && <div className="w-5" />}

                {isExpanded || isSelected ? (
                    <FolderOpen className={cn(
                        "w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 transition-transform",
                        isCollapsed && "w-5 h-5"
                    )} />
                ) : (
                    <Folder className={cn(
                        "w-4 h-4 text-gray-500 flex-shrink-0 transition-transform",
                        isCollapsed && "w-5 h-5"
                    )} />
                )}

                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-sm font-medium truncate">
                            {category.name}
                        </span>

                        {(category.article_count !== undefined && category.article_count > 0) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
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
                                    "flex items-center justify-center h-10 w-10 mx-auto mb-4 rounded-md cursor-pointer transition-all",
                                    !selectedCategoryId
                                        ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                                onClick={() => onCategorySelect(null)}
                            >
                                <FileText className="w-5 h-5 flex-shrink-0" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                            <span>All Articles</span>
                            <span className="bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight">
                                {totalArticles}
                            </span>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <div
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 mb-2 rounded-md cursor-pointer transition-colors",
                            !selectedCategoryId
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        onClick={() => onCategorySelect(null)}
                    >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium">All Articles</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                            {totalArticles}
                        </span>
                    </div>
                )}

                {!isCollapsed && <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />}

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
