import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button.jsx";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table.jsx";

function GenericTable({ headers, data, primaryKey = "id", sortBy, sortOrder, onSort }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-blue-500 text-primary-foreground rounded-lg">
          <TableRow>
            {headers.map((header) => (
              <TableCell
                as="th"
                className={`px-4 py-2 text-left font-semibold cursor-pointer select-none ${
                  sortBy === header.key ? "bg-blue-700 text-white" : ""
                }`}
                key={header.key}
                onClick={() => onSort && onSort(header.key)}
              >
                <span className="flex items-center gap-1">
                  {header.label}
                  {sortBy === header.key && (
                    sortOrder === "asc" ? <ArrowUp className="w-3 h-3 fill-current" /> : <ArrowDown className="w-3 h-3 fill-current" />
                  )}
                </span>
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item) => (
            <TableRow key={item[primaryKey]}>
              {headers.map((header) => (
                <TableCell
                  key={`${item[primaryKey]}-${header.key}`}
                  className={
                    "px-1.5 py-2 text-left text-wrap " +
                    (header.key === "customer_status" || header.key === "vendor_status"
                      ? item[header.key] === "Active"
                        ? "text-green-500 font-bold"
                        : item[header.key] === "Inactive"
                        ? "text-red-500 font-bold"
                        : ""
                      : "")
                  }
                >
                  {item[header.key] || "N/A"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default GenericTable;