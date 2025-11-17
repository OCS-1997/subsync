import { saveAs } from "file-saver";
import { Eye, FileDown, FileUp, Plus, Trash2 } from 'lucide-react';
import * as Papa from "papaparse";
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast, Bounce } from "react-toastify";
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from "@/components/layouts/ThemeToggle.jsx";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Hamster from "@/components/animations/Hamster.jsx";
import api from '@/lib/axiosInstance.js';
import GenericTable from '@/components/layouts/GenericTable.jsx';
import Pagination from '@/components/layouts/Pagination.jsx';
import SearchFilterForm from '@/components/layouts/SearchFilterForm.jsx';
import { fetchServices, deleteService } from '@/features/Services/serviceSlice.js';

const headers = [
  { key: 'service_name', label: 'Service Name' },
  { key: 'stock_keepers_unit', label: 'SKU' },
  { key: 'item_group_name', label: 'Item Group' },
  { key: 'selling_price', label: 'Selling Price' },
  { key: 'tax_rate', label: 'Tax Rate' },
  { key: 'total_amount', label: 'Amount' },
  { key: 'preferred_vendor_name', label: 'Vendor' },
  { key: 'actions', label: 'Actions' },
];

function Services() {
  const dispatch = useDispatch();
  const { list: services, loading, error, totalRecords, totalPages } = useSelector((state) => state.services);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const fileInputRef = useRef(null);
  const debounceTimeout = useRef();

  // Reset to first page when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  // Fetch services when parameters change
  useEffect(() => {
    const params = {
      search: debouncedSearch,
      page: currentPage,
      limit: 10
    };

    // Only add sort parameters if they are not null
    if (sortBy && sortOrder) {
      params.sort = sortBy;
      params.order = sortOrder;
    }

    dispatch(fetchServices(params));
  }, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);

  // Debounce search
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  // Handle search input change (e.g., on Enter key)
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    // Don't sort actions column
    if (key === 'actions') return;

    if (sortBy === key && sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortBy === key && sortOrder === "desc") {
      setSortBy(null);
      setSortOrder(null);
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  // Backend handles all filtering, sorting, and pagination
  const backendTotalPages = totalPages || Math.max(1, Math.ceil(totalRecords / 10));

  const handleDeleteClick = (serviceId) => {
    const service = services.find(s => s.service_id === serviceId);
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await dispatch(deleteService(serviceToDelete.service_id));
      // Refresh the services list to get updated pagination
      const params = {
        search: debouncedSearch,
        page: currentPage,
        limit: 10
      };

      // Only add sort parameters if they are not null
      if (sortBy && sortOrder) {
        params.sort = sortBy;
        params.order = sortOrder;
      }

      dispatch(fetchServices(params));

      toast.success(`Service "${serviceToDelete.service_name}" deleted successfully!`, {
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
      toast.error("Failed to delete service", {
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
      setServiceToDelete(null);
    }
  };

  const renderActions = (serviceId) => (
    <div className="flex items-center gap-2">
      <Link to={`${serviceId}`}>
        <Button variant="ghost" size="icon">
          <Eye className="w-4 h-4" />
        </Button>
      </Link>
      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(serviceId)}>
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );

  const fetchServicesAndExport = async () => {
    try {
      const response = await api.get("/all-services");
      if (!response.data || !Array.isArray(response.data.services)) {
        throw new Error("Invalid service data received for export!");
      }
      const allServices = response.data.services;

      if (allServices.length === 0) {
        toast.info("No service data available to export!");
        return;
      }

      const formattedData = allServices.map((s) => ({
        "Service ID": s.service_id,
        "Service Name": s.service_name,
        "SKU": s.stock_keepers_unit,
        "Tax Preference": s.tax_preference,
        "Item Group Name": s.item_group_name || 'N/A',
        "Sales Info (JSON)": s.sales_info ? JSON.stringify(s.sales_info) : '',
        "Purchase Info (JSON)": s.purchase_info ? JSON.stringify(s.purchase_info) : '',
        "Preferred Vendor Name": s.preferred_vendor_name || 'N/A',
        "Default Tax Rates (JSON)": s.default_tax_rates ? JSON.stringify(s.default_tax_rates) : '',
        "Created At": s.created_at,
        "Updated At": s.updated_at,
      }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `services_export_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("CSV file downloaded successfully!");
    } catch (err) {
      console.error("Error exporting services:", err);
      toast.error(err.message || "Failed to generate CSV file.");
    }
  };

  const handleImportButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const importableData = result.data.map(row => ({
            service_name: row["Service Name"] || "",
            SKU: row["SKU"] || "",
            tax_preference: row["Tax Preference"] || "Taxable",
            item_group: row["Item Group ID"] || "",
            sales_information: JSON.parse(row["Sales Info (JSON)"] || '{}'),
            purchase_information: JSON.parse(row["Purchase Info (JSON)"] || '{}'),
            preferred_vendor: row["Preferred Vendor ID"] || "",
            default_tax_rates: JSON.parse(row["Default Tax Rates (JSON)"] || '{}'),
          }));
          handleImport(importableData);
        },
        error: (err) => {
          toast.error(`Error parsing CSV: ${err.message}`);
        }
      });
    }
  };

  const handleImport = async (dataToImport) => {
    if (dataToImport.length === 0) {
      toast.error("No data to import from CSV!");
      return;
    }
    toast.info("Importing services...");
    try {
      const res = await api.post(`${import.meta.env.VITE_API_URL}/import-services`, { services: dataToImport });
      if (res.status === 200 || res.status === 201) {
        toast.success("Services imported successfully!");
        dispatch(fetchServices());
      } else {
        throw new Error(res.data.error || "Import failed!");
      }
    } catch (err) {
      console.error("Error during import:", err);
      toast.error(err.response?.data?.error || err.message || "Error importing services.");
    }
  };

  const getPriceNumber = (info, key) => {
    if (!info) return 0;
    try {
      const obj = typeof info === 'string' ? JSON.parse(info) : info;
      return obj?.[key] ? parseFloat(obj[key]) : 0;
    } catch {
      return 0;
    }
  };

  const formatCurrency = (num) => {
    const n = Number(num) || 0;
    return `Rs.${n.toFixed(2)}`;
  };

  const getSellingPrice = (salesInfo) => {
    if (!salesInfo) return 0;
    try {
      const obj = typeof salesInfo === 'string' ? JSON.parse(salesInfo) : salesInfo;
      return parseFloat(obj?.price) || 0;
    } catch {
      return 0;
    }
  };

  const getTaxRate = (service) => {
    // Use tax_details from the backend enhancement if available
    if (service.tax_details) {
      // Prioritize intra-state tax rate for calculation
      if (service.tax_details.intra && (service.tax_details.intra.tax_rate || service.tax_details.intra.rate)) {
        return parseFloat(service.tax_details.intra.tax_rate || service.tax_details.intra.rate) || 0;
      }
      // Fallback to inter-state tax rate
      if (service.tax_details.inter && (service.tax_details.inter.tax_rate || service.tax_details.inter.rate)) {
        return parseFloat(service.tax_details.inter.tax_rate || service.tax_details.inter.rate) || 0;
      }
    }

    // Fallback to old method for backward compatibility
    if (!service.default_tax_rates) return 0;
    try {
      const taxRates = typeof service.default_tax_rates === 'string' ?
        JSON.parse(service.default_tax_rates) : service.default_tax_rates;

      // Use intra state tax rate for calculation
      if (taxRates.intra && taxRates.intra.rate) {
        return parseFloat(taxRates.intra.rate) || 0;
      }

      return 0;
    } catch {
      return 0;
    }
  };

  const calculateTaxAmount = (sellingPrice, taxRate) => {
    return (sellingPrice * taxRate) / 100;
  };

  const calculateTotalAmount = (sellingPrice, taxAmount) => {
    return sellingPrice + taxAmount;
  };

  const formatPercent = (rate) => {
    const r = Number(rate) || 0;
    return `${r.toFixed(2)}%`;
  };

  const formatTotalAmount = (totalAmount) => {
    return formatCurrency(totalAmount);
  };


  return (
    <>
      <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Services</h1>
        <Link to={`add`}>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white w-40">
            <Plus /> Add
          </Button> 
        </Link>
      </div>
      <hr className="mb-6 border-blue-500 border-1" />
      <div className="flex items-center gap-3 mb-3">
        <SearchFilterForm
          search={search}
          setSearch={setSearch}
          handleSearch={(e) => setSearch(e.target.value)}
        />
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleImportButtonClick}>
          <FileDown /> Import
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <FileUp /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={fetchServicesAndExport}>Export as CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
      </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="p-6 flex flex-col justify-center items-center">
            <Hamster />
          </div>
        ) : services.length > 0 ? (
          <>
            <GenericTable
              headers={headers}
              data={services.map((service) => {
                const sellingPrice = getSellingPrice(service.sales_info);
                const taxRatePercent = getTaxRate(service);
                const taxAmount = calculateTaxAmount(sellingPrice, taxRatePercent);
                const totalAmount = calculateTotalAmount(sellingPrice, taxAmount);

                return {
                  ...service,
                  stock_keepers_unit: service.stock_keepers_unit,
                  item_group_name: service.item_group_name || 'N/A',
                  preferred_vendor_name: service.preferred_vendor_name || 'N/A',
                  selling_price: (
                    <span className="inline-block text-right pr-4 tabular-nums">{formatCurrency(getPriceNumber(service.sales_info, 'price'))}</span>
                  ),
                  tax_rate: (
                    <span className="inline-block text-right pr-4 tabular-nums">{formatPercent(taxRatePercent)}</span>
                  ),
                  total_amount: (
                    <span className="inline-block text-right pr-4 tabular-nums">{formatTotalAmount(totalAmount)}</span>
                  ),
                  actions: renderActions(service.service_id),
                };
              })}
              primaryKey="service_id"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={backendTotalPages}
              totalRecords={totalRecords}
            />
          </>
        ) : (
          <div className="p-10 border rounded-md bg-white text-center">
            {debouncedSearch ? (
              <>
                <div className="text-lg font-semibold mb-2">No results found</div>
                <div className="text-sm text-gray-600 mb-4">Try adjusting your search criteria.</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold mb-2">No services yet</div>
                <div className="text-sm text-gray-600 mb-4">Create your first service to get started.</div>
                <Link to="add">
                  <Button><Plus className="w-4 h-4" /> Add Service</Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the service &quot; <b className="font-semibold text-black">{serviceToDelete?.service_name}</b>&quot; ?
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

export default Services;
