import { Pencil, Trash2, Star, Plus, AlertCircle, ChevronDown, Layers, ArrowDownWideNarrow, Receipt, ShieldCheck, Zap, History, Layout } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { toast, Bounce } from "react-toastify";

import { Button } from "@/components/ui/button.jsx";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.jsx";
import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function AllTaxes() {
    const { username } = useParams();
    const [data, setData] = useState([]);
    const [defaultTax, setDefaultTax] = useState(null);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taxToDelete, setTaxToDelete] = useState(null);
    const [groupDeleteDialogOpen, setGroupDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const includeQuery = filter === 'Inactive' ? '?include=inactive' : (filter === 'All' ? '?include=all' : '');
            const [taxesRes, defaultTaxRes, groupsRes] = await Promise.all([
                api.get(`/all-taxes${includeQuery}`),
                api.get("/default-tax-preference"),
                api.get("/tax-groups?include=members")
            ]);

            setData(taxesRes.data.taxes || []);
            setDefaultTax(defaultTaxRes.data.defaultTaxPreference || null);
            setGroups(groupsRes.data.groups || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Tax verification protocol failure");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (tax) => {
        setTaxToDelete(tax);
        setDeleteDialogOpen(true);
    };

    const handleGroupDeleteClick = (group) => {
        setGroupToDelete(group);
        setGroupDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!taxToDelete) return;

        try {
            await api.delete(`/delete-tax/${taxToDelete.tax_id}`);
            setData((prev) => prev.filter((item) => item.tax_id !== taxToDelete.tax_id));
            if (defaultTax && defaultTax.tax_id === taxToDelete.tax_id) {
                setDefaultTax(null);
            }
            toast.success(`Tax purged from registry`, { theme: "colored", transition: Bounce });
        } catch (error) {
            toast.error(error.response?.data?.error || "Purge execution failed", { theme: "colored", transition: Bounce });
        } finally {
            setDeleteDialogOpen(false);
            setTaxToDelete(null);
        }
    };

    const setAsDefault = async (tax) => {
        try {
            const response = await api.post("/set-default-tax-preference", { taxId: tax.tax_id });
            setDefaultTax(response.data.defaultTaxPreference);
            toast.success(`Default preference updated`, { theme: "colored" });
        } catch (error) {
            toast.error("Preference update failure");
        }
    };

    const headers = [
        { key: "tax_name", label: "Tax Name" },
        { key: "tax_type", label: "Type" },
        { key: "tax_rate", label: "Rate" },
        { key: "group_membership", label: "Groups" },
        { key: "is_default", label: "Default" },
        { key: "actions", label: "" }
    ];

    const filteredTaxes = data.filter(item => {
        if (filter === 'Tax Group') return false;
        if (filter === 'Tax') return true;
        if (filter === 'Active') return item.is_active !== false;
        if (filter === 'Inactive') return item.is_active === false;
        return true;
    });

    const filteredGroups = groups.filter(g => {
        if (filter === 'Tax') return false;
        if (filter === 'Tax Group') return true;
        if (filter === 'Active') return g.is_active !== false;
        if (filter === 'Inactive') return g.is_active === false;
        return true;
    });

    const rows = useMemo(() => {
        const taxRows = filteredTaxes.map(item => ({
            ...item,
            tax_name: (
                <div className="flex flex-col gap-1">
                    <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{item.tax_name || "N/A"}</span>
                    {item.description && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{item.description}</span>}
                </div>
            ),
            tax_type: (
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 inline-block">
                    {item.tax_type}
                </span>
            ),
            tax_rate: (
                <span className="font-black text-slate-900 dark:text-white tabular-nums tracking-widest">
                    {item.tax_rate !== null ? `${Number(item.tax_rate).toFixed(2)}%` : "0.00%"}
                </span>
            ),
            group_membership: (
                <div className="flex flex-wrap gap-1">
                    {groups
                        .filter(g => (g.members || []).some(m => m.tax_id === item.tax_id))
                        .map(g => (
                            <Badge key={g.group_id} variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-0.5">
                                {g.group_name}
                            </Badge>
                        ))}
                    {groups.filter(g => (g.members || []).some(m => m.tax_id === item.tax_id)).length === 0 && (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Independent</span>
                    )}
                </div>
            ),
            is_default: (
                defaultTax && defaultTax.tax_id === item.tax_id ? (
                    <div className="flex items-center gap-2 text-amber-500">
                        <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                            <Star className="fill-current" size={12} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest">Master Default</span>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setAsDefault(item)} className="text-slate-300 hover:text-amber-500 h-8 w-8 rounded-lg transition-colors p-0">
                        <Star size={14} />
                    </Button>
                )
            ),
            actions: (
                <div className="flex items-center gap-1 justify-end">
                    <Link to={`edit/${item.tax_id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <Pencil size={14} className="text-slate-400" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)} className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                        <Trash2 size={14} className="text-rose-500 opacity-60 hover:opacity-100" />
                    </Button>
                </div>
            )
        }));

        const groupRows = (filter === 'All' || filter === 'Tax Group') ? filteredGroups.map(g => ({
            ...g,
            tax_name: (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <Layers size={12} className="text-emerald-500" />
                        </div>
                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">{g.group_name}</span>
                    </div>
                    {g.description && <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none ml-8">{g.description}</span>}
                </div>
            ),
            tax_type: (
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 inline-block">
                    COMPOSITE GROUP
                </span>
            ),
            tax_rate: (
                <span className="font-black text-slate-900 dark:text-white tabular-nums tracking-widest text-[10px]">
                    {g.members?.length || 0} MEMBERS
                </span>
            ),
            group_membership: (
                <div className="flex flex-wrap gap-1">
                    {(g.members || []).map(m => (
                        <Badge key={m.tax_id} variant="outline" className="text-[9px] font-black uppercase tracking-widest border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                            {m.tax_name}
                        </Badge>
                    ))}
                </div>
            ),
            is_default: <span className="text-slate-300 font-black uppercase tracking-widest text-[10px]">-</span>,
            actions: (
                <div className="flex items-center gap-1 justify-end">
                    <Link to={`../tax-groups/edit/${g.group_id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <Pencil size={14} className="text-slate-400" />
                        </Button>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => handleGroupDeleteClick(g)} className="h-9 w-9 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                        <Trash2 size={14} className="text-rose-500 opacity-60 hover:opacity-100" />
                    </Button>
                </div>
            )
        })) : [];

        return [...taxRows, ...groupRows];
    }, [filteredTaxes, filteredGroups, defaultTax, groups, filter, username]);

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-8 h-full flex flex-col">
            <PageHeader
                title="Taxes"
                description="Manage your tax rates and tax groups."
                breadcrumbItems={[
                    { label: "Settings", href: `/${username}/dashboard/settings` },
                    { label: "Taxes" }
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-[10px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-blue-500/30">
                                    <ArrowDownWideNarrow size={16} className="mr-3 text-slate-400" />
                                    Criteria: {filter}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-56 p-2 rounded-[2rem] dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl">
                                <div className="space-y-1">
                                    {['All', 'Active', 'Inactive', 'Tax', 'Tax Group'].map(f => (
                                        <button
                                            key={f}
                                            className={cn(
                                                "w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all",
                                                filter === f
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                                            )}
                                            onClick={() => { setFilter(f); setFilterOpen(false); }}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
                                    <Plus size={16} className="mr-3" />
                                    Add New
                                    <ChevronDown size={14} className="ml-3 opacity-60" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-64 p-2 rounded-[2rem] dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl">
                                <div className="space-y-1">
                                    <Link to="add" className="flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 group transition-all">
                                        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <Plus size={14} />
                                        </div>
                                        New Tax Rate
                                    </Link>
                                    <Link to="../tax-groups/add" className="flex items-center gap-4 px-5 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 group transition-all">
                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <Layers size={14} />
                                        </div>
                                        New Tax Group
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                }
            />

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Alert variant="destructive" className="rounded-3xl border-rose-500/20 bg-rose-500/5 p-6">
                        <ShieldCheck className="h-5 w-5 text-rose-500" />
                        <AlertTitle className="text-rose-500 font-black uppercase tracking-widest text-[10px] mb-1">Integrity Critical</AlertTitle>
                        <AlertDescription className="text-rose-600/80 font-bold text-xs uppercase tracking-tight">{error}</AlertDescription>
                    </Alert>
                </motion.div>
            )}

            <div className="flex-1 min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col justify-center items-center my-32">
                        <Hamster />
                        <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Registry...</p>
                    </div>
                ) : rows.length === 0 ? (
                    <div className="py-40 px-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-white/50 dark:bg-slate-950/20 text-center backdrop-blur-sm">
                        <div className="max-w-md mx-auto">
                            <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-slate-200 dark:border-slate-800">
                                <Receipt size={40} className="text-slate-200" strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Zero Config Logs</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 leading-relaxed uppercase tracking-widest text-[10px]">Registry engine currently offline or filtered. No active tax protocols detected for the selected parameters.</p>
                            <Button onClick={() => setFilter('All')} className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-2xl h-14 px-8 font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                Restore Default View
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <GenericTable headers={headers} data={rows} primaryKey="tax_id" cellPadding="px-4" />
                    </div>
                )}
            </div>

            {/* Termination Engine (Single Tax) */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-[3rem] dark:bg-slate-950 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Confirm Tax Purge</DialogTitle>
                    </DialogHeader>
                    <div className="p-10 pt-12 text-center">
                        <div className="h-20 w-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <Trash2 className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Confirm Purge</h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            Confirming permanent deletion of <strong className="text-slate-900 dark:text-white">{taxToDelete?.tax_name}</strong>. This operation will cascade across all legacy records.
                        </p>
                    </div>
                    <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-3">
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-[10px] flex-1">Abort</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 flex-[1.5]">Execute Purge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Migration Engine (Tax Group) */}
            <Dialog open={groupDeleteDialogOpen} onOpenChange={setGroupDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-[3rem] dark:bg-slate-950 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Dissolve Tax Group</DialogTitle>
                    </DialogHeader>
                    <div className="p-10 pt-12 text-center">
                        <div className="h-20 w-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <Layers className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Dissolve Group</h2>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">
                            Requesting the decommissioning of group <strong className="text-slate-900 dark:text-white">{groupToDelete?.group_name}</strong>. Member protocols will remain active in isolation.
                        </p>
                    </div>
                    <DialogFooter className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-3">
                        <Button variant="ghost" onClick={() => setGroupDeleteDialogOpen(false)} className="rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-[10px] flex-1">Abort</Button>
                        <Button variant="destructive" onClick={async () => {
                            if (!groupToDelete) return;
                            try {
                                await api.delete(`/tax-groups/${groupToDelete.group_id}`);
                                setGroups(prev => prev.filter(g => g.group_id !== groupToDelete.group_id));
                                toast.success(`Group decommissioned successfully`, { theme: "colored" });
                            } catch (e) {
                                toast.error(e?.response?.data?.error || "Purge execution failed");
                            } finally {
                                setGroupDeleteDialogOpen(false);
                                setGroupToDelete(null);
                            }
                        }} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 flex-[1.5]">Confirm Dissolve</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AllTaxes;
