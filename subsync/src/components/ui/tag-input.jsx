import { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { Badge } from './badge';
import { Input } from './input';
import { Button } from './button';

const SUGGESTED_TAGS = [
    'troubleshooting', 'how-to', 'guide', 'tutorial', 'faq',
    'security', 'billing', 'technical', 'setup', 'configuration',
    'api', 'integration', 'authentication', 'deployment', 'maintenance'
];

export function TagInput({ tags = [], onChange, maxTags = 10 }) {
    const [input, setInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = SUGGESTED_TAGS.filter(
        tag => !tags.includes(tag) && tag.toLowerCase().includes(input.toLowerCase())
    );

    const addTag = (tag) => {
        const trimmed = tag.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
            onChange([...tags, trimmed]);
            setInput('');
            setShowSuggestions(false);
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="space-y-3">
            {/* Input */}
            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Type a tag and press Enter..."
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setShowSuggestions(e.target.value.length > 0);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(input.length > 0)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="pl-10"
                            disabled={tags.length >= maxTags}
                        />
                    </div>
                    <Button
                        type="button"
                        onClick={() => addTag(input)}
                        variant="outline"
                        disabled={!input.trim() || tags.length >= maxTags}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                    </Button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2 text-xs text-gray-500 border-b">Suggested tags:</div>
                        {filteredSuggestions.map((tag, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                            >
                                <TagIcon className="w-3 h-3 inline mr-2 text-gray-400" />
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1 pl-3 pr-1">
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-600 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-500">
                {tags.length}/{maxTags} tags • Press Enter to add, Backspace to remove last
            </p>
        </div>
    );
}
