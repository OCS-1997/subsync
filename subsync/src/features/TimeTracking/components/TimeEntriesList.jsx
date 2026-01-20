import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Pencil, Trash2, Search, Download, Clock, Briefcase, User, Filter, RotateCcw } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const TimeEntriesList = ({ refresh, onEdit }) => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        customer_id: '',
        project_id: '',
        activity_type_id: '',
        is_billable: '',
        page: 1,
        limit: 20
    });
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchEntries();
    }, [refresh, filters.page]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const response = await api.get(`/time-tracking/entries?${params}`);
            setEntries(response.data.entries || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching time entries:', error);
            toast.error('Failed to load time entries');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (entryId) => {
        if (!confirm('Are you sure you want to delete this time entry?')) return;

        try {
            await api.delete(`/time-tracking/entries/${entryId}`);
            toast.success('Time entry deleted');
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
            toast.error('Failed to delete time entry');
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '-';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Title', 'Customer', 'Project', 'Activity', 'Duration', 'Billable'];
        const rows = entries.map(entry => [
            format(new Date(entry.start_time), 'yyyy-MM-dd HH:mm'),
            `"${entry.title.replace(/"/g, '""')}"`,
            `"${(entry.customer_name || '-').replace(/"/g, '""')}"`,
            `"${(entry.project_name || '-').replace(/"/g, '""')}"`,
            entry.activity_type_name || '-',
            formatDuration(entry.duration_minutes),
            entry.is_billable ? 'Yes' : 'No'
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `time-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            customer_id: '',
            project_id: '',
            activity_type_id: '',
            is_billable: '',
            page: 1,
            limit: 20
        });
        fetchEntries();
    };

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm transition-all duration-300">
            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Execution Ledger
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            className="h-10 px-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-950 transition-all shadow-sm"
                        >
                            <Download className="mr-2 h-3.5 w-3.5 text-blue-500" />
                            Export Telemetry
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-950 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                        >
                            <RotateCcw className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Filter by subject or notes..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="h-12 pl-11 rounded-1.5xl bg-gray-50/50 dark:bg-slate-950 border-transparent focus:border-gray-200 dark:focus:border-slate-800 font-bold text-sm transition-all"
                        />
                    </div>
                    <Button 
                        onClick={fetchEntries} 
                        className="h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-1.5xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Execute Filter
                    </Button>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-slate-800/30">
                            <TableRow className="hover:bg-transparent border-gray-100 dark:border-slate-800">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 px-6">Timestamp</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Objective</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Dimensions</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Classification</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5">Duration</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-5 text-right px-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing Ledger...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 bg-gray-50 dark:bg-slate-800 rounded-2.5xl flex items-center justify-center">
                                                <Clock className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Log Archive Empty</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No matching telemetry found</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map(entry => (
                                    <TableRow key={entry.id} className="group border-gray-50 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="py-5 px-6 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                                    {format(new Date(entry.start_time), 'MMM dd')}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                                                    {format(new Date(entry.start_time), 'HH:mm')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col max-w-[200px]">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                                                    {entry.title}
                                                </span>
                                                {entry.description && (
                                                    <span className="text-[10px] font-medium text-slate-400 truncate leading-relaxed">
                                                        {entry.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-1">
                                                {entry.customer_name && (
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                                                            {entry.customer_name}
                                                        </span>
                                                    </div>
                                                )}
                                                {entry.project_name && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">
                                                            {entry.project_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 font-bold">
                                            <div className="flex flex-col gap-2">
                                                {entry.activity_type_name && (
                                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-800 w-fit">
                                                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.activity_color || '#3b82f6' }}></div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                                                            {entry.activity_type_name}
                                                        </span>
                                                    </div>
                                                )}
                                                {entry.is_billable ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none shadow-none text-[9px] font-black uppercase tracking-widest w-fit">
                                                        Premium Ledger
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none shadow-none text-[9px] font-black uppercase tracking-widest w-fit">
                                                        Internal
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 font-black text-sm tracking-tight">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                {formatDuration(entry.duration_minutes)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-right px-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => onEdit && onEdit(entry)}
                                                                className="h-9 w-9 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-lg font-bold text-[10px] uppercase tracking-widest">Update Log</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm"
                                                                onClick={() => handleDelete(entry.entry_id)}
                                                                className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 border-gray-100 dark:border-slate-800 hover:border-red-100 dark:hover:border-red-900 transition-all shadow-sm"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-red-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest">Delete Log</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Ledger Segment <span className="text-slate-900 dark:text-white px-2 py-1 bg-gray-50 dark:bg-slate-800 rounded-lg ml-2">{filters.page}</span> / {totalPages}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={filters.page === 1}
                                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                className="h-10 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-950 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={filters.page === totalPages}
                                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                className="h-10 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-950 disabled:opacity-30 transition-all shadow-sm"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TimeEntriesList;

