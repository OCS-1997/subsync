import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, Archive, RotateCcw } from "lucide-react";
import Hamster from "@/components/animations/Hamster.jsx";
import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";

const sortMap = {
    domain_name: 's.domain_name',
    customer_name: 'c.display_name',
    start_date: 's.start_date',
    end_date: 's.end_date',
    archived_at: 's.archived_at',
    total: 's.total',
};

export default function ArchivedSubscriptions() {
    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('');
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
            // Filter for archived subscriptions only
            params.set('archivedOnly', 'true');
            if (debouncedSearch) params.set('search', debouncedSearch);

            // Server-side sorting
            const serverSort = sortMap[sortBy];
            if (serverSort && sortOrder) {
                params.set('sort', serverSort);
                params.set('order', sortOrder);
            }

            const res = await api.get(`/subscriptions?${params.toString()}`);
            let rows = res.data.dataArray || [];

            // Client-side sort for non-server keys
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
        { key: 'sub_id_display', label: 'Subscription ID' },
        { key: 'domain_name', label: 'Domain' },
        { key: 'service_summary', label: 'Services' },
        { key: 'customer_name', label: 'Contact' },
        { key: 'start_date', label: 'Start Date' },
        { key: 'end_date', label: 'End Date' },
        { key: 'archived_at', label: 'Archived Date' },
        { key: 'total', label: 'Total' },
    ]), []);

    const onSort = (key) => {
        // Toggle cycle: '', 'asc', 'desc', ''
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
        archived_at: (
            <Badge
                variant="outline"
                className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 uppercase tracking-[0.1em] text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm whitespace-nowrap"
            >
                {formatDateTime(row.archived_at)}
            </Badge>
        ),
        total: (
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                ₹{row.total ? Number(row.total).toFixed(2) : '0.00'}
            </span>
        ),
    }));

    return (
        <div className="min-h-screen bg-slate-50/30 dark:bg-transparent px-8 py-8">
            <div className="max-w-[1700px] mx-auto space-y-8">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PageHeader
                        title="Archived Subscriptions"
                        description="Historical archive of terminated service contracts and expired domain identities."
                        breadcrumbItems={[
                            { label: "Subscriptions", href: `/${username}/dashboard/subscriptions` },
                            { label: "Archived" }
                        ]}
                        actions={
                            <Button
                                onClick={() => navigate(`/${username}/dashboard/subscriptions`)}
                                className="bg-slate-600 hover:bg-slate-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-500/25 active:scale-95 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5 mr-3" /> Back to Active
                            </Button>
                        }
                    />

                    <div className="mt-12 flex flex-col md:flex-row items-center gap-4 mb-8">
                        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => { }} className="w-full" />
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => { setSearch(""); setPage(1); fetchData({ page: 1 }); }}
                            className="h-14 w-14 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <RotateCcw className="w-5 h-5 text-slate-500" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center my-32">
                            <Hamster />
                            <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Archive...</p>
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="py-32 px-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-950/20 text-center">
                            <div className="max-w-md mx-auto">
                                <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Archive className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Empty Archive</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                                    {debouncedSearch
                                        ? "No archived subscriptions found matching your search criteria."
                                        : "No archived subscriptions found. All active contracts are currently in the main manifest."}
                                </p>
                                {debouncedSearch && (
                                    <Button onClick={() => { setSearch(""); setPage(1); fetchData({ page: 1 }); }} className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest">
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <GenericTable headers={headers} data={rows} primaryKey="sub_id" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
                            <div className="mt-10">
                                <Pagination currentPage={page} setCurrentPage={setPage} totalPages={totalPages} totalRecords={totalRecords} />
                            </div>
                        </>
                    )}
                </div>
            </div>
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

function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
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
