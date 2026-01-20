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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const TimeEntryForm = ({ onSubmit, initialData = null, customers = [], projects = [], categories = [], compact = false }) => {
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

    // Duration options in minutes
    const durationOptions = [
        { label: '15 mins', value: 15 },
        { label: '30 mins', value: 30 },
        { label: '1 hour', value: 60 },
        { label: '2 hours', value: 120 },
        { label: '4 hours', value: 240 },
        { label: '8 hours', value: 480 },
    ];

    // Auto-calculate end time when duration changes
    useEffect(() => {
        if (formData.duration_minutes && formData.start_time) {
            const start = new Date(formData.start_time);
            const end = new Date(start.getTime() + formData.duration_minutes * 60000);
            setFormData(prev => ({ ...prev, end_time: end.toISOString() }));
        }
    }, [formData.duration_minutes, formData.start_time]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // If no duration specified, automatically start a timer
        if (!formData.duration_minutes) {
            const timerData = {
                ...formData,
                is_timer_running: true,
                duration_minutes: null,
                end_time: null,
            };
            onSubmit(timerData, true); // true flag indicates it's a timer start
        } else {
            // Save as completed time entry
            onSubmit(formData);
        }
    };

    const handleStartTimer = () => {
        const timerData = {
            ...formData,
            is_timer_running: true,
            duration_minutes: null,
            end_time: null,
        };
        onSubmit(timerData, true);
    };

    const selectedCustomer = customers.find(c => c.customer_id === formData.customer_id);
    const availableProjects = projects.filter(p => !formData.customer_id || p.customer_id === formData.customer_id);
    const selectedProject = projects.find(p => p.id === formData.project_id);

    const formContent = (
        <form onSubmit={handleSubmit} className={compact ? "space-y-6" : "space-y-10"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Start Date/Time */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Start Date & Time
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        type="date"
                                        value={format(new Date(formData.start_time), 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const date = new Date(e.target.value);
                                            const time = format(new Date(formData.start_time), 'HH:mm');
                                            const [hours, minutes] = time.split(':');
                                            date.setHours(parseInt(hours), parseInt(minutes));
                                            setFormData(prev => ({ ...prev, start_time: date.toISOString() }));
                                        }}
                                        className="h-11 pl-10 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="relative w-32 group">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        type="time"
                                        value={format(new Date(formData.start_time), 'HH:mm')}
                                        onChange={(e) => {
                                            const [hours, minutes] = e.target.value.split(':');
                                            const newDate = new Date(formData.start_time);
                                            newDate.setHours(parseInt(hours), parseInt(minutes));
                                            setFormData(prev => ({ ...prev, start_time: newDate.toISOString() }));
                                        }}
                                        className="h-11 pl-10 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Duration (minutes)
                            </Label>
                            <div className="relative">
                                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Enter minutes or leave empty to start timer"
                                    value={formData.duration_minutes || ''}
                                    onChange={(e) => {
                                        const value = e.target.value === '' ? null : parseInt(e.target.value);
                                        setFormData(prev => ({ ...prev, duration_minutes: value }));
                                    }}
                                    className="h-11 pl-10 pr-12 rounded-xl font-medium text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800"
                                />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                        >
                                            <ChevronsUpDown className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2 dark:bg-slate-900 dark:border-slate-800" align="end">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-xs font-medium text-slate-500 px-2 py-1">Quick Select</p>
                                            {durationOptions.map(option => (
                                                <Button
                                                    key={option.value}
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setFormData(prev => ({ ...prev, duration_minutes: option.value }))}
                                                    className="justify-start text-sm font-medium"
                                                >
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <p className="text-xs text-slate-500">Leave empty to start a live timer</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Customer */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Client Association
                            </Label>
                            <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
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
                                                : "Select client..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                    <Command className="dark:bg-slate-900">
                                        <CommandInput placeholder="Search clients..." className="font-bold border-none focus:ring-0" />
                                        <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No client found.</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-auto p-2">
                                            {customers.map((c) => (
                                                <CommandItem
                                                    key={c.customer_id}
                                                    value={c.display_name}
                                                    onSelect={() => {
                                                        setFormData(prev => ({ ...prev, customer_id: c.customer_id, project_id: '' }));
                                                        setCustomerPopoverOpen(false);
                                                    }}
                                                    className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", formData.customer_id === c.customer_id ? "opacity-100" : "opacity-0")} />
                                                    <span className="font-bold text-sm tracking-tight">{c.display_name}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Project */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Workspace/Project
                            </Label>
                            <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={projectPopoverOpen}
                                        className="h-11 w-full justify-between items-center px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-900 transition-all shadow-sm disabled:opacity-50"
                                        disabled={availableProjects.length === 0}
                                    >
                                        <span className="truncate">
                                            {formData.project_id
                                                ? projects.find((p) => p.id === formData.project_id)?.project_name
                                                : "Select project..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                    <Command className="dark:bg-slate-900">
                                        <CommandInput placeholder="Search projects..." className="font-bold border-none focus:ring-0" />
                                        <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No project found.</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-auto p-2">
                                            {availableProjects.map((p) => (
                                                <CommandItem
                                                    key={p.id}
                                                    value={p.project_name}
                                                    onSelect={() => {
                                                        setFormData(prev => ({ ...prev, project_id: p.id }));
                                                        setProjectPopoverOpen(false);
                                                    }}
                                                    className="rounded-lg mb-1 data-[selected=true]:bg-blue-600 data-[selected=true]:text-white cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", formData.project_id === p.id ? "opacity-100" : "opacity-0")} />
                                                    <span className="font-bold text-sm tracking-tight">{p.project_name}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Activity Category */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Intelligence Classification *
                            </Label>
                            <Select
                                value={formData.activity_type_id?.toString()}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, activity_type_id: parseInt(value) }))}
                            >
                                <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800">
                                    <SelectValue placeholder="Activity type..." />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Title */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-1">
                                Subject/Objective *
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
                                Financial Status
                            </Label>
                            <div className="flex items-center h-11 px-4 rounded-xl bg-gray-50/50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Billable Workflow</span>
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
                            Operational Narrative
                        </Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detailed telemetry and notes regarding this execution..."
                            rows={3}
                            className="rounded-[1.5rem] p-5 font-bold text-sm bg-white dark:bg-slate-950 border-gray-100 dark:border-slate-800 shadow-sm transition-all focus:h-32"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/50">
                        <Button type="submit" className="h-14 flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all duration-300">
                            <Save className="mr-3 h-4 w-4" />
                            {initialData ? 'Update Entry' : 'Save Entry'}
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

