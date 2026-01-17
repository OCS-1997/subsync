import { saveAs } from "file-saver";
import { Eye, FileDown, FileUp, UserPlus, Search, ChevronDown } from "lucide-react";
import * as Papa from "papaparse";
import { Link, useParams } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import { fetchCustomers } from "@/features/Customers/customerSlice.js";
import { cn } from "@/lib/utils";

const headers = [
  { key: "customer_name", label: "Customer Name" },
  { key: "display_name", label: "Display Name" },
  { key: "company_name", label: "Company Name" },
  { key: "phone_with_country_code", label: "Phone Number" },
  { key: "primary_email", label: "Email" },
  { key: "gst_treatment", label: "GST Treatment" },
  { key: "actions", label: "Actions" },
];

function Customers() {
  const dispatch = useDispatch();
  const { username } = useParams();
  const { list: customers, loading, error, totalPages, totalRecords } = useSelector((state) => state.customers);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingImport, setLoading] = useState(false);

  // Debounce search
  const debounceTimeout = useRef();
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

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
    dispatch(fetchCustomers(params));
  }, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);

  const fetchCustomersAndExport = async () => {
    try {
      const response = await api.get(`/all-customer-details`);
      const data = response.data;

      if (!data.customers || !Array.isArray(data.customers)) throw new Error("Invalid data received!");

      const formattedData = data.customers.map((c) => ({
        "Identity": `${c.first_name} ${c.last_name}`,
        "Email": c.primary_email,
        "Enterprise": c.company_name,
        "GSTIN": c.gst_in,
        "Country": c.customer_address?.country,
      }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `subsync_customer_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success("Manifest exported successfully.");
    } catch (err) {
      toast.error("Export sequence failed.");
    }
  };

  const fileInputRef = useRef(null);
  const handleImportButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => handleImport(result.data),
        error: (err) => toast.error(`CSV Parsing error: ${err.message}`)
      });
    }
  };

  const handleImport = async (dataToImport) => {
    if (dataToImport.length === 0) return toast.error("Manifest is empty.");
    setLoading(true);
    try {
      const res = await api.post(`/import-customers`, { customers: dataToImport });
      if (res.status === 200 || res.status === 201) {
        toast.success("Registry synchronized.");
        dispatch(fetchCustomers());
      }
    } catch (err) {
      toast.error("Synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

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

  const renderActions = (id) => (
    <div className="flex items-center justify-center">
      <Link to={`${id}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
        >
          <Eye className="w-4 h-4 text-slate-400 hover:text-blue-600 transition-colors" />
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title="Customers"
        description="Unified registry of all clients, stakeholders, and enterprise entities."
        breadcrumbItems={[{ label: "Customers" }]}
        actions={
          <Link to="add">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
              <UserPlus className="w-5 h-5 mr-3" />
              Add Customer
            </Button>
          </Link>
        }
      />

      <div className="space-y-8 mt-12">
        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
            <SearchFilterForm
              search={search}
              setSearch={setSearch}
              placeholder="Search by name, enterprise, email..."
              className="w-full"
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
                <DropdownMenuItem onClick={fetchCustomersAndExport} className="rounded-xl p-3 font-bold text-xs gap-3">
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
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Scanning Registry...</p>
          </div>
        ) : customers.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GenericTable
              headers={headers}
              data={customers.map((c) => ({
                ...c,
                customer_name: (
                  <Link to={`${c.customer_id}`} className="flex flex-col min-w-[180px] group/name">
                    <span className="text-sm font-black text-slate-900 dark:text-white group-hover/name:text-blue-600 transition-colors uppercase tracking-tight">
                      {c.salutation} {c.first_name} {c.last_name}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">ID: {c.customer_id}</span>
                  </Link>
                ),
                display_name: (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.display_name}</span>
                ),
                company_name: (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.company_name || 'Individual Profile'}</span>
                ),
                phone_with_country_code: (
                  <div className="whitespace-nowrap flex items-center justify-center">
                    <span className="text-[15px] font-black text-slate-700 dark:text-slate-300 tabular-nums">
                      {c.country_code} {c.primary_phone_number}
                    </span>
                  </div>
                ),
                primary_email: (
                  <span className="text-xs font-bold text-blue-600/80 dark:text-blue-400/80 lowercase">{c.primary_email}</span>
                ),
                gst_treatment: (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.gst_treatment || "Non-Taxable"}</span>
                ),
                actions: renderActions(c.customer_id),
                _rowClassName: (c.customer_status || '').toLowerCase() === 'inactive' ? 'opacity-50 grayscale' : '',
              }))}
              primaryKey="customer_id"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
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
              Adjust your search parameters or register a new customer in the hub.
            </p>
            {!debouncedSearch && (
              <Link to="add">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[11px]">
                  Add Initial Customer
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
