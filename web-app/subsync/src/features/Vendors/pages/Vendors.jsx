import { Eye, FileUp, UserPlus } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import Hamster from "@/components/animations/Hamster.jsx";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
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
    <>
      <div className="flex flex-col p-6 rounded-lg shadow-lg">
        <h1 className="w-full text-3xl font-bold mb-2">Vendors</h1>
        <hr className="mb-4 border-blue-500 border-3 size-auto" />
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 w-full">
          <div className="flex flex-col sm:flex-row w-full items-center gap-3">
            <SearchFilterForm
              search={search}
              setSearch={setSearch}
              handleSearch={handleSearch}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto ">
            <Button 
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white" 
              onClick={handleAddVendor}
            >
              <UserPlus /> Add
            </Button>
            <Button className="w-full sm:w-auto  bg-blue-500 hover:bg-blue-600 text-white" onClick={fetchVendorsAndExport}>
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
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center my-8">
            <Hamster />
          </div>
        ) : vendors.length > 0 ? (
          <>
            <GenericTable
              headers={headers}
              data={vendors.map((v) => ({
                ...v,
                display_name:  `${v.salutation || ""} ${v.first_name || ""} ${v.last_name || ""}`.trim(),
                primary_phone_number: v.country_code && v.primary_phone_number
                    ? `${v.country_code} ${v.primary_phone_number}`
                    : v.primary_phone_number || "Not provided",
                gst_treatment: v.gst_treatment || "Not specified",
                actions: renderActions(v),
              }))}
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
          <Alert>
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>
              {search ? `No vendors found for "${search}"` : "No vendors available"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}

export default Vendors;
       