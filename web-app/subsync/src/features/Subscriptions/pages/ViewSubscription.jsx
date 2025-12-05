import { Mail, Edit, Trash2, Globe2, Calendar, IndianRupee, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import Separator from "../components/Separator.jsx";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function StatusPill({ status }) {
  const variant =
    status === "Active"
      ? "secondary"
      : status === "Expired"
        ? "destructive"
        : "default";
  return <Badge variant={variant}>{status || "Unknown"}</Badge>;
}

export default function ViewSubscription({
  subscription,
  onEdit,
  onDelete,
  showActions = true,
}) {
  if (!subscription) return null;

  const {
    sub_id,
    domain_name,
    customer_name,
    start_date,
    end_date,
    status,
    subtotal,
    tax_total,
    total,
    discount_type,
    discount_value,
    rounding,
    notes,
    email_list,
    currency,
    items = [],
    created_at,
    updated_at,
  } = subscription;

  const currencyLabel = currency || "INR";

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                <Globe2 className="w-5 h-5" />
              </span>
              <span className="text-xl font-semibold">
                {domain_name || "Unnamed Subscription"}
              </span>
            </CardTitle>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Subscription ID:{" "}
              <span className="font-mono font-medium">{sub_id}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Customer: <span className="font-medium">{customer_name}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={status} />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              <div>Start: {formatDate(start_date)}</div>
              <div>End: {end_date ? formatDate(end_date) : "Never"}</div>
            </div>
            {showActions && (
              <div className="flex gap-2 mt-2">
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: services & financials */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="w-4 h-4" />
                Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(!items || items.length === 0) ? (
                <p className="text-sm text-gray-500">No services attached.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 pr-4 font-semibold">Service</th>
                        <th className="py-2 pr-4 font-semibold text-right">
                          Qty
                        </th>
                        <th className="py-2 pr-4 font-semibold text-right">
                          Rate ({currencyLabel})
                        </th>
                        <th className="py-2 pr-4 font-semibold text-right">
                          Tax %
                        </th>
                        <th className="py-2 pr-0 font-semibold text-right">
                          Amount ({currencyLabel})
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={item.item_id || `${item.service_id}-${item.service_name}`}
                          className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <td className="py-2 pr-4">
                            {item.service_name || "Unknown Service"}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {item.quantity}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {Number(item.rate || 0).toFixed(2)}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            {Number(item.tax_percent || 0).toFixed(2)}
                          </td>
                          <td className="py-2 pr-0 text-right">
                            {Number(item.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IndianRupee className="w-4 h-4" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Currency</p>
                  <p className="font-medium">{currencyLabel}</p>
                </div>
                <div>
                  <p className="text-gray-500">Subtotal</p>
                  <p className="font-medium">
                    {currencyLabel}{" "}
                    {subtotal != null
                      ? Number(subtotal).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tax Total</p>
                  <p className="font-medium">
                    {currencyLabel}{" "}
                    {tax_total != null
                      ? Number(tax_total).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Discount</p>
                  <p className="font-medium">
                    {discount_type === "percent"
                      ? `${Number(discount_value || 0).toFixed(2)}%`
                      : `${currencyLabel} ${Number(
                        discount_value || 0
                      ).toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Rounding</p>
                  <p className="font-medium">
                    {currencyLabel}{" "}
                    {rounding != null
                      ? Number(rounding).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Grand Total</p>
                  <p className="font-semibold text-lg">
                    {currencyLabel}{" "}
                    {total != null ? Number(total).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: additional info */}
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />
                Additional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Created At</p>
                <p className="font-medium">
                  {created_at
                    ? new Date(created_at).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {updated_at
                    ? new Date(updated_at).toLocaleString()
                    : "-"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Notes
                </p>
                <p className="mt-1 text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                  {notes || "No notes added."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="w-4 h-4" />
                Notification Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              {email_list && email_list.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {email_list.map((em, idx) => (
                    <Badge key={idx} variant="outline">
                      {em}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No notification emails configured.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




