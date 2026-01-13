import Select from "react-select";
import countryList from "react-select-country-list";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { indianStates } from "@/features/Customers/data/statesOfIndia.js";

const VendorAddressSection = ({
  vendorData = {},
  handleInputChange,
  handleSelectChange,
  countries,
  states = [],
  setStates = () => { }, // fallback to no-op if not provided
  isIndia = false, // new prop
}) => {
  const countryOptions = countries && Array.isArray(countries) && countries.length > 0
    ? countries
    : countryList().getData();

  const handleCountryChange = (selectedOption) => {
    handleSelectChange("address.country", selectedOption);
    handleSelectChange("address.state", null);

    // Always update states if setStates is available
    if (selectedOption && selectedOption.value === "IN") {
      setStates(indianStates);
    } else {
      setStates([]);
    }
  };

  const handleStateChange = (selectedOption) => {
    handleSelectChange("address.state", selectedOption);
  };

  const address = vendorData.address || {};
  // Handle both object and string values for country
  const getCountryValue = () => {
    if (!address.country) return "IN"; // Default to India

    // If country is an object with value property
    if (typeof address.country === 'object' && address.country.value) {
      return address.country.value;
    }

    // If country is a string
    return address.country;
  };

  const countryValue = getCountryValue();

  // Handle both object and string values for state
  const getStateValue = () => {
    if (!address.state) return null;

    // If state is an object with value property
    if (typeof address.state === 'object' && address.state.value) {
      return address.state.value;
    }

    // If state is a string or has a different structure
    return address.state;
  };

  const stateValue = getStateValue();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
        <div className="flex flex-col md:col-span-12">
          <Label htmlFor="addressLine" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Address Line<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="addressLine"
            type="text"
            name="address.addressLine"
            value={address.addressLine || ""}
            onChange={handleInputChange}
            required
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="country" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">
            Country<span className="text-red-500 font-bold ml-1">*</span>
          </Label>
          <Select
            id="country"
            placeholder="Select Country"
            options={countryOptions}
            value={Array.isArray(countryOptions)
              ? countryOptions.find(option => {
                // Handle both object and string values
                if (typeof address.country === 'object' && address.country.value) {
                  return option.value === address.country.value;
                }
                return option.value === countryValue;
              }) || null
              : null}
            onChange={selectedOption => {
              handleSelectChange("address.country", selectedOption);
              handleSelectChange("address.state", null);
              if (selectedOption && selectedOption.value === "IN") {
                setStates(indianStates);
              } else {
                setStates([]);
              }
            }}
            className="react-select-container"
            classNamePrefix="react-select"
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
              singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))", fontWeight: "600" }),
              input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
              menu: (base) => ({ ...base, backgroundColor: "hsl(var(--popover))", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "hsl(var(--accent))" : "transparent",
                color: state.isFocused ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
              }),
            }}
          />
        </div>

        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="state" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">
            State<span className="text-red-500 font-bold ml-1">*</span>
          </Label>
          {isIndia ? (
            <Select
              id="state"
              placeholder="Select State"
              options={states}
              value={Array.isArray(states)
                ? states.find(option => {
                  // Handle both object and string values
                  if (typeof address.state === 'object' && address.state) {
                    return option.value === address.state.value;
                  }
                  return option.value === stateValue;
                }) || null
                : null}
              onChange={handleStateChange}
              className="react-select-container"
              classNamePrefix="react-select"
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
                singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))", fontWeight: "600" }),
                input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
                menu: (base) => ({ ...base, backgroundColor: "hsl(var(--popover))", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "hsl(var(--accent))" : "transparent",
                  color: state.isFocused ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                }),
              }}
            />
          ) : (
            <Input
              id="state"
              type="text"
              name="address.state"
              value={typeof address.state === 'object' && address.state ? (address.state.value || address.state.label || "") : (address.state || "")}
              onChange={handleInputChange}
              required
              placeholder="Enter State/Province"
              className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-6 mb-8">
        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="city" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">City<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="city"
            type="text"
            name="address.city"
            value={address.city || ""}
            onChange={handleInputChange}
            required
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col md:col-span-6">
          <Label htmlFor="zipCode" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Zip Code<span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="zipCode"
            type="text"
            name="address.zipCode"
            value={address.zipCode || ""}
            onChange={handleInputChange}
            required
            className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </>
  );
};

export default VendorAddressSection;
