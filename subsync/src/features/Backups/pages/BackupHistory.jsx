import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, RotateCcw, Search, Loader2, Filter, History, Database, Clock, HardDrive, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import api from '@/lib/axiosInstance.js';
import Hamster from '@/components/animations/Hamster.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import { cn } from "@/lib/utils";

export default function BackupHistory() {
    const navigate = useNavigate();
    const { username, configId } = useParams();
    const { hasPermission } = usePermissions();

    const [history, setHistory] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedConfigId, setSelectedConfigId] = useState(configId || 'all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [restoring, setRestoring] = useState(false);

    const canDownload = hasPermission(PERMISSIONS.BACKUPS_DOWNLOAD);
    const canRestore = hasPermission(PERMISSIONS.BACKUPS_RESTORE);

    useEffect(() => {
        fetchConfigs();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [currentPage, selectedConfigId, statusFilter]);

    const fetchConfigs = async () => {
        try {
            const response = await api.get('/backups', { params: { limit: 1000 } });
            setConfigs(response.data.configs || []);
        } catch (error) {
            console.error('Failed to load configurations:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 10,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                configId: selectedConfigId !== 'all' ? selectedConfigId : undefined
            };

            const response = await api.get('/backup-history', { params });
            setHistory(response.data.history || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalRecords || 0);
        } catch (error) {
            toast.error('Failed to load backup history');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (historyId) => {
        try {
            const response = await api.get(`/backup-history/${historyId}/download`, {
                responseType: 'blob'
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'backup.sql.gz';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Backup downloaded successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to download backup');
        }
    };

    const handleRestore = async () => {
        if (!selectedHistory) return;

        try {
            setRestoring(true);
            await api.post(`/backup-history/${selectedHistory.id}/restore`);
            toast.success('Database restored successfully from backup');
            setRestoreDialogOpen(false);
            setSelectedHistory(null);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to restore backup');
        } finally {
            setRestoring(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none hover:bg-emerald-500/20 font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                        Completed
                    </Badge>
                );
            case 'failed':
                return (
                    <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-none hover:bg-red-500/20 font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                        Failed
                    </Badge>
                );
            case 'in_progress':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none animate-pulse font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                        In Progress
                    </Badge>
                );
            case 'queued':
                return (
                    <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                        Queued
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                        {status}
                    </Badge>
                );
        }
    };

    if (loading && history.length === 0) {
        return (
            <div className="flex-0 flex-col items-center  justify-center min-h-[80vh]">
                <Hamster />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <PageHeader
                    title="Backup History"
                    description="Audit trail of all system backups and restoration events"
                    breadcrumbItems={[
                        { label: "Backups", href: `/${username}/dashboard/backups` },
                        { label: "History" }
                    ]}
                    actions={
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/${username}/dashboard/backups`)}
                            className="rounded-xl hover:bg-white dark:hover:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Backups
                        </Button>
                    }
                />

                {/* Filter Bar */}
                <div className="flex flex-col lg:flex-row gap-6 items-center px-1">
                    <div className="flex flex-1 gap-6 w-full items-center">
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
                            <Search className="text-slate-400 h-5 w-5 mr-3" />
                            <Input
                                placeholder="Search backup history..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="border-none bg-transparent shadow-none focus-visible:ring-0 text-base p-0 w-full"
                            />

                            <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 mx-4" />

                            <Select value={selectedConfigId} onValueChange={(value) => {
                                setSelectedConfigId(value);
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger className="w-56 border-none bg-transparent shadow-none focus:ring-0 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-3.5 w-3.5" />
                                        <SelectValue placeholder="All Clusters" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl p-2">
                                    <SelectItem value="all" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">All Configurations</SelectItem>
                                    {configs.map((config) => (
                                        <SelectItem key={config.id} value={config.id.toString()} className="rounded-xl my-1 mx-1 font-bold text-xs uppercase">
                                            {config.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800 mx-4" />

                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value);
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger className="w-44 border-none bg-transparent shadow-none focus:ring-0 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl p-2">
                                    <SelectItem value="all" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">All Status</SelectItem>
                                    <SelectItem value="completed" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">Completed</SelectItem>
                                    <SelectItem value="failed" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">Failed</SelectItem>
                                    <SelectItem value="in_progress" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">In Progress</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Premium Table */}
                <div className="bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Configuration</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Status</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Timeline</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Metrics</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Target</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                                                <History className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No history records</h3>
                                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">History will appear here once your backup schedules begin running.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((entry) => (
                                    <TableRow key={entry.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100">{entry.config_name || 'System Auto'}</span>
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 tracking-tighter uppercase">ID: {entry.id.toString().padStart(6, '0')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    <Clock className="h-3 w-3 mr-1.5 opacity-50" />
                                                    {entry.started_at ? new Date(entry.started_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </div>
                                                <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                                    Duration: {entry.duration_seconds ? `${entry.duration_seconds}s` : 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatFileSize(entry.file_size)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{entry.database_name || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {canDownload && entry.status === 'completed' && entry.file_path && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDownload(entry.id)}
                                                        className="h-9 w-9 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                                                        title="Download SQL"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canRestore && entry.status === 'completed' && entry.file_path && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedHistory(entry);
                                                            setRestoreDialogOpen(true);
                                                        }}
                                                        className="h-9 w-9 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                                                        title="Restore this version"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {totalPages > 1 && (
                        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-transparent">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Restore Confirmation Dialog */}
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <DialogContent className="rounded-3xl border-slate-100 dark:border-slate-800 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <RotateCcw className="h-5 w-5 text-red-600" />
                            System Restoration
                        </DialogTitle>
                        <DialogDescription className="space-y-4 pt-4">
                            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                                <p className="font-bold text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> CRITICAL OPERATION
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400/80 mt-1">
                                    This will overwrite your current database with the state from <span className="font-bold underline">{selectedHistory?.completed_at ? new Date(selectedHistory.completed_at).toLocaleString() : 'N/A'}</span>.
                                </p>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                Restoration replaces all current data including customers, subscriptions, and transactions. This process cannot be reversed once started.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-8 gap-3">
                        <Button variant="ghost" onClick={() => setRestoreDialogOpen(false)} className="rounded-xl px-6 h-11 font-medium">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRestore}
                            disabled={restoring}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 font-medium shadow-lg shadow-red-500/20 transition-all min-w-[160px]"
                        >
                            {restoring ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore Database
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


