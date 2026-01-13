import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";
import api from "@/lib/axiosInstance.js";

const VendorOtherDetails = ({
  vendorData,
  handleInputChange,
  handleSelectChange,
  taxRates = [],
  countries,
  states,
  setStates,
  isIndia, // <-- accept isIndia prop
}) => {
  const currencyOptions = [
    "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
    "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL",
    "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY",
    "COP", "CRC", "CUP", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EGP",
    "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL", "GGP", "GHS",
    "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF",
    "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD", "JOD",
    "JPY", "KES", "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD", "KZT",
    "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL", "MGA", "MKD",
    "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN", "MYR", "MZN",
    "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PGK",
    "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR",
    "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SOS", "SRD", "SSP",
    "STN", "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD",
    "TVD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VES", "VND",
    "VUV", "WST", "XAF", "XCD", "XDR", "XOF", "XPF", "YER", "ZAR", "ZMW",
    "ZWL"
  ];

  const taxPreferenceOptions = ["Taxable", "Tax Exempt"];



  // GST Treatment options (static, not from tax table)
  const gstTreatmentOptions = [
    {
      value: "Registered Business - Regular",
      label: "Registered Business - Regular",
      description: "Business that is registered under GST"
    },
    {
      value: "Registered Business - Composition",
      label: "Registered Business - Composition",
      description: "Business that is registered under the Composition Scheme in GST"
    },
    {
      value: "Unregistered Business",
      label: "Unregistered Business",
      description: "Business that has not been Registered under GST"
    },
    {
      value: "Consumer",
      label: "Consumer",
      description: "A Customer  who is a regular Consumer"
    },
    {
      value: "Overseas",
      label: "Overseas",
      description: "Persons with whom you service outside of India"
    },
    {
      value: "Special Economic Zone",
      label: "Special Economic Zone",
      description: "A Customer located in a Special Economic Zone"
    },
    {
      value: "Deemed Export",
      label: "Deemed Export",
      description: "Transactions that are considered as Exports under GST"
    },
    {
      value: "Tax Deductor",
      label: "Tax Deductor",
      description: "Departments of the State/Central government, governmental agencies or local authorities"
    },
    {
      value: "SEZ Developer",
      label: "SEZ Developer",
      description: "A person/organisation who owns at least 26% of the equity in creating business units in a Special Economic Zone (SEZ)"
    },
    {
      value: "Input Service Distributor",
      label: "Input Service Distributor",
      description: "An office of the supplier of goods and/or services which receives tax invoices for services used by the company in different states under the same PAN"
    }
  ];

  // Set GST Treatment value: use vendorData.gst_treatment if set, else default to 'Registered Business - Regular'
  const gstTreatmentValue = vendorData.gst_treatment || "Registered Business - Regular";

  // Prefill GST Treatment with default if adding (not editing) and not set
  useEffect(() => {
    if (!vendorData.gst_treatment) {
      handleSelectChange("gst_treatment", "Registered Business - Regular");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default values if not set
  const currencyValue = vendorData.currencyCode || "INR";

  // Determine if GSTIN is required based on country and GST treatment
  const treatmentsRequireGSTIN = new Set([
    "Registered Business - Regular",
    "Registered Business - Composition",
    "Input Service Distributor",
    "Tax Deductor",
    "SEZ Developer",
    "Special Economic Zone",
  ]);
  const requiresGSTIN = isIndia && treatmentsRequireGSTIN.has(gstTreatmentValue);

  // GSTIN field logic
  useEffect(() => {
    // If GSTIN not required, default to GST_NA
    if (!requiresGSTIN && vendorData.gstin !== "GST_NA") {
      handleInputChange({ target: { name: "gstin", value: "GST_NA" } });
    }
    // If GSTIN required and was GST_NA, clear it for user input
    if (requiresGSTIN && vendorData.gstin === "GST_NA") {
      handleInputChange({ target: { name: "gstin", value: "" } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresGSTIN]);

  return (
    <div className="space-y-6">
      {/* AddressSection is now only in the Address tab, not here */}

      <div className="grid md:grid-cols-2 gap-x-6 gap-y-6">
        <div className="space-y-2 md:col-span-1">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 block">GST Treatment<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Select
            value={gstTreatmentValue}
            onValueChange={(value) => handleSelectChange("gst_treatment", value)}
          >
            <SelectTrigger className="w-full h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
              <SelectValue placeholder="Select treatment" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-[350px] max-w-full dark:bg-slate-900 dark:border-slate-800">
              {gstTreatmentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="whitespace-normal break-words min-h-[3.5rem] py-2 dark:hover:bg-slate-800">
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{opt.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-slate-400 whitespace-pre-line leading-relaxed">{opt.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gstin" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 block">
            GSTIN
            {requiresGSTIN && <span className="text-red-500 font-bold ml-1">*</span>}
          </Label>
          <Input
            id="gstin"
            name="gstin"
            value={vendorData.gstin}
            onChange={handleInputChange}
            required={requiresGSTIN}
            disabled={!requiresGSTIN}
            placeholder={requiresGSTIN ? "Enter GSTIN" : "GSTIN not required"}
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-slate-950 disabled:text-gray-400 dark:disabled:text-slate-600"
          />
          {!requiresGSTIN && (
            <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 italic ml-1">
              GSTIN not required for selected treatment/country
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 block">Currency Code<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Select
            value={currencyValue}
            onValueChange={(value) => handleSelectChange("currencyCode", value)}
          >
            <SelectTrigger className="w-full h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              {currencyOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-bold text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 block">Tax Preference<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Select
            value={vendorData.tax_preference || ""}
            onValueChange={(value) => handleSelectChange("tax_preference", value)}
          >
            <SelectTrigger className="w-full h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
              <SelectValue placeholder="Select tax preference" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              {taxPreferenceOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="font-bold text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tax Exemption Reason remains below if needed */}

      {vendorData.tax_preference === "Tax Exempt" && (
        <div className="space-y-2 mt-6">
          <Label htmlFor="exemption_reason" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 block">Tax Exemption Reason<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="exemption_reason"
            name="exemption_reason"
            value={vendorData.exemption_reason}
            onChange={handleInputChange}
            required
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

export default VendorOtherDetails;
