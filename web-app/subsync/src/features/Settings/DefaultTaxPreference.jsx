import { useState, useEffect } from "react";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Star, Layers, Percent } from "lucide-react";
import api from "@/lib/axiosInstance.js";

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
            console.error("Error fetching data:", error);
            setError("Failed to fetch tax data");
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

            toast.success("Default tax preferences saved!", {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
                transition: Bounce,
            });
        } catch (error) {
            console.error("Error setting default tax:", error);
            toast.error(error.response?.data?.error || "Failed to set default tax", {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
                transition: Bounce,
            });
        } finally {
            setSaving(false);
        }
    };

    const getTaxTypeBadge = (taxType) => {
        const colors = {
            'CGST': 'bg-blue-100 text-blue-800',
            'SGST': 'bg-green-100 text-green-800',
            'IGST': 'bg-purple-100 text-purple-800',
            'SEZ': 'bg-yellow-100 text-yellow-800',
            'NO_TAX': 'bg-gray-100 text-gray-800'
        };
        
        return (
            <Badge className={colors[taxType] || 'bg-gray-100 text-gray-800'}>
                {taxType}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center items-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p>Loading tax preferences...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Default Tax Preference
                        </CardTitle>
                        <CardDescription>
                            Set default tax preferences for intra-state and inter-state transactions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Intra-state */}
                                <div className="space-y-3 p-4 border rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2"><Percent size={16}/> Intra State Tax Rate</h3>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select kind</label>
                                        <Select value={selected.intra?.kind || ""} onValueChange={(v) => setSelected(s => ({ ...s, intra: { kind: v, id: "" } }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tax">Tax</SelectItem>
                                                <SelectItem value="group">Tax Group</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {selected.intra?.kind === 'tax' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Tax</label>
                                            <Select value={selected.intra?.id || ""} onValueChange={(v) => setSelected(s => ({ ...s, intra: { ...s.intra, id: v } }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a tax" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {taxes.map((tax) => (
                                                        <SelectItem key={tax.tax_id} value={tax.tax_id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{tax.tax_name}</span>
                                                                {getTaxTypeBadge(tax.tax_type)}
                                                                <span className="text-gray-500">({tax.tax_rate}%)</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {selected.intra?.kind === 'group' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Tax Group</label>
                                            <Select value={selected.intra?.id || ""} onValueChange={(v) => setSelected(s => ({ ...s, intra: { ...s.intra, id: v } }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a tax group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {groups.map((g) => (
                                                        <SelectItem key={g.group_id} value={g.group_id}>
                                                            <div className="flex items-center gap-2">
                                                                <Layers size={14}/>
                                                                <span>{g.group_name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                {/* Inter-state */}
                                <div className="space-y-3 p-4 border rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2"><Percent size={16}/> Inter State Tax Rate</h3>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select kind</label>
                                        <Select value={selected.inter?.kind || ""} onValueChange={(v) => setSelected(s => ({ ...s, inter: { kind: v, id: "" } }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="tax">Tax</SelectItem>
                                                <SelectItem value="group">Tax Group</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {selected.inter?.kind === 'tax' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Tax</label>
                                            <Select value={selected.inter?.id || ""} onValueChange={(v) => setSelected(s => ({ ...s, inter: { ...s.inter, id: v } }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a tax" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {taxes.map((tax) => (
                                                        <SelectItem key={tax.tax_id} value={tax.tax_id}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{tax.tax_name}</span>
                                                                {getTaxTypeBadge(tax.tax_type)}
                                                                <span className="text-gray-500">({tax.tax_rate}%)</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {selected.inter?.kind === 'group' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Tax Group</label>
                                            <Select value={selected.inter?.id || ""} onValueChange={(v) => setSelected(s => ({ ...s, inter: { ...s.inter, id: v } }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a tax group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {groups.map((g) => (
                                                        <SelectItem key={g.group_id} value={g.group_id}>
                                                            <div className="flex items-center gap-2">
                                                                <Layers size={14}/>
                                                                <span>{g.group_name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={saving || !selected.intra?.kind || !selected.inter?.kind || !selected.intra?.id || !selected.inter?.id}
                            >
                                {saving ? "Saving..." : "Save Default Preferences"}
                            </Button>
                        </form>

                        {(preferences.intra || preferences.inter) && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <h3 className="font-semibold text-green-800">Current Intra State Default</h3>
                                    </div>
                                    <p className="text-green-700 text-sm">{preferences.intra ? `${preferences.intra.kind} - ${preferences.intra.id}` : 'Not set'}</p>
                                </div>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <h3 className="font-semibold text-green-800">Current Inter State Default</h3>
                                    </div>
                                    <p className="text-green-700 text-sm">{preferences.inter ? `${preferences.inter.kind} - ${preferences.inter.id}` : 'Not set'}</p>
                                </div>
                            </div>
                        )}

                        {taxes.length === 0 && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                    <p className="text-yellow-800">
                                        No taxes available. Please add some tax rates first.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default DefaultTaxPreference;
