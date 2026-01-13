import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import ManageItemGroupsModal from './ManageItemGroupsModal';
import { fetchItemGroups } from "../itemGroupSlice.js";

const BasicDetailsSection = ({ formData, setFormData, serviceError }) => {
  const dispatch = useDispatch();
  const { list: itemGroups, loading: isLoadingItemGroups, error: itemGroupsError } = useSelector((state) => state.itemGroups);

  useEffect(() => {
    dispatch(fetchItemGroups());
  }, [dispatch]);

  const handleItemGroupChange = (selectedValue) => {
    setFormData({ ...formData, item_group: selectedValue });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service_name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Name <span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="service_name"
            value={formData.service_name}
            onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
            className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
          {serviceError && serviceError.includes("service with this name already exists") && (
            <p className="text-red-500 text-sm mt-1">{serviceError}</p>
          )}
        </div>
        <div>
          <Label htmlFor="SKU" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">SKU (Stock Keepers Unit) <span className="text-red-500 font-bold ml-1">*</span></Label>
          <Input
            id="SKU"
            value={formData.SKU}
            onChange={(e) => setFormData({ ...formData, SKU: e.target.value })}
            className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <Label htmlFor="tax_preference" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Tax Preference <span className="text-red-500 font-bold ml-1">*</span></Label>
          <Select
            id="tax_preference"
            onValueChange={(val) => setFormData({ ...formData, tax_preference: val })}
            defaultValue={formData.tax_preference}
          >
            <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              <SelectItem value="Taxable" className="text-xs font-bold">Taxable</SelectItem>
              <SelectItem value="Tax Exempt" className="text-xs font-bold">Tax Exempt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="item-group" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Item Group <span className="text-red-500 font-bold ml-1">*</span></Label>
          <div className="flex gap-2">
            <Select
              value={formData.item_group || ""}
              onValueChange={handleItemGroupChange}
              disabled={isLoadingItemGroups || itemGroupsError}
            >
              <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white flex-1" id="item-group">
                <SelectValue placeholder={isLoadingItemGroups ? "Loading item groups..." : itemGroupsError ? "Error loading item groups" : "Select an item group"} />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                {itemGroupsError ? (
                  <SelectItem value="error" disabled>Error loading item groups</SelectItem>
                ) : itemGroups.length === 0 && !isLoadingItemGroups ? (
                  <SelectItem value="no-item-groups" disabled>No item groups available</SelectItem>
                ) : (
                  itemGroups.map((group) => (
                    <SelectItem key={group.item_group_id} value={String(group.item_group_id)} className="text-xs font-bold">
                      {group.item_group_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <ManageItemGroupsModal onItemGroupsUpdated={() => dispatch(fetchItemGroups())} />
          </div>
          {itemGroupsError && (
            <p className="text-red-500 text-sm mt-1">Failed to load item groups. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BasicDetailsSection;
