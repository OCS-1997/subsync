import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { ArrowLeft, Mail, Plus, RotateCcw, FileDown, Archive } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";

import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function toTimestamp(dateStr) {
  if (!dateStr) return null;
  return `${dateStr} 00:00:00`;
}

const StatusPill = ({ status }) => {
  const variant = status === 'Active' ? 'secondary' : status === 'Expired' ? 'destructive' : 'default';
  return <Badge variant={variant}>{status}</Badge>;
};

const ListView = ({ onAddNew }) => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // '', 'active', 'expired', 'soon'
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFields, setExportFields] = useState({
    domain: true,
    service: true,
    contact: true,
    startDate: true,
    endDate: true,
    status: true
  });
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
      const res = await api.get(`/subscriptions?${params.toString()}`);
      setData(res.data.dataArray || []);
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
  }, [page, statusFilter, debouncedSearch]);

  const headers = useMemo(() => ([
    { key: 'domain_name', label: 'Domain' },
    { key: 'service_name', label: 'Service' },
    { key: 'customer_name', label: 'Contact' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'dynamic_status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]), []);

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
    service_name: (
      <ServiceTooltip items={row.items || []}>
        <span className="cursor-help underline decoration-dotted">
          {row.service_name || '-'}
        </span>
      </ServiceTooltip>
    ),
    start_date: formatDate(row.start_date),
    end_date: formatDate(row.end_date),
    dynamic_status: <StatusPill status={row.dynamic_status || row.status || '-'} />,
    actions: (
      <div className="flex gap-2">
        {/* Edit to be implemented */}
        <Button size="sm" variant="outline">Edit</Button>
        <Button size="sm" variant="ghost" onClick={async () => {
          try {
            await api.post(`/subscription/${row.sub_id}/reminder`);
            toast.success('Reminder sent successfully');
          } catch (e) {
            toast.error(e.normalizedMessage || 'Failed to send reminder');
          }
        }}>
          <Mail className="w-4 h-4" /> Reminder
        </Button>
        <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={async () => {
          try {
            await api.post(`/subscriptions/${row.sub_id}/archive`);
            toast.success('Subscription archived successfully');
            fetchData();
          } catch (e) {
            toast.error(e.normalizedMessage || 'Failed to archive subscription');
          }
        }}>
          <Archive className="w-4 h-4" /> Archive
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

      <div className="flex items-center gap-3 mb-3">
        <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => { }} />
        <div className="flex items-center gap-2">
          <Label>Status</Label>
          <Select
            value={statusFilter || "all"}
            onValueChange={val => { setPage(1); setStatusFilter(val === "all" ? "" : val); }}
          >
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="soon">Soon Expiring</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setPage(1); fetchData({ page: 1 }); }}>
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {loading ? (
        <div className="p-6 flex flex-1 justify-center items-center">
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
              <div className="text-sm text-gray-600 mb-4">Create your first subscription to get started.</div>
              <Button onClick={onAddNew}><Plus className="w-4 h-4" /> Add Subscription</Button>
            </>
          )}
        </div>
      ) : (
        <GenericTable headers={headers} data={rows} primaryKey="sub_id" />
      )}

      <Pagination currentPage={page} setCurrentPage={setPage} totalPages={totalPages} totalRecords={totalRecords} />
    </div>
  );
};

