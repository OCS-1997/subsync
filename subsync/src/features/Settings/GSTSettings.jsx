import { useState, useEffect } from "react";
import { toast, Bounce } from "react-toastify";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Building2, Landmark, Fingerprint, CalendarDays, ShieldAlert, Info, ShieldCheck } from "lucide-react";
import api from "../../lib/axiosInstance";
import Hamster from "@/components/animations/Hamster.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { cn } from "@/lib/utils";

function GSTSettings() {
    const [formDetails, setFormDetails] = useState({
        taxRegistrationNumberLabel: "",
        gstin: "",
        businessLegalName: "",
        businessTradeName: "",
        gstRegisteredOn: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGSTSettings = async () => {
            try {
                setLoading(true);
                const response = await api.get("/get-gst-settings");
                const data = response.data;

                if (!data.success) {
                    throw new Error(data.error || "GST settings retrieval failed.");
                }

                const settings = data.settings[0];
                if (settings) {
                    setFormDetails({
                        taxRegistrationNumberLabel: settings.tax_reg_num_label || "",
                        gstin: settings.gst_in || "",
                        businessLegalName: settings.business_legal_name || "",
                        businessTradeName: settings.business_trade_name || "",
                        gstRegisteredOn: settings.gst_reg_date
                            ? settings.gst_reg_date.slice(0, 10)
                            : "",
                    });
                }
            } catch (error) {
                setError("Failed to synchronize GST parameters.");
            } finally {
                setLoading(false);
            }
        };

        fetchGSTSettings();
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormDetails((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.put("/update-gst-settings", formDetails);
            toast.success("Regulatory parameters updated!", {
                theme: "colored",
                transition: Bounce,
                className: "font-black uppercase tracking-widest text-[10px] rounded-2xl"
            });
        } catch (error) {
            toast.error(error.response?.data?.error || "Update cycle failed.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center my-32">
                <Hamster />
                <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Accessing Secure Vault...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto py-8 px-4">
            <PageHeader
                title="GST Settings"
                description="Manage your GST registration details and business identifiers."
                breadcrumbItems={[
                    { label: "Settings", href: `settings` },
                    { label: "Taxes", href: `tax-rates` },
                    { label: "GST Settings" }
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
                                <Building2 className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black uppercase tracking-tight">Entity Identity</CardTitle>
                                <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Statutory registration and legal designations</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {error && (
                                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                    <Alert variant="destructive" className="rounded-2xl border-rose-500/20 bg-rose-500/5 mb-8">
                                        <ShieldCheck className="h-4 w-4 text-rose-500" />
                                        <AlertTitle className="text-rose-500 font-black uppercase tracking-widest text-[10px]">Operation Fault</AlertTitle>
                                        <AlertDescription className="text-rose-600/80 font-bold text-xs">{error}</AlertDescription>
                                    </Alert>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <Label htmlFor="taxRegistrationNumberLabel" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reg Number Label</Label>
                                    <div className="relative">
                                        <Input
                                            id="taxRegistrationNumberLabel"
                                            required
                                            value={formDetails.taxRegistrationNumberLabel}
                                            onChange={handleChange}
                                            className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-bold pl-12"
                                            placeholder="e.g. GSTIN, VAT, TIN"
                                        />
                                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="gstin" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registration Identifier</Label>
                                    <div className="relative">
                                        <Input
                                            id="gstin"
                                            required
                                            value={formDetails.gstin}
                                            onChange={handleChange}
                                            className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-black tracking-widest pl-12 uppercase"
                                            placeholder="ENTER REG NO."
                                        />
                                        <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <Label htmlFor="businessLegalName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Entity Name</Label>
                                    <Input
                                        id="businessLegalName"
                                        required
                                        value={formDetails.businessLegalName}
                                        onChange={handleChange}
                                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-bold px-6"
                                        placeholder="Registered Name"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="businessTradeName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trading Designation</Label>
                                    <Input
                                        id="businessTradeName"
                                        required
                                        value={formDetails.businessTradeName}
                                        onChange={handleChange}
                                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-blue-500/20 font-bold px-6"
                                        placeholder="Brand or Trade Name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 max-w-sm">
                                <Label htmlFor="gstRegisteredOn" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Effective Date</Label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="gstRegisteredOn"
                                        className="w-full h-14 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:outline-none font-black tabular-nums px-12 transition-all appearance-none text-slate-700 dark:text-slate-200"
                                        value={formDetails.gstRegisteredOn}
                                        onChange={handleChange}
                                    />
                                    <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] h-16 font-black uppercase tracking-[0.25em] text-[11px] shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all"
                            >
                                {saving ? "Compiling..." : "Synchronize Identity Matrix"}
                            </Button>
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ensure all data matches your legal tax certificates exactly for regulatory compliance.</p>
            </motion.div>
        </div>
    );
}

export default GSTSettings;
