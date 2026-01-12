import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const RemarksSection = ({ customerData, handleInputChange }) => {
  return (
    <div className="space-y-4 mb-8">
      <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2">Notes / Internal Instructions</Label>
      <Textarea
        id="notes"
        name="notes"
        rows={4}
        value={customerData.notes}
        onChange={handleInputChange}
        className="rounded-[1.5rem] px-6 py-4 text-sm font-medium bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white min-h-[150px] focus:ring-2 focus:ring-blue-500/20 transition-all"
        placeholder="Add any specific instructions or notes for this customer..."
      />
    </div>
  );
};

export default RemarksSection;
