import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import PermissionGate from '@/components/auth/PermissionGate.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';

const DCRList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const username = location.pathname.split('/')[1];

    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        category: '',
        call_type: '',
        search: ''
    });
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
        loadEntries();
    }, [page, filters]);

    const loadCategories = async () => {
        try {
            const res = await api.get('/dcr/categories');
            setCategories(res.data || []);
        } catch (err) {
            console.error('Failed to load categories');
        }
    };

    const loadEntries = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                ...filters
            };
            const res = await api.get('/dcr', { params });
            setEntries(res.data.dataArray || []);
            setTotalCount(res.data.totalCount || 0);
        } catch (err) {
            toast.error('Failed to load DCR entries');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;

        try {
            await api.delete(`/dcr/${id}`);
            toast.success('Entry deleted successfully');
            loadEntries();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to delete entry');
        }
    };

    const handleEdit = (entry) => {
        navigate(`/${username}/dashboard/dcr/edit/${entry.id}`, { state: { entry } });
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams(filters);
            const res = await api.get('/dcr/export', { params, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `dcr_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Export completed');
        } catch (err) {
            toast.error('Failed to export entries');
        }
    };

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const handleFilterChange = (key, value) => {
        // Convert "all" back to empty string for API filtering
        const filterValue = value === 'all' ? '' : value;
        setFilters(prev => ({ ...prev, [key]: filterValue }));
        setPage(1);
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Daily Call Register</h1>
                <div className="flex gap-2">
                    <PermissionGate required={PERMISSIONS.DCR_VIEW}>
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </PermissionGate>
                    <PermissionGate required={PERMISSIONS.DCR_CREATE}>
                        <Button onClick={() => navigate(`/${username}/dashboard/dcr/add`)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Entry
                        </Button>
                    </PermissionGate>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                    <label className="text-sm font-medium mb-1 block">Start Date</label>
                    <Input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">End Date</label>
                    <Input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Call Type</label>
                    <Select value={filters.call_type || 'all'} onValueChange={(value) => handleFilterChange('call_type', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Inbound">Inbound</SelectItem>
                            <SelectItem value="Outbound">Outbound</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Search</label>
                    <Input
                        placeholder="Search..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Domain</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center">Loading...</TableCell>
                            </TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center">No entries found</TableCell>
                            </TableRow>
                        ) : (
                            entries.map(entry => (
                                <TableRow key={entry.id}>
                                    <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>{entry.user_name}</TableCell>
                                    <TableCell>{entry.company || '-'}</TableCell>
                                    <TableCell>{entry.domain || '-'}</TableCell>
                                    <TableCell>{entry.contact_person || '-'}</TableCell>
                                    <TableCell>{entry.call_type}</TableCell>
                                    <TableCell>{entry.category}</TableCell>
                                    <TableCell>{formatTime(entry.time_spent_minutes)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <PermissionGate required={PERMISSIONS.DCR_UPDATE}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(entry)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </PermissionGate>
                                            <PermissionGate required={PERMISSIONS.DCR_DELETE}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(entry.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </PermissionGate>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalCount > limit && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            disabled={page * limit >= totalCount}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DCRList;

