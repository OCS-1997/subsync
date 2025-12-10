import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";

import { fetchCustomerById, clearCustomerState } from "@/features/Customers/customerSlice.js";

function CustomerDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCustomer, loading, error } = useSelector((state) => state.customers);
  const navigate = useNavigate();
  const location = useLocation();

  // Single collapsible for all details
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
    }
    return () => {
      dispatch(clearCustomerState());
    };
  }, [id, dispatch]);

  const handleBack = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/customers`);
  };

  const handleEdit = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    // Always go to edit route for this customer
    navigate(`/${userSegment}/dashboard/customers/${id}/edit`, { state: { editableCustomerId: id } });
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentCustomer) return <p>No customer data available.</p>;

  // Helper for address
  const address = currentCustomer.customer_address || {};
  const contacts = currentCustomer.other_contacts || [];

  return (
    <div className="container mx-auto py-4 px-2 sm:px-2 lg:px-6">
      <Breadcrumb
        items={[
          { label: "Customers", href: `/${location.pathname.split('/')[1]}/dashboard/customers` },
          { label: currentCustomer?.display_name || 'Customer Details' }
        ]}
      />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Customer Details</h1>
        </div>
        <Button
          onClick={handleEdit}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Edit size={16} />
          Edit Customer
        </Button>
      </div>
      <hr className="mb-6 border-blue-500 border-2" />

      {/* Single collapsible for all details */}
      <div className="mb-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 focus:outline-none hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
          aria-expanded={open}
        >
          <span className="text-xl font-semibold text-gray-800 dark:text-white">Customer Information</span>
          {open ? (
            <ChevronDown className="w-5 h-5 transition-transform" />
          ) : (
            <ChevronRight className="w-5 h-5 transition-transform" />
          )}
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <div className="px-4 pb-4 pt-1">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {currentCustomer.salutation} {currentCustomer.first_name} {currentCustomer.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.primary_email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Secondary Email</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.secondary_email || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {currentCustomer.country_code} {currentCustomer.primary_phone_number}
                    </p>
                  </div>
                  {currentCustomer.secondary_phone_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Secondary Phone</label>
                      <p className="text-lg text-gray-900 dark:text-white">
                        {currentCustomer.country_code} {currentCustomer.secondary_phone_number}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${currentCustomer.customer_status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                      {currentCustomer.customer_status}
                    </span>
                  </div>
                </div>
              </div>
              {/* Company Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Company Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Company Name</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.company_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.display_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">GSTIN</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.gst_in || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Currency</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.currency_code || "INR"}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Address Information */}
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Address Information</h2>
              {address && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Address Line</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {address.addressLine || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">City</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {address.city || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">State</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {address.state || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">ZIP Code</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {address.zipCode || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Country</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {address.country === "IN" ? "India" : address.country || "Not provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Tax Information */}
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Tax Information</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">GST Treatment</label>
                  <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.gst_treatment || "Not specified"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Tax Preference</label>
                  <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.tax_preference || "Not specified"}</p>
                </div>
                {currentCustomer.exemption_reason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Exemption Reason</label>
                    <p className="text-lg text-gray-900 dark:text-white">{currentCustomer.exemption_reason}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Payment Terms */}
            {currentCustomer.payment_terms && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Payment Terms</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Payment Term</label>
                  <p className="text-lg text-gray-900 dark:text-white">
                    {currentCustomer.payment_terms.term_name} ({currentCustomer.payment_terms.days || 0} days)
                  </p>
                </div>
              </div>
            )}
            {/* Notes */}
            {currentCustomer.notes && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Notes</h2>
                <div>
                  <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">{currentCustomer.notes}</p>
                </div>
              </div>
            )}
            {/* Contact Persons */}
            {contacts && contacts.length > 0 && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Contact Persons</h2>
                <div className="grid gap-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                          <p className="text-lg text-gray-900 dark:text-white">
                            {contact.salutation} {contact.first_name} {contact.last_name}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Designation</label>
                          <p className="text-lg text-gray-900 dark:text-white">{contact.designation || "Not specified"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                          <div className="flex items-center gap-2">
                            <p className="text-lg text-gray-900 dark:text-white">{contact.email || "Not provided"}</p>
                            {contact.include_in_communication && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Include in Communication
                              </span>
                            )}
                            {contact.email_send && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Email Send
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                          <p className="text-lg text-gray-900 dark:text-white">
                            {contact.country_code} {contact.phone_number || "Not provided"}
                          </p>
                        </div>
                        {contact.birthday && (
                          <div>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Birthday</label>
                            <p className="text-lg text-gray-900 dark:text-white">
                              {new Date(contact.birthday).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SkeletonLoader = () => (
  <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <Skeleton className="h-12 w-3/4 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <p className="text-red-500">Error: {message}</p>
  </div>
);



export default CustomerDetails;
