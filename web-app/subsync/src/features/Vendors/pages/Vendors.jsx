import { Eye, FileUp, UserPlus } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import { fetchVendors } from "@/features/Services/vendorSlice.js";

const headers = [
  { key: "display_name", label: "Vendor Display Name" },
  { key: "company_name", label: "Company Name" },
  { key: "primary_phone_number", label: "Phone Number" },
  { key: "primary_email", label: "Email" },
  { key: "vendor_status", label: "Status" },
  { key: "actions", label: "Actions" },
];

function Vendors() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { list: vendors, loading, error } = useSelector((state) => state.vendors);

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
    dispatch(fetchVendors({
      search: debouncedSearch,
      sortBy,
      order: sortOrder,
      page: currentPage
    }));
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
        "Display Name": v.display_name || "",
        "Company Name": v.company_name || "",
        "Phone Number": v.primary_phone_number || "",
        "Email": v.primary_email || "",
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

  // Filtering and sorting are now handled by backend, but you can still do client-side filtering if needed
  // For now, just use vendors from Redux
  const itemsPerPage = 10;
  const totalRecords = vendors.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const paginatedData = vendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
          <div className="flex justify-center items-center my-8">
            <span className="animate-spin w-6 h-6 border-4 border-t-transparent border-blue-500 rounded-full"></span>
          </div>
        ) : paginatedData.length > 0 ? (
          <>
            <GenericTable
              headers={headers}
              data={paginatedData.map((v) => ({
                ...v,
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
              totalPages={totalPages}
              totalRecords={totalRecords}
            />
          </>
        ) : (
          <Alert>
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>No vendors available</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}

export default Vendors;
       