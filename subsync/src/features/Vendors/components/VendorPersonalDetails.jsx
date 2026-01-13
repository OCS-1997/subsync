import { parsePhoneNumberFromString } from "libphonenumber-js";
import PhoneInput from "react-phone-number-input";
import Select from "react-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import 'react-phone-number-input/style.css';

const VendorPersonalDetails = ({ vendorData, handleInputChange, handleSelectChange, handleStatusChange, isVendor = false }) => {

  const getCurrentPhoneNumber = (type = 'primary') => {
    const phoneNumber = type === 'primary' ? vendorData.phoneNumber : vendorData.secondaryPhoneNumber;
    if (vendorData.country_code && phoneNumber) {
      if (vendorData.country_code.startsWith('+')) {
        return `${vendorData.country_code}${phoneNumber}`;
      }
      return `+${vendorData.country_code}${phoneNumber}`;
    }
    return "";
  };

  const handlePhoneNumberChange = (value, type = 'primary') => {
    if (value) {
      const phoneNumberObj = parsePhoneNumberFromString(value);
      if (phoneNumberObj && phoneNumberObj.isValid()) {
        handleInputChange({
          target: { name: "country_code", value: phoneNumberObj.countryCallingCode ? `+${phoneNumberObj.countryCallingCode}` : "" }
        });
        handleInputChange({
          target: { name: type === 'primary' ? "phoneNumber" : "secondaryPhoneNumber", value: phoneNumberObj.nationalNumber ? String(phoneNumberObj.nationalNumber) : "" }
        });
      } else {
        handleInputChange({ target: { name: "country_code", value: "" } });
        handleInputChange({ target: { name: type === 'primary' ? "phoneNumber" : "secondaryPhoneNumber", value: "" } });
      }
    } else {
      handleInputChange({ target: { name: "country_code", value: "" } });
      handleInputChange({ target: { name: type === 'primary' ? "phoneNumber" : "secondaryPhoneNumber", value: "" } });
    }
  };

  const salutationOptions = [
    { value: "Mr.", label: "Mr." },
    { value: "Ms.", label: "Ms." },
    { value: "Mrs.", label: "Mrs." },
    { value: "Dr.", label: "Dr." },
  ];

  // Set default salutation to Mr. if not set
  const selectedSalutation = salutationOptions.find(option => option.value === vendorData.salutation) || salutationOptions[0];

  // Handle both customerStatus and vendorStatus
  const statusField = isVendor ? 'vendorStatus' : 'customerStatus';
  const currentStatus = vendorData[statusField] || "Active";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
        <div className="flex flex-col md:col-span-12">
          <Label htmlFor="vendor-status" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-3">Vendor status</Label>
          <div className="flex bg-gray-100/50 dark:bg-slate-800/50 p-1 rounded-xl w-fit border border-gray-100 dark:border-slate-800 shadow-inner">
            <button
              id="tbg-radio-1"
              type="button"
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${currentStatus === "Active"
                  ? 'bg-white dark:bg-slate-900 text-green-600 shadow-sm'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'
                }`}
              onClick={() => handleStatusChange("Active")}
            >
              Active
            </button>
            <button
              id="tbg-radio-2"
              type="button"
              className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${currentStatus === "Inactive"
                  ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-600'
                }`}
              onClick={() => handleStatusChange("Inactive")}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="flex flex-col md:col-span-2">
          <Label htmlFor="salutation" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Salutation<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Select
            id="salutation"
            options={salutationOptions}
            value={selectedSalutation}
            onChange={(selectedOption) => handleSelectChange("salutation", selectedOption ? selectedOption.value : null)}
            getOptionLabel={(option) => option.label}
            getOptionValue={(option) => option.value}
            classNamePrefix="react-select"
            className="react-select-container"
            placeholder="Select"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--input))",
                minHeight: "2.75rem",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                padding: "0px 8px",
                boxShadow: "none",
                "&:hover": { borderColor: "hsl(var(--ring))" },
              }),
              singleValue: (base) => ({
                ...base,
                color: "hsl(var(--foreground))",
                fontWeight: "600"
              }),
              input: (base) => ({
                ...base,
                color: "hsl(var(--foreground))"
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "hsl(var(--popover))",
                borderRadius: "0.75rem",
                border: "1px solid hsl(var(--border))",
                zIndex: 20,
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "hsl(var(--accent))" : "transparent",
                color: state.isFocused ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                cursor: "pointer",
                fontWeight: "500",
              }),
            }}
          />
        </div>

        <div className="flex flex-col md:col-span-5">
          <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">First Name<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="firstName"
            type="text"
            name="firstName"
            value={vendorData.firstName}
            onChange={handleInputChange}
            required
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col md:col-span-5">
          <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            name="lastName"
            value={vendorData.lastName}
            onChange={handleInputChange}
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="primaryPhoneNumber" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Primary Phone Number<span className="text-red-500 font-bold ml-1">*</span></Label>
          <div className="relative">
            <PhoneInput
              international
              defaultCountry="IN"
              value={getCurrentPhoneNumber('primary')}
              onChange={(value) => handlePhoneNumberChange(value, 'primary')}
              className="phone-input-custom-style rounded-xl text-sm font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-4 h-11 text-gray-900 dark:text-white"
              placeholder="Enter primary phone number"
            />
          </div>
        </div>

        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="secondaryPhoneNumber" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Secondary Phone Number</Label>
          <div className="relative">
            <PhoneInput
              international
              defaultCountry="IN"
              value={getCurrentPhoneNumber('secondary')}
              onChange={(value) => handlePhoneNumberChange(value, 'secondary')}
              className="phone-input-custom-style rounded-xl text-sm font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 px-4 h-11 text-gray-900 dark:text-white"
              placeholder="Enter secondary phone number"
            />
          </div>
        </div>

        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Email Address<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={vendorData.email}
            onChange={handleInputChange}
            required
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="secondaryEmail" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Secondary Email</Label>
          <Input
            id="secondaryEmail"
            type="email"
            name="secondary_email"
            value={vendorData.secondary_email}
            onChange={handleInputChange}
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </>
  );
};

export default VendorPersonalDetails;
