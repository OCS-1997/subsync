import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Play, Edit, Trash2, History, Search, Loader2, Database, Shield, Activity, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { PageHeader } from '@/components/ui/breadcrumb.jsx';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import api from '@/lib/axiosInstance.js';
import Hamster from '@/components/animations/Hamster.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import { cn } from "@/lib/utils";

export default function BackupConfigurations() {
    const navigate = useNavigate();
    const { username } = useParams();
    const { hasPermission } = usePermissions();

    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [triggering, setTriggering] = useState(null);

    const canCreate = hasPermission(PERMISSIONS.BACKUPS_CREATE);
    const canUpdate = hasPermission(PERMISSIONS.BACKUPS_UPDATE);
    const canDelete = hasPermission(PERMISSIONS.BACKUPS_DELETE);
    const canTrigger = hasPermission(PERMISSIONS.BACKUPS_TRIGGER);

    useEffect(() => {
        fetchConfigs();
    }, [currentPage, searchTerm]);

    const fetchConfigs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/backups', {
                params: {
                    page: currentPage,
                    limit: 10,
                    search: searchTerm || undefined
                }
            });
            setConfigs(response.data.configs || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRecords(response.data.totalRecords || 0);
        } catch (error) {
            toast.error('Failed to load backup configurations');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedConfig) return;

        try {
            await api.delete(`/backups/${selectedConfig.id}`);
            toast.success('Backup configuration deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedConfig(null);
            fetchConfigs();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete backup configuration');
        }
    };

    const handleTrigger = async (configId) => {
        try {
            setTriggering(configId);
            const response = await api.post(`/backups/${configId}/trigger`);
            toast.success('Backup triggered successfully');
            fetchConfigs();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to trigger backup');
        } finally {
            setTriggering(null);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'success') {
            return (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none hover:bg-emerald-500/20 font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                    <Activity className="h-3 w-3 mr-1" /> Success
                </Badge>
            );
        } else if (status === 'failed') {
            return (
                <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-none hover:bg-red-500/20 font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                    <Shield className="h-3 w-3 mr-1" /> Failed
                </Badge>
            );
        }
        return (
            <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider px-3 py-1">
                Never Run
            </Badge>
        );
    };

    const getScheduleLabel = (config) => {
        if (config.schedule_type === 'manual') return 'Manual';
        if (config.schedule_type === 'daily') return `Daily at ${config.schedule_time}`;
        if (config.schedule_type === 'weekly') {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            return `Weekly on ${days[config.schedule_day_of_week]} at ${config.schedule_time}`;
        }
        if (config.schedule_type === 'monthly') {
            return `Monthly on day ${config.schedule_day_of_month} at ${config.schedule_time}`;
        }
        return config.schedule_type;
    };

    if (loading && configs.length === 0) {
        return (
            <div className="p-6 flex flex-col justify-center items-center">
                <Hamster />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-4 sm:px-8 py-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                <PageHeader
                    title="Backup Configurations"
                    description="Manage and automate your database backup strategies"
                    breadcrumbItems={[
                        { label: "Backups", href: `/${username}/dashboard/backups` }
                    ]}
                    actions={
                        canCreate && (
                            <Button
                                onClick={() => navigate(`/${username}/dashboard/backups/new`)}
                                className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:shadow-blue-500/20 px-6 h-11"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                New Configuration
                            </Button>
                        )
                    }
                />

                {/* Modern Search Bar */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5 w-full">
                        <Search className="text-slate-400 h-5 w-5 mr-3" />
                        <Input
                            placeholder="Search configurations by name or description..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border-none bg-transparent shadow-none focus-visible:ring-0 text-base p-0 w-full"
                        />
                    </div>
                </div>

                {/* Premium Table Container */}
                <div className="bg-white dark:bg-gray-800/20 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-b border-gray-100 dark:border-gray-800">
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Name</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Schedule</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Status</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Last Run</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14">Retention</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 h-14 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {configs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                                                <Database className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No configurations found</h3>
                                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">Get started by creating your first automated backup strategy.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                configs.map((config) => (
                                    <TableRow key={config.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-gray-50 dark:border-gray-800/50">
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 dark:text-slate-100">{config.name}</span>
                                                {config.description && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{config.description}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {config.enabled ? (
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                                                )}
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{getScheduleLabel(config)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(config.last_run_status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                                <Clock className="h-3.5 w-3.5 mr-2 opacity-50" />
                                                {config.last_run_at
                                                    ? new Date(config.last_run_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                                    : 'Never'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{config.retention_days} Days</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-tighter">Max: {config.max_backups}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {canTrigger && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleTrigger(config.id)}
                                                        disabled={triggering === config.id || !config.enabled}
                                                        className="h-9 w-9 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                                                        title="Run Backup Now"
                                                    >
                                                        {triggering === config.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Play className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigate(`/${username}/dashboard/backups/${config.id}/history`)}
                                                    className="h-9 w-9 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                                                    title="View History"
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                {canUpdate && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/${username}/dashboard/backups/${config.id}/edit`)}
                                                        className="h-9 w-9 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                                        title="Edit Configuration"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedConfig(config);
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        className="h-9 w-9 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="rounded-3xl border-slate-100 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Delete Backup Configuration</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 pt-2">
                            Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-slate-100">"{selectedConfig?.name}"</span>? This action is permanent and will stop all future scheduled backups for this configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 gap-3">
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl px-6 h-11 font-medium">
                            No, Keep it
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 h-11 font-medium shadow-lg shadow-red-500/20 transition-all">
                            Yes, Delete Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


