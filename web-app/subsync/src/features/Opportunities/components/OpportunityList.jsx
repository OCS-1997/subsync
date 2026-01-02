import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Search, Filter, X, Eye, Edit, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import { fetchOpportunities, fetchStatuses } from "../opportunitySlice.js";
import opportunityService from "../services/opportunityService.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";

const OpportunityList = () => {
    const dispatch = useDispatch();
    const { username } = useParams();
    const navigate = useNavigate();
    const { list = [], loading, totalPages, totalRecords, currentPage, statuses = [] } = useSelector((state) => state.opportunities);

    const baseUrl = `/${username}/dashboard`;

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState(null); // Default: None
    const [sortOrder, setSortOrder] = useState("asc");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        dispatch(fetchStatuses());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchOpportunities({
            search: searchTerm,
            status: statusFilter === "all" ? null : statusFilter,
            page: page,
            sort: sortBy,
            order: sortOrder
        }));
    }, [dispatch, searchTerm, statusFilter, page, sortBy, sortOrder]);

    const handleSort = (key) => {
        if (sortBy === key) {
            if (sortOrder === "asc") {
                setSortOrder("desc");
            } else {
                // Cycle: Asc -> Desc -> None
                setSortBy(null);
                setSortOrder("asc");
            }
        } else {
            setSortBy(key);
            setSortOrder("asc");
        }
    };

    const handleDeleteClick = (opportunityId) => {
        setSelectedOpportunityId(opportunityId);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedOpportunityId) return;

        setDeleting(true);
        try {
            await opportunityService.deleteOpportunity(selectedOpportunityId);
            toast.success('Opportunity deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedOpportunityId(null);
            // Refresh the list
            dispatch(fetchOpportunities({
                search: searchTerm,
                status: statusFilter === "all" ? null : statusFilter,
                page: page,
                sort: sortBy,
                order: sortOrder
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete opportunity');
        } finally {
            setDeleting(false);
        }
    };

    const headers = [
        { label: "Date", key: "opportunity_date" },
        { label: "Customer", key: "customer_name" },
        { label: "Value", key: "opportunity_value" },
        { label: "Owner", key: "owner" },
        { label: "Status", key: "status_name" },
        { label: "Actions", key: "actions", align: "center" }
    ];

    const processedData = (list || []).map((item) => ({
        ...item,
        opportunity_date: item.opportunity_date ? new Date(item.opportunity_date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
        opportunity_value: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(item.opportunity_value),
        status_name: (
            <Badge className="font-medium" style={{ backgroundColor: item.status_color || "#3b82f6", color: "white" }}>
                {item.status_name}
            </Badge>
        ),
        actions: (
            <div className="flex items-center justify-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => navigate(`${baseUrl}/opportunities/view/${item.opportunity_id}`)}
                    title="View"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    onClick={() => navigate(`${baseUrl}/opportunities/edit/${item.opportunity_id}`)}
                    title="Edit"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(item.opportunity_id)}
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )
    }));

    const breadcrumbItems = [
        { label: "Opportunities" }
    ];

    return (
        <div className="w-full space-y-6 pb-12">
            <PageHeader
                title="Sales Pipeline"
                description="Manage and track active sales opportunities and leads"
                breadcrumbItems={breadcrumbItems}
                actions={
                    <Button onClick={() => navigate(`${baseUrl}/opportunities/new`)} className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:shadow-blue-500/20 px-6 h-11">
                        <Plus className="h-4 w-4 mr-2" /> New Opportunity
                    </Button>
                }
            />

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center py-2 px-1">
                <div className="flex flex-1 gap-4 w-full md:max-w-3xl">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Search by customer, products or owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-11 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-60 h-11 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Filter className="h-3.5 w-3.5 text-gray-400" />
                                <SelectValue placeholder="All Stages" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-900 border-gray-100 dark:border-gray-800">
                            <SelectItem value="all">All Stages</SelectItem>
                            {(statuses || []).map((s) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.status_color }} />
                                        {s.status_name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden backdrop-blur-md">
                <GenericTable
                    headers={headers}
                    data={processedData}
                    primaryKey="opportunity_id"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                />
                {!loading && list.length === 0 && (
                    <div className="p-24 text-center space-y-3">
                        <div className="bg-gray-50 dark:bg-gray-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">No results found</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">We couldn't find any opportunities matching your current search or filters.</p>
                        {(searchTerm || statusFilter !== "all") && (
                            <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }} className="mt-4 border-blue-100 text-blue-600 hover:bg-blue-50">
                                Clear all active filters
                            </Button>
                        )}
                    </div>
                )}
                <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-transparent">
                    <Pagination
                        currentPage={page}
                        setCurrentPage={setPage}
                        totalPages={totalPages}
                        totalRecords={totalRecords}
                    />
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this opportunity? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OpportunityList;
