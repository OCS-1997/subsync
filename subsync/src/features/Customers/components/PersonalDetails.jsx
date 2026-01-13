import { parsePhoneNumberFromString } from "libphonenumber-js";
import PhoneInput from "react-phone-number-input";
import Select from "react-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import 'react-phone-number-input/style.css';

const PersonalDetails = ({ customerData, handleInputChange, handleSelectChange, handleStatusChange, isVendor = false }) => {

  const getCurrentPhoneNumber = (type = 'primary') => {
    const phoneNumber = type === 'primary' ? customerData.phoneNumber : customerData.secondaryPhoneNumber;
    if (customerData.country_code && phoneNumber) {
      if (customerData.country_code.startsWith('+')) {
        return `${customerData.country_code}${phoneNumber}`;
      }
      return `+${customerData.country_code}${phoneNumber}`;
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
          target: { name: type === 'primary' ? "phoneNumber" : "secondaryPhoneNumber", value: phoneNumberObj.nationalNumber || "" }
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
  const selectedSalutation = salutationOptions.find(option => option.value === customerData.salutation) || salutationOptions[0];

  // Handle both customerStatus and vendorStatus
  const statusField = isVendor ? 'vendorStatus' : 'customerStatus';
  const currentStatus = customerData[statusField] || "Active";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
        <div className="flex flex-col md:col-span-12">
          <Label htmlFor="customer-status" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">{isVendor ? "Vendor" : "Customer"} Status</Label>
          <div className="inline-flex rounded-xl shadow-sm w-max p-1 bg-gray-100 dark:bg-slate-800/50" role="group">
            <Button
              id="tbg-radio-1"
              type="button"
              className={`rounded-lg px-6 h-9 font-bold text-xs transition-all ${currentStatus === "Active" ? 'bg-green-600 text-white shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-green-600'}`}
              onClick={() => handleStatusChange("Active")}
            >
              Active
            </Button>
            <Button
              id="tbg-radio-2"
              type="button"
              className={`rounded-lg px-6 h-9 font-bold text-xs transition-all ${currentStatus === "Inactive" ? 'bg-red-600 text-white shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-red-600'}`}
              onClick={() => handleStatusChange("Inactive")}
            >
              Inactive
            </Button>
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
            placeholder="Select Salutation"
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
              valueContainer: (base) => ({
                ...base,
                padding: "0 4px",
              }),
              singleValue: (base) => ({
                ...base,
                color: "hsl(var(--foreground))",
                fontWeight: "600",
              }),
              input: (base) => ({
                ...base,
                color: "hsl(var(--foreground))",
                margin: 0,
                padding: 0,
              }),
              indicatorSeparator: () => ({
                display: "none",
              }),
              dropdownIndicator: (base) => ({
                ...base,
                padding: "0 4px",
                color: "hsl(var(--muted-foreground))",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "hsl(var(--popover))",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                zIndex: 20,
                border: "1px solid hsl(var(--border))",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "hsl(var(--accent))" : "transparent",
                color: state.isFocused ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                padding: "10px 12px",
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
            value={customerData.firstName}
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
            value={customerData.lastName}
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
              className="phone-input-custom-style min-h-[2.75rem] shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4"
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
              className="phone-input-custom-style min-h-[2.75rem] shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4"
              placeholder="Enter secondary phone number (optional)"
            />
          </div>
        </div>

        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Email<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="email"
            type="email"
            name="email"
            value={customerData.email}
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
            value={customerData.secondary_email}
            onChange={handleInputChange}
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </>
  );
};

export default PersonalDetails;
