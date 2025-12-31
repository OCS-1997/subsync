import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axiosInstance.js";
import { toast } from "react-toastify";

export default function CategorySidebar({ selectedCategoryId, onCategorySelect, className }) {
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
            .filter(cat => cat.parent_id === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));
    };

    const renderCategory = (category, level = 0) => {
        const hasChildren = categories.some(c => c.parent_id === category.id);
        const isExpanded = expandedCategories.has(category.id);
        const isSelected = selectedCategoryId === category.id || selectedCategoryId === category.id.toString();
        const children = buildCategoryTree(category.id);

        return (
            <div key={category.id}>
                <div
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors group",
                        isSelected
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                    onClick={() => onCategorySelect(category.id)}
                >
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(category.id);
                            }}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {!hasChildren && <div className="w-5" />}

                    {isExpanded || isSelected ? (
                        <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    ) : (
                        <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}

                    <span className="flex-1 text-sm font-medium truncate">
                        {category.name}
                    </span>

                    {(category.article_count !== undefined && category.article_count > 0) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                            {category.article_count}
                        </span>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div>
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
        <div className={cn("overflow-y-auto", className)}>
            {/* All Articles Option */}
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

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            {/* Category Tree */}
            <div className="space-y-1">
                {rootCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                        No categories yet
                    </p>
                ) : (
                    rootCategories.map(category => renderCategory(category, 0))
                )}
            </div>
        </div>
    );
}
