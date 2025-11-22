import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { Mail, Plus, RotateCcw, History } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";

import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import SubscriptionHistory from "../components/SubscriptionHistory.jsx";

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

export default function ListSubscriptions({ onAddNew, onEdit }) {
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
  const debounceTimeout = useRef();

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
        rows = [...rows].sort((a,b) => {
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
    // toggle cycle: '', 'asc', 'desc', ''
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
    total:  `₹${row.total ? Number(row.total).toFixed(2) : '-'}`,
    actions: (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onEdit && onEdit(row.sub_id)}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={async () => {
          try {
            await api.post(`/subscription/${row.sub_id}/reminder`);
            toast.success('Reminder queued');
          } catch (e) {
            toast.error(e.normalizedMessage || 'Failed to queue reminder');
          }
        }}>
          <Mail className="w-4 h-4" /> Reminder
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            setSelectedSubId(row.sub_id);
            setHistoryDialogOpen(true);
          }}
        >
          <History className="w-4 h-4 mr-1" /> View History
        </Button>
      </div>
    )
  }));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">All Subscriptions</h1>
        
        <Button onClick={onAddNew}><Plus className="w-4 h-4" /> Add Subscription</Button>
        
      </div>
       <hr className="mb-4 border-blue-500 border-3 size-auto" />

      <div className="flex items-center gap-3 mb-3">
        <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => {}} />
        <div className="flex items-center gap-2">
          <Label>Status</Label>
          <select className="border rounded-md h-9 px-2" value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="soon">Soon Expiring</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); fetchData({ page: 1 }); }}>
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center my-8">
        <Hamster />
       </div>
      ) : rows.length === 0 ? (
        <div className="p-10 border rounded-md bg-white text-center">
          {debouncedSearch || statusFilter ? (
            <>
              <div className="text-lg font-semibold mb-2">No results found</div>
              <div className="text-sm text-gray-600 mb-4">Try adjusting your search or filter criteria.</div>
              <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); fetchData({ page: 1 }); }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Clear Filters
              </Button>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold mb-2">No subscriptions yet</div>
              <div className="text-sm text-gray-600 mb-4">Add a subscription to see it listed here.</div>
              {onAddNew && (
                <Button onClick={onAddNew}><Plus className="w-4 h-4" /> Add Subscription</Button>
              )}
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
    </div>
  );
}
