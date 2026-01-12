import React, { useEffect, useState } from 'react';
import api from '../../lib/axiosInstance';
import Hamster from '@/components/animations/Hamster.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import { Search, Filter, RefreshCw, Eye, Calendar, User, Globe, Activity, Database, CalendarIcon, ShieldAlert, Zap, Layers, Info } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { cn } from "@/lib/utils";

const ActionBadge = ({ action }) => {
  const getActionStyles = (action) => {
    const actionLower = action?.toLowerCase() || '';
    if (actionLower.includes('delete') || actionLower.includes('failed') || actionLower.includes('error')) {
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
    if (actionLower.includes('update') || actionLower.includes('edit')) {
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
    if (actionLower.includes('login_success') || actionLower.includes('login')) {
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
    if (actionLower.includes('logout')) {
      return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
    return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  };

  return (
    <Badge className={cn("text-[9px] font-black uppercase tracking-widest border px-3 py-1 rounded-lg", getActionStyles(action))}>
      {action}
    </Badge>
  );
};

const DetailViewModal = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const formatDetails = (details) => {
    if (!details) return 'NO TELEMETRY DATA';
    if (typeof details === 'string') {
      try {
        return JSON.stringify(JSON.parse(details), null, 4);
      } catch {
        return details;
      }
    }
    return JSON.stringify(details, null, 4);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl rounded-[3rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 overflow-hidden">
        <DialogHeader className="p-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Activity className="text-blue-500" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Sequence Details</DialogTitle>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">LOG ID: {log.id}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temporal Stamp</span>
              </div>
              <p className="text-lg font-black tracking-tight uppercase tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString()}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <User className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Source</span>
              </div>
              <p className="text-lg font-black tracking-tight uppercase truncate">{log.username}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized User</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Action Matrix</span>
              </div>
              <ActionBadge action={log.action} />
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-4 w-4 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Origin IP</span>
              </div>
              <p className="text-lg font-black tabular-nums tracking-widest">{log.ip_address || 'UNIDENTIFIED'}</p>
            </div>
          </div>

          {(log.resource_type || log.resource_id) && (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-center">
              <div className="flex flex-col items-center gap-3">
                <Layers className="h-6 w-6 text-indigo-500" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Association</h4>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                    {log.resource_type || 'SYSTEM'}
                  </span>
                  {log.resource_id && (
                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black tabular-nums">
                      #{log.resource_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 ml-1">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Raw Telemetry Data</span>
            </div>
            <div className="rounded-3xl bg-slate-950 p-8 overflow-hidden shadow-inner font-mono text-xs leading-relaxed text-emerald-400 border border-white/5">
              <pre className="custom-scrollbar overflow-auto max-h-[300px]">
                {formatDetails(log.details)}
              </pre>
            </div>
          </div>
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
      setError(err.response?.data?.error || 'Synchronisation Failure');
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
      default:
        dateFrom = '';
        dateTo = '';
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 h-full flex flex-col">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <span>Security</span>
            <span className="opacity-40">/</span>
            <span className="text-blue-500">Audit Engine</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight">System Activity Log</h1>
          <p className="text-slate-500 font-medium max-w-xl">Comprehensive immutable ledger of all system interactions and administrative operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => fetchLogs(pagination.currentPage)} className="rounded-2xl h-12 border-slate-100 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest px-6 shadow-sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh Engine
          </Button>
        </div>
      </div>

      {/* Filters Hub */}
      <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none mb-10 overflow-visible overflow-x-auto">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Global Query</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-500" />
                <Input
                  placeholder="SEARCH ENTRIES..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 h-12 rounded-xl border-slate-100 dark:border-slate-800 focus:ring-blue-500/20 font-black uppercase text-[10px] tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Filter</label>
              <Input
                placeholder="USERNAME..."
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 focus:ring-blue-500/20 font-black uppercase text-[10px] tracking-widest"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Action Vector</label>
              <Select value={filters.action || 'all'} onValueChange={(value) => handleFilterChange('action', value === 'all' ? '' : value)}>
                <SelectTrigger className="h-12 rounded-xl border-slate-100 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest">
                  <SelectValue placeholder="EVENT CLASSIFICATION" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-800">
                  <SelectItem value="all" className="rounded-xl my-1 mx-1 font-black text-[10px]">ALL LOGS</SelectItem>
                  <SelectItem value="LOGIN_SUCCESS" className="rounded-xl my-1 mx-1 font-black text-[10px]">AUTHORISED ACCESS</SelectItem>
                  <SelectItem value="LOGIN_FAILED" className="rounded-xl my-1 mx-1 font-black text-[10px]">AUTH BLOCK</SelectItem>
                  <SelectItem value="LOGOUT" className="rounded-xl my-1 mx-1 font-black text-[10px]">SESSION EXIT</SelectItem>
                  <SelectItem value="CREATE" className="rounded-xl my-1 mx-1 font-black text-[10px]">STRUCTURAL ADDITION</SelectItem>
                  <SelectItem value="UPDATE" className="rounded-xl my-1 mx-1 font-black text-[10px]">ENTITY MUTATION</SelectItem>
                  <SelectItem value="DELETE" className="rounded-xl my-1 mx-1 font-black text-[10px]">PURGE OPERATION</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Resource Scope</label>
              <Input
                placeholder="RESOURCE TYPE..."
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="h-12 rounded-xl border-slate-100 dark:border-slate-800 focus:ring-blue-500/20 font-black uppercase text-[10px] tracking-widest"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Interval Start</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-100 dark:border-slate-800 tabular-nums focus:ring-blue-500/20 font-black uppercase text-[10px]"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Interval End</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-100 dark:border-slate-800 tabular-nums focus:ring-blue-500/20 font-black uppercase text-[10px]"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-6 border-t border-slate-50 dark:border-slate-800/50">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl h-10 px-4 font-black uppercase text-[10px] tracking-widest">
                <Filter className="h-4 w-4 mr-2" />
                Reset Parameters
              </Button>
              <div className="h-6 w-px bg-slate-100 dark:bg-slate-800 mx-2"></div>
              <div className="flex items-center gap-2">
                {['today', 'yesterday', 'last7days', 'last30days'].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangePreset(preset)}
                    className="rounded-xl h-10 px-4 border-slate-100 dark:border-slate-800 font-bold uppercase text-[9px] tracking-[0.2em] text-slate-500 hover:border-blue-500/30 hover:text-blue-500 transition-all"
                  >
                    {preset.replace(/([A-Z0-9])/g, ' $1').trim()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-500/5 border border-blue-500/10">
              <Activity size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                Telemetries Captured: {pagination.totalRecords}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Deck */}
      <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none flex-1 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto h-full">
            <table className="min-w-full text-sm">
              <thead className="bg-[#FBFCFE] dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Cluster</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Source</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Action Vector</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Origin IP</th>
                  <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Structural Goal</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Analytics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-40">
                      <div className="flex flex-col justify-center items-center h-full">
                        <Hamster />
                        <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Decompressing Ledger...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="text-center py-40">
                      <div className="flex flex-col items-center gap-4 text-rose-500">
                        <ShieldAlert className="h-12 w-12 opacity-40 animate-bounce" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">{error}</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-40">
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <Database className="h-12 w-12 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-[0.2em]">Zero Telemetry Events Detected</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-black tabular-nums tracking-widest text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {log.username.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-black uppercase tracking-tight text-xs">{log.username}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-black tabular-nums tracking-widest text-[10px] text-slate-500 dark:text-slate-400">
                          {formatIpAddress(log.ip_address)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {log.resource_type ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                              {log.resource_type}
                            </span>
                            {log.resource_id && (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-black tabular-nums text-slate-400">
                                #{log.resource_id}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em]">ROOT ACTION</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(log)}
                          className="h-10 w-10 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                        >
                          <Eye className="h-5 w-5" />
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

      {/* Pagination Command Bar */}
      {pagination.totalPages > 1 && (
        <div className="mt-10 flex justify-center">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalRecords={pagination.totalRecords}
            setCurrentPage={handlePageChange}
          />
        </div>
      )}

      {/* Detail Modal Engine */}
      <DetailViewModal
        log={selectedLog}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};

export default AdminActivityLog;
