import { useState, useEffect } from "react";
import { X, Tag as TagIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { cn } from "@/lib/utils";
import api from "@/lib/axiosInstance.js";

export default function TagFilter({ selectedTags = [], onTagsChange, className }) {
    const [allTags, setAllTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            // Use the optimized tags endpoint instead of fetching articles
            const res = await api.get('/kb/tags?limit=100');
            const tags = (res.data.tags || []).map(tag => tag.name);
            setAllTags(tags.sort());
        } catch (error) {
            console.error('Failed to fetch tags:', error);
            // Fallback: set empty array instead of crashing
            setAllTags([]);
        }
    };

    const filteredTags = allTags.filter(tag =>
        !selectedTags.includes(tag) &&
        tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addTag = (tag) => {
        if (!selectedTags.includes(tag)) {
            onTagsChange([...selectedTags, tag]);
        }
        setSearchTerm("");
        setShowSuggestions(false);
    };

    const removeTag = (tagToRemove) => {
        onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className={cn("flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-16 px-6 shadow-sm", className)}>
            <div className="flex items-center gap-2 flex-shrink-0">
                <TagIcon className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tags</span>
                {selectedTags.length > 0 && (
                    <Badge className="bg-blue-600 text-white text-[9px] font-black h-5 px-1.5 min-w-[20px] justify-center rounded-full">
                        {selectedTags.length}
                    </Badge>
                )}
            </div>

            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-1" />

            <div className="flex-1 flex items-center gap-2 overflow-hidden">
                <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-12 flex-1">
                    {selectedTags.map(tag => (
                        <Badge
                            key={tag}
                            className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none hover:bg-blue-600 hover:text-white transition-all h-7 px-3 text-[10px] font-bold rounded-xl gap-1.5"
                        >
                            {tag}
                            <button
                                onClick={() => removeTag(tag)}
                                className="group/btn"
                            >
                                <X className="w-3 h-3 opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                            </button>
                        </Badge>
                    ))}

                    <div className="relative w-40">
                        <input
                            type="text"
                            placeholder={selectedTags.length > 0 ? "Add..." : "Filter by tags..."}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium h-7"
                        />

                        {showSuggestions && searchTerm && filteredTags.length > 0 && (
                            <div className="absolute z-50 w-64 top-full mt-2 left-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto backdrop-blur-xl">
                                {filteredTags.slice(0, 10).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => addTag(tag)}
                                        className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-700 dark:text-slate-300 flex items-center justify-between"
                                    >
                                        {tag}
                                        <Plus className="w-3 h-3 opacity-30" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedTags.length === 0 && !searchTerm && allTags.length > 0 && (
                <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Popular:</span>
                    <div className="flex gap-1.5">
                        {allTags.slice(0, 3).map(tag => (
                            <button
                                key={tag}
                                onClick={() => addTag(tag)}
                                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
