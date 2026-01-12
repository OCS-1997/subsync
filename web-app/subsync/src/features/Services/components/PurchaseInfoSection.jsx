import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ManageVendorsModal from './ManageVendorsModal';

const PurchaseInfoSection = ({ data, setData, vendors = [], isLoadingVendors, vendorsError, fetchVendors }) => {

  const handleVendorChange = (selectedValue) => {
    setData({ ...data, vendor: selectedValue });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="cost-price" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Cost Price <span className="text-red-500 font-bold ml-1">*</span></Label>
        <Input
          id="cost-price"
          type="number"
          value={data.price}
          onChange={(e) => setData({ ...data, price: e.target.value })}
          className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Description</Label>
        <Input
          id="description"
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          placeholder="For purchase orders..."
        />
      </div>

      <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
        <Label htmlFor="preferred-vendor" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Preferred Vendor <span className="text-red-500 font-bold ml-1">*</span></Label>
        <div className="flex gap-2">
          <Select
            value={data.vendor || ""}
            onValueChange={handleVendorChange}
            disabled={isLoadingVendors || vendorsError}
          >
            <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white flex-1" id="preferred-vendor">
              <SelectValue placeholder={isLoadingVendors ? "Loading vendors..." : vendorsError ? "Error loading vendors" : "Select a vendor"} />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              {vendorsError ? (
                <SelectItem value="error" disabled>Error loading vendors</SelectItem>
              ) : vendors.length === 0 && !isLoadingVendors ? (
                <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
              ) : (
                vendors.map((vendor) => (
                  <SelectItem key={vendor.vendor_id} value={String(vendor.vendor_id)} className="text-xs font-bold">
                    {vendor.display_name || `${vendor.first_name} ${vendor.last_name}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <ManageVendorsModal onVendorsUpdated={fetchVendors} />
        </div>
        {vendorsError && (
          <p className="text-red-500 text-sm mt-1">Failed to load vendors. Please try again.</p>
        )}
      </div>
    </div>
  );
};

export default PurchaseInfoSection;
