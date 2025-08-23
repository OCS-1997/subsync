import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useState } from "react";
import api from "@/lib/axiosInstance.js";

const OtherDetails = ({
 customerData,
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
  const [fetchedTaxRates, setFetchedTaxRates] = useState(taxRates);
  const [defaultTaxType, setDefaultTaxType] = useState("");

  // Fetch tax rates and default tax preference on mount
  useEffect(() => {
    // Only fetch if no taxRates prop and nothing fetched yet
    if ((!taxRates || taxRates.length === 0) && fetchedTaxRates.length === 0) {
      api.get("/tax-rates").then(res => setFetchedTaxRates(res.data.taxes || []));
    }
    // Fetch default tax preference
    api.get("/default-tax-preference").then(res => {
      if (res.data && res.data.defaultTaxPreference && res.data.defaultTaxPreference.tax_type) {
        setDefaultTaxType(res.data.defaultTaxPreference.tax_type);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Set GST Treatment value: use customerData.gst_treatment if set, else use defaultTaxType
  const gstTreatmentValue = customerData.gst_treatment || defaultTaxType || "";

  // Prefill GST Treatment with default if adding (not editing) and not set
  useEffect(() => {
    if (
      !customerData.gst_treatment &&
      defaultTaxType &&
      (taxRates.length > 0 ? taxRates : fetchedTaxRates).some(t => t.tax_type === defaultTaxType)
    ) {
      handleSelectChange("gst_treatment", defaultTaxType);
    }
    // Only run when defaultTaxType is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTaxType]);

  // Set default values if not set
  const currencyValue = customerData.currencyCode || "INR";

  return (
    <div className="space-y-6">
      {/* AddressSection is now only in the Address tab, not here */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gstin">
            GSTIN
            {isIndia && <span className="text-red-800">*</span>}
          </Label>
          <Input
            id="gstin"
            name="gstin"
            value={customerData.gstin}
            onChange={handleInputChange}
            required={isIndia}
            disabled={!isIndia}
            placeholder={isIndia ? "Enter GSTIN" : "Not required for non-India"}
            className="rounded-xl px-4 py-3 text-base border border-gray-300"
          />
        </div>

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
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>GST Treatment<span className="text-red-800">*</span></Label>
          <Select
            value={gstTreatmentValue}
            onValueChange={(value) => handleSelectChange("gst_treatment", value)}
          >
            <SelectTrigger className="w-full rounded-xl px-4 py-3 text-base border border-gray-300">
              <SelectValue placeholder="Select treatment" />
            </SelectTrigger>
            <SelectContent>
              {(taxRates.length > 0 ? taxRates : fetchedTaxRates).map((tax) => (
                <SelectItem key={tax.tax_id} value={tax.tax_type}>
                  {tax.tax_name} ({tax.tax_type} - {tax.tax_rate}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tax Preference<span className="text-red-800">*</span></Label>
          <Select
            value={customerData.tax_preference || ""}
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

      {customerData.tax_preference === "Tax Exempt" && (
        <div className="space-y-2">
          <Label htmlFor="exemption_reason">Tax Exemption Reason<span className="text-red-800">*</span></Label>
          <Input
            id="exemption_reason"
            name="exemption_reason"
            value={customerData.exemption_reason}
            onChange={handleInputChange}
            required
            className="rounded-xl px-4 py-3 text-base border border-gray-300"
          />
        </div>
      )}
    </div>
  );
};

export default OtherDetails;
