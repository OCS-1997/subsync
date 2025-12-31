import { useState, useEffect } from "react";
import { X, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import api from "@/lib/axiosInstance.js";

export default function TagFilter({ selectedTags = [], onTagsChange }) {
    const [allTags, setAllTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            // Get all unique tags from articles
            const res = await api.get('/kb/articles?limit=1000');
            const articles = res.data.articles || [];
            const tagsSet = new Set();

            articles.forEach(article => {
                try {
                    const tags = typeof article.tags === 'string'
                        ? JSON.parse(article.tags)
                        : article.tags || [];
                    tags.forEach(tag => tagsSet.add(tag));
                } catch (e) {
                    // Skip invalid tags
                }
            });

            setAllTags(Array.from(tagsSet).sort());
        } catch (error) {
            console.error('Failed to fetch tags:', error);
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
        <Card className="border-dashed">
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    {/* Header and Selected Tags */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <TagIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Tags</span>
                        {selectedTags.length > 0 && (
                            <Badge variant="secondary" className="text-xs h-5">
                                {selectedTags.length}
                            </Badge>
                        )}
                    </div>

                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 flex-1">
                            {selectedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="default"
                                    className="gap-1 cursor-pointer hover:bg-blue-700 h-6 text-xs"
                                >
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="ml-1 hover:text-red-200"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Tag Search */}
                    <div className="relative w-48 flex-shrink-0">
                        <Input
                            type="text"
                            placeholder="Add tags..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="text-sm h-8"
                        />

                        {/* Suggestions Dropdown */}
                        {showSuggestions && searchTerm && filteredTags.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredTags.slice(0, 10).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => addTag(tag)}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Badge variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Popular Tags - Only show when no tags selected and no search */}
                {selectedTags.length === 0 && !searchTerm && allTags.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Popular:</p>
                        <div className="flex flex-wrap gap-2">
                            {allTags.slice(0, 8).map(tag => (
                                <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 h-6"
                                    onClick={() => addTag(tag)}
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
