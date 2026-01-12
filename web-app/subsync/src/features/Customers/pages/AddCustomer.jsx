import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import countryList from "react-select-country-list";
import { Bounce, toast } from "react-toastify";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";

import AddressSection from "../components/AddressSection.jsx";
import CompanyDetails from "../components/CompanyDetails.jsx";
import ContactPersonsSection from "../components/ContactPersonsSection.jsx";
import OtherDetails from "../components/OtherDetails.jsx";
import PaymentTermsSection from '../components/PaymentTermsSection';
import PersonalDetails from "../components/PersonalDetails.jsx";
import RemarksSection from "../components/RemarksSection.jsx";

import { createCustomer, updateCustomer, fetchCustomerById, clearCustomerState } from "@/features/Customers/customerSlice.js";
import { validateCustomerData } from "@/features/Customers/services/inputValidator.js";
import { indianStates } from "@/features/Customers/data/statesOfIndia.js";

const AddCustomer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentCustomer, loading, error } = useSelector((state) => state.customers);
  const editableCustomerId = location.state?.editableCustomerId || null;

  const countries = countryList().getData();
  const [states, setStates] = useState([]);
  const [contactPersons, setContactPersons] = useState([]);
  const [activeTab, setActiveTab] = useState("address"); // Default to Address tab
  const [isEditing, setIsEditing] = useState(!!editableCustomerId);
  const [paymentTermsList, setPaymentTermsList] = useState([]);

  const [customerData, setCustomerData] = useState({
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
    gst_treatment: "",
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
    customerStatus: "Active",
  });

  const resetCustomerData = () => {
    setCustomerData({
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
      gst_treatment: "",
      tax_preference: "Taxable",
      exemption_reason: "",
      currencyCode: { label: "INR", value: "INR" },
      address: {
        country: "IN",
        addressLine: "",
        state: null,
        city: "",
        zipCode: "",
      },
      payment_terms: null,
      notes: "",
      customerStatus: "Active",
    });
    setContactPersons([]);
    dispatch(clearCustomerState());
  };

  const handleCancel = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/customers`);
  };

  const handleStatusChange = (status) => {
    setCustomerData((prevData) => ({
      ...prevData,
      customerStatus: status,
    }));
  };

  useEffect(() => {
    if (editableCustomerId) {
      dispatch(fetchCustomerById(editableCustomerId));
    }
    return () => {
      dispatch(clearCustomerState());
    };
  }, [editableCustomerId, dispatch]);

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

  useEffect(() => {
    if (currentCustomer && isEditing) {
      // Set all customer data including payment terms
      setCustomerData({
        salutation: currentCustomer.salutation,
        firstName: currentCustomer.first_name,
        lastName: currentCustomer.last_name,
        companyName: currentCustomer.company_name,
        displayName: currentCustomer.display_name,
        email: currentCustomer.primary_email,
        secondary_email: currentCustomer.secondary_email,
        country_code: currentCustomer.country_code,
        phoneNumber: currentCustomer.primary_phone_number,
        secondaryPhoneNumber: currentCustomer.secondary_phone_number,
        gstin: currentCustomer.gst_in,
        gst_treatment: currentCustomer.gst_treatment,
        tax_preference: currentCustomer.tax_preference,
        exemption_reason: currentCustomer.exemption_reason,
        currencyCode: currentCustomer.currency_code?.value || currentCustomer.currency_code || "",
        address: {
          country: currentCustomer.customer_address.country?.value || currentCustomer.customer_address.country || "",
          addressLine: currentCustomer.customer_address?.addressLine || "",
          state: currentCustomer.customer_address.state?.value || currentCustomer.customer_address.state || "",
          city: currentCustomer.customer_address?.city || "",
          zipCode: currentCustomer.customer_address?.zipCode || "",
        },
        payment_terms: currentCustomer.payment_terms,
        notes: currentCustomer.notes,
        customerStatus: currentCustomer.customer_status,
      });
      setContactPersons(currentCustomer.other_contacts || []);
    }
  }, [currentCustomer, isEditing]);

  // Update payment terms with matched term from the list when both are available
  useEffect(() => {
    if (currentCustomer && isEditing && paymentTermsList.length > 0 && currentCustomer.payment_terms) {
      // Find the matching term object from the list by term_id
      const matchedTerm = paymentTermsList.find(
        t => t.term_id === currentCustomer.payment_terms?.term_id
      );

      // console.log('AddCustomer: currentCustomer.payment_terms:', currentCustomer.payment_terms);
      // console.log('AddCustomer: matchedTerm:', matchedTerm);

      if (matchedTerm) {
        setCustomerData(prev => ({
          ...prev,
          payment_terms: matchedTerm,
        }));
      }
    }
  }, [currentCustomer, isEditing, paymentTermsList]);

  useEffect(() => {
    if (!customerData.address.state) {
      setStates(indianStates);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split(".");

    if (keys.length > 1) {
      setCustomerData((prevData) => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value,
        },
      }));
    } else {
      setCustomerData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (field, value) => {
    const keys = field.split(".");
    if (keys.length > 1) {
      setCustomerData((prevData) => ({
        ...prevData,
        [keys[0]]: {
          ...prevData[keys[0]],
          [keys[1]]: value?.value || "",
        },
      }));
    } else {
      setCustomerData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }
  };

  const handlePaymentTermChange = (term) => {
    // console.log('AddCustomer: handlePaymentTermChange called with:', term);
    setCustomerData(prev => ({
      ...prev,
      payment_terms: term
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateCustomerData(customerData);
      const payload = {
        salutation: customerData.salutation,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        secondary_email: customerData.secondary_email,
        country_code: customerData.country_code,
        phoneNumber: customerData.phoneNumber,
        secondaryPhoneNumber: customerData.secondaryPhoneNumber,
        companyName: customerData.companyName,
        displayName: customerData.displayName,
        gstin: customerData.gstin,
        currencyCode: customerData.currencyCode?.value || customerData.currencyCode || "INR",
        gst_treatment: customerData.gst_treatment,
        tax_preference: customerData.tax_preference,
        exemption_reason: customerData.exemption_reason || "",
        address: {
          ...customerData.address,
          country: customerData.address.country?.value || customerData.address.country || "IN",
          state: customerData.address.state?.value || customerData.address.state || "",
          addressLine: customerData.address.addressLine || "",
          city: customerData.address.city || "",
          zipCode: customerData.address.zipCode || ""
        },
        contactPersons: contactPersons.map((person) => ({
          salutation: person.salutation || "",
          designation: person.designation || "",
          first_name: person.first_name || "",
          last_name: person.last_name || "",
          email: person.email || "",
          include_in_communication: !!person.include_in_communication,
          phone_number: person.phone_number || "",
          birthday: person.birthday || "",
          email_send: !!person.email_send,
          country_code: person.country_code || "+91"
        })),
        payment_terms: customerData.payment_terms || { term_name: "Due on Receipt", days: 0, is_default: true },
        notes: customerData.notes || "",
        customerStatus: customerData.customerStatus || "Active"
      };
      console.log("Submitting payload:", payload);


      let actionResult;
      if (isEditing) {
        actionResult = await dispatch(updateCustomer({ id: editableCustomerId, payload }));
      } else {
        actionResult = await dispatch(createCustomer(payload));
      }

      // Debug: Log the action result
      console.log("Action result:", actionResult);
      console.log("Request status:", actionResult.meta.requestStatus);
      console.log("Action payload:", actionResult.payload);

      if (actionResult.meta.requestStatus === "rejected") {
        // Check for duplicate name error
        const backendMsg = actionResult.payload || "Error saving customer details.";
        console.log("Backend error message:", backendMsg);

        // Check for duplicate name (handle both exact message and contains)
        if (backendMsg.toLowerCase().includes("already exists") ||
          backendMsg.toLowerCase().includes("duplicate")) {
          toast.error("A customer with this name already exists. Please use a different name.", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });

          // Focus on the displayName field (try multiple possible IDs)
          setTimeout(() => {
            const displayNameInput = document.getElementById("displayName") ||
              document.querySelector('input[name="displayName"]');
            if (displayNameInput) {
              displayNameInput.focus();
              displayNameInput.select(); // Select the text so user can easily change it
              displayNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else if (backendMsg.toLowerCase().includes("invalid") ||
          backendMsg.toLowerCase().includes("required")) {
          // Handle other validation errors
          toast.error(backendMsg, {
            position: "top-center",
            autoClose: 5000,
          });
        } else {
          // Generic error message
          toast.error(backendMsg || "Failed to save customer details.", {
            position: "top-center",
            autoClose: 5000,
          });
        }
        // IMPORTANT: Don't reset the form - keep all user data
        return;
      }

      toast.success(isEditing ? "Customer Updated Successfully." : "Customer Created Successfully.");

      // Only reset form on SUCCESS
      if (!isEditing) resetCustomerData();

      const userSegment = location.pathname.split("/")[1];
      setTimeout(() => navigate(`/${userSegment}/dashboard/customers`), 2000);
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'An error occurred';
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
      });
      // IMPORTANT: Don't reset the form - keep all user data
    }
  };

  const handleBack = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/customers`);
  };

  // Determine if country is India for state dropdown logic
  const countryVal =
    customerData.address?.country?.value ||
    customerData.address?.country ||
    customerData.country ||
    "";
  const isIndia = countryVal === "IN" || countryVal === "India";

  if (loading) return <p>Loading customer details...</p>;
  if (error) return <p className="text-red-500">Error: {typeof error === 'string' ? error : error.message || 'An error occurred'}</p>;

  return (
    <div className="container mt-4 ml-4 min-h-screen">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Customers", href: `/${location.pathname.split('/')[1]}/dashboard/customers` },
            { label: isEditing ? 'Edit Customer' : 'New Customer' }
          ]}
        />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
          {isEditing ? "Edit Customer" : "Add Customer"}
        </h1>
      </div>
      <hr className="mb-8 border-blue-500/30 dark:border-blue-500/20" />

      <form onSubmit={handleSubmit}>
        <PersonalDetails
          customerData={customerData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
          handleStatusChange={handleStatusChange}
        />
        <CompanyDetails
          customerData={customerData}
          handleInputChange={handleInputChange}
          handleSelectChange={handleSelectChange}
        />

        <hr className="my-8 border-gray-200 dark:border-slate-800" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-gray-100 dark:bg-slate-800/50 p-1 text-muted-foreground mb-6">
            <TabsTrigger
              value="contactPersons"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              Contacts
            </TabsTrigger>
            <TabsTrigger
              value="address"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              Address
            </TabsTrigger>
            <TabsTrigger
              value="otherDetails"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              Tax Details
            </TabsTrigger>
            <TabsTrigger
              value="remarks"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contactPersons" className="tabs-content-transition">
            <ContactPersonsSection
              contactPersons={contactPersons}
              setContactPersons={setContactPersons}
            />
          </TabsContent>

          <TabsContent value="address" className="tabs-content-transition">
            <AddressSection
              customerData={customerData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              countries={countries}
              states={states}
              setStates={setStates}
              isIndia={isIndia}
              setCustomerData={setCustomerData}
            />
          </TabsContent>

          <TabsContent value="otherDetails" className="tabs-content-transition">
            <OtherDetails
              customerData={customerData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              countries={countries}
              states={states}
              setStates={setStates}
              isIndia={isIndia}
            />
            <PaymentTermsSection
              selectedTerm={customerData.payment_terms}
              onTermChange={handlePaymentTermChange}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="remarks" className="tabs-content-transition">
            <RemarksSection
              customerData={customerData}
              handleInputChange={handleInputChange}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-12 pb-12 border-t border-gray-100 dark:border-slate-800 pt-8">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-black uppercase tracking-widest text-xs"
            disabled={loading}
          >
            {isEditing ? "Update Customer" : "Save Customer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-xs border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300"
            onClick={resetCustomerData}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-xs"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomer;
