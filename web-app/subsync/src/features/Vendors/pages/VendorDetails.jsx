import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchVendorById, clearVendorState } from "@/features/Services/vendorSlice.js";

function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentVendor, loading, error } = useSelector((state) => state.vendors);

  useEffect(() => {
    if (id) {
      dispatch(fetchVendorById(id));
    }
    return () => {
      dispatch(clearVendorState());
    };
  }, [id, dispatch]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/vendors/${id}/edit`);
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentVendor) return <p>No vendor data available.</p>;

  return (
    <div className="container mx-auto py-4 px-2 sm:px-2 lg:px-6">
      {/* Header with back button and edit button */}
       <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 animate-slideInLeft"
          disabled={loading}
        >
          <ArrowLeft size={20} className="animate-bounce-x" />
          <span className="font-medium">Back</span>
        </button>
      <div className="flex items-center justify-between mb-6">
        
        <div className="flex items-center gap-4">
          
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Vendor Details</h1>
        </div>
        <Button
          onClick={handleEdit}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Edit size={16} />
          Edit Vendor
        </Button>
      </div>

      <hr className="mb-6 border-blue-500 border-2" />

      {/* Vendor Information */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Personal Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.salutation} {currentVendor.first_name} {currentVendor.last_name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
              <p className="text-lg text-gray-900 dark:text-white">{currentVendor.primary_email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone Number</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.country_code} {currentVendor.primary_phone_number}
              </p>
            </div>

            {currentVendor.secondary_phone_number && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Secondary Phone</label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {currentVendor.country_code} {currentVendor.secondary_phone_number}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                currentVendor.vendor_status === "Active" 
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}>
                {currentVendor.vendor_status}
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
              <p className="text-lg text-gray-900 dark:text-white">{currentVendor.company_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Display Name</label>
              <p className="text-lg text-gray-900 dark:text-white">{currentVendor.display_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">GSTIN</label>
              <p className="text-lg text-gray-900 dark:text-white">{currentVendor.gst_in || "Not provided"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Currency</label>
              <p className="text-lg text-gray-900 dark:text-white">{currentVendor.currency_code || "INR"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Address Information</h2>
        
        {currentVendor.vendor_address && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Address Line</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.vendor_address.addressLine || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">City</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.vendor_address.city || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">State</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.vendor_address.state || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">ZIP Code</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.vendor_address.zipCode || "Not provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Country</label>
              <p className="text-lg text-gray-900 dark:text-white">
                {currentVendor.vendor_address.country === "IN" ? "India" : currentVendor.vendor_address.country || "Not provided"}
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
            <p className="text-lg text-gray-900 dark:text-white">{currentVendor.gst_treatment || "Not specified"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Tax Preference</label>
            <p className="text-lg text-gray-900 dark:text-white">{currentVendor.tax_preference || "Not specified"}</p>
          </div>

          {currentVendor.exemption_reason && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Exemption Reason</label>
              <p className="text-lg text-gray-900 dark:text-white">{currentVendor.exemption_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      {currentVendor.payment_terms && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Payment Terms</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Payment Term</label>
            <p className="text-lg text-gray-900 dark:text-white">
              {currentVendor.payment_terms.term_name} ({currentVendor.payment_terms.days || 0} days)
              
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {currentVendor.notes && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Notes</h2>
          
          <div>
            <p className="text-lg text-gray-900 dark:text-white whitespace-pre-wrap">{currentVendor.notes}</p>
          </div>
        </div>
      )}

      {/* Contact Persons */}
      {currentVendor.other_contacts && currentVendor.other_contacts.length > 0 && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Contact Persons</h2>
          
          <div className="grid gap-4">
            {currentVendor.other_contacts.map((contact, index) => (
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
                    <p className="text-lg text-gray-900 dark:text-white">{contact.email || "Not provided"}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                    <p className="text-lg text-gray-900 dark:text-white">
                      {contact.country_code} {contact.phone_number || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

export default VendorDetails; 