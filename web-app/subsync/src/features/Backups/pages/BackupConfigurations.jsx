import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Play, Edit, Trash2, History, Search, Loader2 } from 'lucide-react';
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
            return <Badge className="bg-green-500">Success</Badge>;
        } else if (status === 'failed') {
            return <Badge className="bg-red-500">Failed</Badge>;
        }
        return <Badge variant="secondary">Never Run</Badge>;
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
        return <Hamster />;
    }

    return (
        <div className="container mx-auto p-6">
            <PageHeader
                title="Backup Configurations"
                description="Manage your database backup configurations"
                breadcrumbItems={[
                    { label: "Backups", href: `/${username}/dashboard/backups` }
                ]}
                actions={
                    canCreate && (
                        <Button onClick={() => navigate(`/${username}/dashboard/backups/new`)}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Configuration
                        </Button>
                    )
                }
            />

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search configurations..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Run</TableHead>
                            <TableHead>Retention</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {configs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No backup configurations found
                                </TableCell>
                            </TableRow>
                        ) : (
                            configs.map((config) => (
                                <TableRow key={config.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{config.name}</div>
                                            {config.description && (
                                                <div className="text-sm text-muted-foreground">{config.description}</div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {config.enabled ? (
                                                <Badge variant="outline" className="bg-green-50">Enabled</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50">Disabled</Badge>
                                            )}
                                            <span className="text-sm">{getScheduleLabel(config)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(config.last_run_status)}</TableCell>
                                    <TableCell>
                                        {config.last_run_at
                                            ? new Date(config.last_run_at).toLocaleString()
                                            : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        {config.retention_days} days / {config.max_backups} max
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {canTrigger && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTrigger(config.id)}
                                                    disabled={triggering === config.id || !config.enabled}
                                                >
                                                    {triggering === config.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/${username}/dashboard/backups/${config.id}/history`)}
                                            >
                                                <History className="h-4 w-4" />
                                            </Button>
                                            {canUpdate && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate(`/${username}/dashboard/backups/${config.id}/edit`)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedConfig(config);
                                                        setDeleteDialogOpen(true);
                                                    }}
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalRecords={totalRecords}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Backup Configuration</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{selectedConfig?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


