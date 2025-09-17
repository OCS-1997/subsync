import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VendorCompanyDetails = ({ vendorData, handleInputChange, isVendor = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyName">Company Name<span className="text-red-800">*</span></Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          value={vendorData.companyName}
          onChange={handleInputChange}
          required
          className="text-base py-3 px-4 rounded-xl border border-gray-300"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">
          {isVendor ? "Vendor" : "Customer"} Display Name<span className="text-red-800">*</span>
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          value={vendorData.displayName}
          onChange={handleInputChange}
          required
          className="text-base py-3 px-4 rounded-xl border border-gray-300"
        />
      </div>
    </div>
  );
};

export default VendorCompanyDetails;
