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

  // GSTIN field logic
  useEffect(() => {
    // If not India, set GSTIN to "GST_NA" automatically
    if (!isIndia && vendorData.gstin !== "GST_NA") {
      handleInputChange({ target: { name: "gstin", value: "GST_NA" } });
    }
    // If India, clear GSTIN if it was set to GST_NA
    if (isIndia && vendorData.gstin === "GST_NA") {
      handleInputChange({ target: { name: "gstin", value: "" } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIndia]);

  return (
    <div className="space-y-6">
      {/* AddressSection is now only in the Address tab, not here */}

      <div className="grid md:grid-cols-2 gap-4">
        {/* GST Treatment full width, all options visible */}
        <div className="space-y-2 md:col-span-1">
          <Label>GST Treatment<span className="text-red-800">*</span></Label>
          <Select
            value={gstTreatmentValue}
            onValueChange={(value) => handleSelectChange("gst_treatment", value)}
          >
            <SelectTrigger className="w-full rounded-xl px-4 py-3 text-base border border-gray-300 text-left ">
              <SelectValue placeholder="Select treatment" className="text-left" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-[350px] max-w-full">
              {gstTreatmentOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="whitespace-normal break-words min-h-[3.5rem] py-2">
                  <div>
                    <div className="font-sans ">{opt.label}</div>
                    <div className="text-xs text-gray-500 whitespace-pre-line">{opt.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* GSTIN */}
        <div className="space-y-2">
          <Label htmlFor="gstin">
            GSTIN
            {isIndia && <span className="text-red-800">*</span>}
          </Label>
          <Input
            id="gstin"
            name="gstin"
            value={vendorData.gstin}
            onChange={handleInputChange}
            required={isIndia}
            disabled={!isIndia}
            placeholder={isIndia ? "Enter GSTIN" : "GST not required for non-India"}
            className="rounded-xl px-4 py-3 text-base border border-gray-300"
          />
          {isIndia && (
            <p className="text-sm text-gray-500 ml-2">
              Enter "GST_NA" if not applicable
            </p>
          )}
        </div>

        {/* Currency Code */}
        <div className="space-y-2">
          <Label>Currency Code<span className="text-red-800">*</span></Label>
          <Select
            value={currencyValue}
            onValueChange={(value) => handleSelectChange("currencyCode", value)}
          >
            <SelectTrigger className="w-full rounded-xl px-4 py-3 text-base border border-gray-300">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tax Preference parallel to Currency Code */}
        <div className="space-y-2">
          <Label>Tax Preference<span className="text-red-800">*</span></Label>
          <Select
            value={vendorData.tax_preference || ""}
            onValueChange={(value) => handleSelectChange("tax_preference", value)}
          >
            <SelectTrigger className="w-full rounded-xl px-4 py-3 text-base border border-gray-300">
              <SelectValue placeholder="Select tax preference" />
            </SelectTrigger>
            <SelectContent>
              {taxPreferenceOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

  {/* Tax Exemption Reason remains below if needed */}

      {vendorData.tax_preference === "Tax Exempt" && (
        <div className="space-y-2">
          <Label htmlFor="exemption_reason">Tax Exemption Reason<span className="text-red-800">*</span></Label>
          <Input
            id="exemption_reason"
            name="exemption_reason"
            value={vendorData.exemption_reason}
            onChange={handleInputChange}
            required
            className="rounded-xl px-4 py-3 text-base border border-gray-300"
          />
        </div>
      )}
    </div>
  );
};

export default VendorOtherDetails;
