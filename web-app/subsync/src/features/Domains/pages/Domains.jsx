import { Pencil, Plus, FileUp } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "@/lib/axiosInstance.js";
import * as Papa from "papaparse";
import { saveAs } from "file-saver";
import "jspdf-autotable";
import { toast } from "react-toastify";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import GenericTable from "@/components/layouts/GenericTable";
import Pagination from "@/components/layouts/Pagination";
import SearchFilterForm from "@/components/layouts/SearchFilterForm";

import { fetchDomains } from "../domainSlice";

function Domains() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const itemsPerPage = 10;
  const { username } = useParams();
  const dispatch = useDispatch();
  // Update selector to get totalPages and totalRecords from backend
  const { list: domains, loading, error, totalPages, totalRecords } = useSelector((state) => state.domains);

  //  const loading = true;
  const headers = [
    { key: "domain_name", label: "Domain Name" },
    { key: "customer_name", label: "Customer Name" },
    { key: "registered_with", label: "Registered With" }, // OCS (RC) will show automatically if present in data
    { key: "name_servers", label: "Name Servers" },
    { key: "mail_service_provider", label: "Mail Services" },
    { key: "description", label: "Description" },
    { key: "registration_date", label: "Registration Date" },
    { key: "domain_status", label: "Status" },
    { key: "actions", label: "Actions" }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB");
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";

    // Get the date in local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${day}-${month}-${year}`;
  };

  const formatNameServers = (nameServers) => {
    if (!nameServers || nameServers.length === 0) return "-";
    return nameServers.map((ns, i) => <div key={i}>{ns}<br /></div>);
  };

  const formatMailServices = (provider, details) => {
    if (!provider) return "-";
    return provider === "Others" ? `${provider} (${details || ""})` : provider;
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") setCurrentPage(1);
  };

  const debounceTimeout = useRef();

  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms debounce
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
    // Fetch domains whenever search, sort, order, or page changes
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

  const fetchDomainsAndExport = async () => {
    try {
      //console.log("Fetching all domains for export...");
      const response = await api.get(`/all-domains`);
      const data = response.data;

      if (!data.domains || !Array.isArray(data.domains)) throw new Error("Invalid domain data received!");
      if (data.domains.length === 0) throw new Error("No domain data available to export!");

      const formattedData = data.domains.map((d) => ({
        "Domain ID": d.domain_id || "",
        "Domain Name": d.domain_name || "",
        "Customer ID": d.customer_id || "",
        "Customer Name": d.customer_name || "",
        "Registered With": d.registered_with || "",
        "Name Servers": d.name_servers?.join(", ") || "",
        "Mail Services": d.mail_service_provider || "",
        "Description": d.description || "",
        "Registration Date": formatDate(d.registration_date) || "",
      }));

      const csv = Papa.unparse(formattedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `domains_export_${new Date().toISOString()}.csv`);
      toast.success("CSV file downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to generate CSV file.");
    }
  };

  return (
    <div className="p-4">
      <Breadcrumb items={[{ label: "Domains" }]} />
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Domains</h1>
        <Link to="add">
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
          handleSearch={handleSearch}
        />
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={fetchDomainsAndExport}>
          <FileUp /> Export
        </Button>
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
      ) : domains.length > 0 ? (
        <>
          <GenericTable
            headers={headers}
            data={domains.map((domain) => {
              const {
                domain_id,
                domain_name,
                customer_id,
                customer_name,
                registered_with,
                other_provider,
                name_servers,
                mail_service_provider,
                other_mail_service_details,
                description,
                registration_date
              } = domain;

              const isExpired = domain.domain_status === 'Expired';
              return {
                ...domain,
                name_servers: formatNameServers(domain.name_servers),
                registration_date: formatDateForInput(domain.registration_date),
                _rowClassName: isExpired ? 'bg-red-50 hover:bg-red-100' : '',
                actions: (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={`/${username}/dashboard/domains/edit/${domain_id}`}
                          state={{
                            domain: {
                              domain_id,
                              domain_name,
                              customer_id,
                              customer_name,
                              registered_with,
                              other_provider,
                              name_servers,
                              mail_service_provider,
                              other_mail_service_details,
                              description,
                              registration_date,
                              domain_status: domain.domain_status
                            }
                          }}
                        >
                          <Button size="icon" variant="ghost" className="ml-1">
                            <Pencil size={12} />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              };
            })}
            primaryKey="domain_id"
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
              <div className="text-lg font-semibold mb-2">No domains yet</div>
              <div className="text-sm text-gray-600 mb-4">Create your first domain to get started.</div>
              <Link to="add">
                <Button><Plus className="w-4 h-4" /> Add Domain</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Domains;
