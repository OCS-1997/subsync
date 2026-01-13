import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Mail, Plus, RotateCcw, History, Trash2, MoreVertical, Edit, Archive } from "lucide-react";
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
import { Breadcrumb, PageHeader } from "@/components/ui/breadcrumb.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.jsx";
import SubscriptionHistory from "../components/SubscriptionHistory.jsx";
import ViewSubscription from "./ViewSubscription.jsx";
import { Input } from "@/components/ui/input.jsx";

const sortMap = {
  domain_name: 's.domain_name',
  customer_name: 'c.display_name',
  start_date: 's.start_date',
  end_date: 's.end_date',
  total: 's.total',
};



export default function ListSubscriptions({ onAddNew, onEdit }) {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState(''); // UI key
  const [sortOrder, setSortOrder] = useState(''); // 'asc' | 'desc' | ''
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subId: null, domain: "" });
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSubscription, setDetailsSubscription] = useState(null);
  const debounceTimeout = useRef();

  const username = location.pathname.split('/')[1] || '';

  const openDeleteDialog = (subId, domainName) => {
    setDeleteDialog({ open: true, subId, domain: domainName || "" });
    setDeleteConfirmValue("");
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, subId: null, domain: "" });
    setDeleteConfirmValue("");
  };

  const openDetailsDialog = async (subId) => {
    try {
      setDetailsLoading(true);
      setDetailsDialogOpen(true);
      setDetailsSubscription(null);
      const res = await api.get(`/subscriptions/${subId}`);
      setDetailsSubscription(res.data.subscription || null);
    } catch (e) {
      toast.error(e.normalizedMessage || 'Failed to load subscription details');
      setDetailsDialogOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.subId) return;
    try {
      await api.delete(`/subscriptions/${deleteDialog.subId}`);
      toast.success('Subscription deleted successfully');
      closeDeleteDialog();
      fetchData(); // Refresh the list
    } catch (e) {
      toast.error(e.normalizedMessage || 'Failed to delete subscription');
    }
  };

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
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('statusFilter', statusFilter);
      // send server sort only for supported columns
      const serverSort = sortMap[sortBy];
      if (serverSort && sortOrder) {
        params.set('sort', serverSort);
        params.set('order', sortOrder);
      }
      const res = await api.get(`/subscriptions?${params.toString()}`);
      let rows = res.data.dataArray || [];
      // client-side sort for non-server keys
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
        toast.error(err.normalizedMessage || 'Failed to load subscriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, sortBy, sortOrder, debouncedSearch]);

  const headers = useMemo(() => ([
    { key: 'sub_id_display', label: 'Subscription ID' },
    { key: 'domain_name', label: 'Domain' },
    { key: 'service_summary', label: 'Services' },
    { key: 'customer_name', label: 'Contact' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'dynamic_status', label: 'Status' },
    { key: 'total', label: 'Total' },
    { key: 'actions', label: '' },
  ]), []);

  const onSort = (key) => {
    if (key === 'actions') return;
    // toggle cycle: '', 'asc', 'desc', ''
    if (sortBy !== key) {
      setSortBy(key); setSortOrder('asc'); return;
    }
    if (sortOrder === 'asc') { setSortOrder('desc'); return; }
    if (sortOrder === 'desc') { setSortBy(''); setSortOrder(''); return; }
    setSortBy(key); setSortOrder('asc');
  };

  const rows = (data || []).map(row => ({
    ...row,
    sub_id_display: (
      <button
        type="button"
        className="text-blue-500 hover:text-blue-400 font-bold font-mono text-xs uppercase"
        onClick={() => navigate(`/${username}/dashboard/subscriptions/${row.sub_id}`)}
      >
        {row.sub_id}
      </button>
    ),
    domain_name: (
      <span className="font-bold text-slate-800 dark:text-slate-200">{row.domain_name || '-'}</span>
    ),
    service_summary: (
      <ServiceTooltip items={row.items || []}>
        <span className="cursor-help underline decoration-slate-300 dark:decoration-slate-700 decoration-dotted text-sm font-medium">
          {row.items_count ? `${row.items_count} item(s)` : (row.service_name || '-')}
        </span>
      </ServiceTooltip>
    ),
    customer_name: (
      <span className="font-bold text-slate-700 dark:text-slate-300">{row.customer_name || '-'}</span>
    ),
    start_date: (
      <span className="text-slate-600 dark:text-slate-400 text-sm">{formatDate(row.start_date)}</span>
    ),
    end_date: (
      <span className="text-rose-500/80 text-sm font-medium">{formatDate(row.end_date)}</span>
    ),
    dynamic_status: (() => {
      const status = row.dynamic_status || row.status || '-';
      const s = status.toLowerCase();
      let colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";

      if (s === "active") {
        colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
      } else if (s === "expired") {
        colorClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800";
      } else if (s === "expiring soon" || s === "soon") {
        colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
      }

      return (
        <Badge
          variant="outline"
          className={`${colorClass} uppercase tracking-[0.1em] text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm whitespace-nowrap`}
        >
          {status}
        </Badge>
      );
    })(),
    total: (
      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
        ₹{row.total ? Number(row.total).toFixed(2) : '0.00'}
      </span>
    ),
    actions: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg">
            <MoreVertical className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-1 dark:bg-slate-900 dark:border-slate-800 rounded-xl">
          <DropdownMenuItem onClick={() => onEdit && onEdit(row.sub_id)} className="rounded-lg p-2 text-sm gap-2">
            <Edit className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            try {
              await api.post(`/subscription/${row.sub_id}/reminder`);
              toast.success('Reminder queued');
            } catch (e) {
              toast.error(e.normalizedMessage || 'Failed to queue reminder');
            }
          }} className="rounded-lg p-2 text-sm gap-2">
            <Mail className="h-4 w-4" /> Send Reminder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            setSelectedSubId(row.sub_id);
            setHistoryDialogOpen(true);
          }} className="rounded-lg p-2 text-sm gap-2">
            <History className="h-4 w-4" /> View History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openDetailsDialog(row.sub_id)} className="rounded-lg p-2 text-sm gap-2">
            <Archive className="h-4 w-4" /> View Details
          </DropdownMenuItem>
          {hasPermission(PERMISSIONS.SUBSCRIPTIONS_DELETE) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => openDeleteDialog(row.sub_id, row.domain_name)}
                className="rounded-lg p-2 text-sm gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }));

  return (
    <div className="space-y-8 w-full">
      <PageHeader
        title="Subscriptions"
        description="Comprehensive manifest of active recurring service contracts and domain identities."
        breadcrumbItems={[{ label: "Subscriptions" }]}
        actions={
          <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
            <Plus className="w-5 h-5 mr-3" /> Add Subscription
          </Button>
        }
      />

      <div className="mt-12 flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => { }} className="w-full" />
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 h-14 flex items-center shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4">Status</span>
            <select
              className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest dark:text-white cursor-pointer"
              value={statusFilter}
              onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="soon">Soon Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <Button
            variant="ghost"
            onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); fetchData({ page: 1 }); }}
            className="h-14 w-14 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-5 h-5 text-slate-500" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center my-32">
          <Hamster />
          <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Fetching Manifest...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-32 px-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-950/20 text-center">
          {debouncedSearch || statusFilter ? (
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Zero Matches</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">No telemetry found matching your specific filter parameters. Try clearing your constraints.</p>
              <Button onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); fetchData({ page: 1 }); }} className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest">
                Clear System Filters
              </Button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Empty Database</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">The subscription manifest is currently offline. Add your first service contract to begin tracking.</p>
              <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
                Register First Contract
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <GenericTable headers={headers} data={rows} primaryKey="sub_id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
          <div className="mt-10">
            <Pagination currentPage={page} setCurrentPage={setPage} totalPages={totalPages} totalRecords={totalRecords} />
          </div>
        </>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800 rounded-[2.5rem] p-10">
          <DialogTitle className="sr-only">Subscription History</DialogTitle>
          {selectedSubId && (
            <SubscriptionHistory
              subId={selectedSubId}
              onClose={() => setHistoryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto dark:bg-slate-950 dark:border-slate-800 rounded-[2.5rem] p-10">
          <DialogTitle className="sr-only">Subscription Details</DialogTitle>
          {detailsLoading ? (
            <div className="flex flex-col justify-center items-center my-8">
              <Hamster />
            </div>
          ) : detailsSubscription ? (
            <div className="space-y-8">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black tracking-tight text-white uppercase">System Audit: {detailsSubscription.sub_id}</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] pt-1">
                  Comprehensive payload inspection for domain contract management.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <ViewSubscription
                  subscription={detailsSubscription}
                  showActions={false}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 font-bold uppercase tracking-widest text-center py-12">Failed to decrypt subscription payload.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => {
        if (!open) closeDeleteDialog();
      }}>
        <DialogContent className="max-w-md dark:bg-slate-950 dark:border-slate-800 rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-rose-500 p-8 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Purge Contract?</DialogTitle>
              <DialogDescription className="text-rose-100 text-sm font-medium leading-relaxed opacity-90">
                This will irrevocably remove <span className="font-black text-white underline decoration-2 underline-offset-4">"{deleteDialog.domain}"</span> from the manifest. All history will be permanently lost.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security Challenge</Label>
              <Input
                id="delete-confirm-input"
                value={deleteConfirmValue}
                onChange={(e) => setDeleteConfirmValue(e.target.value)}
                placeholder={`Type "${deleteDialog.domain}" to confirm`}
                className="h-14 px-5 rounded-2xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 focus:ring-rose-500/20"
              />
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={closeDeleteDialog}
                className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-widest text-slate-500"
              >
                Abort
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={
                  !deleteDialog.domain ||
                  deleteConfirmValue.trim().toLowerCase() !== deleteDialog.domain.trim().toLowerCase()
                }
                className="rounded-2xl h-14 flex-1 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 font-black text-[11px] uppercase tracking-widest"
              >
                Confirm Purge
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helpers
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

const ServiceTooltip = ({ items, children }) => {
  if (!items || items.length === 0) return children;
  const itemsList = items.map((item, idx) => (
    <div key={idx} className="py-2 border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors px-1">
      <div className="font-black text-[11px] uppercase tracking-tight text-white mb-0.5">{item.service_name || 'Generic Service'}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
        <span>Qty: {item.quantity}</span>
        <span className="text-blue-400">₹{Number(item.rate || 0).toFixed(2)}</span>
      </div>
    </div>
  ));
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl">
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 border-b border-slate-800 pb-2">Manifest Components ({items.length})</div>
            {itemsList}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
