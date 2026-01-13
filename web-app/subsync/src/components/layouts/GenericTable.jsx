import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function GenericTable({ headers, data, primaryKey = "id", sortBy, sortOrder, onSort, cellPadding = "px-8" }) {
  // Determine alignment based on header key or explicit align property
  const getAlignment = (header) => {
    if (header.align) return header.align;
    // Auto-detect: center for numbers, dates, quantities, rates, prices
    const centerKeys = ['quantity', 'rate', 'price', 'amount', 'total', 'subtotal', 'tax', 'discount',
      'created_at', 'updated_at', 'start_date', 'end_date', 'registration_date',
      'phone_number', 'phone_with_country_code', 'primary_phone_number', 'actions'];
    return centerKeys.some(k => header.key.toLowerCase().includes(k)) ? 'center' : 'left';
  };

  return (
    <div className="w-full overflow-hidden rounded-[2rem] border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-500">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <Table className="w-full border-collapse">
          <TableHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <TableRow className="hover:bg-transparent border-none">
              {headers.map((header) => {
                const align = getAlignment(header);
                const isCenter = align === 'center';
                const isSorting = sortBy === header.key;

                return (
                  <TableCell
                    as="th"
                    key={header.key}
                    className={cn(
                      cellPadding,
                      "py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 select-none whitespace-nowrap",
                      isCenter ? "text-center" : "text-left",
                      isSorting
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                        : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400",
                      onSort ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => onSort && onSort(header.key)}
                  >
                    <div className={cn(
                      "flex items-center gap-2",
                      isCenter ? "justify-center" : "justify-start"
                    )}>
                      {header.label}
                      <AnimatePresence mode="wait">
                        {isSorting && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2 }}
                            className="text-blue-600 dark:text-blue-400"
                          >
                            {sortOrder === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow className="border-none">
                <TableCell colSpan={headers.length} className="h-40 text-center text-slate-400 font-bold text-sm bg-white dark:bg-slate-900">
                  No records matching the current parameters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, rowIndex) => (
                <TableRow
                  key={item[primaryKey] || rowIndex}
                  className={cn(
                    "group transition-all duration-300 border-b border-gray-50 dark:border-slate-800/50 last:border-none",
                    "hover:bg-blue-50/30 dark:hover:bg-blue-900/5",
                    item._rowClassName || ""
                  )}
                >
                  {headers.map((header) => {
                    const align = getAlignment(header);
                    const isCenter = align === 'center';
                    const val = item[header.key];
                    const isStatus = header.key.toLowerCase().includes('status');

                    return (
                      <TableCell
                        key={`${item[primaryKey] || rowIndex}-${header.key}`}
                        className={cn(
                          cellPadding,
                          "py-5 transition-all duration-300",
                          isCenter ? "text-center" : "text-left",
                          "text-slate-700 dark:text-slate-300 text-sm font-bold"
                        )}
                      >
                        {isStatus && typeof val === 'string' ? (
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            String(val).toLowerCase() === "active" || String(val).toLowerCase() === "published"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50"
                              : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/50"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full mr-2 animate-pulse",
                              String(val).toLowerCase() === "active" || String(val).toLowerCase() === "published" ? "bg-emerald-500" : "bg-red-500"
                            )} />
                            {val || "N/A"}
                          </span>
                        ) : (
                          <span className="opacity-80 group-hover:opacity-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {val !== undefined && val !== null ? val : "—"}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default GenericTable;
