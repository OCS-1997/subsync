import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, CheckSquare, Square, CheckCircle2, AlertCircle, Calendar, Filter } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

// Helper to convert Date to YYYY-MM-DD string safely
const toDateInputString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
};

const ExportModal = ({ 
    isOpen, 
    onClose, 
    users = [], 
    customers = [], 
    projects = [], 
    categories = [],
    currentUser, 
    hasTeamView, 
    defaultStartDate, 
    defaultEndDate 
}) => {
    const [formatType, setFormatType] = useState('excel'); // 'excel' | 'pdf'
    const [pdfOrientation, setPdfOrientation] = useState('portrait'); // 'portrait' | 'landscape'
    const [companyName, setCompanyName] = useState('Online Consultancy Services');
    const [scopeType, setScopeType] = useState('all'); // 'all' | 'specific' | 'self'
    const [selectedUsernames, setSelectedUsernames] = useState([]);
    
    // Dynamic Filter States
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterCustomerId, setFilterCustomerId] = useState('all');
    const [filterProjectId, setFilterProjectId] = useState('all');
    const [filterActivityTypeId, setFilterActivityTypeId] = useState('all');
    const [filterIsBillable, setFilterIsBillable] = useState('all');

    // Toggles
    const [includeCharts, setIncludeCharts] = useState(true);
    const [includeAI, setIncludeAI] = useState(true);
    const [includeRecs, setIncludeRecs] = useState(true);

    // Progress State
    const [exportStatus, setExportStatus] = useState('idle'); // 'idle' | 'exporting' | 'completed' | 'failed'
    const [progress, setProgress] = useState(0);
    const [taskId, setTaskId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset states on open
            setExportStatus('idle');
            setProgress(0);
            setTaskId('');
            setErrorMsg('');
            
            // Set default dates
            setFilterStartDate(toDateInputString(defaultStartDate || new Date()));
            setFilterEndDate(toDateInputString(defaultEndDate || new Date()));

            // Reset other filters
            setFilterCustomerId('all');
            setFilterProjectId('all');
            setFilterActivityTypeId('all');
            setFilterIsBillable('all');
            
            if (!hasTeamView) {
                setScopeType('self');
                setSelectedUsernames([currentUser?.username]);
            } else {
                setScopeType('all');
                setSelectedUsernames([]);
            }
        }
    }, [isOpen, hasTeamView, currentUser, defaultStartDate, defaultEndDate]);

    // Handle user selection checkbox
    const toggleUserSelection = (username) => {
        setSelectedUsernames(prev => {
            if (prev.includes(username)) {
                return prev.filter(u => u !== username);
            } else {
                return [...prev, username];
            }
        });
    };

    // Filter projects based on selected customer
    const filteredProjects = filterCustomerId === 'all' 
        ? projects 
        : projects.filter(p => p.customer_id === parseInt(filterCustomerId));

    // Poll task progress from backend
    const startPolling = (tid) => {
        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/time-tracking/reports/export-insights/status/${tid}`);
                const { status, progress: prg, error, fileName: fn } = response.data;
                
                setProgress(prg);
                setFileName(fn);

                if (status === 'completed') {
                    setExportStatus('completed');
                    clearInterval(interval);
                    triggerDownload(tid, fn);
                } else if (status === 'failed') {
                    setExportStatus('failed');
                    setErrorMsg(error || 'Failed to generate report.');
                    clearInterval(interval);
                    toast.error(error || 'Export generation failed.');
                }
            } catch (err) {
                console.error("Error polling export status:", err);
                setExportStatus('failed');
                setErrorMsg('Network error checking export status.');
                clearInterval(interval);
            }
        }, 1200);
    };

    // Trigger file download stream
    const triggerDownload = async (tid, fn) => {
        try {
            const response = await api.get(`/time-tracking/reports/export-insights/download/${tid}`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fn || `User_Insights_Report.${formatType === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Report downloaded successfully!');
        } catch (err) {
            console.error("Download stream error:", err);
            toast.error("Failed to download output file.");
        }
    };

    // Submit Export Job
    const handleExportTrigger = async () => {
        if (!filterStartDate || !filterEndDate) {
            toast.warn('Please select both start and end dates.');
            return;
        }

        setExportStatus('exporting');
        setProgress(0);
        setErrorMsg('');

        try {
            const payload = {
                format: formatType,
                orientation: pdfOrientation,
                companyName,
                includeCharts,
                includeAI,
                includeRecs,
                startDate: new Date(filterStartDate).toISOString(),
                endDate: new Date(filterEndDate).toISOString(),
                customerId: filterCustomerId === 'all' ? undefined : filterCustomerId,
                projectId: filterProjectId === 'all' ? undefined : filterProjectId,
                activityTypeId: filterActivityTypeId === 'all' ? undefined : filterActivityTypeId,
                isBillable: filterIsBillable === 'all' ? undefined : filterIsBillable,
                userIds: scopeType === 'all' ? 'all' : selectedUsernames
            };

            const response = await api.post('/time-tracking/reports/export-insights', payload);
            const { taskId: tid } = response.data;
            setTaskId(tid);
            startPolling(tid);
        } catch (err) {
            console.error("Failed to start export:", err);
            setExportStatus('failed');
            setErrorMsg(err.response?.data?.error || 'Failed to initialize export job.');
            toast.error(err.response?.data?.error || 'Export initialization failed.');
        }
    };

    // Get progress text label
    const getProgressLabel = () => {
        if (progress < 25) return 'Compiling user profiles...';
        if (progress < 55) return 'Analyzing operational KPIs & insights...';
        if (progress < 80) return 'Drawing charts and visualizations...';
        return 'Compiling sheet streams...';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl dark:bg-slate-950 max-h-[90vh] flex flex-col">
                {/* Header Banner */}
                <DialogHeader className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Download className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-black uppercase tracking-tight">Export User Insights</DialogTitle>
                            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                                Generate enterprise-grade operational reports
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {exportStatus === 'exporting' || exportStatus === 'completed' ? (
                        // PROGRESS SCREEN
                        <div className="p-8 pb-10 flex flex-col items-center justify-center min-h-[350px] bg-white dark:bg-slate-950 text-center gap-6">
                            {exportStatus === 'exporting' ? (
                                <div className="relative flex items-center justify-center h-28 w-28">
                                    <div className="absolute inset-0 border-4 border-slate-100 dark:border-slate-800 rounded-full" />
                                    <div 
                                        className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" 
                                        style={{ animationDuration: '1.5s' }}
                                    />
                                    <span className="text-lg font-black text-slate-800 dark:text-white">{progress}%</span>
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                            )}
                            <div>
                                <h4 className="text-md font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                    {exportStatus === 'exporting' ? 'Generating Report' : 'Compilation Complete'}
                                </h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {exportStatus === 'exporting' ? getProgressLabel() : 'Downloading file automatically...'}
                                </p>
                            </div>
                            {exportStatus === 'completed' && (
                                <Button 
                                    onClick={onClose}
                                    className="h-10 px-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest mt-2"
                                >
                                    Done
                                </Button>
                            )}
                        </div>
                    ) : (
                        // CONFIGURATION SCREEN
                        <div className="p-6 space-y-6 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                            {/* Format & Style */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450">File Format</Label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setFormatType('excel')}
                                            className={cn(
                                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                formatType === 'excel' 
                                                    ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm font-black" 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Excel (.xlsx)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormatType('pdf')}
                                            className={cn(
                                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                formatType === 'pdf' 
                                                    ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm font-black" 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            PDF (.pdf)
                                        </button>
                                    </div>
                                </div>

                                {formatType === 'pdf' ? (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450">Page Orientation</Label>
                                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => setPdfOrientation('portrait')}
                                                className={cn(
                                                    "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    pdfOrientation === 'portrait' 
                                                        ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm font-black" 
                                                        : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                Portrait
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPdfOrientation('landscape')}
                                                className={cn(
                                                    "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                    pdfOrientation === 'landscape' 
                                                        ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm font-black" 
                                                        : "text-slate-400 hover:text-slate-600"
                                                )}
                                            >
                                                Landscape
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450">Workspace / Brand</Label>
                                        <Input
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            className="h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-xs font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Date Filter Panel */}
                            <div className="space-y-3 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450">Reporting Date Range</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">From Date</span>
                                        <input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To Date</span>
                                        <input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Data Filters Selector Grid */}
                            <div className="space-y-3 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Filter className="w-4 h-4 text-blue-600" />
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450">Data Filters</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Customer / Client */}
                                    <div className="space-y-1 flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Client / Customer</span>
                                        <select
                                            value={filterCustomerId}
                                            onChange={(e) => {
                                                setFilterCustomerId(e.target.value);
                                                setFilterProjectId('all'); // reset project on customer change
                                            }}
                                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                                        >
                                            <option value="all">All Clients</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Project */}
                                    <div className="space-y-1 flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project</span>
                                        <select
                                            value={filterProjectId}
                                            onChange={(e) => setFilterProjectId(e.target.value)}
                                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                                        >
                                            <option value="all">All Projects</option>
                                            {filteredProjects.map(p => (
                                                <option key={p.id} value={p.id}>{p.project_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Activity Type */}
                                    <div className="space-y-1 flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Activity Type</span>
                                        <select
                                            value={filterActivityTypeId}
                                            onChange={(e) => setFilterActivityTypeId(e.target.value)}
                                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                                        >
                                            <option value="all">All Activities</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.type_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Billing Status */}
                                    <div className="space-y-1 flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Billing Status</span>
                                        <select
                                            value={filterIsBillable}
                                            onChange={(e) => setFilterIsBillable(e.target.value)}
                                            className="h-10 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                                        >
                                            <option value="all">All (Billable & Non-Billable)</option>
                                            <option value="1">Billable Only</option>
                                            <option value="0">Non-Billable Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Scope Select (Admin only) */}
                            {hasTeamView && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450">Export Scope</Label>
                                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() => setScopeType('all')}
                                            className={cn(
                                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                scopeType === 'all' 
                                                    ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm font-black" 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            All Team Members
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScopeType('specific')}
                                            className={cn(
                                                "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                scopeType === 'specific' 
                                                    ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm font-black" 
                                                    : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            Select Members
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Checkbox Grid for User List */}
                            {scopeType === 'specific' && hasTeamView && (
                                <div className="space-y-2 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-450 mb-1 block">Choose Members ({selectedUsernames.length} selected)</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                                        {users.map(u => {
                                            const isSelected = selectedUsernames.includes(u.username);
                                            return (
                                                <button
                                                    key={u.username}
                                                    type="button"
                                                    onClick={() => toggleUserSelection(u.username)}
                                                    className="flex items-center gap-2 text-left bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-all text-xs"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                                    )}
                                                    <span className="font-bold truncate text-[11px]">{u.name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Contents Toggles */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-450 block mb-1">Include Options</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { state: includeCharts, set: setIncludeCharts, title: 'Visual Charts', desc: 'Embed graphs' },
                                        { state: includeAI, set: setIncludeAI, title: 'AI Summaries', desc: 'Narrative playbooks' },
                                        { state: includeRecs, set: setIncludeRecs, title: 'Recommendations', desc: 'Actionable playbooks' }
                                    ].map((item, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => item.set(!item.state)}
                                            className={cn(
                                                "flex flex-col items-start gap-1 p-4 rounded-2xl border text-left transition-all hover:scale-[1.02]",
                                                item.state 
                                                    ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-500/30 text-blue-600 border-blue-500" 
                                                    : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-850 text-slate-400"
                                            )}
                                        >
                                            <span className="text-xs font-black uppercase tracking-tight">{item.title}</span>
                                            <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">{item.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error Warning */}
                            {exportStatus === 'failed' && (
                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-500 text-xs">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="font-bold uppercase tracking-tight">{errorMsg}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer buttons (Fixed at bottom) */}
                {exportStatus !== 'exporting' && exportStatus !== 'completed' && (
                    <div className="flex gap-3 justify-end p-4 border-t border-slate-50 dark:border-slate-900 bg-white dark:bg-slate-950 shrink-0">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="h-11 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-100 dark:border-slate-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleExportTrigger}
                            disabled={scopeType === 'specific' && selectedUsernames.length === 0}
                            className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                        >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Generate Report
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ExportModal;
