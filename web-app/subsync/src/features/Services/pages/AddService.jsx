import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast} from "react-toastify";
import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button";

import BasicDetailsSection from "../components/BasicDetailsSection";
import PurchaseInfoSection from "../components/PurchaseInfoSection";
import SalesInfoSection from "../components/SalesInfoSection";
import TaxSection from "../components/TaxSection";

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
  const [taxRates, setTaxRates] = useState({ intra: "", inter: "" });
  const [taxRatesList, setTaxRatesList] = useState([]);

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
    api.get("/tax-rates").then(res => setTaxRatesList(res.data.taxes || []));


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

      setTaxRates({
        intra: parsedTaxRates?.intra || "",
        inter: parsedTaxRates?.inter || "",
      });
    }
  }, [isEditing, currentService]);

  // When vendor changes, update default tax rates based on vendor GST treatment
  useEffect(() => {
    if (!purchaseInfo.vendor || !vendors?.length || !taxRatesList.length) return;
    const selectedVendor = vendors.find(
      v => String(v.vendor_id || v.id) === String(purchaseInfo.vendor)
    );
    if (!selectedVendor) return;
    const gstTreatment = selectedVendor.gst_treatment;
    // Find tax rates matching the vendor's GST treatment
    let intra = "";
    let inter = "";
    if (gstTreatment === "CGST & SGST") {
      intra = taxRatesList.find(t => t.tax_type === "CGST")?.tax_rate || "";
      inter = taxRatesList.find(t => t.tax_type === "IGST")?.tax_rate || "";
    } else if (gstTreatment === "IGST" || gstTreatment === "iGST") {
      intra = taxRatesList.find(t => t.tax_type === "IGST")?.tax_rate || "";
      inter = taxRatesList.find(t => t.tax_type === "IGST")?.tax_rate || "";
    } else if (gstTreatment === "SEZ") {
      intra = taxRatesList.find(t => t.tax_type === "SEZ")?.tax_rate || "";
      inter = taxRatesList.find(t => t.tax_type === "SEZ")?.tax_rate || "";
    } else if (gstTreatment === "No GST" || gstTreatment === "NO_TAX") {
      intra = taxRatesList.find(t => t.tax_type === "NO_TAX")?.tax_rate || "";
      inter = taxRatesList.find(t => t.tax_type === "NO_TAX")?.tax_rate || "";
    }
    setTaxRates({ intra, inter });
  // eslint-disable-next-line
  }, [purchaseInfo.vendor, vendors, taxRatesList]);

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
    if (!taxRates.intra || !taxRates.inter) {
      toast.error("Both Intra-state and Inter-state Tax Rates are required.");
      // console.log("Validation Failed: Tax Rates");
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
      default_tax_rates: taxRates,
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
    setTaxRates({ intra: "", inter: "" });
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
    navigate(`/${userSegment}/dashboard/customers`);
  };

  return (
    <>
   
    <button
          onClick={handleBack}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 animate-slideInLeft"
          disabled={loading}
        >
          <ArrowLeft size={20} className="animate-bounce-x" />
          <span className="font-medium">Back</span>
        </button>
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
          />
        </div>
      </div>

      <hr className="mb-4 border-gray-500 border-1 size-auto" />

      <TaxSection taxRates={taxRates} setTaxRates={setTaxRates} taxRatesList={taxRatesList} />

      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" className="bg-blue-500"  disabled={isSubmittingService}>
          {isSubmittingService ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update Service" : "Save Service")}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
      </div>
    </form>
    </>
  );
};

export default AddService;
