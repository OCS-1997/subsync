import { Pencil, Trash2, Star, Plus, AlertCircle, ChevronDown, Layers, ArrowDownWideNarrow } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast, ToastContainer, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
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
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import api from "@/lib/axiosInstance.js";

function AllTaxes() {
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
            setError("Failed to fetch tax data");
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

    const filteredTaxes = data.filter(item => {
        if (filter === 'Tax Group') return false;
        if (filter === 'Tax') return true;
        if (filter === 'Active') return item.is_active !== false;
        if (filter === 'Inactive') return item.is_active === false;
        return true; // All
    });

    const filteredGroups = groups.filter(g => {
        if (filter === 'Tax') return false;
        if (filter === 'Tax Group') return true;
        if (filter === 'Active') return g.is_active !== false;
        if (filter === 'Inactive') return g.is_active === false;
        return true; // All
    });

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
            <PageHeader
                title="Tax Rates"
                description="Manage your tax rates and tax groups"
                breadcrumbItems={[
                    { label: "Settings", href: "settings" },
                    { label: "Taxes", href: "settings/taxes" },
                    { label: "Tax Rates" }
                ]}
                actions={
                    <div className="flex items-center gap-2">
                        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <ArrowDownWideNarrow size={16} /> {filter}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-44 p-1">
                                <div className="flex flex-col">
                                    {['All', 'Active', 'Inactive', 'Tax', 'Tax Group'].map(f => (
                                        <button key={f} className={`text-left px-3 py-2 hover:bg-gray-100 rounded-md ${filter === f ? 'bg-gray-100' : ''}`} onClick={() => { setFilter(f); setFilterOpen(false); }}>
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button className="bg-blue-500 hover:bg-blue-600 rounded-lg px-4 py-2 text-white flex items-center gap-2">
                                    <Plus size={16} />
                                    Add
                                    <ChevronDown size={16} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-48 p-1">
                                <div className="flex flex-col">
                                    <Link to="add" className="px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2">
                                        <Plus size={14} /> Add Tax
                                    </Link>
                                    <Link to="../tax-groups/add" className="px-3 py-2 hover:bg-gray-100 rounded-md flex items-center gap-2">
                                        <Layers size={14} /> Add Tax Group
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                }
            />

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="w-full">
                {filteredTaxes.length === 0 && filteredGroups.length === 0 ? (
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
                                <TableHead className="text-white">Groups</TableHead>
                                <TableHead className="text-white">Default</TableHead>
                                <TableHead className="text-white">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredTaxes.map((item) => (
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
                                        <div className="flex flex-wrap gap-1">
                                            {groups
                                                .filter(g => (g.members || []).some(m => m.tax_id === item.tax_id))
                                                .map(g => (
                                                    <Badge key={`${g.group_id}-${item.tax_id}`} className="bg-gray-100 text-gray-800">
                                                        {g.group_name}
                                                    </Badge>
                                                ))}
                                            {groups.filter(g => (g.members || []).some(m => m.tax_id === item.tax_id)).length === 0 && (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </div>
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

                            {(filter === 'All' || filter === 'Tax Group') && filteredGroups.map((g) => (
                                <TableRow key={g.group_id} className="hover:bg-gray-50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Layers size={14} /> {g.group_name}
                                        </div>
                                        {g.description && (
                                            <p className="text-sm text-gray-500 mt-1">{g.description}</p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={'bg-indigo-100 text-indigo-800'}>Group</Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {g.members && g.members.length > 0 ? `${g.members.length} taxes` : '0'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(g.members || []).map(m => (
                                                <Badge key={`${g.group_id}-${m.tax_id}`} className="bg-gray-100 text-gray-800">{m.tax_name}</Badge>
                                            ))}
                                            {(g.members || []).length === 0 && <span className="text-xs text-gray-400">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-gray-400">-</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button asChild variant="ghost" size="sm" aria-label={`Edit ${g.group_name}`}>
                                                <Link to={`../tax-groups/edit/${g.group_id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                aria-label={`Delete ${g.group_name}`}
                                                onClick={() => handleGroupDeleteClick(g)}
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

            {/* Delete Group Confirmation Dialog */}
            <Dialog open={groupDeleteDialogOpen} onOpenChange={setGroupDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tax Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the tax group "{groupToDelete?.group_name}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setGroupDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!groupToDelete) return;
                                try {
                                    await api.delete(`/tax-groups/${groupToDelete.group_id}`);
                                    setGroups(prev => prev.filter(g => g.group_id !== groupToDelete.group_id));
                                    toast.success(`Tax group "${groupToDelete.group_name}" deleted successfully!`, {
                                        position: "top-right",
                                        autoClose: 2000,
                                        theme: "colored",
                                        transition: Bounce,
                                    });
                                } catch (e) {
                                    toast.error(e?.response?.data?.error || "Failed to delete tax group", {
                                        position: "top-right",
                                        autoClose: 2000,
                                        theme: "colored",
                                        transition: Bounce,
                                    });
                                } finally {
                                    setGroupDeleteDialogOpen(false);
                                    setGroupToDelete(null);
                                }
                            }}
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
