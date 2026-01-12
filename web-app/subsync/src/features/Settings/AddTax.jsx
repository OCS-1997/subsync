import { AlertCircle, ArrowLeft, Receipt, Info, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import { motion } from "framer-motion";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select.jsx";
import api from "@/lib/axiosInstance.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { cn } from "@/lib/utils";
import Hamster from "@/components/animations/Hamster.jsx";

function AddTax() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [taxName, setTaxName] = useState("");
    const [taxType, setTaxType] = useState("CGST");
    const [taxRate, setTaxRate] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);

    const taxTypes = [
        { value: "CGST", label: "CGST (Central GST)" },
        { value: "SGST", label: "SGST (State GST)" },
        { value: "IGST", label: "IGST (Integrated GST)" },
        { value: "SEZ", label: "SEZ (Special Zone)" },
        { value: "NO_TAX", label: "Exempt / No Tax" }
    ];

    useEffect(() => {
        if (isEditing && id) {
            fetchTaxData();
        }
    }, [id]);

    const fetchTaxData = async () => {
        try {
            setInitialLoading(true);
            const response = await api.get(`/tax/${id}`);
            const tax = response.data.tax;
            setTaxName(tax.tax_name || "");
            setTaxType(tax.tax_type || "CGST");
            setTaxRate(tax.tax_rate?.toString() || "");
            setDescription(tax.description || "");
        } catch (error) {
            setError("Manifest access failed");
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!taxName.trim()) {
            setError("Tax identity is mandatory");
            return;
        }

        try {
            setLoading(true);
            const requestData = {
                taxName: taxName.trim(),
                taxType: taxType,
                taxRate: taxType === "NO_TAX" ? 0 : parseFloat(taxRate),
                description: description.trim()
            };

            if (isEditing) {
                await api.put(`/edit-tax/${id}`, requestData);
            } else {
                await api.post("/add-tax", requestData);
            }

            const currentPath = window.location.pathname;
            const userSegment = currentPath.split("/")[1];
            navigate(`/${userSegment}/dashboard/settings/taxes/tax-rates`);
            toast.success(isEditing ? "Configuration synchronized!" : "New tax protocol registered!", {
                theme: "colored",
                transition: Bounce,
                className: "font-black uppercase tracking-widest text-[10px] rounded-2xl"
            });
        } catch (error) {
            setError(error.response?.data?.error || "Registration sequence failed");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        const currentPath = window.location.pathname;
        const userSegment = currentPath.split("/")[1];
        navigate(`/${userSegment}/dashboard/settings/taxes/tax-rates`);
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col justify-center items-center my-32">
                <Hamster />
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Initializing Interface...</p>
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
                    <span className="text-blue-500">Config</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tight">{isEditing ? "Modify Protocol" : "New Configuration"}</h1>
                        <p className="text-slate-500 font-medium max-w-xl">Define precise tax parameters for your financial operations.</p>
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
                            <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                <Receipt className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">{isEditing ? "Evolutionary Update" : "Establishment Protocol"}</CardTitle>
                                <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Configure metadata for tax computation</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-8">
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
                                    <Label htmlFor="taxName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax Identity</Label>
                                    <Input
                                        id="taxName"
                                        value={taxName}
                                        onChange={(e) => setTaxName(e.target.value)}
                                        placeholder="e.g. Standard GST 18%"
                                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-bold text-slate-700 dark:text-slate-200"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="taxType" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classification</Label>
                                    <Select value={taxType} onValueChange={setTaxType} disabled={loading}>
                                        <SelectTrigger className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-bold">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl">
                                            {taxTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value} className="rounded-xl my-1 mx-1 font-bold text-xs uppercase tracking-widest">
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {taxType !== "NO_TAX" && (
                                    <div className="space-y-3">
                                        <Label htmlFor="taxRate" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Percentage (%)</Label>
                                        <div className="relative">
                                            <Input
                                                id="taxRate"
                                                type="number"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(e.target.value)}
                                                placeholder="18.00"
                                                step="0.01"
                                                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-black tabular-nums pl-6"
                                                disabled={loading}
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta Description</Label>
                                    <Input
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Optional telemetry notes..."
                                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-bold"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all"
                                >
                                    {loading ? "Processing..." : (isEditing ? "Synchronize Configuration" : "Register Configuration")}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goBack}
                                    className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-500"
                                >
                                    Dismiss
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
                <Info size={14} className="text-blue-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ensure tax rates comply with standard statutory guidelines for your jurisdiction.</p>
            </motion.div>
        </div>
    );
}

export default AddTax;
