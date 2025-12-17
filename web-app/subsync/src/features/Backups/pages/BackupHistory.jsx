import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Download, RotateCcw, Search, Loader2 } from 'lucide-react';
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

            // Get filename from content-disposition header or use default
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'backup.sql.gz';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            // Create blob and download
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
                return <Badge className="bg-green-500">Completed</Badge>;
            case 'failed':
                return <Badge className="bg-red-500">Failed</Badge>;
            case 'in_progress':
                return <Badge className="bg-blue-500">In Progress</Badge>;
            case 'queued':
                return <Badge variant="secondary">Queued</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading && history.length === 0) {
        return <Hamster />;
    }

    return (
        <div className="container mx-auto p-6">
            <PageHeader
                title="Backup History"
                description="View and manage backup history"
                breadcrumbItems={[
                    { label: "Backups", href: `/${username}/dashboard/backups` },
                    { label: "History" }
                ]}
                actions={
                    <Button variant="ghost" onClick={() => navigate(`/${username}/dashboard/backups`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Backups
                    </Button>
                }
            />

            {/* Filters */}
            <div className="mb-4 flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search backups..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>
                </div>
                <Select value={selectedConfigId} onValueChange={(value) => {
                    setSelectedConfigId(value);
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="All Configurations" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Configurations</SelectItem>
                        {configs.map((config) => (
                            <SelectItem key={config.id} value={config.id.toString()}>
                                {config.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="queued">Queued</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Configuration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Database</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No backup history found
                                </TableCell>
                            </TableRow>
                        ) : (
                            history.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell className="font-medium">{entry.config_name || 'N/A'}</TableCell>
                                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                                    <TableCell>
                                        {entry.started_at
                                            ? new Date(entry.started_at).toLocaleString()
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {entry.completed_at
                                            ? new Date(entry.completed_at).toLocaleString()
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {entry.duration_seconds
                                            ? `${entry.duration_seconds}s`
                                            : 'N/A'}
                                    </TableCell>
                                    <TableCell>{formatFileSize(entry.file_size)}</TableCell>
                                    <TableCell>{entry.database_name || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {canDownload && entry.status === 'completed' && entry.file_path && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(entry.id)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {canRestore && entry.status === 'completed' && entry.file_path && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedHistory(entry);
                                                        setRestoreDialogOpen(true);
                                                    }}
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

            {/* Restore Confirmation Dialog */}
            <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Restore Database from Backup</DialogTitle>
                        <DialogDescription>
                            <div className="space-y-2 mt-2">
                                <p className="font-semibold text-red-600">⚠️ WARNING: This is a critical operation!</p>
                                <p>This will restore the database from the backup taken on:</p>
                                <p className="font-mono text-sm">
                                    {selectedHistory?.completed_at
                                        ? new Date(selectedHistory.completed_at).toLocaleString()
                                        : 'N/A'}
                                </p>
                                <p className="text-red-600 font-semibold">
                                    All current data will be replaced with the backup data. This action cannot be undone.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRestore}
                            disabled={restoring}
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


