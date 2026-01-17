import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
    Package, Tag, Percent, Info, ShoppingCart, TrendingUp, 
    Calendar, Clock, User, Building2, FileText, CheckCircle2,
    DollarSign, Briefcase, Layers, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { cn } from "@/lib/utils";

import { format } from "date-fns";
import api from "@/lib/axiosInstance.js";

function DisplayService({ serviceDetails }) {
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loadingTaxData, setLoadingTaxData] = useState(true);

  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        const [groupsRes, taxesRes] = await Promise.all([
          api.get("/tax-groups?include=members"),
          api.get("/all-taxes")
        ]);
        setTaxGroups(groupsRes.data.groups || []);
        setTaxes(taxesRes.data.taxes || []);
      } catch (error) {
        console.error("Error fetching tax data:", error);
      } finally {
        setLoadingTaxData(false);
      }
    };

    fetchTaxData();
  }, []);

  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), includeTime ? "dd MMM yyyy, hh:mm a" : "dd MMM yyyy");
    } catch (err) {
      return "-";
    }
  };

  const renderTaxDetail = (type, title, textColor) => {
    const details = serviceDetails.tax_details?.[type];

    if (!details || parseFloat(details.tax_rate || 0) === 0) {
      return (
        <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
          <div className="text-xl font-black text-slate-400">EXEMPT (0%)</div>
        </div>
      );
    }

    const isGroup = !!details.members;

    return (
      <div className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-blue-500/30 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
            <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-none")}>
                {isGroup ? "Group Tax" : "Simple Tax"}
            </Badge>
        </div>
        <div className={cn("text-3xl font-black mb-1 hover:scale-105 transition-transform cursor-default", textColor)}>
          {parseFloat(details.tax_rate).toFixed(1)}%
        </div>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4 truncate">
          {isGroup ? details.group_name : details.tax_name}
        </p>

        {isGroup && details.members && (
          <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-slate-800">
            {details.members.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400 uppercase">{member.tax_type}</span>
                <span className="text-slate-900 dark:text-white">{member.tax_rate}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Core Identity Segment */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="p-8 pb-0">
                <div className="flex items-center justify-between mb-4">
                    <Badge className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-blue-500/20">
                        {serviceDetails.tax_preference}
                    </Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {formatDate(serviceDetails.updated_at)}
                    </span>
                </div>
                <CardTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Package className="h-8 w-8 text-blue-500" />
                    Service Inventory Detail
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DetailItem icon={Tag} label="Service Name" value={serviceDetails.service_name} largeValue />
                    <DetailItem icon={FileText} label="Service ID" value={serviceDetails.service_id} isMono />
                    <DetailItem icon={Layers} label="SKU / Reference" value={serviceDetails.stock_keepers_unit} isMono />
                    <DetailItem icon={Briefcase} label="Item Group" value={serviceDetails.item_group_name} />
                </div>
                
                {serviceDetails.preferred_vendor_name && serviceDetails.preferred_vendor_name !== "N/A" && (
                    <>
                        <Separator className="my-8 opacity-50" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <DetailItem icon={Building2} label="Preferred Vendor" value={serviceDetails.preferred_vendor_name} />
                            <DetailItem icon={Info} label="Vendor ID" value={serviceDetails.preferred_vendor_id} isMono />
                        </div>
                    </>
                )}
            </CardContent>
          </Card>

          {/* Commerce Segments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sales Card */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                        Sales Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="space-y-6">
                        <DetailItem 
                            label="Selling Price" 
                            value={serviceDetails.sales_info?.selling_price ? `Rs.${parseFloat(serviceDetails.sales_info.selling_price).toLocaleString('en-IN')}` : null} 
                            largeValue 
                            valueColor="text-emerald-500"
                        />
                        <DetailItem label="Account" value={serviceDetails.sales_info?.sales_account} />
                        {serviceDetails.sales_info?.description && (
                             <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                                    {serviceDetails.sales_info.description}
                                </p>
                             </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-amber-500">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <ShoppingCart className="h-6 w-6 text-amber-500" />
                        Purchase Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="space-y-6">
                        <DetailItem 
                            label="Purchase Price" 
                            value={serviceDetails.purchase_info?.purchase_price ? `Rs.${parseFloat(serviceDetails.purchase_info.purchase_price).toLocaleString('en-IN')}` : null} 
                            largeValue 
                            valueColor="text-amber-500"
                        />
                        <DetailItem label="Account" value={serviceDetails.purchase_info?.purchase_account} />
                        {serviceDetails.purchase_info?.description && (
                             <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                                    {serviceDetails.purchase_info.description}
                                </p>
                             </div>
                        )}
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Taxation Segment */}
          <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-0">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Percent className="h-6 w-6 text-indigo-500" />
                    Taxation Parameters
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {renderTaxDetail('intra', 'Intra-State (CGST/SGST)', 'text-blue-500')}
                    {renderTaxDetail('inter', 'Inter-State (IGST)', 'text-indigo-500')}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Action & Metadata Sidebar */}
        <div className="space-y-8">
          <Card className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-500/20 overflow-hidden">
            <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/70">Management</p>
                        <h4 className="text-lg font-black tracking-tight">Quick Actions</h4>
                    </div>
                </div>
                <div className="space-y-4">
                    <Link
                        to="edit"
                        state={{ editableServiceId: serviceDetails.service_id }}
                        className="block"
                    >
                        <Button className="w-full justify-between bg-white text-blue-600 hover:bg-blue-50 rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest transition-all">
                            Edit Service
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
            <CardHeader className="p-8 pb-0">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master Governance</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-6 space-y-4">
                <MetaRow label="Catalog Entry" value={formatDate(serviceDetails.created_at)} />
                <MetaRow label="Last Analysis" value={formatDate(serviceDetails.updated_at)} />
                <MetaRow label="Visibility" value="Marketplace Active" />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, isMono = false, largeValue = false, fallback = '-', valueColor }) {
    const displayValue = (value === null || value === undefined || value === '') ? fallback : value;
    
    return (
        <div className="group">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                {Icon && <Icon className="h-3.5 w-3.5 opacity-50" />}
                {label}
            </p>
            <div className="flex items-center gap-2">
                <span className={cn(
                    "font-black tracking-tight transition-colors",
                    largeValue ? "text-xl" : "text-[15px]",
                    isMono && "font-mono",
                    valueColor || "text-slate-800 dark:text-slate-200",
                    displayValue === fallback && "text-slate-400 font-bold"
                )}>
                    {displayValue}
                </span>
            </div>
        </div>
    );
}

function MetaRow({ label, value, isMono = false }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
            <span className={cn("text-[11px] font-bold text-slate-600 dark:text-slate-300", isMono && "font-mono")}>{value}</span>
        </div>
    );
}

export default DisplayService;
