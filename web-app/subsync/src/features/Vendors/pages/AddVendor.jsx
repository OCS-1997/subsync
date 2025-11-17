import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import countryList from "react-select-country-list";
import { Bounce, toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";

import VendorAddressSection from "@/features/Vendors/components/VendorAddressSection.jsx";
import VendorCompanyDetails from "@/features/Vendors/components/VendorCompanyDetails.jsx";
import VendorContactPersonsSection from "@/features/Vendors/components/VendorContactPersonsSection.jsx";
import VendorOtherDetails from "@/features/Vendors/components/VendorOtherDetails.jsx";
import VendorPaymentTermsSections from '@/features/Vendors/components/VendorPaymentTermsSections';
import VendorPersonalDetails from "@/features/Vendors/components/VendorPersonalDetails.jsx";
import VendorRemarksSection from "@/features/Vendors/components/VendorRemarksSection.jsx";

import { createVendor, updateVendor, fetchVendorById, clearVendorState } from "@/features/Services/vendorSlice.js";
import { indianStates } from "@/features/Customers/data/statesOfIndia.js";
import api from '@/lib/axiosInstance.js';

const AddVendor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentVendor, loading, error } = useSelector((state) => state.vendors);
  const editableVendorId = id || location.state?.editableVendorId || null;

  const countries = countryList().getData();
  const [states, setStates] = useState(indianStates);
  const [contactPersons, setContactPersons] = useState([]);
  const [activeTab, setActiveTab] = useState("address"); // Default to Address tab
  const [isEditing, setIsEditing] = useState(!!editableVendorId);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [taxRates, setTaxRates] = useState([]);

  const [vendorData, setVendorData] = useState({
    salutation: "Mr.",
    firstName: "",
    lastName: "",
    companyName: "",
    displayName: "",
    email: "",
    secondary_email: "",
    country_code: "+91",
    phoneNumber: "",
    secondaryPhoneNumber: "",
    gstin: "",
    gst_treatment: "Registered Business - Regular",
    tax_preference: "Taxable",
    exemption_reason: "",
    currencyCode: "INR",
    address: {
      country: "IN",
      addressLine: "",
      state: null,
      city: "",
      zipCode: "",
    },
    payment_terms: null,
    notes: "",
    vendorStatus: "Active",
  });

  const resetVendorData = () => {
    setVendorData({
      salutation: "Mr.",
      firstName: "",
      lastName: "",
      companyName: "",
      displayName: "",
      email: "",
      secondary_email: "",
      country_code: "+91",
      phoneNumber: "",
      secondaryPhoneNumber: "",
      gstin: "",
      gst_treatment: "Registered Business - Regular",
      tax_preference: "Taxable",
      exemption_reason: "",
      currencyCode: "INR",
      address: {
        country: "IN",
        addressLine: "",
        state: null,
        city: "",
        zipCode: "",
      },
      payment_terms: null,
      notes: "",
      vendorStatus: "Active",
    });
    setContactPersons([]);
    setStates(indianStates);
    dispatch(clearVendorState());
  };

  const handleCancel = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/vendors`);
  };

  const handleStatusChange = (status) => {
    setVendorData((prevData) => ({
      ...prevData,
      vendorStatus: status,
    }));
  };

  const handleBack = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/vendors`);
  };

  useEffect(() => {
    if (editableVendorId) {
      dispatch(fetchVendorById(editableVendorId));
    }
    return () => {
      dispatch(clearVendorState()); 
    };
  }, [editableVendorId, dispatch]);

  useEffect(() => {
    // Fetch payment terms for matching
    const fetchTerms = async () => {
      try {
        const response = await api.get('/payment-terms');
        setPaymentTermsList(response.data || []);
      } catch (e) {
        setPaymentTermsList([]);
      }
    };
    fetchTerms();
  }, []);

  // Update payment terms with matched term from the list when both are available
  useEffect(() => {
    if (currentVendor && isEditing && paymentTermsList.length > 0 && currentVendor.payment_terms) {
      const matchedTerm = paymentTermsList.find(
        t => t.term_id === currentVendor.payment_terms?.term_id
      );
      
      if (matchedTerm) {
        setVendorData(prev => ({
          ...prev,
          payment_terms: matchedTerm,
        }));
      }
    }
  }, [currentVendor, isEditing, paymentTermsList]);

  useEffect(() => {
    if (currentVendor && isEditing) {
      // Parse JSON fields if needed
      let address = currentVendor.vendor_address || currentVendor.address || {};
      if (typeof address === "string") {
        try { address = JSON.parse(address); } catch { address = {}; }
      }
      let contactPersons = currentVendor.other_contacts || currentVendor.contact_persons || [];
      if (typeof contactPersons === "string") {
        try { contactPersons = JSON.parse(contactPersons); } catch { contactPersons = []; }
      }
      let paymentTerms = currentVendor.payment_terms;
      if (typeof paymentTerms === "string") {
        try { paymentTerms = JSON.parse(paymentTerms); } catch { paymentTerms = null; }
      }

      // Set states based on country
      const countryValue = address.country || "IN";
      if (countryValue === "IN" || countryValue === "India") {
        setStates(indianStates);
      }

      // Debug logging
      // console.log("Editing vendor - Address data:", address);
      // console.log("Country value:", countryValue);
      // console.log("State value:", address.state);

      setVendorData({
        salutation: currentVendor.salutation || "Mr.",
        firstName: currentVendor.first_name || currentVendor.firstName || "",
        lastName: currentVendor.last_name || currentVendor.lastName || "",
        companyName: currentVendor.company_name || currentVendor.companyName || "",
        displayName: currentVendor.display_name || currentVendor.displayName || "",
        email: currentVendor.primary_email || currentVendor.email || "",
        secondary_email: currentVendor.secondary_email || "",
        country_code: currentVendor.country_code || "+91",
        phoneNumber: currentVendor.primary_phone_number || currentVendor.phoneNumber || "",
        secondaryPhoneNumber: currentVendor.secondary_phone_number || currentVendor.secondaryPhoneNumber || "",
        gstin: currentVendor.gst_in || currentVendor.gstin || "",
        gst_treatment: currentVendor.gst_treatment || "Registered Business - Regular",
        tax_preference: currentVendor.tax_preference || "Taxable",
        exemption_reason: currentVendor.exemption_reason || "",
        currencyCode: currentVendor.currency_code?.value || currentVendor.currency_code || "INR",
        address: {
          country: address.country
            ? (typeof address.country === 'object' ? address.country : { label: address.country === "IN" ? "India" : address.country, value: address.country })
            : { label: "India", value: "IN" },
          addressLine: address.addressLine || address.address_line || "",
          state: address.state
            ? (typeof address.state === 'object' ? address.state : { label: address.state, value: address.state })
            : null,
          city: address.city || "",
          zipCode: address.zipCode || address.zip_code || "",
        },
        payment_terms: paymentTerms || null,
        notes: currentVendor.notes || "",
        vendorStatus: currentVendor.vendor_status || "Active",
      });
      setContactPersons(Array.isArray(contactPersons) ? contactPersons : []);
    }
  }, [currentVendor, isEditing]);

  // Ensure states are set when country is India
  useEffect(() => {
    if (vendorData.address.country?.value === "IN" || vendorData.address.country === "IN") {
      setStates(indianStates);
    }
  }, [vendorData.address.country]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    if (keys.length > 1) {
      setVendorData((prevData) => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else {
      setVendorData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (field, value) => {
    const keys = field.split(".");
    if (keys.length > 1) {
      // Handle address fields specially to maintain object structure for react-select
      if (keys[0] === "address" && (keys[1] === "country" || keys[1] === "state")) {
        setVendorData((prevData) => ({
          ...prevData,
          [keys[0]]: {
            ...prevData[keys[0]],
            [keys[1]]: value || null, // Keep the full object for react-select
          },
        }));
      } else {
        setVendorData((prevData) => ({
          ...prevData,
          [keys[0]]: {
            ...prevData[keys[0]],
            [keys[1]]: value?.value || value || "",
          },
        }));
      }
    } else {
      setVendorData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }
  };

  const handlePaymentTermChange = (term) => {
    setVendorData(prev => ({
      ...prev,
      payment_terms: term
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        salutation: vendorData.salutation,
        firstName: vendorData.firstName,
        lastName: vendorData.lastName,
        email: vendorData.email,
        secondary_email: vendorData.secondary_email || "",
        country_code: vendorData.country_code,
        phoneNumber: vendorData.phoneNumber,
        secondaryPhoneNumber: vendorData.secondaryPhoneNumber,
        companyName: vendorData.companyName,
        displayName: vendorData.displayName,
        gstin: vendorData.gstin,
        currencyCode: vendorData.currencyCode?.value || vendorData.currencyCode || "INR",
        gst_treatment: vendorData.gst_treatment,
        tax_preference: vendorData.tax_preference,
        exemption_reason: vendorData.exemption_reason || "",
        address: {
          ...vendorData.address,
          country: vendorData.address.country?.value || vendorData.address.country || "IN",
          state: vendorData.address.state?.value || vendorData.address.state || "",
          addressLine: vendorData.address.addressLine || "",
          city: vendorData.address.city || "",
          zipCode: vendorData.address.zipCode || ""
        },
        contactPersons: contactPersons.map((person) => ({
          salutation: person.salutation || "Mr.",
          designation: person.designation || "",
          first_name: person.first_name || "",
          last_name: person.last_name || "",
          email: person.email || "",
          phone_number: person.phone_number || "",
          country_code: person.country_code || "+91"
        })),
        payment_terms: vendorData.payment_terms || { term_name: "Due on Receipt", days: 0, is_default: true },
        notes: vendorData.notes || "",
        vendorStatus: vendorData.vendorStatus || "Active"
      };

      let actionResult;
      if (isEditing) {
        actionResult = await dispatch(updateVendor({ id: editableVendorId, ...payload }));
      } else {
        actionResult = await dispatch(createVendor(payload));
      }

      if (actionResult.meta.requestStatus === "rejected") {
        throw new Error(actionResult.payload || "Error saving vendor details.");
      }

      toast.success(isEditing ? "Vendor Updated Successfully." : "Vendor Created Successfully.");
      if (!isEditing) resetVendorData();

      const userSegment = location.pathname.split("/")[1];
      setTimeout(() => navigate(`/${userSegment}/dashboard/vendors`), 2000);
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'An error occurred';
      toast.error(errorMessage);
    }
  };


  if (loading) return <p>Loading vendor details...</p>;
  if (error) return <p className="text-red-500">Error: {typeof error === 'string' ? error : error.message || 'An error occurred'}</p>;

  // Determine if country is India for state dropdown logic
  const countryVal =
    vendorData.address?.country?.value || 
    vendorData.address?.country ||
    vendorData.country ||
    "";
  const isIndia = countryVal === "IN" || countryVal === "India";

  return (
    <div className="container mt-4 ml-4">
      {/* Breadcrumb */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
            disabled={loading}
          >
            <ArrowLeft size={16} />
          </button>
          <span>Vendors</span>
          <span>{`>`}</span>
          <span className="font-medium text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'New'}</span>
        </div>
      </div>
      <h1 className="mb-4 text-3xl font-bold">{isEditing ? "Edit Vendor" : "Add Vendor"}</h1>
      <hr className="mb-4 border-blue-500 border-3 size-auto" />

      <form onSubmit={handleSubmit}>
        <VendorPersonalDetails
          vendorData={vendorData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleStatusChange={handleStatusChange}
          isVendor={true}
        />
        <VendorCompanyDetails
          vendorData={vendorData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          isVendor={true}
        />

        <hr className="mb-4 border-gray-500 border-1 size-auto" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-2">
          <TabsList className="flex flex-wrap justify-start w-fit border-1 border-gray-300 bg-gray-200 mb-4 gap-2">
            <TabsTrigger
              value="contactPersons"
              className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Address
            </TabsTrigger>
            <TabsTrigger
              value="otherDetails"
              className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Tax Details
            </TabsTrigger>
            <TabsTrigger
              value="remarks"
              className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              Notes / Instructions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contactPersons" className="tabs-content-transition">
            <VendorContactPersonsSection
              contactPersons={contactPersons}
              setContactPersons={setContactPersons}
            />
          </TabsContent>

          <TabsContent value="address" className="tabs-content-transition">
            <VendorAddressSection
              vendorData={vendorData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              countries={countries}
              states={states}
              setStates={setStates}
              isIndia={isIndia}
            />
          </TabsContent>

          <TabsContent value="otherDetails" className="tabs-content-transition">
            <VendorOtherDetails
              vendorData={vendorData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              taxRates={taxRates}
              countries={countries}
              states={states}
              setStates={setStates}
              isIndia={isIndia}
            />
            <VendorPaymentTermsSections
              selectedTerm={vendorData.payment_terms}
              onTermChange={handlePaymentTermChange}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="remarks" className="tabs-content-transition">
            <VendorRemarksSection
              vendorData={vendorData}
              handleInputChange={handleInputChange}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-4 mr-4">
          <Button type="submit" className="bg-blue-500 " disabled={loading}>{isEditing ? "Update" : "Save"}</Button>
          <Button type="button" className="bg-yellow-500 text-black hover:bg-yellow-600" onClick={resetVendorData} disabled={loading}>Reset</Button>
          <Button type="button" variant="destructive" onClick={handleCancel} disabled={loading}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default AddVendor;