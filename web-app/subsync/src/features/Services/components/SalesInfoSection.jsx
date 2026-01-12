import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SalesInfoSection = ({ data, setData }) => (
  <div className="space-y-6">
    <div>
      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Selling Price <span className="text-red-500 font-bold ml-1">*</span></Label>
      <Input
        type="number"
        value={data.price}
        onChange={(e) => setData({ ...data, price: e.target.value })}
        className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
      />
    </div>

    <div>
      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Description</Label>
      <Input
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
        placeholder="Short description for invoices..."
      />
    </div>
  </div>
)

export default SalesInfoSection
