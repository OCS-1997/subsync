import { useState, useEffect } from "react";
import { toast, Bounce } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { CheckCircle, AlertCircle, Star, Layers, Percent, ShieldCheck, Globe } from "lucide-react";
import api from "@/lib/axiosInstance.js";
import Hamster from "@/components/animations/Hamster.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { cn } from "@/lib/utils";

function DefaultTaxPreference() {
    const [taxes, setTaxes] = useState([]);
    const [groups, setGroups] = useState([]);
    const [preferences, setPreferences] = useState({ intra: null, inter: null });
    const [selected, setSelected] = useState({
        intra: { kind: "", id: "" },
        inter: { kind: "", id: "" }
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [taxesRes, groupsRes, prefsRes] = await Promise.all([
                api.get("/all-taxes"),
                api.get("/tax-groups"),
                api.get("/default-tax-preferences")
            ]);
            setTaxes(taxesRes.data.taxes || []);
            setGroups(groupsRes.data.groups || []);
            const prefs = prefsRes.data.preferences || { intra: null, inter: null };
            setPreferences(prefs);
            setSelected({
                intra: prefs.intra || { kind: "", id: "" },
                inter: prefs.inter || { kind: "", id: "" }
            });
        } catch (error) {
            setError("Failed to fetch tax manifest");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);

            const response = await api.post("/default-tax-preferences", { intra: selected.intra, inter: selected.inter });
            setPreferences(response.data.preferences);
            toast.success("Manifest defaults synchronized!", {
                theme: "colored",
                transition: Bounce,
                className: "font-black uppercase tracking-widest text-[10px] rounded-2xl"
            });
        } catch (error) {
            setError(error.response?.data?.error || "Manifest update failure");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center my-32">
                <Hamster />
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Preferences...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto py-8 px-4">
            <PageHeader
                title="Tax Preferences"
                description="Manage your default tax preferences for intra-state and inter-state transactions."
                breadcrumbItems={[
                    { label: "Settings", href: `settings` },
                    { label: "Taxes", href: `tax-rates` },
                    { label: "Tax Preference" }
                ]}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                    <CardHeader className="p-10 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">System Defaults</CardTitle>
                                <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Architect your automated tax application logic</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        {error && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                <Alert variant="destructive" className="rounded-2xl border-rose-500/20 bg-rose-500/5 mb-8">
                                    <AlertCircle className="h-4 w-4 text-rose-500" />
                                    <AlertTitle className="text-rose-500 font-black uppercase tracking-widest text-[10px]">Operation Fault</AlertTitle>
                                    <AlertDescription className="text-rose-600/80 font-bold text-xs">{error}</AlertDescription>
                                </Alert>
                            </motion.div>
                        )}

                        <form onSubmit={handleSave} className="space-y-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Intra-state */}
                                <div className="space-y-8 p-8 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Layers className="text-emerald-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 leading-none">Intra-State</h3>
                                            <p className="text-[10px] font-bold text-slate-500/60 uppercase tracking-widest mt-1">Same Region Protocols</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logic Class</label>
                                            <Select value={selected.intra?.kind || ""} onValueChange={(v) => setSelected(s => ({ ...s, intra: { kind: v, id: "" } }))}>
                                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-emerald-500/20 font-bold px-6">
                                                    <SelectValue placeholder="Select classification" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl">
                                                    <SelectItem value="tax" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">Standalone Tax</SelectItem>
                                                    <SelectItem value="group" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">Tax Group Cluster</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selected.intra?.kind && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Mapping</label>
                                                <Select value={selected.intra?.id || ""} onValueChange={(v) => setSelected(s => ({ ...s, intra: { ...s.intra, id: v } }))}>
                                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-emerald-500/20 font-bold px-6">
                                                        <SelectValue placeholder={`Choose a ${selected.intra?.kind}`} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl max-h-60">
                                                        {selected.intra?.kind === 'tax' ? (
                                                            taxes.map((tax) => (
                                                                <SelectItem key={tax.tax_id} value={tax.tax_id} className="rounded-xl my-1 mx-1 font-bold text-xs">
                                                                    <div className="flex items-center justify-between w-full gap-4">
                                                                        <span className="truncate uppercase tracking-tight">{tax.tax_name}</span>
                                                                        <span className="text-[10px] font-black tabular-nums text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">{tax.tax_rate}%</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            groups.map((g) => (
                                                                <SelectItem key={g.group_id} value={g.group_id} className="rounded-xl my-1 mx-1 font-bold text-xs uppercase tracking-tight">
                                                                    {g.group_name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                {/* Inter-state */}
                                <div className="space-y-8 p-8 rounded-[2rem] bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/50">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Globe className="text-blue-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 leading-none">Inter-State</h3>
                                            <p className="text-[10px] font-bold text-slate-500/60 uppercase tracking-widest mt-1">Cross-Border Protocols</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logic Class</label>
                                            <Select value={selected.inter?.kind || ""} onValueChange={(v) => setSelected(s => ({ ...s, inter: { kind: v, id: "" } }))}>
                                                <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-blue-500/20 font-bold px-6">
                                                    <SelectValue placeholder="Select classification" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl">
                                                    <SelectItem value="tax" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">Standalone Tax</SelectItem>
                                                    <SelectItem value="group" className="rounded-xl my-1 mx-1 font-bold text-[10px] uppercase tracking-widest">Tax Group Cluster</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selected.inter?.kind && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Assigned Mapping</label>
                                                <Select value={selected.inter?.id || ""} onValueChange={(v) => setSelected(s => ({ ...s, inter: { ...s.inter, id: v } }))}>
                                                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-blue-500/20 font-bold px-6">
                                                        <SelectValue placeholder={`Choose a ${selected.inter?.kind}`} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl max-h-60">
                                                        {selected.inter?.kind === 'tax' ? (
                                                            taxes.map((tax) => (
                                                                <SelectItem key={tax.tax_id} value={tax.tax_id} className="rounded-xl my-1 mx-1 font-bold text-xs">
                                                                    <div className="flex items-center justify-between w-full gap-4">
                                                                        <span className="truncate uppercase tracking-tight">{tax.tax_name}</span>
                                                                        <span className="text-[10px] font-black tabular-nums text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">{tax.tax_rate}%</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            groups.map((g) => (
                                                                <SelectItem key={g.group_id} value={g.group_id} className="rounded-xl my-1 mx-1 font-bold text-xs uppercase tracking-tight">
                                                                    {g.group_name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] h-16 font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-40"
                                disabled={saving || !selected.intra?.kind || !selected.inter?.kind || !selected.intra?.id || !selected.inter?.id}
                            >
                                {saving ? "Updating Registry..." : "Synchronize System Defaults"}
                            </Button>
                        </form>

                        <AnimatePresence>
                            {(preferences.intra || preferences.inter) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6"
                                >
                                    <div className="p-8 bg-slate-50/50 dark:bg-slate-950/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 group hover:border-emerald-500/30 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <CheckCircle size={80} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-8 w-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Regional Manifest</h3>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 w-fit">{preferences.intra?.kind} Mapping</span>
                                            <p className="text-xl font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{preferences.intra?.name || preferences.intra?.id || 'Not assigned'}</p>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50/50 dark:bg-slate-950/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 group hover:border-blue-500/30 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <CheckCircle size={80} />
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                                <CheckCircle className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Global Manifest</h3>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 w-fit">{preferences.inter?.kind} Mapping</span>
                                            <p className="text-xl font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{preferences.inter?.name || preferences.inter?.id || 'Not assigned'}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

export default DefaultTaxPreference;
