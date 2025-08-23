import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { ToastContainer, toast, Bounce } from "react-toastify";
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

import AddressSection from "@/features/Customers/components/AddressSection";
import CompanyDetails from "@/features/Customers/components/CompanyDetails";
import ContactPersonsSection from "@/features/Customers/components/ContactPersonsSection";
import OtherDetails from "@/features/Customers/components/OtherDetails";
import PaymentTermsSection from '@/features/Customers/components/PaymentTermsSection';
import PersonalDetails from "@/features/Customers/components/PersonalDetails";
import RemarksSection from "@/features/Customers/components/RemarksSection";

import { createVendor, updateVendor } from "@/features/Services/vendorSlice";
import { indianStates } from "@/features/Customers/data/statesOfIndia.js";
import api from '@/lib/axiosInstance.js';

const AddVendorModal = ({ isEditing = false, editableVendor = null, onVendorAdded, isOpen, setIsOpen  }) => {
  const dispatch = useDispatch();
 
  const [activeTab, setActiveTab] = useState("address");
  const [contactPersons, setContactPersons] = useState([]);
  const [states, setStates] = useState(indianStates);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const countries = countryList().getData();

  // Track local editing state to avoid prop confusion
  const [localIsEditing, setLocalIsEditing] = useState(isEditing);

  const [vendorData, setVendorData] = useState({
    salutation: "Mr.",
    firstName: "",
    lastName: "",
    companyName: "",
    displayName: "",
    email: "",
    country_code: "+91",
    phoneNumber: "",
    secondaryPhoneNumber: "",
    gstin: "",
    gst_treatment: "CGST & SGST",
    tax_preference: "Taxable",
    exemption_reason: "",
    currencyCode: "INR",
    address: {
      country: { label: "India", value: "IN" },
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
      country_code: "+91",
      phoneNumber: "",
      secondaryPhoneNumber: "",
      gstin: "",
      gst_treatment: "CGST & SGST",
      tax_preference: "Taxable",
      exemption_reason: "",
      currencyCode: "INR",
      address: {
        country: { label: "India", value: "IN" },
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

  useEffect(() => {
    api.get("/tax-rates").then(res => setTaxRates(res.data.taxes || []));
  }, []);

  // Reset local editing state when modal opens/closes
  useEffect(() => {
    setLocalIsEditing(isEditing);
  }, [isEditing, isOpen]);

  // Prefill vendor data when editing
  useEffect(() => {
    if (editableVendor && localIsEditing) {
      let address = editableVendor.vendor_address || editableVendor.address || {};
      if (typeof address === "string") {
        try { address = JSON.parse(address); } catch { address = {}; }
      }
      let contactPersons = editableVendor.other_contacts || editableVendor.contact_persons || [];
      if (typeof contactPersons === "string") {
        try { contactPersons = JSON.parse(contactPersons); } catch { contactPersons = []; }
      }
      let paymentTerms = editableVendor.payment_terms;
      if (typeof paymentTerms === "string") {
        try { paymentTerms = JSON.parse(paymentTerms); } catch { paymentTerms = null; }
      }

      // --- Country normalization ---
      let countryObj;
      if (address.country && typeof address.country === "object" && address.country.value) {
        countryObj = address.country;
      } else if (address.country === "IN" || address.country === "India") {
        countryObj = { label: "India", value: "IN" };
      } else if (typeof address.country === "string" && address.country) {
        countryObj = { label: address.country, value: address.country };
      } else {
        countryObj = { label: "India", value: "IN" };
      }

      // --- State normalization ---
      let stateObj = null;
      if (countryObj.value === "IN") {
        // Try to find matching state object from indianStates
        const stateVal = address.state?.value || address.state;
        stateObj = indianStates.find(s => s.value === stateVal) || (stateVal ? { label: stateVal, value: stateVal } : null);
      } else {
        stateObj = address.state || "";
      }

      setVendorData({
        salutation: editableVendor.salutation || "Mr.",
        firstName: editableVendor.first_name || editableVendor.firstName || "",
        lastName: editableVendor.last_name || editableVendor.lastName || "",
        companyName: editableVendor.company_name || editableVendor.companyName || "",
        displayName: editableVendor.display_name || editableVendor.displayName || "",
        email: editableVendor.primary_email || editableVendor.email || "",
        country_code: editableVendor.country_code || "+91",
        phoneNumber: editableVendor.primary_phone_number || editableVendor.phoneNumber || "",
        secondaryPhoneNumber: editableVendor.secondary_phone_number || editableVendor.secondaryPhoneNumber || "",
        gstin: editableVendor.gst_in || editableVendor.gstin || "",
        gst_treatment: editableVendor.gst_treatment || "CGST & SGST",
        tax_preference: editableVendor.tax_preference || "Taxable",
        exemption_reason: editableVendor.exemption_reason || "",
        currencyCode: editableVendor.currency_code?.value
          ? { label: editableVendor.currency_code, value: editableVendor.currency_code }
          : editableVendor.currency_code || "INR",
        address: {
          country: countryObj,
          addressLine: address.addressLine || address.address_line || "",
          state: stateObj,
          city: address.city || "",
          zipCode: address.zipCode || address.zip_code || "",
        },
        payment_terms: paymentTerms || null,
        notes: editableVendor.notes || "",
        vendorStatus: editableVendor.vendor_status || "Active",
      });
      setContactPersons(Array.isArray(contactPersons) ? contactPersons : []);
      // Set states for India
      if (countryObj.value === "IN") setStates(indianStates);
      else setStates([]);
    } else if (!localIsEditing) {
      // Reset for add
      setVendorData({
        salutation: "Mr.",
        firstName: "",
        lastName: "",
        companyName: "",
        displayName: "",
        email: "",
        country_code: "+91",
        phoneNumber: "",
        secondaryPhoneNumber: "",
        gstin: "",
        gst_treatment: "CGST & SGST",
        tax_preference: "Taxable",
        exemption_reason: "",
        currencyCode: "INR",
        address: {
          country: { label: "India", value: "IN" },
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
    }
  // eslint-disable-next-line
  }, [editableVendor, localIsEditing, isOpen]);

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
      setVendorData((prevData) => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value?.value || "",
        },
      }));
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

    // Validation for vendor, not service
    const validationErrors = [];
    if (!vendorData.salutation?.trim()) validationErrors.push("Salutation");
    if (!vendorData.firstName?.trim()) validationErrors.push("First Name");
    if (!vendorData.lastName?.trim()) validationErrors.push("Last Name");
    if (!vendorData.email?.trim()) validationErrors.push("Email");
    if (!vendorData.phoneNumber?.trim()) validationErrors.push("Phone Number");
    if (!vendorData.companyName?.trim()) validationErrors.push("Company Name");
    if (!vendorData.displayName?.trim()) validationErrors.push("Display Name");
    // GSTIN required only for India
    const countryVal =
      vendorData.address?.country?.value ||
      vendorData.address?.country ||
      vendorData.country ||
      "";
    const isIndia = countryVal === "IN" || countryVal === "India";
    if (isIndia && !vendorData.gstin?.trim()) validationErrors.push("GSTIN");
    if (!vendorData.address?.addressLine?.trim()) validationErrors.push("Address Line");
    if (!vendorData.address?.city?.trim()) validationErrors.push("City");
    if (!vendorData.address?.zipCode?.trim()) validationErrors.push("ZIP Code");
    if (!vendorData.address?.state) {
      validationErrors.push("State");
    } else if (typeof vendorData.address.state === 'object' && !vendorData.address.state.value) {
      validationErrors.push("State");
    } else if (typeof vendorData.address.state === 'string' && !vendorData.address.state.trim()) {
      validationErrors.push("State");
    }

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
      if (localIsEditing) {
        actionResult = await dispatch(updateVendor({ id: editableVendor.vendor_id, ...payload }));
      } else {
        actionResult = await dispatch(createVendor(payload));
      }

      if (actionResult.meta.requestStatus === "rejected") {
        throw new Error(actionResult.payload || "Error saving vendor details.");
      }

      toast.success(localIsEditing ? "Vendor Updated Successfully." : "Vendor Created Successfully.");
      if (!localIsEditing) resetVendorData();
      setIsOpen(false);
      if (onVendorAdded) onVendorAdded();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'An error occurred';
      toast.error(errorMessage);
    }
  };

  // Determine if country is India for state dropdown logic
  const countryVal =
    vendorData.address?.country?.value ||
    vendorData.address?.country ||
    vendorData.country ||
    "";
  const isIndia = countryVal === "IN" || countryVal === "India";

  return (
    <>
    <ToastContainer autoClose={2000} position="top-right" theme="colored" transition={Bounce} pauseOnHover />
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {localIsEditing ? "Edit Vendor" : "+ Add New Vendor"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="">{localIsEditing ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          <DialogDescription>
            {localIsEditing ? "Update vendor details." : "Add a new vendor to your services."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <PersonalDetails
            customerData={vendorData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleStatusChange={handleStatusChange}
            isVendor={true}
          />
          <CompanyDetails
            customerData={vendorData}
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
              <AddressSection
                customerData={vendorData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                countries={countries}
                states={states}
                setStates={setStates}
                isIndia={isIndia}
              />
            </TabsContent>

            <TabsContent value="otherDetails" className="tabs-content-transition">
              <OtherDetails
                customerData={vendorData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                taxRates={taxRates}
                countries={countries}
                states={states}
                setStates={setStates}
                isIndia={isIndia}
              />
              <PaymentTermsSection
                selectedTerm={vendorData.payment_terms}
                onTermChange={handlePaymentTermChange}
                isEditing={isEditing}
              />
            </TabsContent>

            <TabsContent value="contactPersons" className="tabs-content-transition">
              <ContactPersonsSection
                contactPersons={contactPersons}
                setContactPersons={setContactPersons}
              />
            </TabsContent>

            <TabsContent value="remarks" className="tabs-content-transition">
              <RemarksSection
                customerData={vendorData}
                handleInputChange={handleInputChange}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
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