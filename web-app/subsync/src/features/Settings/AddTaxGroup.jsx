import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import api from "@/lib/axiosInstance.js";
import { ArrowLeft, Layers, Info, Check, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import Hamster from "@/components/animations/Hamster.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";

function AddTaxGroup() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [allTaxes, setAllTaxes] = useState([]);
    const [selectedTaxIds, setSelectedTaxIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setInitialLoading(true);
                const promises = [api.get('/all-taxes')];
                if (isEditing) promises.push(api.get(`/tax-groups/${id}`));
                const [taxesRes, groupRes] = await Promise.all(promises);
                setAllTaxes(taxesRes.data.taxes || []);
                if (isEditing && groupRes) {
                    const g = groupRes.data.group;
                    setGroupName(g.group_name || "");
                    setDescription(g.description || "");
                    setSelectedTaxIds((g.members || []).map(m => m.tax_id));
                }
            } catch (e) {
                setError("Data linkage failure");
            } finally {
                setInitialLoading(false);
            }
        };
        load();
    }, [id]);

    const toggleTax = (taxId) => {
        setSelectedTaxIds(prev => prev.includes(taxId) ? prev.filter(id => id !== taxId) : [...prev, taxId]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!groupName.trim()) {
            setError('Group identifier is required');
            return;
        }
        try {
            setLoading(true);
            const payload = { groupName: groupName.trim(), description: description.trim(), taxIds: selectedTaxIds };
            if (isEditing) {
                await api.put(`/tax-groups/${id}`, payload);
                toast.success('Group manifest synchronized!', {
                    theme: 'colored',
                    transition: Bounce,
                    className: "font-black uppercase tracking-widest text-[10px] rounded-2xl"
                });
            } else {
                await api.post('/tax-groups', payload);
                toast.success('New logical group established!', {
                    theme: 'colored',
                    transition: Bounce,
                    className: "font-black uppercase tracking-widest text-[10px] rounded-2xl"
                });
            }
            setTimeout(() => navigate(-1), 1000);
        } catch (e) {
            setError(e?.response?.data?.error || 'Integration protocol failed');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        navigate(-1);
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col justify-center items-center my-32">
                <Hamster />
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Registry...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto py-8 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 flex flex-col gap-1"
            >
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <span>Settings</span>
                    <span className="opacity-40">/</span>
                    <span>Financials</span>
                    <span className="opacity-40">/</span>
                    <span className="text-blue-500">Logical Clusters</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight">{isEditing ? "Modify Cluster" : "New Grouping"}</h1>
                        <p className="text-slate-500 font-medium max-w-xl">Architect a logical collection of various tax entities for unified billing protocols.</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        className="w-fit p-0 h-auto font-black uppercase tracking-widest text-[11px] text-slate-500 hover:text-blue-600 hover:bg-transparent transition-colors group"
                    >
                        <ArrowLeft size={16} className="mr-3 group-hover:-translate-x-1 transition-transform" />
                        Return to Registry
                    </Button>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    <CardHeader className="p-10 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                <Layers className="text-indigo-500" size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">{isEditing ? "Cluster Refinement" : "Assembly Logic"}</CardTitle>
                                <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Define membership parameters for composite tax groups</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                    <Alert variant="destructive" className="rounded-2xl border-rose-500/20 bg-rose-500/5">
                                        <ShieldCheck className="h-4 w-4 text-rose-500" />
                                        <AlertTitle className="text-rose-500 font-black uppercase tracking-widest text-[10px]">Operation Fault</AlertTitle>
                                        <AlertDescription className="text-rose-600/80 font-bold text-xs">{error}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="groupName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Group Identifier</Label>
                                    <Input
                                        id="groupName"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="e.g. Cumulative Corporate Tax"
                                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-indigo-500/20 font-bold"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Description</Label>
                                    <Input
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional architectural notes..."
                                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-indigo-500/20 font-bold"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between ml-1 leading-none">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Member Entities
                                    </Label>
                                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10 uppercase tracking-widest">
                                        {selectedTaxIds.length} Linked Protocols
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                    <AnimatePresence>
                                        {allTaxes.map((tax, index) => {
                                            const isSelected = selectedTaxIds.includes(tax.tax_id);
                                            return (
                                                <motion.button
                                                    key={tax.tax_id}
                                                    type="button"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => toggleTax(tax.tax_id)}
                                                    className={cn(
                                                        "flex items-center gap-4 p-5 rounded-[1.75rem] border-2 transition-all text-left relative overflow-hidden group active:scale-[0.98]",
                                                        isSelected
                                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20"
                                                            : "bg-white dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500/30"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl border-2 flex items-center justify-center transition-all",
                                                        isSelected ? "bg-white/20 border-white/40 text-white" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 group-hover:border-indigo-400"
                                                    )}>
                                                        {isSelected ? <Check size={16} strokeWidth={4} /> : <Zap size={14} className="opacity-20" />}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className={cn(
                                                            "text-[10px] font-black uppercase tracking-tight truncate",
                                                            isSelected ? "text-white" : "text-slate-900 dark:text-slate-100"
                                                        )}>{tax.tax_name}</p>
                                                        <div className="flex items-center gap-2 mt-1 opacity-60">
                                                            <span className="text-[8px] font-black uppercase tracking-[0.15em]">{tax.tax_type}</span>
                                                            <span className="h-0.5 w-0.5 bg-current rounded-full"></span>
                                                            <span className="text-[8px] font-black tabular-nums">{tax.tax_rate}%</span>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </AnimatePresence>
                                    {allTaxes.length === 0 && (
                                        <div className="col-span-full py-20 text-center rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10">
                                            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                <Layers size={24} className="text-slate-300" strokeWidth={1} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No protocols detected in registry.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all"
                                >
                                    {loading ? "Establishing..." : (isEditing ? "Synchronize Cluster" : "Register Cluster Logic")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goBack}
                                    className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500"
                                >
                                    Abort
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex items-center justify-center gap-2 p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/50"
            >
                <Info size={14} className="text-indigo-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clusters enable complex multi-layer tax calculations across various jurisdictions.</p>
            </motion.div>
        </div>
    );
}

export default AddTaxGroup;


