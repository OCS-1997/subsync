import { Pencil, Plus, FileUp, Globe, Users, Database, RotateCcw, Trash2 } from "lucide-react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "@/lib/axiosInstance.js";
import * as Papa from "papaparse";
import { saveAs } from "file-saver";
import "jspdf-autotable";
import { toast } from "react-toastify";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button.jsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";

import { fetchDomains, deleteDomain } from "../domainSlice";

function Domains() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const itemsPerPage = 10;
  const { username } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { list: domains, loading, error, totalPages, totalRecords } = useSelector((state) => state.domains);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);

  const headers = [
    { key: "domain_name", label: "Domain Name" },
    { key: "customer_name", label: "Customer Name" },
    { key: "registered_with", label: "Registered With" },
    { key: "name_servers", label: "Name Servers" },
    { key: "mail_service_provider", label: "Mail Services" },
    { key: "registration_date", label: "Registration Date" },
    { key: "actions", label: "" }
  ];

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const debounceTimeout = useRef();

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  useEffect(() => {
    const params = {
      search: debouncedSearch,
      page: currentPage
    };
    if (sortBy && sortOrder) {
      params.sort = sortBy;
      params.order = sortOrder;
    }
    dispatch(fetchDomains(params));
  }, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  const handleSort = (key) => {
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

  const handleDelete = async (domainId, domainName) => {
    setDomainToDelete({ id: domainId, name: domainName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!domainToDelete) return;

    try {
      await dispatch(deleteDomain(domainToDelete.id)).unwrap();
      toast.success(`Domain "${domainToDelete.name}" deleted successfully!`);
      // Optionally refetch or adjust page if needed
      if (list.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error(error || "Failed to delete domain");
    } finally {
      setDeleteDialogOpen(false);
      setDomainToDelete(null);
    }
  };

  const fetchDomainsAndExport = async () => {
    try {
      const response = await api.get(`/all-domains`);
      const data = response.data;

      if (!data.domains || !Array.isArray(data.domains)) throw new Error("Invalid domain telemetry!");
      if (data.domains.length === 0) throw new Error("No payload available for extraction.");

      const formattedData = data.domains.map((d) => ({
        "Domain ID": d.domain_id || "",
        "Domain Identity": d.domain_name || "",
        "Customer Name": d.customer_name || "",
        "Registrar": d.registered_with || "",
        "DNS Nodes": d.name_servers?.join(", ") || "",
        "Mail Services": d.mail_service_provider || "",
        "Lifecycle": formatDateForDisplay(d.registration_date) || "",
      }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `domain_manifest_${new Date().toISOString()}.csv`);
      toast.success("Telemetry extracted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to initiate extraction.");
    }
  };

  return (
    <div className="container py-8 max-w-none mx-auto px-4 md:px-8">
      <PageHeader
        title="Domains"
        description="Dynamic directory of registered enterprise domains and DNS telemetry."
        breadcrumbItems={[{ label: "Domains" }]}
        actions={
          <div className="flex gap-3">
            <Button onClick={fetchDomainsAndExport} variant="outline" className="rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <FileUp size={16} className="mr-3 text-slate-500" />
              Export
            </Button>
            <Link to="add">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all">
                <Plus size={16} className="mr-3" />
                Add Domain
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mt-12 flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 h-14 flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <SearchFilterForm search={search} setSearch={setSearch} handleSearch={() => { }} className="w-full" />
        </div>
        <Button
          variant="ghost"
          onClick={() => { setSearch(""); setSortBy(null); setSortOrder(null); setCurrentPage(1); }}
          className="h-14 w-14 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RotateCcw className="w-5 h-5 text-slate-500" />
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8 rounded-3xl border-rose-500/20 bg-rose-500/5">
          <AlertTitle className="text-rose-500 font-black uppercase tracking-widest text-[10px]">System Fault</AlertTitle>
          <AlertDescription className="text-rose-600/80 font-bold">{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center my-32">
          <Hamster />
          <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Scanning Registry...</p>
        </div>
      ) : domains.length > 0 ? (
        <>
          <GenericTable
            headers={headers}
            data={domains.map((domain) => {
              const isExpired = domain.domain_status === 'Expired';
              return {
                ...domain,
                domain_name: (
                  <Link 
                    to={`/${username}/dashboard/domains/${domain.domain_id}`}
                    className="font-black text-blue-600 dark:text-blue-400 uppercase tracking-tight hover:underline transition-all"
                  >
                    {domain.domain_name}
                  </Link>
                ),
                customer_name: (
                  <Link 
                    to={`/${username}/dashboard/customers/${domain.customer_id}`}
                    className="font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {domain.customer_name}
                  </Link>
                ),
                registered_with: (
                  <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 whitespace-normal text-center min-w-[80px] inline-block">
                    {domain.registered_with === "Others" ? (domain.other_provider || "Others") : (domain.registered_with || "-")}
                  </span>
                ),
                name_servers: (
                  <div className="flex flex-col gap-1">
                    {domain.name_servers?.map((ns, idx) => (
                      <span key={idx} className="text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {ns}
                      </span>
                    )) || "-"}
                  </div>
                ),
                mail_service_provider: (
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {domain.mail_service_provider === "Others" ? `${domain.mail_service_provider} (${domain.other_mail_service_details || ""})` : domain.mail_service_provider || "-"}
                  </span>
                ),
                registration_date: (
                  <span className="text-xs font-bold text-slate-500">
                    {formatDateForDisplay(domain.registration_date)}
                  </span>
                ),
                _rowClassName: isExpired ? 'bg-rose-500/5 hover:bg-rose-500/10' : '',
                actions: (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/${username}/dashboard/domains/edit/${domain.domain_id}`}
                      state={{ domain }}
                    >
                      <Button size="icon" variant="ghost" className="rounded-xl hover:bg-blue-500/10 hover:text-blue-500">
                        <Pencil size={14} className="opacity-60" />
                      </Button>
                    </Link>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="rounded-xl hover:bg-red-500/10 hover:text-red-500"
                      onClick={() => handleDelete(domain.domain_id, domain.domain_name)}
                    >
                      <Trash2 size={14} className="opacity-60" />
                    </Button>
                  </div>
                )
              };
            })}
            primaryKey="domain_id"
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
            />
          </div>
        </>
      ) : (
        <div className="py-32 px-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-950/20 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-20 w-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Globe className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Registry Offline</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">The domain manifest is currently empty. Synchronize your digital assets to begin telemetry tracking.</p>
            <Link to="add">
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20">
                Register First Domain
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900 dark:text-white">
              Delete Domain
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 dark:text-slate-400">
              Are you sure you want to delete the domain <span className="font-bold text-gray-900 dark:text-white">"{domainToDelete?.name}"</span>? 
              This action cannot be undone and will permanently remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold text-xs uppercase tracking-widest">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20"
            >
              Delete Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Domains;
