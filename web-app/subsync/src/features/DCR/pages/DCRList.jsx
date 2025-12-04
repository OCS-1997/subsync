import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Hamster from "@/components/animations/Hamster.jsx";
import GenericTable from "@/components/layouts/GenericTable";
import Pagination from "@/components/layouts/Pagination";
import { getDcrEntries, removeDcrEntry } from "../dcrSlice";
import { getWeekMeta, fetchAllUsers } from "../services/dcrAPI";
import { usePermissions } from "@/context/PermissionsContext";
import { PERMISSIONS } from "@/constants/permissions";

const ALL_USERS_VALUE = "__ALL_USERS__";

export default function DCRList() {
  const navigate = useNavigate();
  const { username } = useParams();
  const dispatch = useDispatch();
  const { list: entries, loading, error, totalPages, totalRecords, startDate, endDate } = useSelector((state) => state.dcr);
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission(PERMISSIONS.DCR_DELETE); // Admin has delete permission

  const [currentPage, setCurrentPage] = useState(1);
  const [weekSegment, setWeekSegment] = useState({ start: null, end: null, label: "" });
  const [filterUserId, setFilterUserId] = useState("");
  const [allUsers, setAllUsers] = useState([]);

  // Load week segment on mount
  useEffect(() => {
    loadWeekSegment(new Date());
  }, []);

  // Load users for admin filter
  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
        .then((data) => {
          setAllUsers(data.users || []);
        })
        .catch((err) => console.error("Error fetching users:", err));
    }
  }, [isAdmin]);

  // Fetch entries when filters change
  useEffect(() => {
    if (weekSegment.start && weekSegment.end) {
      fetchEntries();
    }
  }, [currentPage, weekSegment, filterUserId]);

  const loadWeekSegment = async (date) => {
    try {
      const data = await getWeekMeta(date.toISOString());
      setWeekSegment({
        start: new Date(data.start),
        end: new Date(data.end),
        label: formatWeekLabel(data.start, data.end)
      });
    } catch (err) {
      console.error("Error loading week segment:", err);
    }
  };

  const formatWeekLabel = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Extract day numbers
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const month = startDate.toLocaleDateString('en-IN', { month: 'long' });
    const year = startDate.getFullYear();

    return `${startDay}–${endDay} ${month} ${year}`;
  };

  const fetchEntries = () => {
    const params = {
      page: currentPage,
      limit: 10,
      startDate: weekSegment.start?.toISOString(),
      endDate: weekSegment.end?.toISOString(),
    };

    if (isAdmin && filterUserId) {
      params.userId = filterUserId;
    }

    dispatch(getDcrEntries(params));
  };

  const handlePrevWeek = () => {
    if (weekSegment.start) {
      const newDate = new Date(weekSegment.start);
      newDate.setDate(newDate.getDate() - 7);
      loadWeekSegment(newDate);
      setCurrentPage(1);
    }
  };

  const handleNextWeek = () => {
    if (weekSegment.end) {
      const newDate = new Date(weekSegment.end);
      newDate.setDate(newDate.getDate() + 1);
      loadWeekSegment(newDate);
      setCurrentPage(1);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this DCR entry?")) {
      return;
    }

    try {
      await dispatch(removeDcrEntry(id)).unwrap();
      toast.success("DCR entry deleted successfully");
      fetchEntries();
    } catch (err) {
      toast.error(err || "Failed to delete DCR entry");
    }
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

  return (
    <div className="p-4">
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

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-lg font-semibold text-blue-700">
            Week: {weekSegment.label || "Loading..."}
          </div>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Admin User Filter */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter by User:</label>
            <Select
              value={filterUserId || ALL_USERS_VALUE}
              onValueChange={(value) => {
                const normalized = value === ALL_USERS_VALUE ? "" : value;
                setFilterUserId(normalized);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_USERS_VALUE}>All Users</SelectItem>
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
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )
            }))}
            primaryKey="id"
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
          <div className="text-lg font-semibold mb-2">No DCR entries for this week</div>
          <div className="text-sm text-gray-600 mb-4">Create your first DCR entry to get started.</div>
          <Button onClick={() => navigate(`/${username}/dashboard/dcr/new`)}>
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Button>
        </div>
      )}
    </div>
  );
}


