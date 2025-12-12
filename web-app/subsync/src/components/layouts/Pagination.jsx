import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";


import { Button } from "@/components/ui/button";

function Pagination({ currentPage, setCurrentPage, totalPages, totalRecords }) {
  // Ensure totalPages is at least 1
  const safeTotalPages = Math.max(1, totalPages);
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/, "");
    setInputPage(value);
  }

  const handleInputBlur = () => {
    let page = Number(inputPage);
    if (!page || page < 1) page = 1;
    if (page > safeTotalPages) page = safeTotalPages;
    setCurrentPage(page);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  return (
    <div className="flex mt-4 items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
      <div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Showing page{" "}
          <input
            type="number"
            min={1}
            max={safeTotalPages}
            value={inputPage}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-16 p-1 border m-1.5 border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:outline-none transition-all duration-200 ease-in-out"
            style={{
              width: "3rem",

            }}
          />
          of <span className="m-1 font-medium dark:text-white">{safeTotalPages}</span>
          {typeof totalRecords === "number" && (
            <> &nbsp;|&nbsp; Total records: <span className="font-medium dark:text-white">{totalRecords}</span></>
          )}
        </p>
      </div>
      <nav className="inline-flex items-center gap-2" aria-label="Pagination">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-full"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          className="rounded-full"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </nav>
    </div>
  );
}

export default Pagination;
