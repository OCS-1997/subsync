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
  const s = (status || "").toLowerCase();
  let colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";

  if (s === "active") {
    colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  } else if (s === "expired") {
    colorClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800";
  } else if (s === "expiring soon" || s === "soon") {
    colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800";
  }

  return (
    <Badge
      variant="outline"
      className={`${colorClass} uppercase tracking-[0.1em] text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm`}
    >
      {status || "Unknown"}
    </Badge>
  );
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
    <div className="space-y-8 pb-20">
      {/* Primary Header Card */}
      <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)] bg-white dark:bg-slate-900 transition-all duration-500">
        <CardContent className="px-12 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-gray-100 dark:border-slate-700">
                <Globe2 className="w-10 h-10" />
              </div>
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {domain_name || "Unnamed Subscription"}
                </h2>
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-800">
                    <span className="text-blue-600 font-black">Subscription ID:</span>
                    <span className="text-slate-900 dark:text-white font-mono">{sub_id}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-slate-800">
                    <span className="text-indigo-600 font-black">Customer:</span>
                    <span className="text-slate-900 dark:text-white">{customer_name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-4">
              <StatusPill status={status} />
              {showActions && (
                <div className="flex items-center gap-3">
                  {onEdit && (
                    <Button
                      variant="outline"
                      onClick={onEdit}
                      className="rounded-2xl h-12 px-6 font-black text-[11px] uppercase tracking-widest border-gray-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-600 dark:text-slate-300"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="destructive"
                      onClick={onDelete}
                      className="rounded-2xl h-12 px-6 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-8">
          {/* Services Section */}
          <Card className="rounded-[2rem] border-none shadow-sm dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden border border-gray-50 dark:border-slate-800/50">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800 px-10 py-6">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                Services
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(!items || items.length === 0) ? (
                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  No services attached.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                        <th className="px-10 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 dark:border-slate-800">Service</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 dark:border-slate-800">Qty</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 dark:border-slate-800">Rate</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 dark:border-slate-800">Tax %</th>
                        <th className="px-10 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-gray-100 dark:border-slate-800">Amount ({currencyLabel})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {items.map((item, idx) => (
                        <tr
                          key={item.item_id || `${item.service_id}-${item.service_name}`}
                          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                        >
                          <td className="px-10 py-6">
                            <div className="font-black text-slate-900 dark:text-white text-sm tracking-tight">{item.service_name || "Unknown Service"}</div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="font-mono font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs">{item.quantity}</span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="font-bold text-slate-900 dark:text-white">{Number(item.rate || 0).toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">{Number(item.tax_percent || 0).toFixed(2)}%</span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <span className="font-black text-slate-900 dark:text-white tracking-tight">{Number(item.amount || 0).toFixed(2)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="rounded-[2rem] border-none shadow-sm dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800 px-10 py-6">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {subtotal != null ? Number(subtotal).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax Total</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {tax_total != null ? Number(tax_total).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discount</p>
                  <p className="text-2xl font-black text-emerald-500 tracking-tight">
                    {discount_type === "percent"
                      ? `${Number(discount_value || 0).toFixed(2)}%`
                      : `${Number(discount_value || 0).toFixed(2)}`}
                  </p>
                </div>
                <div className="space-y-1 border-l border-gray-100 dark:border-slate-800 pl-10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Total ({currencyLabel})</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {total != null ? Number(total).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Area */}
        <div className="xl:col-span-4 space-y-8">
          {/* Additional Info */}
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800 px-8 py-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-blue-500" />
                Additional Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Start Date</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(start_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">End Date</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{end_date ? formatDate(end_date) : "Never"}</p>
                </div>
              </div>

              <div className="p-6 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950/50 border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notes</p>
                </div>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic whitespace-pre-wrap">
                  {notes || "No notes added."}
                </p>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <span>Created At</span>
                  <span className="text-slate-900 dark:text-white">{created_at ? new Date(created_at).toLocaleString() : "-"}</span>
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span>Last Updated</span>
                  <span className="text-slate-900 dark:text-white">{updated_at ? new Date(updated_at).toLocaleString() : "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Emails */}
          <Card className="rounded-[2.5rem] border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-gray-100 dark:border-slate-800 px-8 py-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                <Mail className="w-4 h-4 text-indigo-500" />
                Notification Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {email_list && email_list.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {email_list.map((em, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="rounded-xl border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 px-4 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      {em}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/30 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  No notification emails configured.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}