const AddForm = ({ onBack }) => {
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [domain, setDomain] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [neverExpires, setNeverExpires] = useState(false);
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(0);
  const [taxPct, setTaxPct] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [rounding, setRounding] = useState(0);
  const [notes, setNotes] = useState("");
  const [emails, setEmails] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, sRes] = await Promise.all([
          api.get('/all-customer-details'),
          api.get('/all-services?limit=1000')
        ]);
        const cs = (cRes.data.customers || []).map(c => ({
          id: c.customer_id,
          name: c.display_name,
          primary_email: c.primary_email,
          other_contacts: typeof c.other_contacts === 'string' ? JSON.parse(c.other_contacts || '[]') : (c.other_contacts || [])
        }));
        const ss = (sRes.data.services || []).map(s => ({ id: s.service_id, name: s.service_name, price: parseFloat((s.selling_price ?? 0)) }));
        setCustomers(cs);
        setServices(ss);
      } catch (e) {
        toast.error(e.normalizedMessage || 'Failed to load form data');
      }
    })();
  }, []);

  useEffect(() => {
    const svc = services.find(s => String(s.id) === String(selectedService));
    if (svc) setRate(svc.price || 0);
  }, [selectedService, services]);

  useEffect(() => {
    const cust = customers.find(c => String(c.id) === String(selectedCustomer));
    if (cust) {
      const extraEmails = (cust.other_contacts || []).map(o => o.email).filter(Boolean);
      setEmails([cust.primary_email, ...extraEmails]);
    } else {
      setEmails([]);
    }
  }, [selectedCustomer, customers]);

  const subtotal = useMemo(() => (Number(qty) * Number(rate)) || 0, [qty, rate]);
  const taxVal = useMemo(() => (subtotal * Number(taxPct)) / 100, [subtotal, taxPct]);
  const discountVal = useMemo(() => Number(discount) || 0, [discount]);
  const total = useMemo(() => Math.max(0, subtotal + taxVal - discountVal + Number(rounding || 0)), [subtotal, taxVal, discountVal, rounding]);

  const handleSave = async (send = false) => {
    if (!selectedCustomer || !selectedService) {
      toast.error('Select customer and service');
      return;
    }
    if (!startDate) {
      toast.error('Select start date');
      return;
    }
    const payload = {
      customerID: selectedCustomer,
      productID: selectedService,
      startDate: toTimestamp(startDate),
      endDate: neverExpires ? null : toTimestamp(endDate)
    };
    try {
      setSaving(true);
      await api.post('/add-subscription', payload);
      if (send) {
        toast.info('Send email feature coming soon');
      }
      toast.success('Subscription saved');
      onBack();
    } catch (e) {
      toast.error(e.normalizedMessage || 'Failed to save subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="text-2xl font-bold">Add Subscription</h2>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Domain</h3>
          <Label>Domain Name</Label>
          <Input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" />

          <h3 className="text-lg font-semibold mt-4">Customer</h3>
          <Label>Customer</Label>
          <Select value={selectedCustomer || "none"} onValueChange={val => setSelectedCustomer(val === "none" ? "" : val)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select customer</SelectItem>
              {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Label className="mt-2">Emails</Label>
          <div className="flex flex-wrap gap-2">
            {emails.map((em, idx) => em ? <Badge key={idx} variant="outline">{em}</Badge> : null)}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Subscription</h3>
          <Label>Service</Label>
          <Select value={selectedService || "none"} onValueChange={val => setSelectedService(val === "none" ? "" : val)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select service</SelectItem>
              {services.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={neverExpires} />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <input type="checkbox" id="never" checked={neverExpires} onChange={e => setNeverExpires(e.target.checked)} />
            <Label htmlFor="never">Never Expires</Label>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="col-span-2">
              <Label>Quantity</Label>
              <Input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Rate</Label>
              <Input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Tax %</Label>
              <Input type="number" min="0" value={taxPct} onChange={e => setTaxPct(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Discount</Label>
              <Input type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Rounding Off</Label>
              <Input type="number" value={rounding} onChange={e => setRounding(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Subtotal</Label>
              <div className="h-9 flex items-center px-3 border rounded-md">{subtotal.toFixed(2)}</div>
            </div>
            <div>
              <Label>Tax</Label>
              <div className="h-9 flex items-center px-3 border rounded-md">{taxVal.toFixed(2)}</div>
            </div>
            <div>
              <Label>Total</Label>
              <div className="h-9 flex items-center px-3 border rounded-md font-semibold">{total.toFixed(2)}</div>
            </div>
          </div>

          <div className="mt-3">
            <Label>Notes</Label>
            <textarea className="w-full border rounded-md p-2" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={() => handleSave(false)} disabled={saving}>Save</Button>
        <Button variant="secondary" onClick={() => handleSave(true)} disabled={saving}><Mail className="w-4 h-4" /> Save & Send</Button>
      </div>
    </div>
  );
};

export default function Subscriptions() {
  const [mode, setMode] = useState('list');
  return mode === 'list' ? <ListView onAddNew={() => setMode('form')} /> : <AddForm onBack={() => setMode('list')} />;
}