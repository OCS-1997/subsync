import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, History, MoreVertical, Edit, Archive,
  RotateCw, RefreshCw, Eye,
  Calendar, Layout, ShieldCheck,
  TrendingDown, Package
} from "lucide-react";

import api from "@/lib/axiosInstance.js";
import Hamster from "@/components/animations/Hamster.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import SubscriptionHistory from "../components/SubscriptionHistory.jsx";
import ViewSubscription from "./ViewSubscription.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import { cn } from "@/lib/utils";

const sortOptions = [
  { label: 'Domain Name', value: 'domain_name' },
  { label: 'Customer', value: 'customer_name' },
  { label: 'Start Date', value: 'start_date' },
  { label: 'End Date', value: 'end_date' },
  { label: 'Total Value', value: 'total' },
];

const sortMap = {
  domain_name: 's.domain_name',
  customer_name: 'c.display_name',
  start_date: 's.start_date',
  end_date: 's.end_date',
  total: 's.total',
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return dateStr;
  }
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="overflow-hidden border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/40 backdrop-blur-xl group hover:shadow-xl transition-all duration-500 rounded-[2rem]">
    <CardContent className="p-6 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</p>
      </div>
      <div className={`p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 transition-all group-hover:bg-blue-600/10 group-hover:scale-110 duration-500`}>
        <Icon className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
      </div>
    </CardContent>
  </Card>
);

