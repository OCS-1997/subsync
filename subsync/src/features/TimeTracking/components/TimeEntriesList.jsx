import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
import { Calendar } from '@/components/ui/calendar';
import { 
    Pencil, Trash2, Search, Download, Clock, Briefcase, User, Filter, 
    RotateCcw, X, Calendar as CalendarIcon, Eye, List, CalendarDays, 
    ChevronLeft, ChevronRight as ChevronRightIcon, Check, ChevronsUpDown 
} from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { 
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday 
} from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import GenericTable from '@/components/layouts/GenericTable';
import Pagination from '@/components/layouts/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-4">
                                <CalendarIcon className="h-4 w-4 text-blue-500" />
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
                                    <CalendarIcon className="h-4 w-4 text-slate-400" />
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

const CalendarGrid = ({ currentMonth, entries, onDateSelect, selectedDate }) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd
    });

    const entriesByDate = entries.reduce((acc, entry) => {
        const dateKey = format(new Date(entry.start_time), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(entry);
        return acc;
    }, {});

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-4 sm:p-8 pb-32 overflow-x-auto no-scrollbar">
            <div className="grid grid-cols-7 mb-4 min-w-[700px]">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden bg-slate-100/50 dark:bg-slate-800/50 min-w-[700px]">
                {days.map((day, i) => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayEntries = entriesByDate[dateKey] || [];
                    const isSelected = isSameDay(day, selectedDate);
                    const isInMonth = isSameMonth(day, monthStart);
                    const isTodayCircle = isToday(day);

                    return (
                        <div 
                            key={i}
                            onClick={() => onDateSelect(day)}
                            className={cn(
                                "min-h-[100px] p-3 transition-all cursor-pointer relative group bg-white dark:bg-slate-900 border border-transparent",
                                !isInMonth && "opacity-30",
                                isSelected && "ring-2 ring-blue-500 z-10 shadow-2xl",
                                !isSelected && "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                    "text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                                    isTodayCircle ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {dayEntries.length > 0 && (
                                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none text-[9px] font-black px-1.5 h-5 rounded-md">
                                        {dayEntries.length}
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="space-y-1.5 max-h-[80px] overflow-hidden">
                                {dayEntries.slice(0, 3).map((entry, idx) => (
                                    <div 
                                        key={idx} 
                                        className="text-[9px] font-bold truncate px-2 py-1 rounded-md border border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.activity_color || '#3b82f6' }} />
                                        {entry.title}
                                    </div>
                                ))}
                                {dayEntries.length > 3 && (
                                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest pl-2 pt-0.5">
                                        + {dayEntries.length - 3} More
                                    </div>
                                )}
                            </div>

                            {isSelected && (
                                <div className="absolute bottom-2 right-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TimeEntriesList = ({ refresh, onEdit, customers = [], projects = [], categories = [], users = [], teams = [] }) => {
    const currentUser = useSelector(state => state.auth.user);
    const [showAllUsers, setShowAllUsers] = useState(false);
    const permissions = useSelector(state => state.auth.permissions);
    const isAdmin = permissions?.includes('time-tracking.view-team') || permissions?.includes('time-tracking.manage');

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        user_id: currentUser?.user_id || '',
        team_id: '',
        customer_id: '',
        project_id: '',
        activity_type_id: '',
        is_billable: '',
        page: 1,
        limit: 20,
        sort_by: '',
        sort_order: '',
        startDate: '',
        endDate: ''
    });
    const [userPopoverOpen, setUserPopoverOpen] = useState(false);
    const [viewType, setViewType] = useState('calendar'); // 'table' or 'calendar'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
    const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [fromDatePopoverOpen, setFromDatePopoverOpen] = useState(false);
    const [toDatePopoverOpen, setToDatePopoverOpen] = useState(false);
    const [monthPickerOpen, setMonthPickerOpen] = useState(false);

    useEffect(() => {
        if (viewType === 'calendar') {
            // Only auto-set dates if no custom date range is set
            if (!filters.startDate && !filters.endDate) {
                const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
                const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
                setFilters(prev => ({ ...prev, startDate: start, endDate: end, limit: 1000 }));
            } else {
                setFilters(prev => ({ ...prev, limit: 1000 }));
            }
        } else {
            if (!filters.startDate && !filters.endDate) {
                setFilters(prev => ({ ...prev, limit: 20 }));
            }
        }
    }, [viewType, currentMonth]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
                   params.append(key, filters[key]);
                }
            });

            const endpoint = showAllUsers ? '/time-tracking/entries/all' : '/time-tracking/entries';
            const response = await api.get(`${endpoint}?${params}`);
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

    useEffect(() => {
        fetchEntries();
    }, [refresh, filters.page, filters.limit, filters.sort_by, filters.sort_order, filters.user_id, filters.customer_id, filters.project_id, filters.activity_type_id, filters.is_billable, filters.startDate, filters.endDate, showAllUsers]);

    // Debounced search effect
    useEffect(() => {
        if (filters.search === '') {
            fetchEntries();
            return;
        }
        const debounceTimer = setTimeout(() => {
            fetchEntries();
        }, 500);
        return () => clearTimeout(debounceTimer);
    }, [filters.search]);

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
            user_id: currentUser?.user_id || '',
            team_id: '',
            customer_id: '',
            project_id: '',
            activity_type_id: '',
            is_billable: '',
            page: 1,
            limit: 20,
            sort_by: '',
            sort_order: '',
            startDate: '',
            endDate: ''
        });
    };

    const applyFilters = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (columnKey) => {
        setFilters(prev => {
            if (prev.sort_by !== columnKey) {
                return { ...prev, sort_by: columnKey, sort_order: 'asc', page: 1 };
            } else if (prev.sort_order === 'asc') {
                return { ...prev, sort_order: 'desc', page: 1 };
            } else if (prev.sort_order === 'desc') {
                return { ...prev, sort_by: '', sort_order: '', page: 1 };
            } else {
                return { ...prev, sort_by: columnKey, sort_order: 'asc', page: 1 };
            }
        });
    };

    const tableHeaders = useMemo(() => {
        const headers = [
            { key: 'timestamp', label: 'Timestamp', align: 'left' },
            { key: 'title', label: 'Objective', align: 'left' }
        ];

        if (showAllUsers) {
            headers.push({ key: 'user', label: 'Resource', align: 'left' });
        }

        headers.push(
            { key: 'dimensions', label: 'Dimensions', align: 'left' },
            { key: 'classification', label: 'Classification', align: 'left' },
            { key: 'duration_minutes', label: 'Duration', align: 'center' },
            { key: 'actions', label: 'Actions', align: 'center' }
        );

        return headers;
    }, [showAllUsers]);

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
        user: (
            <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                    {entry.user_full_name || 'System User'}
                </span>
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                    @{entry.user_name || entry.user_id}
                </span>
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
    
    // Check if there are active filters (including date range)
    const hasCustomDateRange = viewType === 'table' 
        ? (filters.startDate || filters.endDate)
        : (filters.startDate && filters.endDate && 
           (filters.startDate !== format(startOfMonth(currentMonth), 'yyyy-MM-dd') || 
            filters.endDate !== format(endOfMonth(currentMonth), 'yyyy-MM-dd')));
    
    const hasActiveFilters = filters.search || filters.customer_id || filters.project_id || 
                              filters.activity_type_id || filters.is_billable || hasCustomDateRange;

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] border-gray-100 shadow-sm transition-all duration-300 mb-12">
            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 p-8 rounded-t-[2rem]">
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
                    <div className="flex items-center gap-6">
                        <div className="bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center shadow-inner">
                            <button
                                onClick={() => setViewType('table')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    viewType === 'table' 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                <List size={14} />
                                Table
                            </button>
                            <button
                                onClick={() => setViewType('calendar')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    viewType === 'calendar' 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                <CalendarDays size={14} />
                                Calendar
                            </button>
                        </div>

                        {viewType === 'calendar' && (
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                                <button 
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
                                >
                                    <ChevronLeft size={16} className="text-slate-400" />
                                </button>
                                <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] w-32 text-center hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg p-2 transition-all">
                                            {format(currentMonth, 'MMMM yyyy')}
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="center">
                                        <Calendar
                                            mode="single"
                                            selected={currentMonth}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setCurrentMonth(date);
                                                    setMonthPickerOpen(false);
                                                }
                                            }}
                                            initialFocus
                                            className="rounded-xl"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <button 
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-all"
                                >
                                    <ChevronRightIcon size={16} className="text-slate-400" />
                                </button>
                            </div>
                        )}
                        
                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-slate-800 mx-1" />

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAllUsers(!showAllUsers)}
                                        className={cn(
                                            "h-10 px-4 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm",
                                            showAllUsers 
                                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white" 
                                                : "border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-950"
                                        )}
                                    >
                                        <User className={cn("mr-2 h-3.5 w-3.5", showAllUsers ? "text-white" : "text-blue-500")} />
                                        {showAllUsers ? "Showing All Users" : "Show All Users"}
                                    </Button>
                                )}
                            </div>
                            
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
                    </div>
                </div>

                {showAdvancedFilters && (
                    <div className="mt-6 space-y-4 p-6 bg-white dark:bg-slate-950 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <div className={cn(
                            "grid gap-4",
                            viewType === 'table' 
                                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        )}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Search</label>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        placeholder="Title or description..."
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                        className="h-11 pl-10 rounded-xl bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800 font-bold text-sm transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resource</label>
                                <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen} modal={false}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                        >
                                            <span className="truncate">
                                                {filters.user_id
                                                    ? (users.find((u) => String(u.user_id) === String(filters.user_id))?.display_name || users.find((u) => String(u.user_id) === String(filters.user_id))?.name || "Selected Resource")
                                                    : "All Resources..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                        <Command className="dark:bg-slate-900">
                                            <CommandInput placeholder="Search resources..." className="font-bold border-none focus:ring-0" />
                                            <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No resource found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto p-2">
                                                <CommandItem
                                                    value="all-users"
                                                    onSelect={() => {
                                                        setFilters(prev => ({ ...prev, user_id: '' }));
                                                        setUserPopoverOpen(false);
                                                    }}
                                                    className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", !filters.user_id ? "opacity-100" : "opacity-0")} />
                                                    <span className="font-bold text-sm tracking-tight">All Resources</span>
                                                </CommandItem>
                                                {users.map((u) => (
                                                    <CommandItem
                                                        key={u.user_id}
                                                        value={u.display_name || u.name}
                                                        onSelect={() => {
                                                            setFilters(prev => ({ ...prev, user_id: u.user_id }));
                                                            setUserPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", String(filters.user_id) === String(u.user_id) ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-bold text-sm tracking-tight">{u.display_name || u.name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

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

                            {viewType === 'table' && (
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
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">From Date</label>
                                <Popover open={fromDatePopoverOpen} onOpenChange={setFromDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                        >
                                            <span className={cn("truncate", !filters.startDate && "text-slate-400")}>
                                                {filters.startDate ? format(new Date(filters.startDate), 'MMM dd, yyyy') : 'Select start date...'}
                                            </span>
                                            <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.startDate ? new Date(filters.startDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setFilters(prev => ({ ...prev, startDate: format(date, 'yyyy-MM-dd'), page: 1 }));
                                                    setFromDatePopoverOpen(false);
                                                }
                                            }}
                                            initialFocus
                                            className="rounded-xl"
                                        />
                                        {filters.startDate && (
                                            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, startDate: '', page: 1 }));
                                                        setFromDatePopoverOpen(false);
                                                    }}
                                                    className="w-full h-9 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <X className="mr-2 h-3 w-3" />
                                                    Clear Date
                                                </Button>
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">To Date</label>
                                <Popover open={toDatePopoverOpen} onOpenChange={setToDatePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-gray-50/50 dark:bg-slate-900 border-gray-100 dark:border-slate-800"
                                        >
                                            <span className={cn("truncate", !filters.endDate && "text-slate-400")}>
                                                {filters.endDate ? format(new Date(filters.endDate), 'MMM dd, yyyy') : 'Select end date...'}
                                            </span>
                                            <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.endDate ? new Date(filters.endDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setFilters(prev => ({ ...prev, endDate: format(date, 'yyyy-MM-dd'), page: 1 }));
                                                    setToDatePopoverOpen(false);
                                                }
                                            }}
                                            disabled={(date) => {
                                                // Disable dates before the start date if start date is set
                                                if (filters.startDate) {
                                                    return date < new Date(filters.startDate);
                                                }
                                                return false;
                                            }}
                                            initialFocus
                                            className="rounded-xl"
                                        />
                                        {filters.endDate && (
                                            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFilters(prev => ({ ...prev, endDate: '', page: 1 }));
                                                        setToDatePopoverOpen(false);
                                                    }}
                                                    className="w-full h-9 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    <X className="mr-2 h-3 w-3" />
                                                    Clear Date
                                                </Button>
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
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
                ) : viewType === 'table' ? (
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
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 items-start min-h-[800px]">
                        <div className="lg:col-span-8 border-r border-slate-100 dark:border-slate-800 overflow-x-auto rounded-bl-[2rem]">
                            <CalendarGrid 
                                currentMonth={currentMonth} 
                                entries={entries} 
                                selectedDate={selectedDate}
                                onDateSelect={setSelectedDate}
                            />
                        </div>
                        <div className="lg:col-span-4 bg-gray-50/30 dark:bg-slate-900/10 rounded-br-[2rem] min-h-[800px]">
                            <div className="p-8 sticky top-0">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">
                                            {format(selectedDate, 'EEEE')}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {format(selectedDate, 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                                        <Clock className="text-white h-5 w-5" />
                                    </div>
                                </div>

                                <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar pr-2">
                                    {entries.filter(e => isSameDay(new Date(e.start_time), selectedDate)).length > 0 ? (
                                        entries.filter(e => isSameDay(new Date(e.start_time), selectedDate)).map((entry, idx) => (
                                            <div 
                                                key={idx}
                                                className="group p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm flex flex-col gap-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">
                                                        {format(new Date(entry.start_time), 'HH:mm')}
                                                    </span>
                                                    <Badge className="bg-slate-50 dark:bg-slate-950 text-slate-400 border-none text-[8px] font-black uppercase tracking-widest">
                                                        {formatDuration(entry.duration_minutes)}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{entry.title}</h4>
                                                    {showAllUsers && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <User className="h-3 w-3 text-blue-500" />
                                                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase truncate">
                                                                {entry.user_full_name} (@{entry.user_name})
                                                            </span>
                                                        </div>
                                                    )}
                                                    {entry.customer_name && (
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <Briefcase className="h-3 w-3 text-slate-300" />
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase truncate">{entry.customer_name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 mt-auto border-t border-slate-50 dark:border-slate-800">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => {
                                                            setSelectedEntry(entry);
                                                            setShowDetailModal(true);
                                                        }}
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    >
                                                        <Eye size={14} className="text-blue-500" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => onEdit(entry)}
                                                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    >
                                                        <Pencil size={14} className="text-slate-400" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                                <CalendarIcon className="text-slate-200 h-6 w-6" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Nothing logged for this day</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
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
