import { useState } from "react";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select.jsx";

export default function AdvancedFilters({ filters, onFiltersChange, users = [] }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFilterChange = (key, value) => {
        onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFiltersChange({
            status: 'all',
            visibility: 'all',
            createdBy: 'all',
            dateFrom: '',
            dateTo: '',
            hasLinkedDCR: 'all'
        });
    };

    const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'status' || key === 'visibility' || key === 'hasLinkedDCR' || key === 'createdBy') {
            return value && value !== 'all';
        }
        return value && value !== '';
    }).length;

    return (
        <Card className="border-dashed">
            <CardContent className="p-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-black">
                                {activeFilterCount}
                            </Badge>
                        )}
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {activeFilterCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearFilters}
                            className="text-xs h-7"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Filters Panel */}
                {isExpanded && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t mt-3">
                        {/* Status Filter */}
                        <div className="space-y-1">
                            <Label htmlFor="status-filter" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</Label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger id="status-filter" className="h-8 text-xs">
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="review">Review</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Visibility Filter */}
                        <div className="space-y-1">
                            <Label htmlFor="visibility-filter" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Visibility</Label>
                            <Select
                                value={filters.visibility || 'all'}
                                onValueChange={(value) => handleFilterChange('visibility', value)}
                            >
                                <SelectTrigger id="visibility-filter" className="h-8 text-xs">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="internal">Internal</SelectItem>
                                    <SelectItem value="customer">Customer</SelectItem>
                                    <SelectItem value="both">Both</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Created By Filter */}
                        <div className="space-y-1">
                            <Label htmlFor="author-filter" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Author</Label>
                            <Select
                                value={filters.createdBy || 'all'}
                                onValueChange={(value) => handleFilterChange('createdBy', value)}
                            >
                                <SelectTrigger id="author-filter" className="h-8 text-xs">
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Authors</SelectItem>
                                    {users.map(user => (
                                        <SelectItem key={user.username} value={user.username}>
                                            {user.name || user.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="space-y-1">
                            <Label htmlFor="date-from" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">From</Label>
                            <Input
                                id="date-from"
                                type="date"
                                value={filters.dateFrom || ''}
                                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>

                        {/* Date To */}
                        <div className="space-y-1">
                            <Label htmlFor="date-to" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">To</Label>
                            <Input
                                id="date-to"
                                type="date"
                                value={filters.dateTo || ''}
                                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>

                        {/* Has Linked DCR */}
                        <div className="space-y-1">
                            <Label htmlFor="dcr-filter" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">DCR Link</Label>
                            <Select
                                value={filters.hasLinkedDCR || 'all'}
                                onValueChange={(value) => handleFilterChange('hasLinkedDCR', value)}
                            >
                                <SelectTrigger id="dcr-filter" className="h-8 text-xs">
                                    <SelectValue placeholder="Any" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any</SelectItem>
                                    <SelectItem value="yes">Has Link</SelectItem>
                                    <SelectItem value="no">No Link</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

