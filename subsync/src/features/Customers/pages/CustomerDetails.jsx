import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
    ArrowLeft, Edit2, User, Mail, Phone, Building2, MapPin, 
    CreditCard, Receipt, FileText, Globe, Clock, History, 
    AtSign, PhoneCall, ChevronRight, Briefcase, PlusCircle,
    BadgeAlert, ShieldCheck, Banknote, Sparkles, ChevronDown, ChevronUp, Layers, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { cn } from "@/lib/utils";

import { fetchCustomerById, clearCustomerState } from "@/features/Customers/customerSlice.js";
import api from "@/lib/axiosInstance.js";
import BentoGrid from "@/features/Dashboard/components/BentoGrid";
import BentoCard from "@/features/Dashboard/components/BentoCard";

function CustomerDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentCustomer, loading, error } = useSelector((state) => state.customers);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (id) {
      dispatch(fetchCustomerById(id));
    }
    return () => {
      dispatch(clearCustomerState());
    };
  }, [id, dispatch]);

  const [subscriptions, setSubscriptions] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [expandedSubs, setExpandedSubs] = useState({});

  useEffect(() => {
    async function loadData() {
      if (id) {
        setLoadingDetails(true);
        try {
          // Fetch subscriptions for this customer ID
          const subRes = await api.get('/subscriptions', {
            params: {
              searchType: 's.customer_id',
              search: id,
              limit: 'all'
            }
          });
          setSubscriptions(subRes.data?.dataArray || []);

          // Fetch all services to map credit hours
          const serviceRes = await api.get('/all-services?limit=1000');
          setServices(serviceRes.data?.services || serviceRes.data?.dataArray || []);
        } catch (err) {
          console.error("Error loading customer subscription details:", err);
        } finally {
          setLoadingDetails(false);
        }
      }
    }
    loadData();
  }, [id]);

  const toggleSubExpanded = (subId) => {
    setExpandedSubs(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const serviceCreditMap = {};
  services.forEach(s => {
    serviceCreditMap[s.service_name] = s.service_credit || 0;
  });

  const calculateSubCredits = (sub) => {
    if (!sub.items || !Array.isArray(sub.items)) return 0;
    return sub.items.reduce((sum, item) => {
      const baseCredit = serviceCreditMap[item.service_name] || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + (baseCredit * qty);
    }, 0);
  };

  const totalCustomerCredits = subscriptions.reduce((sum, sub) => {
    return sum + calculateSubCredits(sub);
  }, 0);

  const handleEdit = () => {
    const userSegment = location.pathname.split("/")[1];
    navigate(`/${userSegment}/dashboard/customers/${id}/edit`, { state: { editableCustomerId: id } });
  };

  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  if (loading) {
    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0 space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-4">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <BentoCard loading size="lg" className="h-[400px] rounded-[2.5rem]" />
                    <BentoCard loading size="md" className="h-[300px] rounded-[2.5rem]" />
                </div>
                <div className="space-y-8">
                    <BentoCard loading size="sm" className="h-[200px] rounded-[2.5rem]" />
                    <BentoCard loading size="sm" className="h-[250px] rounded-[2.5rem]" />
                </div>
            </div>
        </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;
  if (!currentCustomer) return <p className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No customer data available.</p>;

  const breadcrumbItems = [
    { label: "Customers", href: `/${location.pathname.split('/')[1]}/dashboard/customers` },
    { label: currentCustomer?.display_name || 'Profile' }
  ];

  const statusConfig = {
    'Active': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'Inactive': { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  };

  const currentStatus = statusConfig[currentCustomer.customer_status] || statusConfig['Active'];

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title={currentCustomer.display_name}
        description={`Customer ID: ${currentCustomer.customer_id}`}
        breadcrumbItems={breadcrumbItems}
        actions={
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4 mr-3" />
            Edit Profile
          </Button>
        }
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12"
      >
        {/* Identity & Company Segment */}
        <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-4">
                        <Badge className={cn("rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest", currentStatus.bg, currentStatus.color, currentStatus.border)}>
                            {currentCustomer.customer_status}
                        </Badge>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Clock className="h-3 w-3" /> Updated: {formatDate(currentCustomer.updated_at)}
                        </span>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-blue-500" />
                        Company Portfolio
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem icon={Briefcase} label="Company Name" value={currentCustomer.company_name} largeValue />
                        <DetailItem icon={User} label="Primary Contact" value={`${currentCustomer.salutation || ''} ${currentCustomer.first_name} ${currentCustomer.last_name}`} />
                        <DetailItem icon={Mail} label="Email Address" value={currentCustomer.primary_email} isMono />
                        <DetailItem icon={Phone} label="Primary Phone" value={currentCustomer.phone_with_country_code} isMono />
                    </div>
                    
                    <Separator className="my-8 opacity-50" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem icon={AtSign} label="Display Name" value={currentCustomer.display_name} />
                        <DetailItem icon={PhoneCall} label="Secondary Phone" value={currentCustomer.secondary_phone_number} isMono />
                    </div>
                </CardContent>
            </Card>

            {/* Financial Details Segment */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-emerald-500">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Banknote className="h-6 w-6 text-emerald-500" />
                        Billing & Tax Parameters
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <DetailItem label="Currency" value={currentCustomer.currency_code} valueColor="text-emerald-500" />
                        <DetailItem label="Payment Terms" value={currentCustomer.payment_terms?.term_name} />
                        <DetailItem label="GST Treatment" value={currentCustomer.gst_treatment} />
                        
                        <Separator className="col-span-full opacity-50" />
                        
                        <DetailItem label="GSTIN" value={currentCustomer.gst_in} isMono />
                        <DetailItem label="Tax Preference" value={currentCustomer.tax_preference} />
                        {currentCustomer.tax_preference !== "Taxable" && (
                            <DetailItem label="Exemption Reason" value={currentCustomer.exemption_reason} />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Address Segment */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-rose-500" />
                        Logistical Address
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-6">
                    <div className="bg-slate-50/50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                            {currentCustomer.customer_address?.addressLine || '-'}
                        </p>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DetailItem label="City" value={currentCustomer.customer_address?.city} />
                            <DetailItem label="State" value={currentCustomer.customer_address?.state} />
                            <DetailItem label="Zip" value={currentCustomer.customer_address?.zipCode} isMono />
                            <DetailItem label="Country" value={currentCustomer.customer_address?.country} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Subscription Portfolio & Service Credits */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-blue-500">
                <CardHeader className="p-8 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Layers className="h-6 w-6 text-blue-500" />
                            Active Subscription Portfolio & Service Credits
                        </CardTitle>
                        {!loadingDetails && subscriptions.length > 0 && (
                            <div className="flex items-center gap-3">
                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-full border border-blue-500/20">
                                    {subscriptions.length} Subscriptions
                                </Badge>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[9px] px-3 py-1.5 rounded-full border border-emerald-500/20">
                                    {totalCustomerCredits} Total Credit Hours
                                </Badge>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                    {loadingDetails ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Portfolio details...</p>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-sm font-bold text-slate-400 italic">No active subscriptions or service credits registered for this customer.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Total entitlement hero panel */}
                            <div className="relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-100">Total Support Credit Entitlement</h4>
                                    <p className="text-sm font-bold text-blue-50 opacity-90 leading-relaxed max-w-md">
                                        Consolidated entitlement across all active domain subscriptions, mapped from services credit definitions.
                                    </p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black tracking-tight">{totalCustomerCredits}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-1">Total Credit Hours</span>
                                </div>
                            </div>

                            {/* Subscriptions Portfolio Grid */}
                            <div className="space-y-4">
                                {subscriptions.map((sub) => {
                                    const subCredits = calculateSubCredits(sub);
                                    const isExpanded = !!expandedSubs[sub.sub_id];
                                    const dateStr = sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never Expires';
                                    
                                    const statusConfig = {
                                        'active': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                                        'paused': { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                        'cancelled': { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
                                    };
                                    const subStatus = statusConfig[sub.status.toLowerCase()] || statusConfig['active'];

                                    return (
                                        <div 
                                            key={sub.sub_id}
                                            className="group border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-slate-50/50 dark:bg-slate-900/20 hover:border-slate-200 dark:hover:border-slate-700/50 transition-all duration-300"
                                        >
                                            {/* Sub header */}
                                            <div 
                                                onClick={() => toggleSubExpanded(sub.sub_id)}
                                                className="p-6 flex items-center justify-between cursor-pointer select-none gap-4"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="h-10 w-10 rounded-[1.2rem] bg-blue-500/10 dark:bg-blue-500/25 flex items-center justify-center text-blue-500 flex-shrink-0">
                                                        <Globe className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 truncate">
                                                                {sub.domain_name || 'No Domain Associated'}
                                                            </span>
                                                            <Badge className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest", subStatus.bg, subStatus.color, subStatus.border)}>
                                                                {sub.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            ID: <span className="font-mono">{sub.sub_id}</span> • Expires: {dateStr}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 flex-shrink-0">
                                                    <div className="text-right hidden sm:block">
                                                        <span className="text-[13px] font-black text-slate-800 dark:text-slate-200 block">
                                                            {subCredits} credit hrs
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Subscription Total
                                                        </span>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-[1rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sub items expansion */}
                                            <AnimatePresence initial={false}>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="border-t border-slate-100 dark:border-slate-800"
                                                    >
                                                        <div className="p-6 bg-white/50 dark:bg-slate-900/30">
                                                            {sub.items && sub.items.length > 0 ? (
                                                                <div className="overflow-x-auto">
                                                                    <table className="w-full text-left border-collapse">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-100 dark:border-slate-800/80">
                                                                                <th className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Service Details</th>
                                                                                <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</th>
                                                                                <th className="pb-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Base Credit</th>
                                                                                <th className="pb-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Total Credits</th>
                                                                                <th className="pb-3 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Rate / Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                                                                            {sub.items.map((item, idx) => {
                                                                                const baseCredit = serviceCreditMap[item.service_name] || 0;
                                                                                const qty = parseFloat(item.quantity) || 0;
                                                                                const itemCredits = baseCredit * qty;
                                                                                const rateVal = parseFloat(item.rate) || 0;
                                                                                const totalCost = rateVal * qty;

                                                                                return (
                                                                                    <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                                                                                        <td className="py-4 pr-2">
                                                                                            <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 block leading-tight">
                                                                                                {item.service_name}
                                                                                            </span>
                                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                                                                                                Service ID: {item.service_id || 'N/A'}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-4 text-center">
                                                                                            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400">
                                                                                                {qty}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-4 text-center">
                                                                                            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-400">
                                                                                                {baseCredit} hrs
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-4 text-right">
                                                                                            <span className={cn(
                                                                                                "text-[12px] font-black",
                                                                                                itemCredits > 0 ? "text-emerald-500" : "text-slate-400"
                                                                                            )}>
                                                                                                {itemCredits} hrs
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-4 text-right">
                                                                                            <span className="text-[12px] font-black text-slate-700 dark:text-slate-300 block">
                                                                                                ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                                            </span>
                                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                                @ ₹{rateVal.toLocaleString('en-IN')}/unit
                                                                                            </span>
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[12px] font-bold text-slate-400 italic">No services registered under this subscription.</p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Master Governance Segment */}
        <div className="space-y-8">
            {/* Active Entitlements Summary */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden border-l-4 border-l-violet-500">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Sparkles className="h-6 w-6 text-violet-500" />
                        Active Entitlements
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-6">
                    {!loadingDetails ? (
                        <div className="space-y-4">
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Entitled Hours</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">{totalCustomerCredits} hrs</p>
                                </div>
                                <div className="h-8 w-8 rounded-[0.8rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Clock className="h-4.5 w-4.5" />
                                </div>
                            </div>
                            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Subscriptions</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-slate-200">{subscriptions.length} active</p>
                                </div>
                                <div className="h-8 w-8 rounded-[0.8rem] bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Layers className="h-4.5 w-4.5" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 text-violet-500 animate-spin animate-infinite" />
                            <span className="text-xs text-slate-400 font-bold">Calculating entitlements...</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Governance & History</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-4">
                    <MetaRow label="Profile Created" value={formatDate(currentCustomer.created_at)} />
                    <MetaRow label="Account ID" value={currentCustomer.customer_id} isMono />
                    {currentCustomer.notes && (
                        <div className="pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Administrative Notes</p>
                            <p className="text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl italic leading-relaxed">
                                "{currentCustomer.notes}"
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentCustomer.other_contacts && currentCustomer.other_contacts.length > 0 && (
                <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Auxiliary Contacts</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-3">
                        {currentCustomer.other_contacts.map((contact, i) => (
                            <div key={i} className="flex flex-col p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                        {contact.first_name} {contact.last_name}
                                    </p>
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 break-all">{contact.email}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">{contact.phone_number}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
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

function ErrorMessage({ message }) {
  return (
    <div className="container mx-auto py-12 px-4 text-center">
      <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <BadgeAlert className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Error</h3>
      <p className="mt-2 text-sm font-bold text-slate-500">{message}</p>
      <Button 
        variant="outline" 
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl font-black uppercase tracking-widest text-[10px] h-12"
      >
        Retry Connection
      </Button>
    </div>
  );
}

export default CustomerDetails;
