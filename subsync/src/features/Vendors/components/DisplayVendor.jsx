import { Building2, Mail, Phone, MapPin, ClipboardList, User, ShieldCheck, Globe, CreditCard } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { cn } from "@/lib/utils";

function DisplayVendor({ vendor }) {
    if (!vendor) return null;

    const renderSectionHeader = (icon, title, color) => (
        <div className="flex items-center gap-3 mb-6">
            <div className={cn("p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 shadow-sm border border-slate-100 dark:border-slate-800", color)}>
                {icon}
            </div>
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Segment</h3>
                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{title}</p>
            </div>
        </div>
    );

    const renderDataPoint = (label, value) => (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 break-words leading-relaxed">
                {value || "—"}
            </span>
        </div>
    );

    return (
        <Accordion type="single" collapsible defaultValue="main-profile" className="w-full space-y-6">
            <AccordionItem value="main-profile" className="border-none">
                <AccordionTrigger className="hover:no-underline group p-0">
                    <div className="flex items-center gap-6 w-full bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all group-data-[state=open]:rounded-b-none group-data-[state=open]:border-b-0">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                                    {vendor.display_name}
                                </h2>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    vendor.vendor_status === "Active"
                                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                )}>
                                    {vendor.vendor_status}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                ID: {vendor.vendor_id} <span className="h-1 w-1 bg-slate-300 rounded-full" /> {vendor.company_name}
                            </p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 border-t-0 p-8 pt-2 rounded-b-[2.5rem] shadow-sm">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">

                            {/* Personal Identity */}
                            <div className="space-y-8">
                                {renderSectionHeader(<User className="w-5 h-5" />, "Corporate Representative", "text-blue-500")}
                                <div className="grid gap-6">
                                    {renderDataPoint("Full Name", `${vendor.salutation} ${vendor.first_name} ${vendor.last_name}`)}
                                    {renderDataPoint("Primary Email", vendor.primary_email)}
                                    {renderDataPoint("Phone Line", `${vendor.country_code} ${vendor.primary_phone_number}`)}
                                </div>
                            </div>

                            {/* Company Profile */}
                            <div className="space-y-8">
                                {renderSectionHeader(<ShieldCheck className="w-5 h-5" />, "Enterprise Metadata", "text-indigo-500")}
                                <div className="grid gap-6">
                                    {renderDataPoint("Legal Entity", vendor.company_name)}
                                    {renderDataPoint("GST Identification", vendor.gst_in)}
                                    {renderDataPoint("Functional Currency", vendor.currency_code)}
                                </div>
                            </div>

                            {/* Financial Flow */}
                            <div className="space-y-8">
                                {renderSectionHeader(<CreditCard className="w-5 h-5" />, "Procurement Parameters", "text-emerald-500")}
                                <div className="grid gap-6">
                                    {renderDataPoint("GST Treatment", vendor.gst_treatment)}
                                    {renderDataPoint("Tax Preference", vendor.tax_preference)}
                                    {vendor.payment_terms && renderDataPoint("Payment Protocol", `${vendor.payment_terms.term_name} (${vendor.payment_terms.days} Days)`)}
                                </div>
                            </div>

                        </div>

                        {/* Logistic & Additional Info */}
                        <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Location */}
                            <div className="space-y-6">
                                {renderSectionHeader(<MapPin className="w-5 h-5" />, "Logistic Hub", "text-rose-500")}
                                {vendor.vendor_address ? (
                                    <div className="bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed uppercase tracking-tight">
                                            {vendor.vendor_address.addressLine}<br />
                                            {vendor.vendor_address.city}, {vendor.vendor_address.state} - {vendor.vendor_address.zipCode}<br />
                                            {vendor.vendor_address.country === "IN" ? "India" : vendor.vendor_address.country}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs font-bold text-slate-400 italic">No operational address indexed.</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="space-y-6">
                                {renderSectionHeader(<ClipboardList className="w-5 h-5" />, "Internal Intelligence", "text-amber-500")}
                                <div className="bg-amber-50/20 dark:bg-amber-500/5 p-6 rounded-3xl border border-amber-100 dark:border-amber-500/10">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                        {vendor.notes || "No additional records or instructions found for this entity."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Personnel Manifest */}
                        {vendor.other_contacts && vendor.other_contacts.length > 0 && (
                            <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
                                {renderSectionHeader(<Globe className="w-5 h-5" />, "Personnel Manifest", "text-cyan-500")}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {vendor.other_contacts.map((contact, idx) => (
                                        <div key={idx} className="p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800/50 hover:border-blue-500/30 transition-all group/card">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 mb-2 block">{contact.designation || "Stakeholder"}</span>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{contact.salutation} {contact.first_name} {contact.last_name}</p>
                                            <div className="space-y-2">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <Mail className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-blue-500 transition-colors" /> {contact.email || "—"}
                                                </p>
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-slate-300 group-hover/card:text-blue-500 transition-colors" /> {contact.country_code} {contact.phone_number || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export default DisplayVendor;
