import { AlertCircle } from "lucide-react"; 
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/axiosInstance.js"; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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

    const taxTypes = [
        { value: "CGST", label: "CGST (Central Goods and Services Tax)" },
        { value: "SGST", label: "SGST (State Goods and Services Tax)" },
        { value: "IGST", label: "IGST (Integrated Goods and Services Tax)" },
        { value: "SEZ", label: "SEZ (Special Economic Zone)" },
        { value: "NO_TAX", label: "No Tax" }
    ];

    // Fetch tax data if editing
    useEffect(() => {
        if (isEditing && id) {
            fetchTaxData();
        }
    }, [id]);

    const fetchTaxData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/tax/${id}`);
            const tax = response.data.tax;
            
            setTaxName(tax.tax_name || "");
            setTaxType(tax.tax_type || "CGST");
            setTaxRate(tax.tax_rate?.toString() || "");
            setDescription(tax.description || "");
        } catch (error) {
            setError("Failed to fetch tax data");
            console.error("Error fetching tax:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!taxName.trim()) {
            setError("Tax name is required");
            return;
        }

        if (isNaN(taxRate) || parseFloat(taxRate) < 0) {
            setError("Tax rate must be a non-negative number");
            return;
        }

        try {
            setLoading(true);
            const requestData = {
                taxName: taxName.trim(),
                taxType: taxType,
                taxRate: parseFloat(taxRate),
                description: description.trim()
            };

            let response;
            if (isEditing) {
                response = await api.put(`/edit-tax/${id}`, requestData);
            } else {
                response = await api.post("/add-tax", requestData);
            }

            if (response.status === 200 || response.status === 201) {
                // Navigate back to taxes list
                const currentPath = window.location.pathname;
                const userSegment = currentPath.split("/")[1];
                navigate(`/${userSegment}/dashboard/settings/taxes/tax-rates`);
                toast.success("Tax added successfully!", {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                    transition: Bounce,
                });
            }
        } catch (error) {
            setError(error.response?.data?.error || error.message || "An error occurred");
            toast.error(error.response?.data?.error || "Failed to add tax", {
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
            setLoading(false);
        }
    };

    const handleCancel = () => {
        const currentPath = window.location.pathname;
        const userSegment = currentPath.split("/")[1];
        navigate(`/${userSegment}/dashboard/settings/taxes/tax-rates`);
    };

    const goBack = () => {
        const currentPath = window.location.pathname;
        const userSegment = currentPath.split("/")[1];
        navigate(`/${userSegment}/dashboard/settings/taxes/tax-rates`);
    };

    return (
        <>

            <div className="w-full max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button 
                        variant="ghost" 
                        onClick={goBack}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Taxes
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Add New Tax</CardTitle>
                        <CardDescription>
                            Create a new tax rate for your business. Fill in the details below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="taxName">Tax Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="taxName"
                                    value={taxName}
                                    onChange={(e) => setTaxName(e.target.value)}
                                    required
                                    placeholder="e.g., Standard GST, Reduced Rate GST"
                                    className={error ? "border-red-500" : ""}
                                    disabled={loading}
                                />
                                {error && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="taxType">Tax Type <span className="text-red-500">*</span></Label>
                                <Select value={taxType} onValueChange={setTaxType} disabled={loading}>
                                    <SelectTrigger className={error ? "border-red-500" : ""}>
                                        <SelectValue placeholder="Select tax type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {taxTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {error && (
                                    <Alert variant="destructive" className="py-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {taxType && taxType !== "NO_TAX" && (
                                <div className="space-y-2">
                                    <Label htmlFor="taxRate">Tax Rate (%) <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="taxRate"
                                        type="number"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(e.target.value)}
                                        required
                                        placeholder="e.g., 18.00"
                                        min="0"
                                        step="0.01"
                                        className={error ? "border-red-500" : ""}
                                        disabled={loading}
                                    />
                                    {error && (
                                        <Alert variant="destructive" className="py-2">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Additional details about this tax rate..."
                                    rows={3}
                                    className={error ? "border-red-500" : ""}
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Adding..." : (isEditing ? "Update Tax" : "Add Tax")}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

export default AddTax;