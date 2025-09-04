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

  const headers = [
    { key: "domain_name", label: "Domain Name" },
    { key: "customer_name", label: "Customer Name" },
    { key: "registered_with", label: "Registered With" }, // OCS (RC) will show automatically if present in data
    { key: "name_servers", label: "Name Servers" },
    { key: "mail_service_provider", label: "Mail Services" },
    { key: "description", label: "Description" },
    { key: "registration_date", label: "Registration Date" },
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
    return nameServers.map((ns, i) => <div key={i}>{ns}<br/></div>);
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
    // Fetch domains whenever search, sort, order, or page changes
    dispatch(fetchDomains({ search: debouncedSearch, sortBy, order: sortOrder, page: currentPage }));
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
    setCurrentPage(1);
  };

  const fetchDomainsAndExport = async () => {
    try {
      console.log("Fetching all domains for export...");
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
    
    <div className="flex flex-col p-6 rounded-lg shadow-lg">

      <h1 className="w-full text-3xl font-bold mb-2">Domains</h1>
      <hr className="mb-4 border-blue-500 border-3 size-auto" />
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <SearchFilterForm
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
        />
        <Link to="add">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
            <Plus /> Add
          </Button>
        </Link>
        <Button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white" onClick={fetchDomainsAndExport}>
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
        <div className="flex justify-center items-center my-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
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

              return {
                ...domain,
                name_servers: formatNameServers(domain.name_servers),
                registration_date: formatDateForInput(domain.registration_date),
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
                              registration_date
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
        <Alert>
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>No domains available</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default Domains;
                       