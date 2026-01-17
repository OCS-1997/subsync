import { saveAs } from "file-saver";
import { Eye, FileDown, FileUp, Plus, Trash2, Search, Filter, ChevronDown } from 'lucide-react';
import * as Papa from "papaparse";
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { toast, Bounce } from "react-toastify";
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from "@/components/layouts/ThemeToggle.jsx";
import { motion, AnimatePresence } from "framer-motion";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
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
import { cn } from "@/lib/utils";

const headers = [
  { key: 'service_name', label: 'Service Identity' },
  { key: 'stock_keepers_unit', label: 'SKU' },
  { key: 'item_group_name', label: 'Item Group' },
  { key: 'selling_price', label: 'Retail Price' },
  { key: 'tax_rate', label: 'Tax Index' },
  { key: 'total_amount', label: 'Gross Value' },
  { key: 'preferred_vendor_name', label: 'Procurement' },
  { key: 'actions', label: 'Operations' },
];

function Services() {
  const dispatch = useDispatch();
  const { username } = useParams();
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

  const handleSort = (key) => {
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

  const backendTotalPages = totalPages || Math.max(1, Math.ceil(totalRecords / 10));

  const handleDeleteClick = (serviceId) => {
    const service = services.find(s => s.service_id === serviceId);
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await dispatch(deleteService(serviceToDelete.service_id)).unwrap();

      const params = {
        search: debouncedSearch,
        page: currentPage,
        limit: 10
      };

      if (sortBy && sortOrder) {
        params.sort = sortBy;
        params.order = sortOrder;
      }

      dispatch(fetchServices(params));

      toast.success(`Service purged from inventory: ${serviceToDelete.service_name}`);
    } catch (error) {
      toast.error("Operation failed: Could not delete service");
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const renderActions = (serviceId) => (
    <div className="flex items-center gap-1.5 justify-center">
      <Link to={`${serviceId}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
        >
          <Eye className="w-4 h-4 text-slate-400 hover:text-blue-600 transition-colors" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteClick(serviceId)}
        className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors" />
      </Button>
    </div>
  );

  const fetchServicesAndExport = async () => {
    try {
      const response = await api.get("/all-services");
      if (!response.data || !Array.isArray(response.data.services)) {
        throw new Error("Invalid service data received!");
      }
      const allServices = response.data.services;

      if (allServices.length === 0) {
        toast.info("No data available to translate into CSV.");
        return;
      }

      const formattedData = allServices.map((s) => ({
        "Service Identity": s.service_name,
        "SKU": s.stock_keepers_unit,
        "Item Category": s.item_group_name || 'N/A',
        "Vendor Source": s.preferred_vendor_name || 'N/A',
        "Created At": s.created_at,
      }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `subsync_services_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Manifest exported successfully.");
    } catch (err) {
      toast.error("Export sequence failed.");
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
          handleImport(result.data);
        },
        error: (err) => {
          toast.error(`CSV Parsing error: ${err.message}`);
        }
      });
    }
  };

  const handleImport = async (dataToImport) => {
    if (dataToImport.length === 0) {
      toast.error("Manifest is empty.");
      return;
    }
    toast.info("Initializing import sequence...");
    try {
      const res = await api.post(`/import-services`, { services: dataToImport });
      if (res.status === 200 || res.status === 201) {
        toast.success("Inventory synchronized.");
        dispatch(fetchServices());
      }
    } catch (err) {
      toast.error("Synchronization failed.");
    }
  };

  const formatCurrency = (num) => {
    const n = Number(num) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(n);
  };

  const getSellingPrice = (salesInfo) => {
    try {
      const obj = typeof salesInfo === 'string' ? JSON.parse(salesInfo) : salesInfo;
      return parseFloat(obj?.price) || 0;
    } catch { return 0; }
  };

  const getTaxRate = (service) => {
    if (service.tax_details) {
      // Use .tax_rate which is the property name returned from the backend/database
      if (service.tax_details.intra) return parseFloat(service.tax_details.intra.tax_rate) || 0;
      if (service.tax_details.inter) return parseFloat(service.tax_details.inter.tax_rate) || 0;
    }
    return 0;
  };

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title="Service Inventory"
        description="Manage and index all deliverable services and service level agreements."
        breadcrumbItems={[{ label: "Services" }]}
        actions={
          <Link to="add">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
              <Plus className="w-5 h-5 mr-3" />
              Add Service
            </Button>
          </Link>
        }
      />

      <div className="space-y-8 mt-12">
        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] p-4 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="pl-4">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search services by identity, SKU, or group..."
              className="flex-1 bg-transparent border-none focus:ring text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="h-10 w-[1px] bg-gray-100 dark:bg-slate-800 mx-2" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-xl h-11 px-6 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400">
                  Operations
                  <ChevronDown className="ml-2 w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2 dark:bg-slate-900 dark:border-slate-800 rounded-2xl min-w-[200px]">
                <DropdownMenuItem onClick={handleImportButtonClick} className="rounded-xl p-3 font-bold text-xs gap-3">
                  <FileDown className="w-4 h-4 text-blue-500" /> Import 
                </DropdownMenuItem>
                <DropdownMenuItem onClick={fetchServicesAndExport} className="rounded-xl p-3 font-bold text-xs gap-3">
                  <FileUp className="w-4 h-4 text-emerald-500" /> Export 
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-[1.5rem] bg-red-50 text-red-600 border-red-100">
            <AlertTitle className="font-black uppercase tracking-widest text-xs mb-2">System Error</AlertTitle>
            <AlertDescription className="text-sm font-bold opacity-80">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="py-40 flex flex-col justify-center items-center">
            <Hamster />
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Scanning Inventory...</p>
          </div>
        ) : services.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GenericTable
              headers={headers}
              data={services.map((service) => {
                const sellingPrice = getSellingPrice(service.sales_info);
                const taxRatePercent = getTaxRate(service);
                const taxAmount = (sellingPrice * taxRatePercent) / 100;
                const totalAmount = sellingPrice + taxAmount;

                return {
                  ...service,
                  service_name: (
                    <Link to={`${service.service_id}`} className="group/name block">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white group-hover/name:text-blue-600 transition-colors hover:underline">{service.service_name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">{service.item_group_name || 'General Inventory'}</span>
                      </div>
                    </Link>
                  ),
                  stock_keepers_unit: <code className="text-[11px] font-black text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">{service.stock_keepers_unit}</code>,
                  item_group_name: service.item_group_name || '—',
                  preferred_vendor_name: service.preferred_vendor_id ? (
                    <Link to={`/${window.location.pathname.split('/')[1]}/dashboard/vendors/${service.preferred_vendor_id}`} className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {service.preferred_vendor_name}
                    </Link>
                  ) : (service.preferred_vendor_name || '—'),
                  selling_price: <span className="text-blue-600 dark:text-blue-400 tabular-nums">{formatCurrency(sellingPrice)}</span>,
                  tax_rate: <span className="text-slate-400 tabular-nums">{taxRatePercent.toFixed(1)}%</span>,
                  total_amount: <span className="text-slate-900 dark:text-white tabular-nums">{formatCurrency(totalAmount)}</span>,
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
          </motion.div>
        ) : (
          <div className="py-40 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Index Matches</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto mb-8">
              Adjust your search parameters or register a new service in the index.
            </p>
            {!debouncedSearch && (
              <Link to="add">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[11px]">
                  Add Initial Service
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden dark:bg-slate-900">
          <div className="p-10 bg-red-600">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6">
              <Trash2 className="w-10 h-10 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black text-white mb-2 tracking-tight">Delete Service?</DialogTitle>
              <DialogDescription className="text-red-100 text-sm font-medium leading-relaxed opacity-90">
                This will irrevocably remove <span className="font-black text-white underline decoration-2 underline-offset-4">"{serviceToDelete?.service_name}"</span> from the . All linked telemetry and metadata will be permanently lost.
              </DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="p-10 pt-0 flex-col sm:flex-row gap-4">
            <Button
              variant="ghost"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="rounded-2xl h-14 flex-1 font-black text-[11px] uppercase tracking-[0.2em] bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20 active:scale-95 transition-all font-bold"
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Services;
