import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Pencil, Trash2, Search, Download, Clock, Briefcase, User, Users, Filter, RotateCcw, X, Calendar, Eye } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import GenericTable from '@/components/layouts/GenericTable';
import Pagination from '@/components/layouts/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Time Entry Detail Modal Component
const TimeEntryDetailModal = ({ entry, isOpen, onClose }) => {
    if (!entry) return null;

    const formatDuration = (minutes) => {
        if (!minutes) return '—';
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hrs}h ${mins}m`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl rounded-[3rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 overflow-hidden">
                <DialogHeader className="p-10 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-blue-500/10 rounded-2xl flex items-center justify-center ring-4 ring-blue-500/10">
                            <Clock className="text-blue-500" size={28} />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{entry.title}</DialogTitle>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                Entry ID: {entry.entry_id} • {entry.is_billable ? 'PREMIUM LEDGER' : 'INTERNAL USE'}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {/* Time Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Time</span>
                            </div>
                            <p className="text-lg font-black tracking-tight uppercase">
                                {format(new Date(entry.start_time), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-1">
                                {format(new Date(entry.start_time), 'HH:mm:ss')}
                            </p>
                        </div>

                        {entry.end_time && (
                            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 mb-4">
                                    <Calendar className="h-4 w-4 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Time</span>
                                </div>
                                <p className="text-lg font-black tracking-tight uppercase">
                                    {format(new Date(entry.end_time), 'MMM dd, yyyy')}
                                </p>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    {format(new Date(entry.end_time), 'HH:mm:ss')}
                                </p>
                            </div>
                        )}

                        <div className="p-6 rounded-3xl bg-blue-500/5 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Total Duration</span>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
                                {formatDuration(entry.duration_minutes)}
                            </p>
                        </div>
                    </div>

                    {/* Project Information */}
                    {(entry.customer_name || entry.project_name) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {entry.customer_name && (
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <User className="h-4 w-4 text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Associated</span>
                                    </div>
                                    <p className="text-lg font-black tracking-tight uppercase">{entry.customer_name}</p>
                                </div>
                            )}

                            {entry.project_name && (
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project/Workspace</span>
                                    </div>
                                    <p className="text-lg font-black tracking-tight uppercase">{entry.project_name}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Activity Classification */}
                    {entry.activity_type_name && (
                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence Classification</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-4 h-4 rounded-full shadow-lg" 
                                    style={{ backgroundColor: entry.activity_color || '#3b82f6' }}
                                />
                                <span className="text-lg font-black tracking-tight uppercase">{entry.activity_type_name}</span>
                            </div>
                        </div>
                    )}

                    {/* Billable Status */}
                    <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Status</span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                    {entry.is_billable ? 'This entry is billable to the client' : 'Internal / Non-billable work'}
                                </p>
                            </div>
                            {entry.is_billable ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-black uppercase tracking-widest px-4 py-2">
                                    Billable
                                </Badge>
                            ) : (
                                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest px-4 py-2">
                                    Non-Billable
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Description/Narrative */}
                    {entry.description && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 ml-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Operational Narrative</span>
                            </div>
                            <div className="p-6 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-slate-800 overflow-hidden">
                                <p className="text-sm leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">
                                    {entry.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Entry ID</p>
                                <p className="text-sm font-black tabular-nums text-slate-600 dark:text-slate-400">#{entry.entry_id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">User ID</p>
                                <p className="text-sm font-black tabular-nums text-slate-600 dark:text-slate-400">#{entry.user_id}</p>
                            </div>
                            {entry.project_id && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Project ID</p>
                                    <p className="text-sm font-black tabular-nums text-slate-600 dark:text-slate-400">#{entry.project_id}</p>
                                </div>
                            )}
                            {entry.customer_id && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Customer ID</p>
                                    <p className="text-sm font-black tabular-nums text-slate-600 dark:text-slate-400">#{entry.customer_id}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const TimeEntriesList = ({ refresh, onEdit, customers = [], projects = [], categories = [], users = [], teams = [] }) => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.roleKey === 'admin' || user?.roleKey === 'manager';

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        user_id: '',
        team_id: '',
        customer_id: '',
        project_id: '',
        activity_type_id: '',
        is_billable: '',
        page: 1,
        limit: 20,
        sort_by: '',
        sort_order: ''
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
    const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
    const [userPopoverOpen, setUserPopoverOpen] = useState(false);
    const [teamPopoverOpen, setTeamPopoverOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);

    useEffect(() => {
        fetchEntries();
    }, [refresh, filters.page, filters.limit, filters.sort_by, filters.sort_order, filters.customer_id, filters.project_id, filters.activity_type_id, filters.is_billable, filters.user_id, filters.team_id]);

    // Debounced search effect
    useEffect(() => {
        if (filters.search === '') {
            // If search is cleared, fetch immediately
            fetchEntries();
            return;
        }

        // Debounce search to avoid too many API calls
        const debounceTimer = setTimeout(() => {
            fetchEntries();
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(debounceTimer);
    }, [filters.search]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                   params.append(key, filters[key]);
                }
            });

            const response = await api.get(`/time-tracking/entries?${params}`);
            setEntries(response.data.entries || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalRecords || 0);
        } catch (error) {
            console.error('Error fetching time entries:', error);
            toast.error('Failed to load time entries');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (entryId) => {
        try {
            await api.delete(`/time-tracking/entries/${entryId}`);
            toast.success('Time entry deleted');
            fetchEntries();
            window.dispatchEvent(new CustomEvent('timeTrackingUpdated'));
        } catch (error) {
            console.error('Error deleting entry:', error);
            toast.error('Failed to delete time entry');
        } finally {
            setDeleteConfirmOpen(false);
            setEntryToDelete(null);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '—';
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
            user_id: '',
            team_id: '',
            customer_id: '',
            project_id: '',
            activity_type_id: '',
            is_billable: '',
            page: 1,
            limit: 20,
            sort_by: '',
            sort_order: ''
        });
        setTimeout(() => fetchEntries(), 100);
    };

    const applyFilters = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
        // fetchEntries will be called automatically by useEffect
    };

    const handleSort = (columnKey) => {
        setFilters(prev => {
            // Three-state cycle: None -> Asc -> Desc -> None
            if (prev.sort_by !== columnKey) {
                // If sorting a different column, start with Asc
                return {
                    ...prev,
                    sort_by: columnKey,
                    sort_order: 'asc',
                    page: 1
                };
            } else if (prev.sort_order === 'asc') {
                // If current is Asc, switch to Desc
                return {
                    ...prev,
                    sort_order: 'desc',
                    page: 1
                };
            } else if (prev.sort_order === 'desc') {
                // If current is Desc, clear sorting (None)
                return {
                    ...prev,
                    sort_by: '',
                    sort_order: '',
                    page: 1
                };
            } else {
                // If no sort, start with Asc
                return {
                    ...prev,
                    sort_by: columnKey,
                    sort_order: 'asc',
                    page: 1
                };
            }
        });
    };

    // Prepare table headers
    const tableHeaders = [
        { key: 'timestamp', label: 'Timestamp', align: 'left' },
        ...(isAdmin ? [{ key: 'user', label: 'Member', align: 'left' }] : []),
        { key: 'title', label: 'Objective', align: 'left' },
        { key: 'dimensions', label: 'Dimensions', align: 'left' },
        { key: 'classification', label: 'Classification', align: 'left' },
        { key: 'duration_minutes', label: 'Duration', align: 'center' },
        { key: 'actions', label: 'Actions', align: 'center' }
    ];

    // Prepare table data
    const tableData = entries.map(entry => ({
        id: entry.entry_id,
        _rowClassName: '',
        timestamp: (
            <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {format(new Date(entry.start_time), 'MMM dd')}
                </span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                    {format(new Date(entry.start_time), 'HH:mm')}
                </span>
            </div>
        ),
        user: isAdmin && (
            <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {entry.username || entry.user_id}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {entry.user_id}
                </span>
            </div>
        ),
        title: (
            <div className="flex flex-col max-w-[250px]">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {entry.title}
                </span>
                {entry.description && (
                    <span className="text-[10px] font-medium text-slate-400 truncate leading-relaxed">
                        {entry.description}
                    </span>
                )}
            </div>
        ),
        dimensions: (
            <div className="flex flex-col gap-1.5">
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
                        <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
                            {entry.project_name}
                        </span>
                    </div>
                )}
                {!entry.customer_name && !entry.project_name && (
                    <span className="text-[10px] font-medium text-slate-400">—</span>
                )}
            </div>
        ),
        classification: (
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
        ),
        duration_minutes: (
            <div className="flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-black text-sm tracking-tight">{formatDuration(entry.duration_minutes)}</span>
            </div>
        ),
        actions: (
            <div className="flex justify-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                    setSelectedEntry(entry);
                                    setShowDetailModal(true);
                                }}
                                className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 border-gray-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 transition-all shadow-sm"
                            >
                                <Eye className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-blue-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest">View Details</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

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
                                onClick={() => {
                                    setEntryToDelete(entry.entry_id);
                                    setDeleteConfirmOpen(true);
                                }}
                                className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 border-gray-100 dark:border-slate-800 hover:border-red-100 dark:hover:border-red-900 transition-all shadow-sm"
                            >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-red-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest">Delete Log</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        )
    }));

    const availableProjects = projects.filter(p => !filters.customer_id || p.customer_id === filters.customer_id);
    const hasActiveFilters = filters.search || filters.customer_id || filters.project_id || filters.activity_type_id || filters.is_billable || filters.user_id || filters.team_id;

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm transition-all duration-300">
            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Execution Ledger
                        {hasActiveFilters && (
                            <Badge className="bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest ml-2">
                                Filtered
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="h-10 px-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-950 transition-all shadow-sm"
                        >
                            <Filter className="mr-2 h-3.5 w-3.5 text-blue-500" />
                            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            className="h-10 px-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-950 transition-all shadow-sm"
                        >
                            <Download className="mr-2 h-3.5 w-3.5 text-blue-500" />
                            Export
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

                {showAdvancedFilters && (
                    <div className="mt-6 space-y-4 p-6 bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* User Filter (Admin Only) */}
                            {isAdmin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team Member</label>
                                    <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen} modal={false}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                            >
                                                <span className="truncate">
                                                    {filters.user_id
                                                        ? users.find((u) => u.username === filters.user_id)?.name || filters.user_id
                                                        : "All members..."}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                            <Command className="dark:bg-slate-900">
                                                <CommandInput placeholder="Search members..." className="font-bold border-none focus:ring-0" />
                                                <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No member found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto p-2">
                                                    <CommandItem
                                                        value="all-users"
                                                        onSelect={() => {
                                                            setFilters(prev => ({ ...prev, user_id: '', page: 1 }));
                                                            setUserPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", !filters.user_id ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-bold text-sm tracking-tight">All Members</span>
                                                    </CommandItem>
                                                    {users.map((u) => (
                                                        <CommandItem
                                                            key={u.username}
                                                            value={u.name}
                                                            onSelect={() => {
                                                                setFilters(prev => ({ ...prev, user_id: u.username, page: 1 }));
                                                                setUserPopoverOpen(false);
                                                            }}
                                                            className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", filters.user_id === u.username ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm tracking-tight">{u.name}</span>
                                                                <span className="text-[9px] opacity-70 uppercase font-black">{u.username}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            {/* Team Filter (Admin Only) */}
                            {isAdmin && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Team</label>
                                    <Popover open={teamPopoverOpen} onOpenChange={setTeamPopoverOpen} modal={false}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                            >
                                                <span className="truncate">
                                                    {filters.team_id
                                                        ? teams.find((t) => t.id === filters.team_id)?.team_name
                                                        : "All teams..."}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                            <Command className="dark:bg-slate-900">
                                                <CommandInput placeholder="Search teams..." className="font-bold border-none focus:ring-0" />
                                                <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No team found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto p-2">
                                                    <CommandItem
                                                        value="all-teams"
                                                        onSelect={() => {
                                                            setFilters(prev => ({ ...prev, team_id: '', page: 1 }));
                                                            setTeamPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", !filters.team_id ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-bold text-sm tracking-tight">All Teams</span>
                                                    </CommandItem>
                                                    {teams.map((t) => (
                                                        <CommandItem
                                                            key={t.id}
                                                            value={t.team_name}
                                                            onSelect={() => {
                                                                setFilters(prev => ({ ...prev, team_id: t.id, page: 1 }));
                                                                setTeamPopoverOpen(false);
                                                            }}
                                                            className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                        >
                                                            <Check className={cn("mr-2 h-4 w-4", filters.team_id === t.id ? "opacity-100" : "opacity-0")} />
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || '#3b82f6' }} />
                                                                <span className="font-bold text-sm tracking-tight">{t.team_name}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}

                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        placeholder="Title or description..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                        className="h-11 pl-10 rounded-xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Customer Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client</label>
                                <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen} modal={false}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                        >
                                            <span className="truncate">
                                                {filters.customer_id
                                                    ? customers.find((c) => c.customer_id === filters.customer_id)?.display_name
                                                    : "All clients..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                        <Command className="dark:bg-slate-900">
                                            <CommandInput placeholder="Search clients..." className="font-bold border-none focus:ring-0" />
                                            <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No client found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto p-2">
                                                <CommandItem
                                                    value="all-clients"
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, customer_id: '', project_id: '' }));
                                                        setCustomerPopoverOpen(false);
                                                    }}
                                                    className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", !filters.customer_id ? "opacity-100" : "opacity-0")} />
                                                    <span className="font-bold text-sm tracking-tight">All Clients</span>
                                                </CommandItem>
                                                {customers.map((c) => (
                                                    <CommandItem
                                                        key={c.customer_id}
                                                        value={c.display_name}
                                                        onSelect={() => {
                                                            setFilters(prev => ({ ...prev, customer_id: c.customer_id, project_id: '' }));
                                                            setCustomerPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", filters.customer_id === c.customer_id ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-bold text-sm tracking-tight">{c.display_name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Project Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project</label>
                                <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen} modal={false}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                            disabled={availableProjects.length === 0}
                                        >
                                            <span className="truncate">
                                                {filters.project_id
                                                    ? projects.find((p) => p.id === filters.project_id)?.project_name
                                                    : "All projects..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                        <Command className="dark:bg-slate-900">
                                            <CommandInput placeholder="Search projects..." className="font-bold border-none focus:ring-0" />
                                            <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No project found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto p-2">
                                                <CommandItem
                                                    value="all-projects"
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, project_id: '' }));
                                                        setProjectPopoverOpen(false);
                                                    }}
                                                    className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", !filters.project_id ? "opacity-100" : "opacity-0")} />
                                                    <span className="font-bold text-sm tracking-tight">All Projects</span>
                                                </CommandItem>
                                                {availableProjects.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={p.project_name}
                                                        onSelect={() => {
                                                            setFilters(prev => ({ ...prev, project_id: p.id }));
                                                            setProjectPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", filters.project_id === p.id ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-bold text-sm tracking-tight">{p.project_name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Activity Type Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Activity</label>
                                <Select
                                    value={filters.activity_type_id?.toString()}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, activity_type_id: value === 'all' ? '' : parseInt(value) }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800">
                                        <SelectValue placeholder="All activities..." />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                        <SelectItem value="all" className="text-xs font-bold">All Activities</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category.id} value={category.id.toString()} className="text-xs font-bold">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: category.color }}></div>
                                                    {category.type_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Billable Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Billable</label>
                                <Select
                                    value={filters.is_billable?.toString()}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, is_billable: value === 'all' ? '' : value, page: 1 }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800">
                                        <SelectValue placeholder="All entries..." />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                        <SelectItem value="all" className="text-xs font-bold">All Entries</SelectItem>
                                        <SelectItem value="true" className="text-xs font-bold">Billable Only</SelectItem>
                                        <SelectItem value="false" className="text-xs font-bold">Non-Billable Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Page Size - Performance Optimization */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Records per Page</label>
                                <Select
                                    value={filters.limit.toString()}
                                    onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800">
                                        <SelectValue placeholder="Page size" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                        <SelectItem value="10" className="text-xs font-bold">10 Records</SelectItem>
                                        <SelectItem value="20" className="text-xs font-bold">20 Records</SelectItem>
                                        <SelectItem value="50" className="text-xs font-bold">50 Records</SelectItem>
                                        <SelectItem value="100" className="text-xs font-bold">100 Records</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                            <Button 
                                variant="outline"
                                onClick={resetFilters} 
                                className="h-11 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-slate-950 transition-all"
                            >
                                <X className="mr-2 h-3.5 w-3.5" />
                                Clear All
                            </Button>
                            <Button 
                                onClick={applyFilters} 
                                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg"
                            >
                                <Filter className="mr-2 h-3.5 w-3.5" />
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-4">Syncing Ledger...</span>
                    </div>
                ) : (
                    <>
                        <GenericTable
                            headers={tableHeaders}
                            data={tableData}
                            primaryKey="id"
                            sortBy={filters.sort_by}
                            sortOrder={filters.sort_order}
                            onSort={handleSort}
                            cellPadding="px-6"
                        />
                        
                        {totalRecords > 0 && (
                            <Pagination
                                currentPage={filters.page}
                                setCurrentPage={(page) => setFilters(prev => ({ ...prev, page }))}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                            />
                        )}
                    </>
                )}
            </CardContent>

            {/* Detail Modal */}
            <TimeEntryDetailModal
                entry={selectedEntry}
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
            />

            {/* Delete Confirmation Alert */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="rounded-[2rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">System Purge Request</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            Are you certain you want to remove this execution record from the ledger? This action cannot be reversed and will affect your productivity analytics.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => handleDelete(entryToDelete)}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest"
                        >
                            Delete Record
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default TimeEntriesList;
