import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";

import BasicDetailsSection from "../components/BasicDetailsSection";
import PurchaseInfoSection from "../components/PurchaseInfoSection";
import SalesInfoSection from "../components/SalesInfoSection";
import DefaultTaxRatesSection from "../components/DefaultTaxRatesSection";

import {
  addService,
  updateService,
  fetchServiceById,
  clearServiceError,
  clearCurrentService,
} from "../serviceSlice.js";
import { fetchVendors } from "../vendorSlice.js";
import { fetchItemGroups } from "../itemGroupSlice.js";

const AddService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const { list: vendors, loading: isLoadingVendors, error: vendorsError } = useSelector((state) => state.vendors);
  const {
    loading: isSubmittingService,
    error: serviceError,
    currentService,
    loading: isFetchingService
  } = useSelector((state) => state.services);

  const isEditing = !!id;

  const [formData, setFormData] = useState({
    service_name: "",
    SKU: "",
    tax_preference: "Taxable",
    item_group: "",
  });
  const [salesInfo, setSalesInfo] = useState({ price: "", account: "Sales", description: "" });
  const [purchaseInfo, setPurchaseInfo] = useState({ price: "", account: "Cost of Goods Sold", description: "", vendor: "" }); // This will hold the vendor ID as a string
  // Updated tax rates state structure for new component
  const [defaultTaxRates, setDefaultTaxRates] = useState({
    intra: { kind: null, id: null, rate: "0" },
    inter: { kind: null, id: null, rate: "0" }
  });

  const getBasePath = () => {
    const pathSegments = location.pathname.split('/');
    const base = pathSegments.slice(0, pathSegments.indexOf('services') + 1).join('/');
    return base;
  };

  const servicesBasePath = getBasePath();

  useEffect(() => {
    // console.log("AddService: useEffect (mount/ID change) - isEditing:", isEditing, "ID:", id);
    if (isEditing && id) {
      dispatch(fetchServiceById(id));
    }

    dispatch(fetchVendors());
    dispatch(fetchItemGroups());


    return () => {
      // console.log("AddService: Cleanup - Clearing service state.");
      dispatch(clearServiceError());
      dispatch(clearCurrentService());
    };
  }, [id, isEditing, dispatch]);

  useEffect(() => {
    // console.log("AddService: useEffect - currentService updated:", currentService);
    if (isEditing && currentService) {
      const parsedSalesInfo = typeof currentService.sales_info === 'string'
        ? JSON.parse(currentService.sales_info) : currentService.sales_info;
      const parsedPurchaseInfo = typeof currentService.purchase_info === 'string'
        ? JSON.parse(currentService.purchase_info) : currentService.purchase_info;
      const parsedTaxRates = typeof currentService.default_tax_rates === 'string'
        ? JSON.parse(currentService.default_tax_rates) : currentService.default_tax_rates;

      setFormData({
        service_name: currentService.service_name || "",
        SKU: currentService.stock_keepers_unit || "",
        tax_preference: currentService.tax_preference || "Taxable",
        item_group: String(currentService.item_group_id || ""),
      });

      setSalesInfo({
        price: parsedSalesInfo?.price || "",
        account: parsedSalesInfo?.account || "Sales",
        description: parsedSalesInfo?.description || "",
      });

      setPurchaseInfo({
        price: parsedPurchaseInfo?.price || "",
        account: parsedPurchaseInfo?.account || "Cost of Goods Sold",
        description: parsedPurchaseInfo?.description || "",
        vendor: String(currentService.preferred_vendor_id || parsedPurchaseInfo?.vendor || ""),
      });

      // Handle both old and new tax rate formats
      if (parsedTaxRates) {
        if (parsedTaxRates.intra && typeof parsedTaxRates.intra === 'object' && parsedTaxRates.intra.kind) {
          // New format - structured tax preferences
          setDefaultTaxRates({
            intra: {
              kind: parsedTaxRates.intra.kind || null,
              id: parsedTaxRates.intra.id || null,
              rate: parsedTaxRates.intra.rate || "0"
            },
            inter: {
              kind: parsedTaxRates.inter?.kind || null,
              id: parsedTaxRates.inter?.id || null,
              rate: parsedTaxRates.inter?.rate || "0"
            }
          });
        } else {
          // Legacy format - simple rate values
          setDefaultTaxRates({
            intra: { kind: null, id: null, rate: parsedTaxRates.intra || "0" },
            inter: { kind: null, id: null, rate: parsedTaxRates.inter || "0" }
          });
        }
      }
    }
  }, [isEditing, currentService]);

  // Note: Tax rate auto-selection based on vendor is now handled by DefaultTaxRatesSection component

  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log("handleSubmit called. isEditing:", isEditing, "isSubmittingService:", isSubmittingService);
    dispatch(clearServiceError());

    if (!formData.service_name.trim()) {
      toast.error("Service Name is required.");
      // console.log("Validation Failed: Service Name");
      return;
    }
    if (!formData.SKU.trim()) {
      toast.error("SKU is required.");
      // console.log("Validation Failed: SKU");
      return;
    }
    if (!formData.item_group) {
      toast.error("Item Group is required.");
      // console.log("Validation Failed: Item Group");
      return;
    }
    if (!salesInfo.price || parseFloat(salesInfo.price) <= 0) {
      toast.error("Sales Price is required and must be greater than zero.");
      // console.log("Validation Failed: Sales Price");
      return;
    }
    if (!purchaseInfo.price || parseFloat(purchaseInfo.price) <= 0) {
      toast.error("Purchase Price is required and must be greater than zero.");
      // console.log("Validation Failed: Purchase Price");
      return;
    }
    if (!purchaseInfo.vendor) {
      toast.error("Preferred Vendor is required.");
      // console.log("Validation Failed: Preferred Vendor");
      return;
    }
    // Validate structured tax preferences - both kind and id should be consistent
    // console.log("Default Tax Rates Debug:", { defaultTaxRates });

    // For new structured format, validate that selections are made (allow null for "No Tax")
    const isIntraValid = defaultTaxRates.intra.rate !== undefined && defaultTaxRates.intra.rate !== '';
    const isInterValid = defaultTaxRates.inter.rate !== undefined && defaultTaxRates.inter.rate !== '';

    if (!isIntraValid || !isInterValid) {
      toast.error("Please configure tax rates for both Intra-state and Inter-state (you can select 'No Tax' if applicable).");
      // console.log("Validation Failed: Tax Rates not configured", { defaultTaxRates, isIntraValid, isInterValid });
      return;
    }
    // console.log("Client-side validation passed.");

    const payload = {
      ...formData,
      stock_keepers_unit: formData.SKU,
      sales_information: salesInfo,
      purchase_information: {
        ...purchaseInfo,
        preferred_vendor: purchaseInfo.vendor,
      },
      default_tax_rates: defaultTaxRates,
    };

    // console.log("Payload being sent:", payload);

    try {
      if (isEditing) {
        //  console.log("Dispatching updateService for ID:", id, "with payload:", payload);
        await dispatch(updateService({ id, serviceData: payload })).unwrap();
        //  console.log("updateService successful.");
        toast.success("Service updated successfully!");
        navigate(`${servicesBasePath}`);
      } else {
        // console.log("Dispatching addService with payload:", payload);
        await dispatch(addService(payload)).unwrap();
        // console.log("addService successful.");
        toast.success("Service added successfully!");
        navigate(`${servicesBasePath}`);
      }
    } catch (err) {
      console.error("Submission failed in catch block:", err);
    }
  };

  const handleCancel = () => {
    // console.log("Cancel button clicked.");
    setFormData({
      service_name: "",
      SKU: "",
      tax_preference: "Taxable",
      item_group: "",
    });
    setSalesInfo({ price: "", account: "Sales", description: "" });
    setPurchaseInfo({ price: "", account: "Cost of Goods Sold", description: "", vendor: "" });
    setDefaultTaxRates({
      intra: { kind: null, id: null, rate: "0" },
      inter: { kind: null, id: null, rate: "0" }
    });
    dispatch(clearServiceError());
    dispatch(clearCurrentService());
    navigate(`${servicesBasePath}`);
  };

  if (isEditing && isFetchingService) {
    return <div className="p-6 text-center">Loading service data...</div>;
  }
  if (isEditing && serviceError && !currentService) {
    return <div className="p-6 text-center text-red-500">Error loading service: {serviceError}</div>;
  }

  const handleBack = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/services`);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Services", href: `/${location.pathname.split('/')[1]}/dashboard/services` },
          { label: isEditing ? 'Edit Service' : 'New Service' }
        ]}
        className="mt-3 mb-4"
      />
      <form className="space-y-6 p-6" onSubmit={handleSubmit}>
        <h1 className="text-3xl font-bold">{isEditing ? "Edit Service" : "New Service"}</h1>
        <hr className="mb-2 border-blue-500 border-1 size-auto" />
        <BasicDetailsSection formData={formData} setFormData={setFormData} serviceError={serviceError} />

        <hr className="mb-4 border-gray-500 border-1 size-auto" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SalesInfoSection data={salesInfo} setData={setSalesInfo} />
          </div>
          <div>
            <PurchaseInfoSection
              data={purchaseInfo}
              setData={setPurchaseInfo}
              vendors={vendors}
              isLoadingVendors={isLoadingVendors}
              vendorsError={vendorsError}
              fetchVendors={() => dispatch(fetchVendors())}
            />
          </div>
        </div>

        <hr className="mb-4 border-gray-500 border-1 size-auto" />

        <DefaultTaxRatesSection defaultTaxRates={defaultTaxRates} setDefaultTaxRates={setDefaultTaxRates} />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="submit" className="bg-blue-500" disabled={isSubmittingService}>
            {isSubmittingService ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Service" : "Save Service")}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
        </div>
      </form>
    </>
  );
};

export default AddService;
