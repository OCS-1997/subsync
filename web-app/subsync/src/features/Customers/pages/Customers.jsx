import { saveAs } from "file-saver";
import { Eye, FileDown, FileUp, UserPlus } from "lucide-react";
import * as Papa from "papaparse";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu.jsx";
import Hamster from "@/components/animations/Hamster.jsx";
import api from "@/lib/axiosInstance.js";
import GenericTable from "@/components/layouts/GenericTable.jsx";
import Pagination from "@/components/layouts/Pagination.jsx";
import SearchFilterForm from "@/components/layouts/SearchFilterForm.jsx";
import { fetchCustomers } from "@/features/Customers/customerSlice.js";

const headers = [
  { key: "first_name", label: "Customer Name" },
  { key: "display_name", label: "Display Name" },
  { key: "company_name", label: "Company Name" },
  { key: "phone_with_country_code", label: "Phone Number" },
  { key: "primary_email", label: "Email" },
  { key: "gst_treatment", label: "GST Treatment" },
  { key: "actions", label: "Actions" },
];

function Customers() {
  const dispatch = useDispatch();
  const { list: customers, loading, error, totalPages, totalRecords } = useSelector((state) => state.customers);

  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [file, setFile] = useState(null);
  const [importData, setImportData] = useState([]);
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
      page: currentPage
    };
    if (sortBy && sortOrder) {
      params.sort = sortBy;
      params.order = sortOrder;
    }
    dispatch(fetchCustomers(params));
  }, [dispatch, debouncedSearch, sortBy, sortOrder, currentPage]);

  const handleSearch = (e) => {
    if (e.key === "Enter") setCurrentPage(1);
  };

 const fetchCustomersAndExport = async () => {
  try {
    const response = await api.get(`/all-customer-details`);
    const data = response.data;

    if (!data.customers || !Array.isArray(data.customers)) throw new Error("Invalid customer data received!");
    if (data.customers.length === 0) throw new Error("No customer data available to export!");

    const formattedData = data.customers.map((c) => ({
      "Customer ID": c.customer_id || "",
      "Salutation": c.salutation || "",
      "First Name": c.first_name || "",
      "Last Name": c.last_name || "",
      "Display Name": c.display_name || "",
      "Company Name": c.company_name || "",
      "Phone Number": `${c.country_code || ""}${c.primary_phone_number || ""}`,
      "Secondary Phone Number": c.secondary_phone_number || "",
      "Email": c.primary_email || "",
      "Secondary Email": c.secondary_email || "",
      "GSTIN": c.gst_in || "",
      "GST Treatment": c.gst_treatment || "",
      "Tax Preference": c.tax_preference || "",
      "Payment Terms": c.payment_terms?.term_name || "",
      "Exemption Reason": c.exemption_reason || "",
      "Currency Code": c.currency_code || "",
      "Address Line": c.customer_address?.addressLine || "",
      "City": c.customer_address?.city || "",
      "State": c.customer_address?.state || "",
      "Country": c.customer_address?.country || "",
      "Zip Code": c.customer_address?.zipCode || "",
      "Notes": c.notes || "",
      "Customer Status": c.customer_status || "Active",
    }));

    const csv = Papa.unparse(formattedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `customers_export_${new Date().toISOString()}.csv`);
    toast.success("CSV file downloaded successfully!");
  } catch (err) {
    toast.error(err.message || "Failed to generate CSV file.");
  }
};

  const fileInputRef = useRef(null);

  const handleImportButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      complete: (result) => {
        const formatted = result.data.map((row) => ({
          customer_id: row["Customer ID"] || "",
          salutation: row["Salutation"] || "",
          first_name: row["First Name"] || "",
          last_name: row["Last Name"] || "",
          primary_email: row["Email"] || "",
          secondary_email: row["Secondary Email"] || "",
          country_code: row["Country Code"] || "",
          primary_phone_number: row["Phone Number"] || "",
          secondary_phone_number: row["Secondary Phone Number"] || "",
          company_name: row["Company Name"] || "",
          display_name: row["Display Name"] || "",
          gst_in: row["GSTIN"] || "",
          payment_terms: row["Payment Terms"] || "",
          gst_treatment: row["GST Treatment"] || "",
          tax_preference: row["Tax Preference"] || "",
          exemption_reason: row["Exemption Reason"] || "",
          currency_code: row["Currency Code"] || "INR",
          customer_address: {
            addressLine: row["Address Line"] || "",
            city: row["City"] || "",
            state: row["State"] || "",
            country: row["Country"] || "IN",
            zipCode: row["Zip Code"] || "",
          },
          other_contacts: [],
          notes: row["Notes"] || "",
          customer_status: row["Customer Status"] || "Active",
        }));
        setImportData(formatted);
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  const handleImport = async () => {
    if (importData.length === 0) return toast.error("No data to import!");
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/import-customers`, { customers: importData });
      if (res.status !== 200) throw new Error("Import failed!");
      toast.success("Customers Imported Successfully!");
      setImportData([]);
    } catch (err) {
      toast.error(err.message || "Error importing customers.");
    } finally {
      setLoading(false);
    }
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
 
  };

  const renderActions = (id) => (
    <div className="flex items-center">
      <Link to={`${id}`}>
        <Button variant="ghost" size="icon">
          <Eye className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );

  // Use customers from Redux, format for table
  const paginatedData = customers.map((c) => {
    const isInactive = (c.customer_status || '').toLowerCase() === 'inactive';
    // Ensure phone number is always a string, handle null/undefined/object cases
    const countryCode = typeof c.country_code === 'string' ? c.country_code : (c.country_code ? String(c.country_code) : '');
    const phoneNumber = typeof c.primary_phone_number === 'string' ? c.primary_phone_number : (c.primary_phone_number ? String(c.primary_phone_number) : '');
    const phoneDisplay = countryCode && phoneNumber ? `${countryCode} ${phoneNumber}` : (phoneNumber || countryCode || 'N/A');
    
    return {
      ...c,
      first_name: (c.salutation ? c.salutation + " " : "") + (c.first_name || "") + " " + (c.last_name || ""),
      phone_with_country_code: phoneDisplay,
      gst_treatment: c.gst_treatment || "",
      actions: renderActions(c.customer_id),
      _rowClassName: isInactive ? 'bg-red-50 hover:bg-red-100' : '',
    };
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link to={`add`}>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white w-40"> 
            <UserPlus /> Add
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
        <Button
          disabled
          className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleImportButtonClick}>
          <FileDown /> Import
        </Button>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={fetchCustomersAndExport}>
          <FileUp /> Export
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={fetchCustomersAndExport}>Export as CSV</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
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
      ) : paginatedData.length > 0 ? (
        <>
          <GenericTable
            headers={headers}
            data={paginatedData}
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
              <div className="text-lg font-semibold mb-2">No customers yet</div>
              <div className="text-sm text-gray-600 mb-4">Create your first customer to get started.</div>
              <Link to="add">
                <Button><UserPlus className="w-4 h-4" /> Add Customer</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Customers;
           