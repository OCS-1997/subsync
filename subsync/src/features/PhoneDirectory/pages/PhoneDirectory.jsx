import { Search, RefreshCw, User, Briefcase, Phone, Mail, Building2, FileDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import * as Papa from "papaparse";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import { fetchDirectory, syncDirectoryAction } from "../directorySlice";
import { Badge } from "@/components/ui/badge.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import { syncContactsToNative } from "@/hooks/useCallDetectionSync";
import api from "@/lib/axiosInstance.js";

const headers = [
  { key: "name", label: "Contact Name" },
  { key: "phone_number", label: "Phone Number" },
  { key: "entity_type", label: "Type" },
  { key: "company_name", label: "Company / Enterprise" },
  { key: "email", label: "Email Address" },
];

function PhoneDirectory() {
  const dispatch = useDispatch();
  const { list: entries, loading, syncing, error, totalPages, totalRecords } = useSelector((state) => state.directory);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Debounce search
  const debounceTimeout = useRef();
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sortBy, sortOrder]);

  const handleSort = (key) => {
    if (sortBy === key && sortOrder === "asc") {
      setSortOrder("desc");
    } else if (sortBy === key && sortOrder === "desc") {
      setSortBy(null);
      setSortOrder("");
    } else {
      setSortBy(key);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    const params = {
      search: debouncedSearch,
      page: currentPage,
      limit: 15
    };
    if (sortBy && sortOrder) {
      params.sort = sortBy;
      params.order = sortOrder;
    }
    dispatch(fetchDirectory(params));
  }, [dispatch, debouncedSearch, currentPage, sortBy, sortOrder]);

  const handleManualSync = async () => {
    try {
      await dispatch(syncDirectoryAction()).unwrap();
      toast.success("Directory synchronization initiated successfully.");
      // Trigger native sync immediately to update overlay
      syncContactsToNative();
      dispatch(fetchDirectory({ search: debouncedSearch, page: currentPage, limit: 15 }));
    } catch (err) {
      toast.error(err || "Failed to synchronize directory.");
    }
  };

  const handleExport = async (format) => {
    setExportLoading(true);
    try {
      // Fetch all entries for export (limit high)
      const res = await api.get('/directory', { params: { limit: 5000, search: debouncedSearch } });
      const records = res.data.entries || [];

      if (records.length === 0) {
        toast.info("No records found to export.");
        return;
      }

      const exportData = records.map(r => ({
        "Name": r.name || "",
        "Phone": r.phone_number || "",
        "Entity Type": r.entity_type || "",
        "Company": r.company_name || "",
        "Email": r.email || "",
        "Designation": r.designation || ""
      }));

      if (format === 'csv') {
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `phone_directory_${new Date().toISOString()}.csv`);
        toast.success("CSV export complete.");
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        doc.text("Phone Directory", 14, 15);
        autoTable(doc, {
          startY: 20,
          head: [["Name", "Phone", "Type", "Company", "Email"]],
          body: records.map(r => [r.name, r.phone_number, r.entity_type, r.company_name, r.email]),
          theme: 'grid',
          headStyles: { fillColor: [30, 41, 59] } // Using RGB for #1e293b
        });
        doc.save(`phone_directory_${new Date().toISOString()}.pdf`);
        toast.success("PDF export complete.");
      }
    } catch (err) {
      toast.error("Export failed. Please try again.");
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  const getEntityBadge = (type) => {
    const styles = {
      customer: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      vendor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      contact: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      user: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      other_contact: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    };
    return (
      <Badge className={`${styles[type] || "bg-gray-100"} border-none uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full`}>
        {type.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title="Phone Directory"
        description="Centralized lookup for all customers, vendors, and contact persons."
        breadcrumbItems={[{ label: "Directory" }]}
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={exportLoading || loading}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-900 dark:text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all gap-3"
                >
                  <FileDown className={`w-4 h-4 ${exportLoading ? 'animate-bounce' : ''}`} />
                  {exportLoading ? "Preparing..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-2xl min-w-[150px] p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl">
                <DropdownMenuItem 
                    onClick={() => handleExport('csv')}
                    className="rounded-xl h-12 font-bold text-xs uppercase tracking-widest cursor-pointer px-4"
                >
                    CSV / Excel
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => handleExport('pdf')}
                    className="rounded-xl h-12 font-bold text-xs uppercase tracking-widest cursor-pointer px-4"
                >
                    PDF Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
                onClick={handleManualSync}
                disabled={syncing}
                className="bg-slate-900 hover:bg-black text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all gap-3"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync Directory"}
            </Button>
          </div>
        }
      />

      <div className="space-y-8 mt-12">
        {/* Search Bar */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-5">
            <SearchFilterForm
              search={search}
              setSearch={setSearch}
              placeholder="Search by name, phone, company, email..."
              className="w-full no-border"
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-[1.5rem] bg-red-50 text-red-600 border-red-100">
            <AlertTitle className="font-black uppercase tracking-widest text-xs mb-2">Sync Error</AlertTitle>
            <AlertDescription className="text-sm font-bold opacity-80">
              {typeof error === 'object' ? (error.message || JSON.stringify(error)) : error}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="py-40 flex flex-col justify-center items-center">
            <Hamster />
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Retrieving Directory...</p>
          </div>
        ) : entries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GenericTable
              headers={headers}
              data={entries.map((e) => ({
                ...e,
                name: (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div 
                      className="flex flex-col min-w-[150px] cursor-pointer group"
                      onClick={() => setSelectedContact(e)}
                    >
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {e.name}
                      </span>
                      {e.designation && (
                        <span className="text-[10px] uppercase font-bold text-slate-400">{e.designation}</span>
                      )}
                    </div>
                  </div>
                ),
                phone_number: (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-blue-500" />
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">
                      {e.phone_number}
                    </span>
                  </div>
                ),
                entity_type: getEntityBadge(e.entity_type),
                company_name: (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{e.company_name || '---'}</span>
                  </div>
                ),
                email: e.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-bold text-blue-600/80 dark:text-blue-400/80 lowercase">{e.email}</span>
                  </div>
                ) : <span className="text-slate-300">---</span>,
              }))}
              primaryKey="id"
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
            <p className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Results Found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto mb-8">
              Your directory is currently empty. Try running a manual synchronization.
            </p>
            <Button 
                onClick={handleManualSync}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 h-14 font-black uppercase tracking-widest text-[11px] gap-3"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Run Master Sync
            </Button>
          </div>
        )}
      </div>

      {/* Contact Details Modal */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl p-0 overflow-hidden shadow-2xl">
          {selectedContact && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-8 flex flex-col items-center justify-center border-b border-slate-100 dark:border-slate-800">
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 shadow-xl shadow-black/5 ring-1 ring-slate-100 dark:ring-slate-800 mb-5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/10" />
                  <User className="w-10 h-10 text-blue-500" />
                </div>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-1">
                  {selectedContact.name}
                </DialogTitle>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {getEntityBadge(selectedContact.entity_type)}
                  {selectedContact.designation && (
                    <Badge className="bg-slate-200/50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full">
                      {selectedContact.designation}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-8 pb-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {selectedContact.phone_number || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedContact.email || "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company Name</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedContact.company_name || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PhoneDirectory;
