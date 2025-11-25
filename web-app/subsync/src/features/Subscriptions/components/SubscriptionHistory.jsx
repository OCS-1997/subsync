import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { History, Loader2, ArrowLeft, X } from "lucide-react";
import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table.jsx";

/**
 * Format date to: 15 Nov 2025, 10:35 AM
 */
function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;

    return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format field name for display
 */
function formatFieldName(fieldName) {
    if (!fieldName) return '-';
    return fieldName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format value for display in table
 */
function formatValue(value, fieldName) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-gray-400 italic">(empty)</span>;
    }

    // Handle dates
    if (fieldName && (fieldName.includes('date') || fieldName.includes('Date'))) {
        try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }
        } catch { }
    }

    // Handle booleans
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    // Handle numbers (currency)
    if (typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)))) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        if (fieldName && (fieldName.includes('total') || fieldName.includes('amount') || fieldName.includes('value') || fieldName.includes('rate') || fieldName.includes('subtotal') || fieldName.includes('tax'))) {
            return `₹${num.toFixed(2)}`;
        }
        return String(num);
    }

    // Handle arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-gray-400 italic">(empty)</span>;
        if (fieldName === 'email_list') {
            return (
                <div className="space-y-1">
                    {value.slice(0, 3).map((email, idx) => (
                        <div key={idx} className="text-sm">{email}</div>
                    ))}
                    {value.length > 3 && <div className="text-xs text-gray-500">+{value.length - 3} more</div>}
                </div>
            );
        }
        return `${value.length} item(s)`;
    }

    // Handle objects
    if (typeof value === 'object') {
        return <span className="text-xs text-gray-500">(complex data)</span>;
    }

    return String(value);
}

export default function SubscriptionHistory({ subId, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const limit = 50;

    useEffect(() => {
        if (!subId) return;

        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/subscriptions/${subId}/history?page=${page}&limit=${limit}`);

                if (res.data.success && res.data.data) {
                    setHistory(res.data.data.history || []);
                    setTotalRecords(res.data.data.count || 0);
                    setTotalPages(Math.ceil((res.data.data.count || 0) / limit));
                } else {
                    // Fallback for old API format
                    setHistory(res.data.history || []);
                    setTotalRecords(res.data.pagination?.totalRecords || 0);
                    setTotalPages(res.data.pagination?.totalPages || 1);
                }
            } catch (err) {
                toast.error(err.normalizedMessage || 'Failed to load history');
                setHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [subId, page]);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <History className="w-6 h-6 text-blue-600" />
                    <h2 className="text-2xl font-semibold text-gray-900">Change History</h2>
                </div>
                {onClose && (
                    <Button variant="outline" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No change history available</p>
                    <p className="text-sm mt-1">Changes to this subscription will appear here</p>
                </div>
            ) : (
                <>
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {history.length} of {totalRecords} change{totalRecords !== 1 ? 's' : ''}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableCell className="font-semibold text-gray-700">Field</TableCell>
                                        <TableCell className="font-semibold text-gray-700">From</TableCell>
                                        <TableCell className="font-semibold text-gray-700">To</TableCell>
                                        <TableCell className="font-semibold text-gray-700">Summary</TableCell>
                                        <TableCell className="font-semibold text-gray-700">Changed By</TableCell>
                                        <TableCell className="font-semibold text-gray-700">IP Address</TableCell>
                                        <TableCell className="font-semibold text-gray-700">Time</TableCell>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900">
                                                {formatFieldName(item.field_name)}
                                            </TableCell>
                                            <TableCell className="text-gray-700">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-700 text-sm">
                                                    {formatValue(item.old_value, item.field_name)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-700">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-sm">
                                                    {formatValue(item.new_value, item.field_name)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm max-w-xs">
                                                {item.summary || '-'}
                                            </TableCell>
                                            <TableCell className="text-gray-700">
                                                {item.changed_by || '-'}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {item.ip_address || '-'}
                                            </TableCell>
                                            <TableCell className="text-gray-600 text-sm">
                                                {formatDateTime(item.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