const SubscriptionCard = ({ sub, onUnarchive, onRenew, onEdit, onView, onViewHistory, index }) => {
  const isExpired = sub.dynamic_status === 'Expired' || sub.days_to_expiry < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="h-full group border-slate-100 dark:border-slate-800/60 shadow-sm bg-white dark:bg-slate-900/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden flex flex-col relative rounded-[2.5rem]">
        <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-2xl shadow-lg backdrop-blur-md bg-white/80 dark:bg-slate-800/80">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-[1.8rem] shadow-2xl p-2 border-slate-100 dark:border-slate-800 dark:bg-slate-900 mt-2">
              <DropdownMenuItem onClick={() => onView(sub)} className="rounded-2xl py-3 px-4 cursor-pointer text-xs font-bold uppercase tracking-widest">
                <Eye className="w-4 h-4 mr-3 text-blue-500" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUnarchive(sub.sub_id)} className="rounded-2xl py-3 px-4 cursor-pointer text-xs font-bold uppercase tracking-widest text-emerald-500 focus:text-emerald-500 focus:bg-emerald-500/10">
                <RotateCcw className="w-4 h-4 mr-3" /> Restore Manifest
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 mx-2 bg-slate-100 dark:bg-slate-800" />
              <DropdownMenuItem onClick={() => onEdit(sub.sub_id)} className="rounded-2xl py-3 px-4 cursor-pointer text-xs font-bold uppercase tracking-widest">
                <Edit className="w-4 h-4 mr-3 text-slate-400" /> Edit Metadata
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRenew(sub)} className="rounded-2xl py-3 px-4 cursor-pointer text-xs font-bold uppercase tracking-widest text-blue-500">
                <RotateCw className="w-4 h-4 mr-3" /> Renew Contract
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewHistory(sub)} className="rounded-2xl py-3 px-4 cursor-pointer text-xs font-bold uppercase tracking-widest text-amber-500">
                <History className="w-4 h-4 mr-3" /> Event Logs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardHeader className="pb-2 p-7">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-500 border border-slate-100 dark:border-slate-800/50 shadow-inner">
              {sub.domain_name ? (
                <img src={`https://www.google.com/s2/favicons?domain=${sub.domain_name}&sz=64`} alt="" className="w-8 h-8 rounded-lg" />
              ) : <Package className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight text-slate-800 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                {sub.domain_name || 'Generic Service'}
              </CardTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{sub.sub_id}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            <Badge className={cn(
              "rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
              isExpired ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
            )}>
              {sub.dynamic_status || sub.status}
            </Badge>
            <Badge className="rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-none bg-slate-100 dark:bg-slate-800/80 text-slate-400">
              {sub.days_to_expiry < 0 ? `Expired ${Math.abs(sub.days_to_expiry)}d ago` : `Archived`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 py-4 px-7 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Merchant/Client</span>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{sub.customer_name}</div>
            </div>
            <div className="space-y-1.5 text-right">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Valuation</span>
              <div className="text-sm font-black text-slate-900 dark:text-white">₹{parseFloat(sub.total).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Archived Timeline</span>
              <span className="text-[9px] font-black font-mono text-slate-300">{sub.items_count || 0} Units Managed</span>
            </div>
            <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-full bg-slate-200 dark:bg-slate-700/50" />
            </div>
            <div className="flex justify-between mt-3">
              <div className="text-left">
                <p className="text-[8px] uppercase font-black tracking-tighter text-slate-400">Origin</p>
                <p className="text-[10px] font-black text-slate-600 dark:text-slate-400">{formatDate(sub.start_date)}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase font-black tracking-tighter text-slate-400">Termination</p>
                <p className={`text-[10px] font-black ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>{formatDate(sub.end_date)}</p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-7 pt-4">
          <Button
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-95 transition-all duration-300 font-black text-[10px] uppercase tracking-widest h-14 shadow-lg shadow-blue-500/20"
            onClick={() => onUnarchive(sub.sub_id)}
          >
            <RotateCcw className="w-5 h-5 mr-3" /> Restore Contract
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default function ArchivedSubscriptions({ onEdit }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [subscriptions, setSubscriptions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('end_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);
  const [renewDialog, setRenewDialog] = useState({ open: false, subId: null, newEndDate: "" });

  const debounceTimeout = useRef();
  const username = pathname.split('/')[1] || 'user';

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
      const targetPage = opts.page || page;
      const params = new URLSearchParams();
      params.set('page', targetPage.toString());
      if (debouncedSearch) params.set('search', debouncedSearch);

      const serverSort = sortMap[sortBy] || sortBy;
      params.set('sort', serverSort);
      params.set('order', sortOrder);

      const res = await api.get(`/subscriptions/archived?${params.toString()}`);

      const data = res.data.dataArray || [];
      setSubscriptions(data);
      setTotalPages(res.data.totalPages || 1);
      setTotalRecords(res.data.totalCount || 0);

    } catch (err) {
      setSubscriptions([]);
      if (err.normalizedStatus !== 404) {
        toast.error(err.normalizedMessage || 'Failed to sync with archive vault');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, sortBy, sortOrder, debouncedSearch]);

  const handleUnarchive = async (subId) => {
    try {
      await api.post(`/subscriptions/${subId}/unarchive`);
      toast.success('Restored to active manifest');
      fetchData();
    } catch (e) {
      toast.error(e.normalizedMessage || 'Restoration failed');
    }
  };

  const handleRenew = async () => {
    if (!renewDialog.subId || !renewDialog.newEndDate) {
      toast.error('Expiry date required for renewal');
      return;
    }
    try {
      await api.post(`/subscriptions/${renewDialog.subId}/renew`, {
        end_date: renewDialog.newEndDate
      });
      toast.success('Contract renewed successfully');
      setRenewDialog({ open: false, subId: null, newEndDate: "" });
      fetchData();
    } catch (e) {
      toast.error(e.normalizedMessage || 'Renewal failed');
    }
  };

  const totalValue = subscriptions.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);

  return (
    <div className="space-y-10 w-full">
      <PageHeader
        title="Subscription Archive"
        description="Encrypted vault of terminated service contracts and historical domain identities."
        breadcrumbItems={[{ label: "Archive Vault" }]}
      />

      {/* Premium Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Archived" value={totalRecords} icon={Archive} color="text-blue-500" />
        <StatCard title="Vault Valuation" value={`₹${totalValue.toLocaleString()}`} icon={ShieldCheck} color="text-emerald-500" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row items-center gap-4 mb-4">
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.8rem] px-5 h-16 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => { }} className="w-full" />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.8rem] px-6 h-16 flex items-center shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-4">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-xs font-black uppercase tracking-widest dark:text-white cursor-pointer min-w-[140px] appearance-none"
            >
              {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="h-8 w-8 ml-2 rounded-xl text-slate-400 hover:text-blue-500"
            >
              {sortOrder === 'asc' ? <TrendingDown className="w-4 h-4 rotate-180" /> : <TrendingDown className="w-4 h-4" />}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => { setSearch(""); setSortBy('end_date'); setSortOrder('desc'); }}
            className="h-16 w-16 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="w-5 h-5 text-slate-400" />
          </Button>

          <Button
            onClick={() => fetchData()}
            className="h-16 w-16 rounded-[1.8rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xl"
          >
            <RefreshCw className={cn("w-5 h-5", loading ? "animate-spin" : "")} />
          </Button>
        </div>
      </div>

      {/* Main Grid Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] py-20">
            <Hamster />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-8 animate-pulse">Decrypting Vault...</p>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center bg-white dark:bg-slate-950/20 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800/60">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-8">
              <Archive className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Vault is Empty</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-3 text-sm font-medium leading-relaxed">
              {debouncedSearch
                ? "Zero historical records matching your current query parameters."
                : "Terminated contracts will appear here for historical reference and restoration."}
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
          >
            {subscriptions.map((sub, idx) => (
              <SubscriptionCard
                key={sub.sub_id}
                sub={sub}
                index={idx}
                onUnarchive={handleUnarchive}
                onView={(s) => { setSelectedSub(s); setDetailsDialogOpen(true); }}
                onEdit={(id) => { if (onEdit) onEdit(id); else navigate(`${id}/edit`); }}
                onRenew={(s) => setRenewDialog({ open: true, subId: s.sub_id, newEndDate: "" })}
                onViewHistory={(s) => { setSelectedSub(s); setHistoryDialogOpen(true); }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-12 gap-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-10 py-8 rounded-[2.5rem] shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault Indexing</span>
          <span className="text-xs font-bold text-slate-500">
            {subscriptions.length} of {totalRecords} entries displayed
          </span>
        </div>
        <Pagination
          currentPage={page}
          setCurrentPage={setPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
        />
      </div>

      {/* Dialog Overlays */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950">
          {selectedSub && (
            <SubscriptionHistory
              subId={selectedSub.sub_id}
              onClose={() => setHistoryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto rounded-[3rem] p-12 border-none shadow-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="mb-10 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="p-5 rounded-[2rem] bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                <Layout className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-4xl font-black tracking-tighter uppercase">Audit Report</DialogTitle>
                <DialogDescription className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Signature: {selectedSub?.sub_id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <AnimatePresence>
            {selectedSub && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <ViewSubscription subscription={selectedSub} showActions={false} />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={renewDialog.open} onOpenChange={(open) => !open && setRenewDialog({ open: false, subId: null, newEndDate: "" })}>
        <DialogContent className="rounded-[3rem] p-12 bg-white dark:bg-slate-950 border-none shadow-2xl max-w-lg">
          <DialogHeader>
            <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mb-8 ring-1 ring-blue-500/20">
              <RotateCw className="w-10 h-10 text-blue-600" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight uppercase">Renew Contract</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed pt-2">
              Renewing this contract will restore it to the active manifest and reset reminder sequences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-8">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Termination Date</Label>
            <Input
              type="date"
              className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-lg font-black px-6 focus-visible:ring-2 focus-visible:ring-blue-500"
              value={renewDialog.newEndDate}
              onChange={(e) => setRenewDialog({ ...renewDialog, newEndDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <DialogFooter className="gap-4 flex-col sm:flex-row">
            <Button variant="ghost" onClick={() => setRenewDialog({ open: false, subId: null, newEndDate: "" })} className="rounded-2xl h-16 px-10 font-black uppercase tracking-widest text-[10px] text-slate-500">Cancel</Button>
            <Button onClick={handleRenew} className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest text-[10px]">Initialize Renewal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
