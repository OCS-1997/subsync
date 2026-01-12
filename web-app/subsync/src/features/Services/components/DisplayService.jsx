import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Percent, Info } from "lucide-react";

import { format } from "date-fns";
import api from "@/lib/axiosInstance.js";

function DisplayService({ serviceDetails }) {
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loadingTaxData, setLoadingTaxData] = useState(true);

  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        const [groupsRes, taxesRes] = await Promise.all([
          api.get("/tax-groups?include=members"),
          api.get("/all-taxes")
        ]);
        setTaxGroups(groupsRes.data.groups || []);
        setTaxes(taxesRes.data.taxes || []);
      } catch (error) {
        console.error("Error fetching tax data:", error);
      } finally {
        setLoadingTaxData(false);
      }
    };

    fetchTaxData();
  }, []);
  const renderSubDetail = (label, value) => {
    let displayValue = value ?? "N/A";

    if (label.includes("Created At") || label.includes("Updated At")) {
      displayValue = formatTimestamp(value);
    } else if (label.toLowerCase().includes("price") && value !== "N/A") {
      displayValue = `Rs.${parseFloat(value).toFixed(2)}`;
    } else if (label.toLowerCase().includes("tax rates") && value !== "N/A") {
      displayValue = `${value}%`;
    }

    return (
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base break-words">{displayValue}</p>
      </div>
    );
  };

  const renderDetails = (label, value, styles = "") => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-1">
            {Object.entries(value).map(([key, subValue]) => {
              const subLabel = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase());
              return (
                <div key={key}>
                  {renderSubDetail(subLabel, subValue)}
                </div>
              );
            })}
          </div>
        </div>
      );
    } else {
      const displayValue = value ?? "N/A";
      return (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`text-base ${styles}`}>{displayValue}</p>
        </div>
      );
    }
  };

  const renderVendorDetails = (service) => {
    const vendorName = service.preferred_vendor_name;
    const vendorId = service.preferred_vendor_id;

    if (!vendorName || vendorName === "N/A") {
      return (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-500">Preferred Vendor</p>
          <p className="text-base text-gray-500">No vendor assigned</p>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500">Preferred Vendor</p>
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-gray-900 dark:text-white">{vendorName}</p>
          {vendorId && (
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              ID: {vendorId}
            </span>
          )}
        </div>
      </div>
    );
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      return format(new Date(timestamp), "MMMM dd, yyyy hh:mm a");
    } catch (err) {
      console.error("Invalid date:", err);
      return "Invalid Date";
    }
  };

  const getTaxTypeBadge = (taxType) => {
    const colors = {
      'CGST': 'bg-blue-100 text-blue-800',
      'SGST': 'bg-green-100 text-green-800',
      'IGST': 'bg-purple-100 text-purple-800',
      'SEZ': 'bg-yellow-100 text-yellow-800',
      'NO_TAX': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={`text-xs ${colors[taxType] || 'bg-gray-100 text-gray-800'}`}>
        {taxType}
      </Badge>
    );
  };

  const renderTaxPreferences = (taxRates) => {
    if (!taxRates) {
      return (
        <div className="text-gray-500 italic">No tax preferences configured</div>
      );
    }

    // Handle legacy format (simple rate values)
    if (typeof taxRates.intra === 'string' || typeof taxRates.intra === 'number') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Intra State Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{taxRates.intra || '0'}%</div>
              <div className="text-xs text-gray-600 mt-1">Legacy format</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-900">Inter State Rate</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{taxRates.inter || '0'}%</div>
              <div className="text-xs text-gray-600 mt-1">Legacy format</div>
            </div>
          </div>
        </div>
      );
    }

    // Handle new structured format
    if (loadingTaxData) {
      return (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <span className="text-sm text-gray-600 mt-2">Loading tax details...</span>
        </div>
      );
    }

    const renderTaxDetail = (type, title, bgColor, textColor) => {
      const details = serviceDetails.tax_details?.[type];

      if (!details || parseFloat(details.tax_rate || 0) === 0) {
        return (
          <div className={`p-4 ${bgColor} rounded-[2rem] border dark:border-slate-800`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 ${textColor.replace('text-', 'bg-')} rounded-full`}></div>
              <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">{title}</span>
            </div>
            <div className="text-lg font-black text-slate-400">NO TAX (0%)</div>
          </div>
        );
      }

      const isGroup = !!details.members;

      return (
        <div className={`p-5 ${bgColor} rounded-[2rem] border dark:border-slate-800 shadow-sm`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-3 h-3 ${textColor.replace('text-', 'bg-')} rounded-full`}></div>
            <span className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">{title}</span>
          </div>
          <div className={`text-3xl font-black ${textColor} mb-2 tracking-tighter`}>
            {parseFloat(details.tax_rate).toFixed(1)}%
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isGroup ? details.group_name : details.tax_name}
            </span>
            {!isGroup && <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{details.tax_type}</span>}
          </div>

          {isGroup && details.members && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Composition</div>
              {details.members.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] uppercase">{member.tax_type}</span>
                    <span className="text-slate-500">{member.tax_name}</span>
                  </span>
                  <span className="text-slate-900 dark:text-white">{member.tax_rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderTaxDetail('intra', 'Intra State Tax', 'dark:bg-slate-900/50', 'text-blue-600')}
          {renderTaxDetail('inter', 'Inter State Tax', 'dark:bg-slate-900/50', 'text-indigo-600')}
        </div>
      </div>
    );
  };

  return (
    <Accordion type="single" collapsible defaultValue="service-details" className="w-full space-y-4">
      <AccordionItem value="service-details">
        <AccordionTrigger className="bg-blue-500 text-white rounded-lg p-4 hover:bg-blue-600 transition-colors">
          <h2 className="text-2xl font-bold">Service Details</h2>
        </AccordionTrigger>
        <AccordionContent>
          <Card>
            <CardContent className="pt-4 space-y-6">
              <div>
                <h3 className="text-lg font-bold pb-2 underline">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {renderDetails("Service ID", serviceDetails.service_id)}
                  {renderDetails("Service Name", serviceDetails.service_name)}
                  {renderDetails("SKU", serviceDetails.stock_keepers_unit)}
                  {renderDetails("Tax Preference", serviceDetails.tax_preference)}
                  {renderDetails("Item Group", serviceDetails.item_group_name)}
                  {renderVendorDetails(serviceDetails)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold pb-2 underline">Sales Information</h3>
                {renderDetails("Sales Details", serviceDetails.sales_info)}
              </div>

              <div>
                <h3 className="text-lg font-bold pb-2 underline">Purchase Information</h3>
                {renderDetails("Purchase Details", serviceDetails.purchase_info)}
              </div>

              <div>
                <h3 className="text-lg font-bold pb-2 underline flex items-center gap-2">
                  <Percent className="h-5 w-5 text-blue-500" />
                  Tax Preferences
                </h3>
                {renderTaxPreferences(serviceDetails.default_tax_rates)}
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                {renderDetails("Created At", serviceDetails.created_at)}
                {renderDetails("Updated At", serviceDetails.updated_at)}
              </div>

              <Link
                to="edit"
                state={{ editableServiceId: serviceDetails.service_id }}
                className="block w-full md:w-auto"
              >
                <Button className="bg-blue-500 text-white hover:bg-blue-600 w-full md:w-auto">
                  Edit Service
                </Button>
              </Link>
            </CardContent>
          </Card>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default DisplayService;
