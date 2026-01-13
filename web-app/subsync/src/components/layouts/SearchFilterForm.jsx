import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function SearchFilterForm({ search, setSearch, handleSearch, className, placeholder = "Search archived subscriptions..." }) {
  return (
    <div className={cn("w-full flex items-center h-full relative group", className)}>
      <div className="absolute left-0 pl-1 pointer-events-none">
        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch && handleSearch(e)}
        placeholder={placeholder}
        className="w-full h-full pl-10 pr-4 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium transition-all"
      />
    </div>
  );
}

export default SearchFilterForm;
