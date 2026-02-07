import { Plus, Trash2, ArrowLeft, Settings, Check, ChevronsUpDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDomainById, createDomain, updateDomain } from "../domainSlice";

import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function AddDomain() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { list: domains, currentDomain, loading, error } = useSelector((state) => state.domains);
  const { list: customers } = useSelector((state) => state.customers);

  const [formData, setFormData] = useState({
    domainName: "",
    description: "",
    customerId: "",
    registrationDate: "",
    registeredWith: "",
    otherProvider: "",
    nameServers: [""],
    mailServices: "",
    mailServicesOther: "",
    domainStatus: "Active"
  });

  const [allCustomers, setAllCustomers] = useState([]);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [domainId, setDomainId] = useState(null);

  // Name server default count (persist in localStorage)
  const [defaultNameServerCount, setDefaultNameServerCount] = useState(() => {
    const saved = localStorage.getItem("defaultNameServerCount");
    return saved ? parseInt(saved, 10) : 2;
  });
  const [showNSSettings, setShowNSSettings] = useState(false);

  const registeredWithOptions = [
    { value: "OCS", label: "OCS" },
    { value: "OCS (RC)", label: "OCS (RC)" },
    { value: "Direct Customer", label: "Direct Customer" },
    { value: "Winds", label: "Winds" },
    { value: "Others", label: "Others" },
  ];

  const mailServicesOptions = [
    { value: "ResellerClub", label: "ResellerClub" },
    { value: "Google Workspace", label: "Google Workspace" },
    { value: "Business email", label: "Business email" },
    { value: "Microsoft 365", label: "Microsoft 365" },
    { value: "Others", label: "Others" },
  ];



  // Robust date parser: handles ISO dates and ensures yyyy-MM-dd format
  const parseToISODate = (dateString) => {
    if (!dateString) return "";
    // If it's already in yyyy-MM-dd format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";

    // Get the date in local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    async function fetchAllCustomers() {
      try {
        const res = await api.get("/all-customer-details");
        setAllCustomers(res.data.customers || []);
      } catch (err) {
        toast.error("Failed to fetch customers.");
      }
    }
    fetchAllCustomers();
  }, []);



  useEffect(() => {
    // If editing, fetch domain by id from state or URL
    const state = location.state;
    if (state?.domain) {
      const d = state.domain;
      setIsEditing(true);
      setDomainId(d.domain_id);
      setFormData({
        domainName: d.domain_name || "",
        description: d.description || "",
        customerId: d.customer_id || "",
        registrationDate: parseToISODate(d.registration_date),
        registeredWith: d.registered_with || "",
        otherProvider: d.other_provider || "",
        nameServers: Array.isArray(d.name_servers)
          ? d.name_servers.filter(Boolean)
          : d.name_servers?.split(",").map(ns => ns.trim()).filter(Boolean) || [""],
        mailServices: d.mail_service_provider || "",
        mailServicesOther: d.other_mail_service_details || "",
        domainStatus: d.domain_status || "Active"
      });
    } else if (domainId) {
      dispatch(fetchDomainById(domainId));
    }
  }, [location.state, domainId, dispatch]);

  useEffect(() => {
    if (currentDomain && isEditing) {
      setFormData({
        domainName: currentDomain.domain_name || "",
        description: currentDomain.description || "",
        customerId: currentDomain.customer_id || "",
        registrationDate: parseToISODate(currentDomain.registration_date),
        registeredWith: currentDomain.registered_with || "",
        otherProvider: currentDomain.other_provider || "",
        nameServers: Array.isArray(currentDomain.name_servers)
          ? currentDomain.name_servers.filter(Boolean)
          : currentDomain.name_servers?.split(",").map(ns => ns.trim()).filter(Boolean) || [""],
        mailServices: currentDomain.mail_service_provider || "",
        mailServicesOther: currentDomain.other_mail_service_details || "",
        domainStatus: currentDomain.domain_status || "Active"
      });
    }
  }, [currentDomain, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.domainName || !formData.registrationDate || !formData.registeredWith) {
      return toast.error("Please fill all required fields.");
    }
    
    // Get customer name
    const customer = allCustomers.find(c => c.customer_id === formData.customerId);
    const customerName = customer ? (customer.display_name || customer.company_name) : "";
    
    const payload = {
      customer_id: formData.customerId,
      customer_name: customerName,
      domain_name: formData.domainName,
      registration_date: formData.registrationDate,
      registered_with: formData.registeredWith,
      other_provider: formData.registeredWith === "Others" ? formData.otherProvider : "",
      name_servers: formData.nameServers.filter(ns => ns.trim() !== ""),
      description: formData.description,
      mail_service_provider: formData.mailServices,
      mail_services_other: formData.mailServices === "Others" ? formData.mailServicesOther : "",
      domain_status: formData.domainStatus || "Active"
    };
    //console.log("Submitting payload:", payload);
    try {
      if (isEditing) {
        await dispatch(updateDomain({ id: domainId, payload })).unwrap();
        toast.success("Domain updated!");
      } else {
        await dispatch(createDomain(payload)).unwrap();
        toast.success("Domain created!");
      }
      setTimeout(() => {
        const userSegment = location.pathname.split("/")[1];
        navigate(`/${userSegment}/dashboard/domains`);
      }, 2000);
    } catch (err) {
      toast.error(err || "Something went wrong.");
    }
  };

  const handleNameServerChange = (index, value) => {
    const ns = [...formData.nameServers];
    ns[index] = value;
    setFormData({ ...formData, nameServers: ns });
  };

  const addNameServer = () => {
    setFormData({ ...formData, nameServers: [...formData.nameServers, ""] });
  };

  const removeNameServer = (index) => {
    if (formData.nameServers.length === 1) return;
    setFormData({ ...formData, nameServers: formData.nameServers.filter((_, i) => i !== index) });
  };

  const handleBack = () => {
    const currentPath = location.pathname;
    const userSegment = currentPath.split("/")[1];
    navigate(`/${userSegment}/dashboard/domains`);
  };

  useEffect(() => {
    // Set default values for add mode
    if (!location.state?.domain) {
      setFormData((prev) => ({
        ...prev,
        registeredWith: "OCS",
        mailServices: "ResellerClub",
        nameServers: Array(defaultNameServerCount).fill(""),
      }));
    }
  }, [defaultNameServerCount, location.state]);

  // When changing defaultNameServerCount, update nameServers if not editing
  useEffect(() => {
    if (!isEditing) {
      setFormData((prev) => ({
        ...prev,
        nameServers: Array(defaultNameServerCount).fill(""),
      }));
    }
  }, [defaultNameServerCount, isEditing]);

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Breadcrumb
            items={[
              { label: "Domains", href: `/${location.pathname.split('/')[1]}/dashboard/domains` },
              { label: isEditing ? 'Edit Domain' : 'New Domain' }
            ]}
          />
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
            {isEditing ? "Edit Domain" : "New Domain"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {showNSSettings && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 animate-in fade-in slide-in-from-right-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Default NS Count:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={defaultNameServerCount}
                onChange={e => {
                  const val = Math.max(1, Math.min(10, Number(e.target.value)));
                  setDefaultNameServerCount(val);
                  localStorage.setItem("defaultNameServerCount", val);
                }}
                className="w-12 h-7 px-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            onClick={() => setShowNSSettings((v) => !v)}
            title="Name Server Settings"
          >
            <Settings size={18} className="text-gray-500 dark:text-slate-400" />
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Domain Status & Ownership
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-3">Domain Status <span className="text-red-500 font-bold ml-1">*</span></Label>
                <div className="inline-flex rounded-xl shadow-sm w-max p-1 bg-gray-100 dark:bg-slate-800/50" role="group">
                  <Button
                    type="button"
                    className={`rounded-lg px-6 h-9 font-bold text-xs transition-all ${formData.domainStatus === "Active" ? 'bg-green-600 text-white shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-green-600'}`}
                    onClick={() => setFormData({ ...formData, domainStatus: "Active" })}
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    className={`rounded-lg px-6 h-9 font-bold text-xs transition-all ${formData.domainStatus === "Expired" ? 'bg-red-600 text-white shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-red-600'}`}
                    onClick={() => setFormData({ ...formData, domainStatus: "Expired" })}
                  >
                    Expired
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Customer Name <span className="text-red-500 font-bold ml-1">*</span></Label>
                <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerPopoverOpen}
                      className="h-11 w-full justify-between px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                    >
                      {formData.customerId
                        ? (() => {
                          const customer = allCustomers.find((c) => c.customer_id === formData.customerId);
                          return customer
                            ? `${customer.display_name}${customer.company_name ? ` (${customer.company_name})` : ''}`
                            : "Select customer";
                        })()
                        : "Search by company name..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                    <Command className="dark:bg-slate-900">
                      <CommandInput placeholder="Search customers..." className="font-bold border-none focus:ring-0" />
                      <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No customer found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto p-2">
                        {(allCustomers || []).map((c) => (
                          <CommandItem
                            key={c.customer_id}
                            value={`${c.display_name} ${c.company_name || ''} ${c.customer_id}`}
                            onSelect={() => {
                              setFormData({ ...formData, customerId: c.customer_id });
                              setCustomerPopoverOpen(false);
                            }}
                            className="rounded-lg mb-1 data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-400"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${formData.customerId === c.customer_id ? "opacity-100" : "opacity-0"
                                }`}
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{c.display_name}</span>
                              {c.company_name && (
                                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{c.company_name}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formData.customerId && (() => {
                  const customer = allCustomers.find(c => c.customer_id === formData.customerId);
                  return customer && (
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2">ID: {customer.customer_id}</p>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Technical Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Domain Name <span className="text-red-500 font-bold ml-1">*</span></Label>
                <Input
                  required
                  value={formData.domainName}
                  onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                  placeholder="example.com"
                  className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Registration Date <span className="text-red-500 font-bold ml-1">*</span></Label>
                <Input
                  type="date"
                  value={formData.registrationDate || ""}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                  className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Registered With <span className="text-red-500 font-bold ml-1">*</span></Label>
                <Select
                  value={formData.registeredWith}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      registeredWith: value,
                      otherProvider: value === "Others" ? formData.otherProvider : ""
                    })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white shadow-sm">
                    <SelectValue placeholder="Select registrar..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    {registeredWithOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.registeredWith === "Others" && (
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Other Registrar</Label>
                  <Input
                    value={formData.otherProvider}
                    onChange={(e) => setFormData({ ...formData, otherProvider: e.target.value })}
                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-50 dark:border-slate-800">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-3 block">Name Servers</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.nameServers.map((ns, index) => (
                  <div key={index} className="flex items-center gap-2 group animate-in fade-in slide-in-from-top-1">
                    <div className="relative flex-1">
                      <Input
                        value={ns}
                        onChange={(e) => handleNameServerChange(index, e.target.value)}
                        placeholder={`Name Server ${index + 1}`}
                        className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        type="button"
                        size="icon"
                        onClick={() => removeNameServer(index)}
                        disabled={formData.nameServers.length === 1}
                        className="h-10 w-10 rounded-xl border-gray-200 dark:border-slate-800 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {index === formData.nameServers.length - 1 && (
                        <Button
                          type="button"
                          size="icon"
                          onClick={addNameServer}
                          className="h-10 w-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Email & Narrative
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Mail Services <span className="text-red-500 font-bold ml-1">*</span></Label>
                <Select
                  value={formData.mailServices}
                  onValueChange={(value) => setFormData({ ...formData, mailServices: value })}
                >
                  <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white shadow-sm">
                    <SelectValue placeholder="Select mail service..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    {mailServicesOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.mailServices === "Others" && (
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Other Mail Service</Label>
                  <Input
                    value={formData.mailServicesOther}
                    onChange={(e) => setFormData({ ...formData, mailServicesOther: e.target.value })}
                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Description (optional)</Label>
              <Textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Internal notes about this domain..."
                className="rounded-[1.5rem] p-4 font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end items-center gap-4 pt-4 pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 h-11 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isEditing ? "Update Domain" : "Create Domain"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddDomain;
