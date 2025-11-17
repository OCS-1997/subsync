import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button.jsx";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table.jsx";

function GenericTable({ headers, data, primaryKey = "id", sortBy, sortOrder, onSort }) {
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-blue-500 text-primary-foreground rounded-lg">
          <TableRow>
            {headers.map((header) => {
              const align = getAlignment(header);
              const isCenter = align === 'center';
              return (
                <TableCell
                  as="th"
                  className={`px-4 py-3 font-semibold cursor-pointer select-none whitespace-nowrap ${
                    isCenter ? 'text-center' : 'text-left'
                  } ${
                    sortBy === header.key ? "bg-blue-700 text-white" : ""
                  }`}
                  key={header.key}
                  onClick={() => onSort && onSort(header.key)}
                >
                  <span className={`flex items-center gap-1 ${isCenter ? 'justify-center' : ''}`}>
                    {header.label}
                    {sortBy === header.key && (
                      sortOrder === "asc" ? <ArrowUp className="w-3 h-3 fill-current" /> : <ArrowDown className="w-3 h-3 fill-current" />
                    )}
                  </span>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item) => (
            <TableRow key={item[primaryKey]} className={item._rowClassName || ""}>
              {headers.map((header) => {
                const align = getAlignment(header);
                const isCenter = align === 'center';
                return (
                  <TableCell
                    key={`${item[primaryKey]}-${header.key}`}
                    className={
                      `px-4 py-3 text-wrap whitespace-nowrap ${
                        isCenter ? 'text-center' : 'text-left'
                      } ` +
                      (header.key === "customer_status" || header.key === "vendor_status" || header.key === "domain_status"
                        ? item[header.key] === "Active"
                          ? "text-green-500 font-bold"
                          : item[header.key] === "Inactive" || item[header.key] === "Expired"
                          ? "text-red-500 font-bold"
                          : ""
                        : "")
                    }
                  >
                    {item[header.key] || "N/A"}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default GenericTable;