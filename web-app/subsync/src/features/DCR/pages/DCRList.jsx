import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Filter, X } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { getDcrEntries, removeDcrEntry } from "../dcrSlice";
import { fetchAllUsers } from "../services/dcrAPI";
import { usePermissions } from "@/context/PermissionsContext";
import { PERMISSIONS } from "@/constants/permissions";

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
    { key: "time_spent", label: "Time Spent" },
    { key: "actions", label: "Actions" }
  ];

  const activeFiltersCount = [filterUserId, filterCallType, filterStartDate, filterEndDate].filter(Boolean).length;

  return (
    <div className="p-4">
      <Breadcrumb items={[{ label: "Daily Call Reports" }]} />
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Daily Call Reports (DCR)</h1>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => navigate(`/${username}/dashboard/dcr/new`)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>
      <hr className="mb-6 border-blue-500 border-1" />

      {/* Search and Filters */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search by domain, company, contact, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={activeFiltersCount > 0 ? "border-blue-500 text-blue-600" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
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
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
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
            data={entries.map((entry) => ({
              ...entry,
              timestamp: formatDateTime(entry.timestamp),
              domain_display: entry.domain_name || entry.domain_free_text || entry.company_name || "-",
              contact_display: entry.contact_name || "-",
              call_type: entry.call_type.charAt(0).toUpperCase() + entry.call_type.slice(1),
              actions: (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => navigate(`/${username}/dashboard/dcr/${entry.id}/edit`)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {hasPermission(PERMISSIONS.DCR_DELETE) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEntryToDelete(entry);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )
            }))}
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
    </div>
  );
}
