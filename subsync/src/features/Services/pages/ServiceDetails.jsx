import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Edit, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton.jsx";

import { fetchServiceById, clearCurrentService } from "@/features/Services/serviceSlice.js";

function ServiceDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentService, loading, error } = useSelector((state) => state.services);

  // Single collapsible for all details
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchServiceById(id));
    }
    return () => {
        dispatch(clearCurrentService()); // Clear current service data when component unmounts
    };
  }, [id, dispatch]);

  const handleBack = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/services`);
  };

  const handleEdit = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    // Always go to edit route for this service
    navigate(`/${userSegment}/dashboard/services/${id}/edit`, { state: { editableServiceId: id } });
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;

  if (!currentService) return <p>No service data available.</p>;

  return (
    <div className="container mx-auto py-4 px-2 sm:px-2 lg:px-6">
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Service Details</h1>
        </div>
        <Button
          onClick={handleEdit}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Edit size={16} />
          Edit Service
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
          <span className="text-xl font-semibold text-gray-800 dark:text-white">Service Information</span>
          {open ? (
            <ChevronDown className="w-5 h-5 transition-transform" />
          ) : (
            <ChevronRight className="w-5 h-5 transition-transform" />
          )}
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4 pt-1">
            {/* Service Information */}
            <ServiceInformation service={currentService} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ServiceInformation = ({ service }) => {
  const formatValue = (value, type = 'text') => {
    if (value === null || value === undefined || value === '') return 'Not provided';
    
    if (type === 'price' && typeof value === 'number') {
      return `Rs.${value.toFixed(2)}`;
    }
    
    if (type === 'date') {
      try {
        return new Date(value).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return value;
      }
    }
    
    return value;
  };

  const renderField = (label, value, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <p className="text-lg text-gray-900 dark:text-white">{formatValue(value, type)}</p>
    </div>
  );

  const renderVendorInfo = () => {
    if (!service.preferred_vendor_name || service.preferred_vendor_name === 'N/A') {
      return renderField('Preferred Vendor', 'No vendor assigned');
    }
    
    return (
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Preferred Vendor</label>
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">{service.preferred_vendor_name}</p>
          {service.preferred_vendor_id && (
            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {service.preferred_vendor_id}</p>
          )}
        </div>
      </div>
    );
  };

  const renderTaxInfo = () => {
    // Check for tax_details first (enhanced backend data)
    if (service.tax_details && (service.tax_details.intra || service.tax_details.inter)) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Tax Information</label>
          <div className="space-y-2 mt-1">
            {service.tax_details.intra && (
              <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Intra-state Tax
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-300">
                    {service.tax_details.intra.tax_rate || service.tax_details.intra.rate || 0}%
                  </span>
                </div>
                {service.tax_details.intra.tax_name && (
                  <div className="mt-2">
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                      {service.tax_details.intra.tax_name}
                      {service.tax_details.intra.kind === 'group' && (
                        <span className="ml-2 text-green-600 dark:text-green-400">(Group)</span>
                      )}
                    </p>
                    {service.tax_details.intra.members && service.tax_details.intra.members.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {service.tax_details.intra.members.map((member, index) => (
                          <div key={index} className="flex justify-between items-center text-xs text-green-600 dark:text-green-400">
                            <span>{member.tax_name}</span>
                            <span>{member.tax_rate}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {service.tax_details.inter && (
              <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Inter-state Tax
                  </span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-300">
                    {service.tax_details.inter.tax_rate || service.tax_details.inter.rate || 0}%
                  </span>
                </div>
                {service.tax_details.inter.tax_name && (
                  <div className="mt-2">
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      {service.tax_details.inter.tax_name}
                      {service.tax_details.inter.kind === 'group' && (
                        <span className="ml-2 text-purple-600 dark:text-purple-400">(Group)</span>
                      )}
                    </p>
                    {service.tax_details.inter.members && service.tax_details.inter.members.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {service.tax_details.inter.members.map((member, index) => (
                          <div key={index} className="flex justify-between items-center text-xs text-purple-600 dark:text-purple-400">
                            <span>{member.tax_name}</span>
                            <span>{member.tax_rate}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback to default_tax_rates if tax_details is not available
    if (service.default_tax_rates) {
      const taxRates = service.default_tax_rates;
      return (
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Tax Information</label>
          <div className="space-y-2 mt-1">
            {taxRates.intra && (
              <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Intra-state Tax (ID: {taxRates.intra.id})
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-300">
                    {taxRates.intra.kind}
                  </span>
                </div>
              </div>
            )}
            {taxRates.inter && (
              <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Inter-state Tax (ID: {taxRates.inter.id})
                  </span>
                  <span className="text-sm text-purple-600 dark:text-purple-300">
                    {taxRates.inter.kind}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return renderField('Tax Information', 'No tax configuration');
  };

  return (
    <>
      {/* Basic Information */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Basic Information</h2>
          <div className="space-y-4">
            {renderField('Service Name', service.service_name)}
            {renderField('SKU', service.stock_keepers_unit)}
            {renderField('Tax Preference', service.tax_preference)}
            {renderField('Item Group', service.item_group_name)}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Vendor Information</h2>
          <div className="space-y-4">
            {renderVendorInfo()}
          </div>
        </div>
      </div>

      {/* Sales Information */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Sales Information</h2>
        {service.sales_info && (
          <div className="grid md:grid-cols-2 gap-8">
            {renderField('Selling Price', service.sales_info.price, 'price')}
            {renderField('Description', service.sales_info.description)}
            {renderField('Account', service.sales_info.account)}
          </div>
        )}
      </div>

      {/* Purchase Information */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Purchase Information</h2>
        {service.purchase_info && (
          <div className="grid md:grid-cols-2 gap-8">
            {renderField('Cost Price', service.purchase_info.price, 'price')}
            {renderField('Description', service.purchase_info.description)}
            {renderField('Account', service.purchase_info.account)}
          </div>
        )}
      </div>

      {/* Tax Information */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Tax Configuration</h2>
        {renderTaxInfo()}
      </div>

      {/* Timestamps */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b pb-2">Record Information</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {renderField('Created At', service.created_at, 'date')}
          {renderField('Updated At', service.updated_at, 'date')}
        </div>
      </div>
    </>
  );
};

const SkeletonLoader = () => (
  <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <Skeleton className="h-12 w-3/4 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
  </div>
);

const ErrorMessage = ({ message }) => (
  <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <p className="text-red-500">Error: {message}</p>
  </div>
);

export default ServiceDetails;
