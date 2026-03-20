import { Search, RefreshCw, User, Briefcase, Phone, Mail, Building2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-toastify";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import { fetchDirectory, syncDirectoryAction } from "../directorySlice";
import { Badge } from "@/components/ui/badge.jsx";

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
  }, [debouncedSearch]);

  useEffect(() => {
    dispatch(fetchDirectory({
      search: debouncedSearch,
      page: currentPage,
      limit: 15
    }));
  }, [dispatch, debouncedSearch, currentPage]);

  const handleManualSync = async () => {
    try {
      await dispatch(syncDirectoryAction()).unwrap();
      toast.success("Directory synchronization initiated successfully.");
      dispatch(fetchDirectory({ search: debouncedSearch, page: currentPage, limit: 15 }));
    } catch (err) {
      toast.error(err || "Failed to synchronize directory.");
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
          <Button 
            onClick={handleManualSync}
            disabled={syncing}
            className="bg-slate-900 hover:bg-black text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all gap-3"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? "Syncing..." : "Sync Directory"}
          </Button>
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
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-[150px]">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
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
    </div>
  );
}

export default PhoneDirectory;
