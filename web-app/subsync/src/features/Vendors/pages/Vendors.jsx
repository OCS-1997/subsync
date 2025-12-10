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
    <div className="p-4">
      <Breadcrumb items={[{ label: "Vendors" }]} />
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white w-40"
          onClick={handleAddVendor}
        >
          <UserPlus /> Add
        </Button>
      </div>
      <hr className="mb-6 border-blue-500 border-1" />
      <div className="flex items-center gap-3 mb-3">
        <SearchFilterForm
          search={search}
          setSearch={setSearch}
          handleSearch={handleSearch}
        />
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={fetchVendorsAndExport}>
          <FileUp /> Export
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={fetchVendorsAndExport}>Export as CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                display_name: `${v.salutation || ""} ${v.first_name || ""} ${v.last_name || ""}`.trim(),
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
  );
}

export default Vendors;
