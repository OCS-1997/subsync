import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Clock, Play, Save, Check, ChevronsUpDown, Calendar, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const TimeEntryForm = ({ onSubmit, initialData = null, customers = [], projects = [], categories = [], compact = false }) => {
    // Helper function to convert ISO string to local datetime-local format
    const toLocalDateTimeString = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // Format: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Helper function to convert local datetime-local format to ISO string
    const fromLocalDateTimeString = (dateTimeString) => {
        if (!dateTimeString) return new Date().toISOString();
        // Create date object from local datetime string
        const date = new Date(dateTimeString);
        return date.toISOString();
    };

    const [formData, setFormData] = useState({
        start_time: initialData?.start_time || new Date().toISOString(),
        duration_minutes: initialData?.duration_minutes || null,
        end_time: initialData?.end_time || null,
        customer_id: initialData?.customer_id || '',
        project_id: initialData?.project_id || '',
        activity_type_id: initialData?.activity_type_id || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        is_billable: initialData?.is_billable !== undefined ? initialData.is_billable : false,
    });

    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
    const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
    const [durationPopoverOpen, setDurationPopoverOpen] = useState(false);
    const [isStartTimeModified, setIsStartTimeModified] = useState(false);

    // Sync form with initialData for editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                start_time: initialData.start_time || new Date().toISOString(),
                duration_minutes: initialData.duration_minutes || null,
                end_time: initialData.end_time || null,
                customer_id: initialData.customer_id || '',
                project_id: initialData.project_id || '',
                activity_type_id: initialData.activity_type_id || '',
                title: initialData.title || '',
                description: initialData.description || '',
                is_billable: initialData.is_billable !== undefined ? initialData.is_billable : false,
            });
        } else {
            // Reset to defaults if initialData is cleared
            setFormData({
                start_time: new Date().toISOString(),
                duration_minutes: null,
                end_time: null,
                customer_id: '',
                project_id: '',
                activity_type_id: '',
                title: '',
                description: '',
                is_billable: false,
            });
        }
        setIsStartTimeModified(false);
    }, [initialData]);

    // Expanded Duration presets
    const durationPresets = {
        short: [
            { label: '5m', value: 5 },
            { label: '10m', value: 10 },
            { label: '15m', value: 15 },
            { label: '20m', value: 20 },
            { label: '25m', value: 25 },
            { label: '30m', value: 30 },
            { label: '40m', value: 40 },
            { label: '45m', value: 45 },
            { label: '50m', value: 50 },
        ],
        standard: [
            { label: '1h', value: 60 },
            { label: '1.25h', value: 75 },
            { label: '1.5h', value: 90 },
            { label: '1.75h', value: 105 },
            { label: '2h', value: 120 },
            { label: '2.25h', value: 135 },
            { label: '2.5h', value: 150 },
            { label: '2.75h', value: 165 },
            { label: '3h', value: 180 },
            { label: '3.25h', value: 195 },
            { label: '3.5h', value: 210 },
            { label: '3.75h', value: 225 },
        ],
        blocks: [
            { label: '4h', value: 240 },
            { label: '5h', value: 300 },
            { label: '6h', value: 360 },
            { label: '7h', value: 420 },
            { label: '8h', value: 480 },
            { label: '10h', value: 600 },
            { label: '12h', value: 720 },
        ]
    };

    const [showAllPresets, setShowAllPresets] = useState(false);

    // Context-aware: Get recommendation based on time of day
    const getRecommendation = () => {
        const hour = new Date().getHours();
        if (hour >= 8 && hour < 11) return 120; // Deep work morning (2h)
        if (hour >= 11 && hour < 14) return 30; // Quick sync/admin (30m)
        if (hour >= 14 && hour < 17) return 60; // Afternoon focus (1h)
        if (hour >= 17 && hour < 20) return 45; // Day wrap-up (45m)
        return 15; // Late night / Early morning catchup
    };

    const recommendedValue = getRecommendation();

    const mainPresets = [
        { label: '15m', value: 15 },
        { label: '30m', value: 30 },
        { label: '1h', value: 60 },
        { label: '2h', value: 120 },
        { label: '4h', value: 240 },
        { label: '8h', value: 480 },
    ];

    const recommendedPreset = mainPresets.find(p => p.value === recommendedValue) || mainPresets[1];

    // Helper to calculate end time based on start and duration
    const updateEndTimeFromDuration = (startTime, durationMins) => {
        if (!durationMins && durationMins !== 0) return null;
        const start = new Date(startTime);
        const end = new Date(start.getTime() + durationMins * 60000);
        return end.toISOString();
    };

    // Helper to calculate duration based on start and end
    const updateDurationFromEndTime = (startTime, endTime) => {
        if (!endTime) return null;
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        return Math.max(0, Math.floor(diffMs / 60000));
    };

    // Auto-calculate end time when duration OR start_time changes
    useEffect(() => {
        if (formData.duration_minutes !== null) {
            const newEndTime = updateEndTimeFromDuration(formData.start_time, formData.duration_minutes);
            if (newEndTime !== formData.end_time) {
                setFormData(prev => ({ ...prev, end_time: newEndTime }));
            }
        }
    }, [formData.duration_minutes, formData.start_time]);

    const handleDurationChange = (type, value) => {
        const val = Math.max(0, parseInt(value) || 0);
        let totalMinutes = formData.duration_minutes || 0;
        
        const currentHours = Math.floor(totalMinutes / 60);
        const currentMins = totalMinutes % 60;

        if (type === 'hours') {
            totalMinutes = (val * 60) + currentMins;
        } else {
            // Cap minutes at 59 for the input field logic
            totalMinutes = (currentHours * 60) + Math.min(59, val);
        }

        setFormData(prev => ({ ...prev, duration_minutes: totalMinutes }));
    };

    const handleEndTimeChange = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const end = new Date(formData.start_time);
        end.setHours(parseInt(hours), parseInt(minutes));
        
        // If end time is before start time, assume it's the next day
        if (end < new Date(formData.start_time)) {
            end.setDate(end.getDate() + 1);
        }

        const newDuration = updateDurationFromEndTime(formData.start_time, end.toISOString());
        setFormData(prev => ({ ...prev, end_time: end.toISOString(), duration_minutes: newDuration }));
    };

    const resetForm = () => {
        setFormData({
            start_time: new Date().toISOString(),
            duration_minutes: null,
            end_time: null,
            customer_id: '',
            project_id: '',
            activity_type_id: '',
            title: '',
            description: '',
            is_billable: false,
        });
        setIsStartTimeModified(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // If no duration specified, automatically start a timer
            if (!formData.duration_minutes) {
                // Refresh start_time to 'now' if it hasn't been manually modified
                // and we are creating a new entry (not editing)
                const finalStartTime = (!isStartTimeModified && !initialData) 
                    ? new Date().toISOString() 
                    : formData.start_time;

                const timerData = {
                    ...formData,
                    start_time: finalStartTime,
                    is_timer_running: true,
                    duration_minutes: null,
                    end_time: null,
                };
                await onSubmit(timerData, true); // true flag indicates it's a timer start
            } else {
                // Save as completed time entry
                await onSubmit(formData);
            }
            
            // Only reset if it was a new entry (not editing)
            if (!initialData) {
                resetForm();
            }
            
            window.dispatchEvent(new CustomEvent('timeTrackingUpdated'));
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const handleStartTimer = async () => {
        // Refresh start_time to 'now' if it hasn't been manually modified
        // and we are creating a new entry (not editing)
        const finalStartTime = (!isStartTimeModified && !initialData) 
            ? new Date().toISOString() 
            : formData.start_time;

        const timerData = {
            ...formData,
            start_time: finalStartTime,
            is_timer_running: true,
            duration_minutes: null,
            end_time: null,
        };
        try {
            await onSubmit(timerData, true);
            if (!initialData) resetForm();
            window.dispatchEvent(new CustomEvent('timeTrackingUpdated'));
        } catch (error) {
            console.error('Timer start error:', error);
        }
    };

    const selectedCustomer = customers.find(c => c.customer_id === formData.customer_id);
    const availableProjects = projects.filter(p => !formData.customer_id || p.customer_id === formData.customer_id);
    
    // Sort for predictable search results
    const sortedCustomers = React.useMemo(() => 
        [...customers].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || '')),
        [customers]
    );

    const sortedProjects = React.useMemo(() => 
        [...availableProjects].sort((a, b) => (a.project_name || '').localeCompare(b.project_name || '')),
        [availableProjects]
    );

    const selectedProject = projects.find(p => p.id === formData.project_id);

    const formContent = (
        <form onSubmit={handleSubmit} className={compact ? "space-y-6" : "space-y-10"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Start Date/Time */}
                        <div className="md:col-span-1 lg:col-span-2 space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                Start Date & Time
                            </Label>
                            <Input
                                type="datetime-local"
                                value={toLocalDateTimeString(formData.start_time)}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, start_time: fromLocalDateTimeString(e.target.value) }));
                                    setIsStartTimeModified(true);
                                }}
                                className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800"
                            />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight pl-1">
                                Started at: {formData.start_time ? format(new Date(formData.start_time), 'hh:mm a') : 'N/A'}
                            </p>
                        </div>

                        {/* Duration */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                Duration
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-1 items-center bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden group focus-within:border-blue-500/50 transition-all">
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={Math.floor((formData.duration_minutes || 0) / 60) || ''}
                                            onChange={(e) => handleDurationChange('hours', e.target.value)}
                                            className="h-11 border-none bg-transparent font-bold text-sm text-center focus-visible:ring-0 px-1"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">H</span>
                                    </div>
                                    <div className="text-slate-300 font-bold opacity-30 px-1">:</div>
                                    <div className="relative flex-1">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="59"
                                            placeholder="00"
                                            value={((formData.duration_minutes || 0) % 60).toString().padStart(2, '0')}
                                            onChange={(e) => handleDurationChange('minutes', e.target.value)}
                                            className="h-11 border-none bg-transparent font-bold text-sm text-center focus-visible:ring-0 px-1"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase pointer-events-none">M</span>
                                    </div>
                                </div>

                                <Popover open={durationPopoverOpen} onOpenChange={(open) => {
                                    setDurationPopoverOpen(open);
                                    if (!open) setShowAllPresets(false);
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-11 px-3 rounded-xl border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-900/10 group transition-all"
                                        >
                                            <Timer className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-5 dark:bg-slate-900 dark:border-slate-800 rounded-3xl shadow-2xl border-gray-100/50 backdrop-blur-xl" align="end">
                                        <div className="space-y-6">
                                            {/* Common Presets (Progressive Disclosure) */}
                                            <div>
                                                <div className="flex items-center justify-between mb-3 px-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flash Presets</p>
                                                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                                        <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                                        <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">Smarter Selection</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {mainPresets.map(preset => (
                                                        <Button
                                                            key={preset.value}
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, duration_minutes: preset.value }));
                                                                setDurationPopoverOpen(false);
                                                            }}
                                                            className={cn(
                                                                "h-10 text-[10px] font-black rounded-xl transition-all uppercase relative overflow-hidden",
                                                                preset.value === recommendedValue 
                                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700" 
                                                                    : "bg-gray-100/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 dark:text-slate-300"
                                                            )}
                                                        >
                                                            {preset.label}
                                                            {preset.value === recommendedValue && (
                                                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border border-white"></span>
                                                                </span>
                                                            )}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Expandable Power Options */}
                                            {!showAllPresets ? (
                                                <div className="flex items-center gap-2 pt-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={() => setShowAllPresets(true)}
                                                        className="flex-1 h-11 text-[10px] font-black text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 uppercase tracking-widest border border-blue-100 dark:border-blue-900/30"
                                                    >
                                                        Show Advanced Grid
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Short Bursts</p>
                                                        <div className="grid grid-cols-4 gap-1.5">
                                                            {durationPresets.short.map(preset => (
                                                                <Button
                                                                    key={preset.value}
                                                                    type="button"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setFormData(prev => ({ ...prev, duration_minutes: preset.value }));
                                                                        setDurationPopoverOpen(false);
                                                                    }}
                                                                    className="h-8 text-[9px] font-black rounded-lg bg-gray-50/50 dark:bg-slate-800/50 hover:bg-blue-600 hover:text-white transition-all uppercase"
                                                                >
                                                                    {preset.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">Deep Work Grid</p>
                                                        <div className="grid grid-cols-4 gap-1.5">
                                                            {[...durationPresets.standard, ...durationPresets.blocks].map(preset => (
                                                                <Button
                                                                    key={preset.value}
                                                                    type="button"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setFormData(prev => ({ ...prev, duration_minutes: preset.value }));
                                                                        setDurationPopoverOpen(false);
                                                                    }}
                                                                    className="h-8 text-[9px] font-black rounded-lg bg-gray-50/50 dark:bg-slate-800/50 hover:bg-indigo-600 hover:text-white transition-all uppercase"
                                                                >
                                                                    {preset.label}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowAllPresets(false)}
                                                        className="w-full text-[9px] font-black text-slate-400 hover:text-blue-500 uppercase tracking-widest"
                                                    >
                                                        Collapse to essentials
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, duration_minutes: 0 }));
                                                        setDurationPopoverOpen(false);
                                                    }}
                                                    className="flex-1 h-10 text-[9px] font-black text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all uppercase tracking-widest"
                                                >
                                                    Clear Duration
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight pl-1">
                                {formData.duration_minutes > 0 ? `Total Allocation: ${formData.duration_minutes} mins` : 'Live Tracking Mode'}
                            </p>
                        </div>

                        {/* End Time */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                                End Time
                            </Label>
                            <div className="flex h-11 items-center px-4 rounded-xl bg-gray-50/50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800">
                                <Clock className="h-4 w-4 text-slate-400 mr-3" />
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                                    {formData.end_time ? format(new Date(formData.end_time), 'hh:mm a') : 'N/A'}
                                </span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight pl-1">
                                Calculated automatically
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Customer */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Client
                            </Label>
                            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen} modal={false}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={customerPopoverOpen}
                                        className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-900 transition-all shadow-sm"
                                    >
                                        <span className="truncate">
                                            {formData.customer_id
                                                ? customers.find((c) => c.customer_id === formData.customer_id)?.display_name
                                                : "Select client"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                    <Command className="dark:bg-slate-900">
                                        <CommandInput placeholder="Search clients..." className="font-bold border-none focus:ring-0" />
                                        <CommandList className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                                            <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No client found.</CommandEmpty>
                                            <CommandGroup className="p-2">
                                                {sortedCustomers.map((c) => (
                                                    <CommandItem
                                                        key={c.customer_id}
                                                        value={c.display_name}
                                                        onSelect={() => {
                                                            // Allow unselecting by clicking on the same customer
                                                            if (formData.customer_id === c.customer_id) {
                                                                setFormData(prev => ({ ...prev, customer_id: '', project_id: '' }));
                                                            } else {
                                                                setFormData(prev => ({ ...prev, customer_id: c.customer_id, project_id: '' }));
                                                            }
                                                            setCustomerPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", formData.customer_id === c.customer_id ? "opacity-100" : "opacity-0")} />
                                                        <span className="font-bold text-sm tracking-tight">{c.display_name}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Project */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Project
                            </Label>
                            <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen} modal={false}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={projectPopoverOpen}
                                        className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50"
                                        disabled={availableProjects.length === 0}
                                    >
                                        <span className="truncate flex items-center gap-2">
                                            {formData.project_id && (
                                                <div 
                                                    className="w-2.5 h-2.5 rounded-full shadow-sm" 
                                                    style={{ backgroundColor: projects.find((p) => p.id === formData.project_id)?.color || '#3b82f6' }} 
                                                />
                                            )}
                                            {formData.project_id
                                                ? projects.find((p) => p.id === formData.project_id)?.project_name
                                                : "Select project"}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                    <Command className="dark:bg-slate-900">
                                        <CommandInput placeholder="Search projects..." className="font-bold border-none focus:ring-0" />
                                        <CommandList className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
                                            <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No project found.</CommandEmpty>
                                            <CommandGroup className="p-2">
                                                {sortedProjects.map((p) => (
                                                    <CommandItem
                                                        key={p.id}
                                                        value={p.project_name}
                                                        onSelect={() => {
                                                            // Allow unselecting by clicking on the same project
                                                            if (formData.project_id === p.id) {
                                                                setFormData(prev => ({ ...prev, project_id: '' }));
                                                            } else {
                                                                setFormData(prev => ({ ...prev, project_id: p.id }));
                                                            }
                                                            setProjectPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", formData.project_id === p.id ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <div 
                                                                className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" 
                                                                style={{ backgroundColor: p.color || '#3b82f6' }} 
                                                            />
                                                            <span className="font-bold text-sm tracking-tight">{p.project_name}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Activity Category */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Activity Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.activity_type_id ? String(formData.activity_type_id) : ""}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type_id: parseInt(value) }))}
                            >
                                <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800">
                                    <SelectValue placeholder="Select activity type" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                    {Array.isArray(categories) && categories.length > 0 ? (
                                        categories.map(category => (
                                            <SelectItem key={category.id} value={String(category.id)} className="text-xs font-bold py-3">
                                                <div className="flex items-start gap-3 w-full">
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] shrink-0 mt-1" style={{ backgroundColor: category.color || '#6b7280' }}></div>
                                                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                        <span className="font-bold text-sm leading-tight text-slate-900 dark:text-white">{category.type_name}</span>
                                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-normal normal-case break-words">
                                                            {category.description || 'No specific guidelines provided for this activity.'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
                                            No categories available
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {(() => {
                                if (!Array.isArray(categories)) return null;
                                const selectedCat = categories.find(c => String(c.id) === String(formData.activity_type_id));
                                if (selectedCat) {
                                    return (
                                        <div className="mt-2 p-3 rounded-xl bg-blue-50/10 dark:bg-blue-900/10 border border-blue-500/10 dark:border-blue-500/20 animate-in fade-in slide-in-from-top-1 duration-500">
                                            <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 leading-relaxed italic">
                                                &ldquo;{selectedCat.description || 'Log your time against this activity to track work patterns.'}&rdquo;
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Title */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Subject/Objective <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Core task focus..."
                                required
                                className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm"
                            />
                        </div>

                        {/* Billable Toggle */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Billing
                            </Label>
                            <div className="flex items-center h-11 px-4 rounded-xl bg-gray-50/50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Billable</span>
                                <Switch
                                    id="billable"
                                    checked={formData.is_billable}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_billable: checked }))}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                            Description {!formData.project_id && <span className="text-red-500">*</span>}
                        </Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Add details or notes..."
                            rows={3}
                            required={!formData.project_id}
                            className="rounded-[1.5rem] p-5 font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm transition-all focus:h-32"
                        />
                        {!formData.project_id && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                ⚠ Details required for non-project work
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/50">
                        <Button type="submit" className="h-14 flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all duration-300">
                            <Save className="mr-3 h-4 w-4" />
                            {initialData ? 'Update Entry' : 'Save Entry / Start Logging'}
                        </Button>
                    </div>
                </form>
    );

    if (compact) {
        return formContent;
    }

    return (
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm transition-all duration-300">
            <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 p-8">
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    {initialData ? 'Edit Time Entry' : 'New Time Entry'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-10">
                {formContent}
            </CardContent>
        </Card>
    );
};

export default TimeEntryForm;

