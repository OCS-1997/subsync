import { Eye, FileUp, UserPlus } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import Hamster from "@/components/animations/Hamster.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { fetchVendors } from "@/features/Services/vendorSlice.js";

const headers = [
  { key: "display_name", label: "Vendor Name" },
  { key: "company_name", label: "Company Name" },
  { key: "primary_phone_number", label: "Phone Number" },
  { key: "primary_email", label: "Email" },
  { key: "gst_treatment", label: "GST Treatment" },
  { key: "actions", label: "Actions" },
];

function Vendors() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { list: vendors, loading, error, totalRecords, totalPages } = useSelector((state) => state.vendors);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

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
    // Dispatch fetchVendors with params for search, sort, pagination
    const params = {
      search: debouncedSearch,
      page: currentPage,
      limit: 10
    };

    // Only add sort parameters if they are not null
    if (sortBy && sortOrder) {
      params.sortBy = sortBy;
      params.order = sortOrder;
    }

    dispatch(fetchVendors(params));
  }, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);

  const handleSearch = (e) => {
    if (e.key === "Enter") setCurrentPage(1);
  };

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

  const handleEditVendor = (vendor) => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/vendors/${vendor.vendor_id}/edit`);
  };

  const fetchVendorsAndExport = async () => {
    try {
      const response = await api.get(`/all-vendors`);
      const vendors = Array.isArray(response.data) ? response.data : response.data.vendors;
      if (!vendors || !Array.isArray(vendors)) throw new Error("Invalid vendor data received!");
      if (vendors.length === 0) throw new Error("No vendor data available to export!");

      // Format for CSV
      const formattedData = vendors.map((v) => ({
        "Vendor ID": v.vendor_id || "",
        "Vendor Name": v.display_name || "",
        "Company Name": v.company_name || "",
        "Phone Number": v.country_code && v.primary_phone_number ? `${v.country_code} ${v.primary_phone_number}` : v.primary_phone_number || "",
        "Email": v.primary_email || "",
        "GST Treatment": v.gst_treatment || "",
        "Status": v.vendor_status || "",
      }));

      // Use PapaParse for CSV
      const csv = await import("papaparse").then(Papa => Papa.unparse(formattedData));
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      await import("file-saver").then(({ saveAs }) =>
        saveAs(blob, `vendors_export_${new Date().toISOString()}.csv`)
      );
      toast.success("CSV file downloaded successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to generate CSV file.");
    }
  };

  const renderActions = (vendor) => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const currentPath = location.pathname;
          const userSegment = currentPath.split("/")[1];
          navigate(`/${userSegment}/dashboard/vendors/${vendor.vendor_id}`);
        }}
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </Button>
    </div>
  );

  // Backend handles pagination, search, and sorting
  const itemsPerPage = 10;
  const backendTotalPages = totalPages || Math.max(1, Math.ceil(totalRecords / itemsPerPage));

  const handleAddVendor = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/vendors/add`);
  };


  return (
    <div className="max-w-[1600px] mx-auto py-4 sm:py-8 px-4">
      <PageHeader
        title="Vendors"
        description="Unified registry of all service providers, suppliers, and external partners."
        breadcrumbItems={[{ label: "Vendors" }]}
        actions={
          <Button
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-6 sm:px-8 h-11 sm:h-14 font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
            onClick={handleAddVendor}
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
            Add Vendor
          </Button>
        }
      />

      <div className="space-y-8 mt-12">
        {/* Control Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 mt-6 sm:mt-12">
          <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl min-h-[3.5rem] flex flex-wrap items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all px-3 sm:px-5 py-2 sm:py-0">
            <SearchFilterForm
              search={search}
              setSearch={setSearch}
              placeholder="Search providers..."
              className="flex-1"
            />
            <div className="hidden sm:block h-10 w-[1px] bg-gray-100 dark:bg-slate-800 mx-2" />
            <Button
              variant="ghost"
              className="flex-1 sm:flex-none rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 gap-2 mt-2 sm:mt-0"
              onClick={fetchVendorsAndExport}
            >
              <FileUp className="w-4 h-4" />
              Export
            </Button>
          </div>
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
        ) : vendors.length > 0 ? (
          <>
            <GenericTable
              headers={headers}
              data={vendors.map((v) => {
                const isInactive = (v.vendor_status || '').toLowerCase() === 'inactive';
                // Ensure phone number is always a string and includes country code
                const countryCode = typeof v.country_code === 'string' ? v.country_code : (v.country_code ? String(v.country_code) : '');
                const phoneNumber = typeof v.primary_phone_number === 'string' ? v.primary_phone_number : (v.primary_phone_number ? String(v.primary_phone_number) : '');
                // Format: country code + phone number, or just phone number, or "Not provided"
                let phoneDisplay = "Not provided";
                if (countryCode && phoneNumber) {
                  phoneDisplay = `${countryCode} ${phoneNumber}`;
                } else if (phoneNumber) {
                  phoneDisplay = phoneNumber;
                } else if (countryCode) {
                  phoneDisplay = countryCode;
                }
                return {
                  ...v,
                  display_name: (
                    <Link 
                      to={`/${location.pathname.split('/')[1]}/dashboard/vendors/${v.vendor_id}`}
                      className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {`${v.salutation || ""} ${v.first_name || ""} ${v.last_name || ""}`.trim()}
                    </Link>
                  ),
                  primary_phone_number: phoneDisplay,
                  gst_treatment: v.gst_treatment || "Not specified",
                  actions: renderActions(v),
                  _rowClassName: isInactive ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30' : '',
                };
              })}
              primaryKey="vendor_id"
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
                <div className="text-lg font-semibold mb-2">No vendors yet</div>
                <div className="text-sm text-gray-600 mb-4">Create your first vendor to get started.</div>
                <Button onClick={handleAddVendor}><UserPlus className="w-4 h-4" /> Add Vendor</Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Vendors;
