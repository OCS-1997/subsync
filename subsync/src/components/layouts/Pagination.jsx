import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ currentPage, setCurrentPage, totalPages, totalRecords }) {
  const safeTotalPages = Math.max(1, totalPages);
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setInputPage(value);
  };

  const handleInputBlur = () => {
    let page = Number(inputPage);
    if (!page || page < 1) page = 1;
    if (page > safeTotalPages) page = safeTotalPages;
    setCurrentPage(page);
    setInputPage(page);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-10 px-6 border-t border-gray-100 dark:border-slate-800 bg-transparent transition-all duration-500">
      {/* Information Section */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            Navigating Indices
          </p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Page <span className="text-blue-600 dark:text-blue-400">{currentPage}</span> of <span className="text-slate-900 dark:text-white">{safeTotalPages}</span>
            {typeof totalRecords === "number" && (
              <span className="ml-2 pl-2 border-l border-gray-200 dark:border-slate-800">
                Total Records: <span className="text-slate-900 dark:text-white">{totalRecords}</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Control Section */}
      <div className="flex items-center gap-3 p-1.5 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 dark:border-slate-800 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="h-10 w-10 rounded-xl disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="First Page"
          >
            <ChevronsLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
        </div>

        {/* Jump to Page Input */}
        <div className="flex items-center gap-2 px-4 h-10 bg-blue-600/5 dark:bg-blue-600/10 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-60">Go To</span>
          <input
            type="text"
            value={inputPage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-8 bg-transparent text-center text-sm font-black text-blue-600 dark:text-blue-400 focus:outline-none placeholder-blue-300 dark:placeholder-blue-900"
          />
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= safeTotalPages}
            className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-400"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(safeTotalPages)}
            disabled={currentPage >= safeTotalPages}
            className="h-10 w-10 rounded-xl disabled:opacity-20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Last Page"
          >
            <ChevronsRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
