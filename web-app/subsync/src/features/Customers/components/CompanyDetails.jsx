import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CompanyDetails = ({ customerData, handleInputChange, isVendor = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-8">
      <div className="flex flex-col gap-2">
        <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Company Name<span className="text-red-500 font-bold ml-1">*</span></Label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          value={customerData.companyName}
          onChange={handleInputChange}
          required
          className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
          {isVendor ? "Vendor" : "Customer"} Display Name<span className="text-red-500 font-bold ml-1">*</span>
        </Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          value={customerData.displayName}
          onChange={handleInputChange}
          required
          className="rounded-xl h-11 px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  );
};

export default CompanyDetails;
