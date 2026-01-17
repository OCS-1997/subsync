import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { 
    Globe, Calendar, ShieldCheck, Mail, Database, 
    User, Building2, Clock, Edit2, ArrowLeft, 
    FileText, CheckCircle2, AlertCircle, Sparkles,
    LayoutPanelTop, Server, HardDrive, Shield
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";
import { cn } from "@/lib/utils";

import { fetchDomainById, clearDomainState } from "@/features/Domains/domainSlice.js";

function DomainDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentDomain: domain, loading, error } = useSelector((state) => state.domains);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (id) {
      dispatch(fetchDomainById(id));
    }
    return () => {
      dispatch(clearDomainState());
    };
  }, [id, dispatch]);

  const handleEdit = () => {
    const userSegment = location.pathname.split("/")[1];
    navigate(`/${userSegment}/dashboard/domains/edit/${id}`, { state: { domain } });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (err) {
      return "-";
    }
  };

  if (loading) {
      return (
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
  }

  if (error) return <ErrorMessage message={error} />;
  if (!domain) return <p className="p-12 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Registry entry not found.</p>;

  const statusConfig = {
    'Active': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    'Expired': { color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  };

  const currentStatus = statusConfig[domain.domain_status] || statusConfig['Active'];

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <PageHeader
        title={domain.domain_name}
        description={`Registry ID: ${domain.domain_id}`}
        breadcrumbItems={[
          { label: "Domains", href: `/${location.pathname.split('/')[1]}/dashboard/domains` },
          { label: domain.domain_name }
        ]}
        actions={
          <Button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] px-8 h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
          >
            <Edit2 className="w-4 h-4 mr-3" />
            Modify Registry
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
                        <Badge className={cn("rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest", currentStatus.bg, currentStatus.color, currentStatus.border)}>
                            {domain.domain_status}
                        </Badge>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                             Updated: {formatDate(domain.updated_at)}
                        </span>
                    </div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Globe className="h-8 w-8 text-blue-500" />
                        Domain Asset Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem icon={LayoutPanelTop} label="Domain Hostname" value={domain.domain_name} largeValue />
                        <DetailItem 
                            icon={User} 
                            label="Registered Owner" 
                            value={
                                <Link 
                                    to={`/${location.pathname.split('/')[1]}/dashboard/customers/${domain.customer_id}`}
                                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    {domain.customer_name}
                                </Link>
                            } 
                        />
                        <DetailItem icon={Shield} label="Registrar / Provider" value={domain.registered_with === "Others" ? domain.other_provider : domain.registered_with} />
                        <DetailItem icon={Calendar} label="Registration Date" value={formatDate(domain.registration_date)} />
                    </div>
                </CardContent>
            </Card>

            {/* DNS Segment */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Server className="h-6 w-6 text-indigo-500" />
                        DNS Infrastructure
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {domain.name_servers && domain.name_servers.length > 0 ? (
                            domain.name_servers.map((ns, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-[10px] font-black">
                                        NS{idx + 1}
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{ns}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs font-bold text-slate-400 italic">No name servers configured.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Communication Segment */}
            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Mail className="h-6 w-6 text-emerald-500" />
                        Mail & Services
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DetailItem 
                            label="Service Provider" 
                            value={domain.mail_service_provider === "Others" ? domain.other_mail_service_details : domain.mail_service_provider} 
                            valueColor="text-emerald-500"
                        />
                         <DetailItem label="Provisioning Status" value="Active" />
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
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/70">Registry Hub</p>
                            <h4 className="text-lg font-black tracking-tight">Quick Controls</h4>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Button
                            onClick={handleEdit}
                            className="w-full justify-between bg-white text-blue-600 hover:bg-blue-50 rounded-2xl h-14 text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                        >
                            Edit Configuration
                            <Edit2 className="h-4 w-4" />
                        </Button>
                     
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 backdrop-blur-xl shadow-sm overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Governance</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-6 space-y-4">
                    <MetaRow label="Registry Created" value={formatDate(domain.created_at)} />
                    <MetaRow label="Internal ID" value={domain.domain_id} isMono />
                    {domain.description && (
                        <div className="pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Technical Description</p>
                            <p className="text-[11px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl italic leading-relaxed">
                                "{domain.description}"
                            </p>
                        </div>
                    )}
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

export default DomainDetails;
