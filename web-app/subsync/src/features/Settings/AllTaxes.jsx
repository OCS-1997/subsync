import { Pencil, Trash2, Star, Plus, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/axiosInstance.js";

function AllTaxes() {
    const [data, setData] = useState([]);
    const [defaultTax, setDefaultTax] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [taxToDelete, setTaxToDelete] = useState(null);

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
            
            setData(taxesRes.data.taxes || []);
            setDefaultTax(defaultTaxRes.data.defaultTaxPreference || null);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to fetch tax data");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (tax) => {
        setTaxToDelete(tax);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!taxToDelete) return;

        try {
            await api.delete(`/delete-tax/${taxToDelete.tax_id}`);
            
            // Update local state
            setData((prev) => prev.filter((item) => item.tax_id !== taxToDelete.tax_id));
            
            // If deleted tax was default, clear default
            if (defaultTax && defaultTax.tax_id === taxToDelete.tax_id) {
                setDefaultTax(null);
            }

            toast.success(`Tax "${taxToDelete.tax_name}" deleted successfully!`, {
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
            console.error("Error deleting tax:", error);
            toast.error(error.response?.data?.error || "Failed to delete tax", {
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
            setDeleteDialogOpen(false);
            setTaxToDelete(null);
        }
    };

    const setAsDefault = async (tax) => {
        try {
            const response = await api.post("/set-default-tax-preference", { taxId: tax.tax_id });
            setDefaultTax(response.data.defaultTaxPreference);
            
            toast.success(`"${tax.tax_name}" set as default tax!`, {
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
                    <p>Loading taxes...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            <div className="w-full flex flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Tax Rates</h1>
                <Link to="add" className="bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2 text-white flex items-center gap-2">
                    <Plus size={16} />
                    Add Tax
                </Link>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="w-full">
                {data.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No taxes found. Add your first tax rate to get started.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-blue-500">
                            <TableRow>
                                <TableHead className="text-white">Tax Name</TableHead>
                                <TableHead className="text-white">Tax Type</TableHead>
                                <TableHead className="text-white">Tax Rate</TableHead>
                                <TableHead className="text-white">Default</TableHead>
                                <TableHead className="text-white">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.tax_id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">
                                        {item.tax_name || "N/A"}
                                        {item.description && (
                                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getTaxTypeBadge(item.tax_type)}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {item.tax_rate !== null ? `${item.tax_rate}%` : "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {defaultTax && defaultTax.tax_id === item.tax_id ? (
                                            <div className="flex items-center gap-2">
                                                <Star className="text-yellow-500 fill-current" size={16} />
                                                <span className="text-sm text-gray-600">Default</span>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setAsDefault(item)} 
                                                title="Set as default"
                                                className="text-gray-400 hover:text-yellow-500"
                                            >
                                                <Star size={16} />
                                            </Button>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="ghost" size="sm" aria-label={`Edit ${item.tax_name || "tax"}`}>
                                                <Link to={`edit/${item.tax_id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Delete ${item.tax_name || "tax"}`}
                                                onClick={() => handleDeleteClick(item)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tax</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the tax "{taxToDelete?.tax_name}"? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleDeleteConfirm}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AllTaxes;
