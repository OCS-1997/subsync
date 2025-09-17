import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { toast} from "react-toastify";
import countryList from "react-select-country-list";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import VendorAddressSection from "@/features/Vendors/components/VendorAddressSection";
import VendorCompanyDetails from "@/features/Vendors/components/VendorCompanyDetails";
import VendorContactPersonsSection from "@/features/Vendors/components/VendorContactPersonsSection";
import VendorOtherDetails from "@/features/Vendors/components/VendorOtherDetails";
import VendorPaymentTermsSections from '@/features/Vendors/components/VendorPaymentTermsSections';
import VendorPersonalDetails from "@/features/Vendors/components/VendorPersonalDetails";
import VendorRemarksSection from "@/features/Vendors/components/VendorRemarksSection";

import { createVendor, updateVendor } from "@/features/Services/vendorSlice";
import { indianStates } from "@/features/Customers/data/statesOfIndia.js";
import api from '@/lib/axiosInstance.js';

const AddVendorModal = ({ isEditing = false, editableVendor = null, onVendorAdded, isOpen, setIsOpen }) => {
  const dispatch = useDispatch();
  const { currentVendor, loading: vendorLoading, error: vendorError } = useSelector((state) => state.vendors);
 
  const [activeTab, setActiveTab] = useState("address");
  const [contactPersons, setContactPersons] = useState([]);
  const [states, setStates] = useState(indianStates);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const countries = countryList().getData();

  // Use external state if provided, otherwise use internal state
  const modalOpen = isOpen !== undefined ? isOpen : internalModalOpen;
  const setModalOpen = setIsOpen || setInternalModalOpen;

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
  };

  const handleCancel = () => {
    if (isEditing && currentVendor) {
      // If editing, reset to original data
      prefillVendorData(currentVendor);
    } else {
      // If adding new, reset to empty form
      resetVendorData();  
    }
    setModalOpen(false);
  };

  const prefillVendorData = (vendor) => {
    // Parse JSON fields if needed
    let address = vendor.vendor_address || vendor.address || {};
    if (typeof address === "string") {
      try { address = JSON.parse(address); } catch { address = {}; }
    }
    
    let contactPersons = vendor.other_contacts || vendor.contact_persons || [];
    if (typeof contactPersons === "string") {
      try { contactPersons = JSON.parse(contactPersons); } catch { contactPersons = []; }
    }
    
    let paymentTerms = vendor.payment_terms;
    if (typeof paymentTerms === "string") {
      try { paymentTerms = JSON.parse(paymentTerms); } catch { paymentTerms = null; }
    }

    // Set states based on country
    const countryValue = address.country || "IN";
    if (countryValue === "IN" || countryValue === "India") {
      setStates(indianStates);
    } else {
      setStates([]);
    }

    setVendorData({
      salutation: vendor.salutation || "Mr.",
      firstName: vendor.first_name || vendor.firstName || "",
      lastName: vendor.last_name || vendor.lastName || "",
      companyName: vendor.company_name || vendor.companyName || "",
      displayName: vendor.display_name || vendor.displayName || "",
      email: vendor.primary_email || vendor.email || "",
      secondary_email: vendor.secondary_email || "",
      country_code: vendor.country_code || "+91",
      phoneNumber: vendor.primary_phone_number || vendor.phoneNumber || "",
      secondaryPhoneNumber: vendor.secondary_phone_number || vendor.secondaryPhoneNumber || "",
      gstin: vendor.gst_in || vendor.gstin || "",
      gst_treatment: vendor.gst_treatment || "Registered Business - Regular",
      tax_preference: vendor.tax_preference || "Taxable",
      exemption_reason: vendor.exemption_reason || "",
      currencyCode: vendor.currency_code?.value || vendor.currency_code || "INR",
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
      notes: vendor.notes || "",
      vendorStatus: vendor.vendor_status || "Active",
    });
    
    setContactPersons(Array.isArray(contactPersons) ? contactPersons : []);
  };

  useEffect(() => {
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



  // Prefill vendor data when editing (same pattern as AddVendor.jsx)
  useEffect(() => {
    if (currentVendor && isEditing) {
      prefillVendorData(currentVendor);
    } else if (!isEditing) {  
      // Reset for add
      resetVendorData();
    }
  }, [currentVendor, isEditing, modalOpen]);

  // Update payment terms with matched term from the list when both are available
  useEffect(() => {
    if (currentVendor && isEditing && paymentTermsList.length > 0 && currentVendor.payment_terms) {
      // Find the matching term object from the list by term_id
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

  const handleStatusChange = (status) => {
    setVendorData((prevData) => ({
      ...prevData,
      vendorStatus: status,
    }));
  };

  const handlePaymentTermChange = (term) => {
    setVendorData(prev => ({
      ...prev,
      payment_terms: term
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation for vendor
    const validationErrors = [];
    if (!vendorData.salutation?.trim()) validationErrors.push("Salutation");
    if (!vendorData.firstName?.trim()) validationErrors.push("First Name");
    if (!vendorData.lastName?.trim()) validationErrors.push("Last Name");
    if (!vendorData.email?.trim()) validationErrors.push("Email");
    if (!vendorData.phoneNumber?.trim()) validationErrors.push("Phone Number");
    if (!vendorData.companyName?.trim()) validationErrors.push("Company Name");
    if (!vendorData.displayName?.trim()) validationErrors.push("Display Name");
    
    // GSTIN required only for India
    const countryVal = vendorData.address?.country?.value || vendorData.address?.country || "";
    const isIndia = countryVal === "IN" || countryVal === "India";
    if (isIndia && !vendorData.gstin?.trim()) validationErrors.push("GSTIN");
    
    if (!vendorData.address?.addressLine?.trim()) validationErrors.push("Address Line");
    if (!vendorData.address?.city?.trim()) validationErrors.push("City");
    if (!vendorData.address?.zipCode?.trim()) validationErrors.push("ZIP Code");
    if (!vendorData.address?.state) validationErrors.push("State");

    if (validationErrors.length > 0) {
      toast.error(`Please fill in the following required fields: ${validationErrors.join(', ')}`);
      return;
    }

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
        actionResult = await dispatch(updateVendor({ id: currentVendor.vendor_id, ...payload }));
      } else {
        actionResult = await dispatch(createVendor(payload));
      }

      if (actionResult.meta.requestStatus === "rejected") {
        throw new Error(actionResult.payload || "Error saving vendor details.");
      }

      toast.success(isEditing ? "Vendor Updated Successfully." : "Vendor Created Successfully.");
      if (!isEditing) resetVendorData();
      setModalOpen(false);
      if (onVendorAdded) onVendorAdded();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'An error occurred';
      toast.error(errorMessage);
    }
  };

  // Determine if country is India for state dropdown logic
  const countryVal = vendorData.address?.country?.value || vendorData.address?.country || "";
  const isIndia = countryVal === "IN" || countryVal === "India";

  return (
    <>
   
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {isEditing ? "Edit Vendor" : "+ Add New Vendor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="">{isEditing ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update vendor details." : "Add a new vendor to your services."}
          </DialogDescription>
        </DialogHeader>

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
                value="contactPersons"
                className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Contact Persons
              </TabsTrigger>
              <TabsTrigger
                value="remarks"
                className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Remarks
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="contactPersons" className="tabs-content-transition">
              <VendorContactPersonsSection
                contactPersons={contactPersons}
                setContactPersons={setContactPersons}
              />
            </TabsContent>

            <TabsContent value="remarks" className="tabs-content-transition">
            <VendorRemarksSection
              vendorData={vendorData}
              handleInputChange={handleInputChange}
            />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Reset
            </Button>
            <Button type="submit" className=" bg-blue-500 hover:bg-blue-600 text-white">
              {isEditing ? "Update Vendor" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AddVendorModal;