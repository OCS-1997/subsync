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
 
  const [activeTab, setActiveTab] = useState("otherDetails");
  const [contactPersons, setContactPersons] = useState([]);
  const [states, setStates] = useState(indianStates);
  const [paymentTermsList, setPaymentTermsList] = useState([]);

  const countries = countryList().getData();

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
    if (editableVendor && isEditing && paymentTermsList.length > 0 && editableVendor.payment_terms) {
      const matchedTerm = paymentTermsList.find(
        t => t.term_id === editableVendor.payment_terms?.term_id
      );
      
      if (matchedTerm) {
        setVendorData(prev => ({
          ...prev,
          payment_terms: matchedTerm,
        }));
      }
    }
  }, [editableVendor, isEditing, paymentTermsList]);

  useEffect(() => {
    if (isEditing && editableVendor) {
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

      const countryValue = address.country || "IN";
      if (countryValue === "IN" || countryValue === "India") {
        setStates(indianStates);
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
        currencyCode: editableVendor.currency_code
          ? { label: editableVendor.currency_code, value: editableVendor.currency_code }
          : "INR",
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
        notes: editableVendor.notes || "",
        vendorStatus: editableVendor.vendor_status || "Active",
      });
      setContactPersons(Array.isArray(contactPersons) ? contactPersons : []);
    } else if (!isEditing) {
      resetVendorData();
    }
  }, [isEditing, editableVendor]);

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

  const handlePaymentTermChange = (term) => {
    setVendorData(prev => ({
      ...prev,
      payment_terms: term
    }));
  };

  const handleStatusChange = (status) => {
    setVendorData((prevData) => ({
      ...prevData,
      vendorStatus: status,
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
        country_code: vendorData.country_code,
        phoneNumber: vendorData.phoneNumber,
        secondaryPhoneNumber: vendorData.secondaryPhoneNumber,
        companyName: vendorData.companyName,
        displayName: vendorData.displayName,
        gstin: vendorData.gst_in,
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
        actionResult = await dispatch(updateVendor({ id: editableVendor.vendor_id, ...payload }));
      } else {
        actionResult = await dispatch(createVendor(payload));
      }

      if (actionResult.meta.requestStatus === "rejected") {
        throw new Error(actionResult.payload || "Error saving vendor details.");
      }

      toast.success(isEditing ? "Vendor Updated Successfully." : "Vendor Created Successfully.");
      if (!isEditing) resetVendorData();
      setIsOpen(false);
      if (onVendorAdded) onVendorAdded();
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'An error occurred';
      toast.error(errorMessage);
    }
  };

  return (
    <>
    <ToastContainer autoClose={2000} position="top-right" theme="colored" transition={Bounce} pauseOnHover />
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
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
          <PersonalDetails
            customerData={vendorData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleStatusChange={handleStatusChange}
          />
          <CompanyDetails
            customerData={vendorData}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
          />

          <hr className="mb-4 border-gray-500 border-1 size-auto" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-2">
            <TabsList className="flex flex-wrap justify-start w-fit border-1 border-gray-300 bg-gray-200 mb-4 gap-2">
              <TabsTrigger
                value="otherDetails"
                className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Other Details
              </TabsTrigger>
              <TabsTrigger
                value="address"
                className="tabs-trigger-transition transition-colors duration-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Address
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

            <TabsContent value="otherDetails" className="tabs-content-transition">
              <OtherDetails
                customerData={vendorData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
              />
              <PaymentTermsSection
                selectedTerm={vendorData.payment_terms}
                onTermChange={handlePaymentTermChange}
                isEditing={isEditing}
              />
            </TabsContent>

            <TabsContent value="address" className="tabs-content-transition">
              <AddressSection
                customerData={vendorData}
                handleInputChange={handleInputChange}
                handleSelectChange={handleSelectChange}
                countries={countries}
                states={states}
                setStates={setStates}
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