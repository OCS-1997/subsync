import { useState, useEffect } from "react";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Star } from "lucide-react";
import api from "@/lib/axiosInstance.js";

function DefaultTaxPreference() {
    const [taxes, setTaxes] = useState([]);
    const [defaultTax, setDefaultTax] = useState(null);
    const [selectedTaxId, setSelectedTaxId] = useState("");
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
            
            const [taxesRes, defaultTaxRes] = await Promise.all([
                api.get("/all-taxes"),
                api.get("/default-tax-preference")
            ]);
            
            setTaxes(taxesRes.data.taxes || []);
            setDefaultTax(defaultTaxRes.data.defaultTaxPreference || null);
            setSelectedTaxId(defaultTaxRes.data.defaultTaxPreference?.tax_id || "");
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to fetch tax data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!selectedTaxId) {
            setError("Please select a tax to set as default.");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            
            const response = await api.post("/set-default-tax-preference", { taxId: selectedTaxId });
             // console.log("Default Tax Res:",response.data);
            setDefaultTax(response.data.defaultTaxPreference);
            
            const selectedTax = taxes.find(tax => tax.tax_id === selectedTaxId);
            // console.log("Selected Tax;",selectedTax);
            toast.success(`"${selectedTax?.tax_name}" set as default tax!`, {
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
            <ToastContainer />
            <div className="w-full max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            Default Tax Preference
                        </CardTitle>
                        <CardDescription>
                            Set the default tax rate that will be automatically applied to new transactions.
                            
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Default Tax</label>
                                <Select value={selectedTaxId} onValueChange={setSelectedTaxId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a tax rate to set as default" />
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

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={saving || !selectedTaxId}
                            >
                                {saving ? "Saving..." : "Save Default Preference"}
                            </Button>
                        </form>

                        {defaultTax && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <h3 className="font-semibold text-green-800">Current Default Tax</h3>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-green-700">
                                        <span className="font-medium">{defaultTax.tax_name}</span>
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {getTaxTypeBadge(defaultTax.tax_type)}
                                        <span className="text-green-600 font-semibold">
                                            {defaultTax.tax_rate}%
                                        </span>
                                    </div>
                                    {defaultTax.description && (
                                        <p className="text-sm text-green-600 mt-1">
                                            {defaultTax.description}
                                        </p>
                                    )}
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
