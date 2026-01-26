import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Filter, X, Eye, FileDown } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Hamster from "@/components/animations/Hamster.jsx";
import GenericTable from "@/components/layouts/GenericTable";
import Pagination from "@/components/layouts/Pagination";
import SearchFilterForm from "@/components/layouts/SearchFilterForm";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { getDcrEntries, removeDcrEntry } from "../dcrSlice";
import { fetchAllUsers } from "../services/dcrAPI";
import { usePermissions } from "@/context/PermissionsContext";
import { PERMISSIONS } from "@/constants/permissions";
import { cn } from "@/lib/utils";

export default function DCRList() {
  const navigate = useNavigate();
  const { username } = useParams();
  const dispatch = useDispatch();
  const { list: entries, loading, error, totalPages, totalRecords } = useSelector((state) => state.dcr);
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission(PERMISSIONS.DCR_DELETE);

  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterUserId, setFilterUserId] = useState("");
  const [filterCallType, setFilterCallType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFields, setExportFields] = useState({
    timestamp: true,
    user: isAdmin,
    domain: true,
    contact: true,
    callType: true,
    duration: true,
    notes: true
  });

  // Debounce search
  const debounceTimeout = useRef();
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  // Load users for admin filter
  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
        .then((data) => setAllUsers(data.users || []))
        .catch((err) => console.error("Error fetching users:", err));
    }
  }, [isAdmin]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterUserId, filterCallType, filterStartDate, filterEndDate, sortBy, sortOrder]);

  // Fetch entries when filters change
  useEffect(() => {
    fetchEntries();
  }, [currentPage, debouncedSearch, filterUserId, filterCallType, filterStartDate, filterEndDate, sortBy, sortOrder]);

  const fetchEntries = () => {
    const params = {
      page: currentPage,
      limit: 10,
      search: debouncedSearch,
    };

    if (filterStartDate) params.startDate = new Date(filterStartDate).toISOString();
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      params.endDate = endDate.toISOString();
    }
    if (isAdmin && filterUserId) params.userId = filterUserId;
    if (filterCallType) params.callType = filterCallType;
    if (sortBy && sortOrder) {
      params.sort = sortBy;
      params.order = sortOrder;
    }

    dispatch(getDcrEntries(params));
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;

    try {
      await dispatch(removeDcrEntry(entryToDelete.id)).unwrap();
      toast.success("DCR entry deleted successfully");
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      fetchEntries();
    } catch (err) {
      toast.error(err || "Failed to delete DCR entry");
    }
  };

  const handleSort = (key) => {
    if (sortBy === key && sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortBy === key && sortOrder === "desc") {
      setSortBy(null);
      setSortOrder(null);
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setFilterUserId("");
    setFilterCallType("");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearch("");
  };

  const handleExport = async () => {
    try {
      // Build query params for export
      const params = {
        search: debouncedSearch,
      };

      if (exportStartDate) params.startDate = new Date(exportStartDate).toISOString();
      if (exportEndDate) {
        const endDate = new Date(exportEndDate);
        endDate.setHours(23, 59, 59, 999);
        params.endDate = endDate.toISOString();
      }
      if (isAdmin && filterUserId) params.userId = filterUserId;
      if (filterCallType) params.callType = filterCallType;

      // Fetch all entries for export (without pagination)
      const response = await dispatch(getDcrEntries({ ...params, limit: 10000 })).unwrap();
      const dataToExport = response.entries || entries;

      if (dataToExport.length === 0) {
        toast.warning("No data available to export");
        return;
      }

      if (exportFormat === "csv") {
        exportToCSV(dataToExport);
      } else if (exportFormat === "pdf") {
        exportToPDF(dataToExport);
      }

      setExportDialogOpen(false);
      toast.success(`Data exported successfully as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to export data");
      console.error("Export error:", err);
    }
  };

  const exportToCSV = (data) => {
    // Build CSV headers
    const headers = [];
    if (exportFields.timestamp) headers.push("Date & Time");
    if (exportFields.user && isAdmin) headers.push("User");
    if (exportFields.domain) headers.push("Domain / Company");
    if (exportFields.contact) headers.push("Contact Person");
    if (exportFields.callType) headers.push("Call Type");
    if (exportFields.duration) headers.push("Duration");
    if (exportFields.notes) headers.push("Description");

    // Build CSV rows
    const rows = data.map(entry => {
      const row = [];
      if (exportFields.timestamp) row.push(`"${formatDateTime(entry.timestamp)}"`);
      if (exportFields.user && isAdmin) row.push(`"${entry.user_name || '-'}"`);
      if (exportFields.domain) row.push(`"${entry.domain_name || entry.domain_free_text || entry.company_name || '-'}"`);
      if (exportFields.contact) row.push(`"${entry.contact_name || '-'}"`);
      if (exportFields.callType) row.push(`"${entry.call_type.charAt(0).toUpperCase() + entry.call_type.slice(1)}"`);
      if (exportFields.duration) row.push(`"${entry.time_spent || '-'}"`);
      if (exportFields.notes) row.push(`"${(entry.notes || '-').replace(/"/g, '""')}"`);
      return row.join(",");
    });

    // Combine headers and rows
    const csvContent = [headers.join(","), ...rows].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `DCR_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (data) => {
    // Create a formatted text content for PDF
    let content = "DAILY CALL REPORTS (DCR) - EXPORT REPORT\n";
    content += "=".repeat(80) + "\n\n";
    content += `Generated on: ${new Date().toLocaleString('en-IN')}\n`;
    content += `Total Records: ${data.length}\n`;

    if (exportStartDate || exportEndDate) {
      content += `Date Range: ${exportStartDate || 'Start'} to ${exportEndDate || 'End'}\n`;
    }
    content += "\n" + "=".repeat(80) + "\n\n";

    // Add each entry
    data.forEach((entry, index) => {
      content += `ENTRY #${index + 1}\n`;
      content += "-".repeat(80) + "\n";

      if (exportFields.timestamp) {
        content += `Date & Time:       ${formatDateTime(entry.timestamp)}\n`;
      }
      if (exportFields.user && isAdmin) {
        content += `User:              ${entry.user_name || '-'}\n`;
      }
      if (exportFields.domain) {
        content += `Domain/Company:    ${entry.domain_name || entry.domain_free_text || entry.company_name || '-'}\n`;
      }
      if (exportFields.contact) {
        content += `Contact Person:    ${entry.contact_name || '-'}\n`;
      }
      if (exportFields.callType) {
        content += `Call Type:         ${entry.call_type.charAt(0).toUpperCase() + entry.call_type.slice(1)}\n`;
      }
      if (exportFields.duration) {
        content += `Duration:          ${entry.time_spent || '-'}\n`;
      }
      if (exportFields.notes) {
        content += `Description:\n${entry.notes || '-'}\n`;
      }

      content += "\n";
    });

    content += "=".repeat(80) + "\n";
    content += "END OF REPORT\n";

    // Download as text file (formatted as PDF-like report)
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `DCR_Export_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExportField = (field) => {
    setExportFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const headers = [
    { key: "timestamp", label: "Date & Time" },
    ...(isAdmin ? [{ key: "user_name", label: "User" }] : []),
    { key: "domain_display", label: "Domain / Company" },
    { key: "contact_display", label: "Contact" },
    { key: "call_type", label: "Call Type" },
    { key: "time_spent", label: "Duration" },
    { key: "notes_preview", label: "Short Description" },
    { key: "actions", label: "Actions" }
  ];

  const activeFiltersCount = [filterUserId, filterCallType, filterStartDate, filterEndDate].filter(Boolean).length;

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4">
      <PageHeader
        title="Daily Call Reports"
        description="Chronological log of operational activities, stakeholder engagements, and system interactions."
        breadcrumbItems={[{ label: "Daily Call Reports" }]}
        actions={
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="rounded-xl h-14 px-6 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all gap-2"
              onClick={() => setExportDialogOpen(true)}
            >
              <FileDown className="w-5 h-5 mr-1" /> Export
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-14 px-6 font-black uppercase tracking-widest text-[10px] text-blue-600 border-blue-100 hover:bg-blue-50 transition-all gap-2"
              onClick={() => navigate(`/${username}/dashboard/dcr/detailed`)}
            >
              <Eye className="w-5 h-5 mr-1" /> Detailed Analytics
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
              onClick={() => navigate(`/${username}/dashboard/dcr/new`)}
            >
              <Plus className="w-5 h-5 mr-3" /> New Entry
            </Button>
          </div>
        }
      />

      <div className="space-y-8 mt-12">
        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
            <SearchFilterForm
              search={search}
              setSearch={setSearch}
              placeholder="Search by domain, company, contact, or notes..."
              className="w-full"
            />
            <div className="h-10 w-[1px] bg-gray-100 dark:bg-slate-800 mx-2" />
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] gap-2",
                activeFiltersCount > 0 ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Filter className="w-4 h-4" />
              Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-xl h-11 px-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                  />
                </div>

                {/* Call Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Call Type</label>
                  <Select
                    value={filterCallType || "all"}
                    onValueChange={(val) => {
                      setFilterCallType(val === "all" ? "" : val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Filter (Admin only) */}
                {isAdmin && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">User</label>
                    <Select
                      value={filterUserId || "all"}
                      onValueChange={(val) => {
                        setFilterUserId(val === "all" ? "" : val);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {allUsers.map((user) => (
                          <SelectItem key={user.username} value={user.username}>
                            {user.name} ({user.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-6 flex flex-col justify-center items-center">
            <Hamster />
          </div>
        ) : entries.length > 0 ? (
          <>
            <GenericTable
              headers={headers}
              data={entries.map((entry) => {
                const notesPreview = entry.notes ? (entry.notes.length > 50 ? entry.notes.substring(0, 50) + '...' : entry.notes) : "-";
                const currentUser = username; // Assuming username is the current logged in user
                const canEdit = isAdmin || entry.user_id === currentUser;

                return {
                  ...entry,
                  timestamp: formatDateTime(entry.timestamp),
                  domain_display: entry.domain_id ? (
                    <Link 
                      to={`/${username}/dashboard/domains/${entry.domain_id}`}
                      className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {entry.domain_name || entry.domain_free_text || entry.company_name || "-"}
                    </Link>
                  ) : (entry.domain_name || entry.domain_free_text || entry.company_name || "-"),
                  contact_display: entry.contact_id ? (
                    <Link 
                      to={`/${username}/dashboard/contacts/${entry.contact_id}`}
                      className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {entry.contact_name || "-"}
                    </Link>
                  ) : (entry.contact_name || "-"),
                  call_type: entry.call_type.charAt(0).toUpperCase() + entry.call_type.slice(1).replace('-', '-'),
                  notes_preview: (
                    <span title={entry.notes || "-"} className="cursor-help">
                      {notesPreview}
                    </span>
                  ),
                  actions: (
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/${username}/dashboard/dcr/${entry.id}`)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/${username}/dashboard/dcr/${entry.id}/edit`)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {hasPermission(PERMISSIONS.DCR_DELETE) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEntryToDelete(entry);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )
                };
              })}
              primaryKey="id"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
            />
          </>
        ) : (
          <div className="p-10 border rounded-md bg-white text-center">
            <div className="text-lg font-semibold mb-2">
              {debouncedSearch || activeFiltersCount > 0 ? "No results found" : "No DCR entries yet"}
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {debouncedSearch || activeFiltersCount > 0
                ? "Try adjusting your search or filters."
                : "Create your first DCR entry to get started."}
            </div>
            <Button onClick={() => navigate(`/${username}/dashboard/dcr/new`)}>
              <Plus className="w-4 h-4 mr-2" /> New Entry
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete DCR Entry</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this DCR entry? This action cannot be undone.
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

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export DCR Data</DialogTitle>
              <DialogDescription>
                Configure your export options and select the fields to include in the export.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Export Format */}
              <div>
                <label className="text-sm font-medium mb-2 block">Export Format</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                    <SelectItem value="pdf">Text Report (Formatted)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {exportFormat === "csv"
                    ? "Download data as a CSV file for use in Excel or other spreadsheet applications."
                    : "Download a formatted text report with detailed information for each entry."}
                </p>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Date Range (Optional)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                    <Input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                    <Input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to export all data based on current filters.
                </p>
              </div>

              {/* Fields Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Fields to Include</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-timestamp"
                      checked={exportFields.timestamp}
                      onCheckedChange={() => toggleExportField('timestamp')}
                    />
                    <label
                      htmlFor="export-timestamp"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Date & Time
                    </label>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="export-user"
                        checked={exportFields.user}
                        onCheckedChange={() => toggleExportField('user')}
                      />
                      <label
                        htmlFor="export-user"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        User
                      </label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-domain"
                      checked={exportFields.domain}
                      onCheckedChange={() => toggleExportField('domain')}
                    />
                    <label
                      htmlFor="export-domain"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Domain / Company
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-contact"
                      checked={exportFields.contact}
                      onCheckedChange={() => toggleExportField('contact')}
                    />
                    <label
                      htmlFor="export-contact"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Contact Person
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-callType"
                      checked={exportFields.callType}
                      onCheckedChange={() => toggleExportField('callType')}
                    />
                    <label
                      htmlFor="export-callType"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Call Type
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-duration"
                      checked={exportFields.duration}
                      onCheckedChange={() => toggleExportField('duration')}
                    />
                    <label
                      htmlFor="export-duration"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Duration
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="export-notes"
                      checked={exportFields.notes}
                      onCheckedChange={() => toggleExportField('notes')}
                    />
                    <label
                      htmlFor="export-notes"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Description / Notes
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={handleExport}
                disabled={!Object.values(exportFields).some(v => v)}
              >
                <FileDown className="w-4 h-4 mr-2" /> Export Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
