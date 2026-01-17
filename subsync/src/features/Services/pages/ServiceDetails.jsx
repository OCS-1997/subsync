import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { 
    Package, Tag, Percent, Info, ShoppingCart, TrendingUp, 
    Calendar, Clock, Building2, FileText, CheckCircle2,
    Briefcase, Layers, Sparkles, AlertCircle, Edit2
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { cn } from "@/lib/utils";

import { fetchServiceById, clearCurrentService } from "@/features/Services/serviceSlice.js";

function ServiceDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentService, loading, error } = useSelector((state) => state.services);

  useEffect(() => {
    if (id) {
      dispatch(fetchServiceById(id));
    }
    return () => {
        dispatch(clearCurrentService());
    };
  }, [id, dispatch]);

  const handleEdit = () => {
    const userSegment = location.pathname.split("/")[1];
    navigate(`/${userSegment}/dashboard/services/${id}/edit`, { state: { editableServiceId: id } });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return "-";
    }
  };

  if (loading) return <SkeletonLoader />;
  if (error) return <ErrorMessage message={error} />;
  if (!currentService) return <p className="p-12 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Service payload not found.</p>;

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title={currentService.service_name}
        description={`Inventory ID: ${currentService.service_id}`}
        breadcrumbItems={[
          { label: "Services", href: `/${location.pathname.split('/')[1]}/dashboard/services` },
          { label: currentService.service_name }
        ]}
        actions={
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4 mr-3" />
            Edit Service
          </Button>
        }
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12"
      >
        <div className="lg:col-span-2 space-y-8">
            {/* Identity Segment */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <Badge className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-500 border-none">
                            {currentService.tax_preference}
                        </Badge>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                             Updated: {formatDate(currentService.updated_at)}
                        </span>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Package className="h-8 w-8 text-blue-500" />
                        Service Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem icon={Tag} label="Service Name" value={currentService.service_name} largeValue />
                        <DetailItem icon={Layers} label="SKU" value={currentService.stock_keepers_unit} isMono />
                        <DetailItem icon={Percent} label="Tax Preference" value={currentService.tax_preference} />
                        <DetailItem icon={Briefcase} label="Item Group" value={currentService.item_group_name} />
                    </div>

                    {currentService.preferred_vendor_name && currentService.preferred_vendor_name !== "N/A" && (
                        <>
                            <Separator className="my-8 opacity-50" />
                            <div className="flex items-center gap-3 mb-6">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Vendor Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <DetailItem 
                                    label="Preferred Vendor" 
                                    value={
                                        currentService.preferred_vendor_id ? (
                                            <Link 
                                                to={`/${location.pathname.split('/')[1]}/dashboard/vendors/${currentService.preferred_vendor_id}`}
                                                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
                                            >
                                                {currentService.preferred_vendor_name}
                                            </Link>
                                        ) : currentService.preferred_vendor_name
                                    } 
                                />
                                <DetailItem label="Vendor ID" value={currentService.preferred_vendor_id} isMono />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Financial Segments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sales Profile */}
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                            Sales Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-6">
                        <div className="space-y-6">
                            <DetailItem 
                                label="Selling Price" 
                                value={currentService.sales_info?.price ? `Rs.${parseFloat(currentService.sales_info.price).toLocaleString('en-IN')}` : null} 
                                largeValue 
                                valueColor="text-emerald-500"
                            />
                            <DetailItem label="Account" value={currentService.sales_info?.account} />
                            {currentService.sales_info?.description && (
                                <div className="pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                                        "{currentService.sales_info.description}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Purchase Profile */}
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-amber-500">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <ShoppingCart className="h-6 w-6 text-amber-500" />
                            Purchase Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-6">
                        <div className="space-y-6">
                            <DetailItem 
                                label="Cost Price" 
                                value={currentService.purchase_info?.price ? `Rs.${parseFloat(currentService.purchase_info.price).toLocaleString('en-IN')}` : null} 
                                largeValue 
                                valueColor="text-amber-500"
                            />
                            <DetailItem label="Account" value={currentService.purchase_info?.account} />
                            {currentService.purchase_info?.description && (
                                <div className="pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                                    <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                                        "{currentService.purchase_info.description}"
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
                        Tax Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <TaxCard type="intra" title="Intra-State (CGST/SGST)" details={currentService.tax_details?.intra} />
                        <TaxCard type="inter" title="Inter-State (IGST)" details={currentService.tax_details?.inter} />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Sidebar Segment */}
        <div className="space-y-8">
            <Card className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl shadow-blue-500/20 overflow-hidden">
                <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/70">Inventory Hub</p>
                            <h4 className="text-lg font-black tracking-tight">Quick Controls</h4>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Button
                            onClick={handleEdit}
                            className="w-full justify-between bg-white text-blue-600 hover:bg-blue-50 rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                            Modify Service
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Record Information</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-4">
                    <MetaRow label="Created At" value={formatDate(currentService.created_at)} />
                    <MetaRow label="Updated At" value={formatDate(currentService.updated_at)} />
                    <MetaRow label="Visibility" value="Marketplace Active" />
                    <MetaRow label="Asset ID" value={currentService.service_id} isMono />
                </CardContent>
            </Card>
        </div>
      </motion.div>
    </div>
  );
}

function TaxCard({ title, details }) {
    if (!details || parseFloat(details.tax_rate || details.rate || 0) === 0) {
        return (
            <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-blue-500/20 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">{title}</p>
                <div className="text-xl font-black text-slate-400">EXEMPT (0%)</div>
            </div>
        );
    }

    const isGroup = !!details.members;

    return (
        <div className="p-6 rounded-[2rem] bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
                <Badge className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 border-none">
                    {isGroup ? "Group Tax" : "Simple Tax"}
                </Badge>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                {parseFloat(details.tax_rate || details.rate).toFixed(1)}%
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-4 truncate">
                {details.tax_name}
            </p>

            {isGroup && details.members && (
                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {details.members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400 uppercase">{member.tax_name}</span>
                            <span className="text-slate-900 dark:text-white">{member.tax_rate}%</span>
                        </div>
                    ))}
                </div>
            )}
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

function ErrorMessage({ message }) {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Telemetry Error</h3>
      <p className="mt-2 text-sm font-bold text-slate-500">{message}</p>
      <Button 
        variant="outline" 
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl font-black uppercase tracking-widest text-[10px] h-12"
      >
        Retry Registry Scan
      </Button>
    </div>
  );
}

const SkeletonLoader = () => (
    <div className="container py-8 max-w mx-auto px-4 md:px-0 space-y-8">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="h-[400px] bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />
                <div className="h-[300px] bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />
            </div>
            <div className="h-[500px] bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] animate-pulse" />
        </div>
    </div>
);

export default ServiceDetails;
