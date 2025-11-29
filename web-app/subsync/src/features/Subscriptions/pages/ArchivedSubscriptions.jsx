import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { RotateCcw, History, MoreVertical, Edit, Archive, RotateCw } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";

import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import SubscriptionHistory from "../components/SubscriptionHistory.jsx";
import { Input } from "@/components/ui/input.jsx";

const sortMap = {
  domain_name: 's.domain_name',
  customer_name: 'c.display_name',
  start_date: 's.start_date',
  end_date: 's.end_date',
  total: 's.total',
};

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

const StatusPill = ({ status }) => {
  const variant = status === 'Active' ? 'secondary' : status === 'Expired' ? 'destructive' : 'default';
  return <Badge variant={variant}>{status}</Badge>;
};

export default function ArchivedSubscriptions({ onEdit }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [renewDialog, setRenewDialog] = useState({ open: false, subId: null, newEndDate: "" });
  const debounceTimeout = useRef();
  
  const username = location.pathname.split('/')[1] || '';

  // Debounce search
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  const fetchData = async (opts = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', (opts.page || page).toString());
      params.set('archivedOnly', 'true');
      if (debouncedSearch) params.set('search', debouncedSearch);
      const serverSort = sortMap[sortBy];
      if (serverSort && sortOrder) {
        params.set('sort', serverSort);
        params.set('order', sortOrder);
      }
      const res = await api.get(`/subscriptions?${params.toString()}`);
      let rows = res.data.dataArray || [];
      if (!serverSort && sortBy && sortOrder) {
        rows = [...rows].sort((a, b) => {
          const av = a[sortBy]; const bv = b[sortBy];
          const na = Number(av); const nb = Number(bv);
          const bothNums = !isNaN(na) && !isNaN(nb);
          let cmp = 0;
          if (bothNums) cmp = na - nb;
          else cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true, sensitivity: 'base' });
          return sortOrder === 'asc' ? cmp : -cmp;
        });
      }
      setData(rows);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalCount || 0);
    } catch (err) {
      setData([]);
      setTotalPages(1);
      setTotalRecords(0);
      if (err.normalizedStatus && err.normalizedStatus !== 200 && err.normalizedStatus !== 404) {
        toast.error(err.normalizedMessage || 'Failed to load archived subscriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, debouncedSearch]);

  const headers = useMemo(() => ([
    { key: 'domain_name', label: 'Domain' },
    { key: 'service_summary', label: 'Services' },
    { key: 'customer_name', label: 'Contact' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'dynamic_status', label: 'Status' },
    { key: 'total', label: 'Total' },
    { key: 'actions', label: 'Actions' },
  ]), []);

  const onSort = (key) => {
    if (key === 'actions') return;
    if (sortBy !== key) {
      setSortBy(key); setSortOrder('asc'); return;
    }
    if (sortOrder === 'asc') { setSortOrder('desc'); return; }
    if (sortOrder === 'desc') { setSortBy(''); setSortOrder(''); return; }
    setSortBy(key); setSortOrder('asc');
  };

  const ServiceTooltip = ({ items, children }) => {
    if (!items || items.length === 0) return children;
    const itemsList = items.map((item, idx) => (
      <div key={idx} className="py-1 border-b border-white/20 last:border-0">
        <div className="font-medium">{item.service_name || 'Unknown Service'}</div>
        <div className="text-xs opacity-80">Qty: {item.quantity} × ₹{Number(item.rate || 0).toFixed(2)}</div>
      </div>
    ));
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent className="max-w-xs bg-gray-900 text-white">
            <div className="space-y-1">
              <div className="font-semibold mb-2">Services ({items.length}):</div>
              {itemsList}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleRenew = async () => {
    if (!renewDialog.subId || !renewDialog.newEndDate) {
      toast.error('Please select an end date');
      return;
    }
    try {
      await api.post(`/subscriptions/${renewDialog.subId}/renew`, {
        end_date: renewDialog.newEndDate
      });
      toast.success('Subscription renewed successfully');
      setRenewDialog({ open: false, subId: null, newEndDate: "" });
      fetchData();
    } catch (e) {
      toast.error(e.normalizedMessage || 'Failed to renew subscription');
    }
  };

  const rows = (data || []).map(row => ({
    ...row,
    domain_name: row.domain_name || '-',
    service_summary: (
      <ServiceTooltip items={row.items || []}>
        <span className="cursor-help underline decoration-dotted">
          {row.items_count ? `${row.items_count} item(s)` : (row.service_name || '-')}
        </span>
      </ServiceTooltip>
    ),
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    dynamic_status: <StatusPill status={row.dynamic_status || row.status || '-'} />,
    total: `₹${row.total ? Number(row.total).toFixed(2) : '-'}`,
    actions: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => {
            setRenewDialog({ open: true, subId: row.sub_id, newEndDate: "" });
          }}>
            <RotateCw className="mr-2 h-4 w-4" />
            Renew Subscription
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            if (onEdit) {
              onEdit(row.sub_id);
            } else {
              navigate(`${row.sub_id}/edit`);
            }
          }}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setSelectedSubId(row.sub_id);
            setHistoryDialogOpen(true);
          }}>
            <History className="mr-2 h-4 w-4" />
            View History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Archived Subscriptions</h1>
      </div>
      <hr className="mb-4 border-blue-500 border-3 size-auto" />

      <div className="flex items-center gap-3 mb-3">
        <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => { }} />
        <Button variant="outline" onClick={() => { setSearch(""); setPage(1); fetchData({ page: 1 }); }}>
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center my-8">
          <Hamster />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-10 border rounded-md bg-white text-center">
          {debouncedSearch ? (
            <>
              <div className="text-lg font-semibold mb-2">No results found</div>
              <div className="text-sm text-gray-600 mb-4">Try adjusting your search criteria.</div>
              <Button variant="outline" onClick={() => { setSearch(""); setPage(1); fetchData({ page: 1 }); }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Clear Filters
              </Button>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold mb-2">No archived subscriptions</div>
              <div className="text-sm text-gray-600 mb-4">Archived subscriptions will appear here.</div>
            </>
          )}
        </div>
      ) : (
        <GenericTable headers={headers} data={rows} primaryKey="sub_id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
      )}

      <Pagination currentPage={page} setCurrentPage={setPage} totalPages={totalPages} totalRecords={totalRecords} />

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedSubId && (
            <SubscriptionHistory
              subId={selectedSubId}
              onClose={() => setHistoryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={renewDialog.open} onOpenChange={(open) => {
        if (!open) setRenewDialog({ open: false, subId: null, newEndDate: "" });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Subscription</DialogTitle>
            <DialogDescription>
              Enter the new end date for this subscription. Reminders will be automatically scheduled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="renew-end-date">New End Date</Label>
            <Input
              id="renew-end-date"
              type="date"
              value={renewDialog.newEndDate}
              onChange={(e) => setRenewDialog({ ...renewDialog, newEndDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setRenewDialog({ open: false, subId: null, newEndDate: "" })}>
              Cancel
            </Button>
            <Button onClick={handleRenew}>
              Renew Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

