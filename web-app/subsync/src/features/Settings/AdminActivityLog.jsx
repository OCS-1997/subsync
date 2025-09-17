import React, { useEffect, useState } from 'react';
import api from '../../lib/axiosInstance';
import Hamster from '@/components/animations/Hamster.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import { Search, Filter, RefreshCw, Eye, Calendar, User, Globe, Activity, Database, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx';

const ActionBadge = ({ action }) => {
  const getActionColor = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('delete') || actionLower.includes('failed')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (actionLower.includes('login_success') || actionLower.includes('login')) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (actionLower.includes('logout')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    if (actionLower.includes('failed') || actionLower.includes('error')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <Badge className={`text-xs font-medium border ${getActionColor(action)}`}>
      {action}
    </Badge>
  );
};

// Detailed view modal component
const DetailViewModal = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const formatDetails = (details) => {
    if (!details) return 'No details available';
    if (typeof details === 'string') {
      try {
        return JSON.stringify(JSON.parse(details), null, 2);
      } catch {
        return details;
      }
    }
    return JSON.stringify(details, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Activity Log Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Timestamp</span>
                </div>
                <p className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(log.timestamp).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Username</span>
                </div>
                <p className="text-sm text-gray-600">{log.username}</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Action</span>
                </div>
                <ActionBadge action={log.action} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">IP Address</span>
                </div>
                <p className="text-sm text-gray-600 font-mono">{log.ip_address || 'N/A'}</p>
              </CardContent>
            </Card>
          </div>

          {(log.resource_type || log.resource_id) && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Resource Type</span>
                  </div>
                  <p className="text-sm text-gray-600">{log.resource_type || 'N/A'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Resource ID</span>
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{log.resource_id || 'N/A'}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Details</span>
              </div>
              <pre className="text-xs bg-gray-50 p-3 rounded border overflow-auto max-h-64">
                {formatDetails(log.details)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 20
  });
  const [filters, setFilters] = useState({
    search: '',
    username: '',
    action: 'all',
    resourceType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.username && { username: filters.username }),
        ...(filters.action && filters.action !== 'all' && { action: filters.action }),
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const res = await api.get(`/activity-logs?${params}`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || pagination);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filters]);

  const handlePageChange = (page) => {
    fetchLogs(page);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      username: '',
      action: 'all',
      resourceType: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const formatIpAddress = (ip) => {
    if (!ip) return 'N/A';
    // Remove IPv6 prefix if present
    return ip.startsWith('::ffff:') ? ip.replace('::ffff:', '') : ip;
  };

  const getDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateRangePreset = (preset) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = getDateString(today);

    switch (preset) {
      case 'today':
        dateFrom = getDateString(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = getDateString(yesterday);
        dateTo = getDateString(yesterday);
        break;
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        dateFrom = getDateString(last7Days);
        break;
      case 'last30days':
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        dateFrom = getDateString(last30Days);
        break;
      case 'thisMonth':
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFrom = getDateString(firstDayOfMonth);
        break;
      case 'lastMonth':
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        dateFrom = getDateString(firstDayOfLastMonth);
        dateTo = getDateString(lastDayOfLastMonth);
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    setFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo
    }));
  };

  return (
    <div className="p-2 md:p-6 w-full mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
          Activity Logs <span className="text-base font-normal text-gray-500">(Admin Only)</span>
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Monitor system activities and user actions across the application
        </p>
        <hr className="mt-4 border-gray-200 dark:border-gray-700" />
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <Input
                placeholder="Filter by username"
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
              <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS">Login Success</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Resource Type</label>
              <Input
                placeholder="Filter by resource"
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.currentPage)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              <span className="text-sm text-gray-600 mr-2">Quick ranges:</span>
              <Button variant="ghost" size="sm" onClick={() => handleDateRangePreset('today')}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDateRangePreset('yesterday')}>
                Yesterday
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDateRangePreset('last7days')}>
                Last 7 days
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDateRangePreset('last30days')}>
                Last 30 days
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDateRangePreset('thisMonth')}>
                This month
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Showing {logs.length} of {pagination.totalRecords} entries
              {(filters.dateFrom || filters.dateTo) && (
                <span className="ml-2 text-blue-600">
                  • Filtered by date
                  {filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo
                    ? ` (${filters.dateFrom})`
                    : filters.dateFrom && filters.dateTo
                    ? ` (${filters.dateFrom} to ${filters.dateTo})`
                    : filters.dateFrom
                    ? ` (from ${filters.dateFrom})`
                    : ` (until ${filters.dateTo})`
                  }
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                   <td colSpan={10} className="py-8 text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col justify-center items-center h-full">
                      <Hamster />
                    </div>
                  </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-red-500">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="h-8 w-8" />
                        <span>{error}</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Database className="h-8 w-8" />
                        <span>No activity logs found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-gray-300">{log.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                            {formatIpAddress(log.ip_address)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {log.resource_type && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Database className="h-3 w-3" />
                              <span>{log.resource_type}</span>
                              {log.resource_id && (
                                <span className="text-xs">#{log.resource_id}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            setCurrentPage={handlePageChange}
          />
        </div>
      )}

      {/* Detail Modal */}
      <DetailViewModal
        log={selectedLog}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};

export default AdminActivityLog; 