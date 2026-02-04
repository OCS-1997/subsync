import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, X, UserPlus, Building2, User, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/ui/breadcrumb";

import { fetchStatuses, fetchOpportunityById, clearCurrentOpportunity } from "../opportunitySlice.js";
import opportunityService from "../services/opportunityService.js";
import api from "@/lib/axiosInstance.js";
import { parseISO, format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

const Mandatory = () => <span className="text-red-500 font-bold ml-1">*</span>;

const OpportunityForm = () => {
    const { id, username } = useParams();
    const isEdit = !!id;
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { statuses = [], currentOpportunity } = useSelector((state) => state.opportunities);

    const baseUrl = `/${username}/dashboard`;

    const [loading, setLoading] = useState(false);
    const [customerMode, setCustomerMode] = useState("existing");
    const [customers, setCustomers] = useState([]);
    const [customerContacts, setCustomerContacts] = useState([]);
    const [users, setUsers] = useState([]);
    const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false);
    const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

    const [formData, setFormData] = useState({
        opportunity_date: new Date().toISOString().split("T")[0],
        customer_id: "",
        customer_details: {
            display_name: "",
            company_name: "",
            email: "",
            phone: "",
            address: "",
            notes: ""
        },
        contact_person_id: "",
        opportunity_type: "Existing",
        referred_by: "",
        domain: "",
        owner: "",
        product_services: "",
        last_contacted_at: new Date().toISOString().split("T")[0],
        status_id: "",
        remarks: "",
        opportunity_value: 0
    });



    useEffect(() => {
        dispatch(fetchStatuses());
        fetchCustomers();
        fetchUsers();
    }, [dispatch]);

    useEffect(() => {
        if (isEdit && id) {
            dispatch(fetchOpportunityById(id));
        } else {
            dispatch(clearCurrentOpportunity());
        }
    }, [dispatch, id, isEdit]);

    useEffect(() => {
        if (isEdit && currentOpportunity) {
            setFormData({
                opportunity_date: currentOpportunity.opportunity_date?.split("T")[0] || "",
                customer_id: currentOpportunity.customer_id || "",
                customer_details: currentOpportunity.customer_details || {
                    display_name: "",
                    company_name: "",
                    email: "",
                    phone: "",
                    address: "",
                    notes: ""
                },
                contact_person_id: currentOpportunity.contact_person_id || "",
                opportunity_type: currentOpportunity.opportunity_type || "Existing",
                referred_by: currentOpportunity.referred_by || "",
                domain: currentOpportunity.domain || "",
                owner: currentOpportunity.owner || "",
                product_services: currentOpportunity.product_services || "",
                last_contacted_at: currentOpportunity.last_contacted_at?.split("T")[0] || "",
                status_id: currentOpportunity.status_id?.toString() || "",
                remarks: currentOpportunity.remarks || "",
                opportunity_value: currentOpportunity.opportunity_value || 0
            });
            setCustomerMode(currentOpportunity.opportunity_type === "New" ? "new" : "existing");
            if (currentOpportunity.customer_id) {
                fetchCustomerContacts(currentOpportunity.customer_id);
            }
        }
    }, [isEdit, currentOpportunity]);

    const fetchCustomers = async () => {
        try {
            const res = await api.get("/all-customer-details");
            setCustomers(res.data.customers || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users");
            // console.log("Users response:", res.data);
            // Backend returns array directly, not wrapped in { users: [...] }
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchCustomerContacts = async (customerId) => {
        try {
            const res = await api.get(`/customer/${customerId}`);
            const contacts = res.data.customer?.other_contacts || [];
            setCustomerContacts(contacts);

            // Auto-select first contact person if available
            if (contacts.length > 0) {
                setFormData(prev => ({ ...prev, contact_person_id: "0" }));
            }
        } catch (error) {
            console.error("Error fetching customer contacts:", error);
        }
    };

    const handleCustomerChange = (customerId) => {
        setFormData({ ...formData, customer_id: customerId, contact_person_id: "" });
        fetchCustomerContacts(customerId);
    };

    const validateForm = () => {
        const requiredFields = [
            { key: "opportunity_date", label: "Opportunity Date" },
            { key: "opportunity_type", label: "Opportunity Type" },
            { key: "opportunity_value", label: "Estimated Value" },
            { key: "status_id", label: "Current Stage" },
            { key: "owner", label: "Owner" },
            { key: "product_services", label: "Product / Services" }
        ];

        if (customerMode === "existing" && !formData.customer_id) {
            toast.error("Please select a customer");
            return false;
        }

        if (customerMode === "new") {
            if (!formData.customer_details.display_name) {
                toast.error("Customer Name is required");
                return false;
            }
        }

        for (const field of requiredFields) {
            if (!formData[field.key] && formData[field.key] !== 0) {
                toast.error(`${field.label} is required`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            let customerId = formData.customer_id;

            // If new customer mode, we don't create a customer record anymore.
            // Details are stored in the opportunity itself.
            if (customerMode === "new") {
                customerId = null;
            }

            // Sanitize payload: convert empty strings to null for backend type safety
            const sanitizedPayload = {
                ...formData,
                opportunity_type: customerMode === "new" ? "New" : "Existing",
                customer_id: customerId,
                customer_details: customerMode === "new" ? formData.customer_details : null,
                contact_person_id: formData.contact_person_id === "" ? null : formData.contact_person_id,
                referred_by: formData.referred_by === "" ? null : formData.referred_by,
                domain: formData.domain === "" ? null : formData.domain,
                last_contacted_at: formData.last_contacted_at === "" ? null : formData.last_contacted_at,
                status_id: formData.status_id === "" ? null : parseInt(formData.status_id),
                remarks: formData.remarks === "" ? null : formData.remarks,
                opportunity_value: parseFloat(formData.opportunity_value) || 0
            };

            if (isEdit) {
                await opportunityService.updateOpportunity(id, sanitizedPayload);
                toast.success("Opportunity updated successfully");
            } else {
                await opportunityService.createOpportunity(sanitizedPayload);
                toast.success("Opportunity created successfully");
            }
            navigate(`${baseUrl}/opportunities`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to save opportunity");
        } finally {
            setLoading(false);
        }
    };

    const breadcrumbItems = [
        { label: "Opportunities", href: `${baseUrl}/opportunities` },
        { label: isEdit ? "Edit Opportunity" : "New Opportunity" }
    ];

    return (
        <div className="container py-8 max-w mx-auto px-4 md:px-0">
            <div className="mb-6">
                <PageHeader
                    title={isEdit ? "Edit Opportunity" : "New Opportunity"}
                    description={isEdit ? `Modifying opportunity ${id}` : "Register a new sales opportunity in the pipeline"}
                    breadcrumbItems={breadcrumbItems}
                />
                {/* <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
                    {isEdit ? "Edit Opportunity" : "New Opportunity"}
                </h1> */}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Customer Identification */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                            Customer Identification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-8">
                        {!isEdit && (
                            <RadioGroup
                                value={customerMode}
                                onValueChange={setCustomerMode}
                                className="flex flex-wrap gap-8 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800/50 w-max"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="existing" id="existing" className="text-blue-600" />
                                    <Label htmlFor="existing" className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 cursor-pointer">Existing Customer</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="new" id="new" className="text-blue-600" />
                                    <Label htmlFor="new" className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-slate-400 cursor-pointer">New Prospect Entry</Label>
                                </div>
                            </RadioGroup>
                        )}

                        {customerMode === "existing" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
                                        Select Customer <Mandatory />
                                    </Label>
                                    <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={customerPopoverOpen}
                                                className="h-11 w-full justify-between px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                                                disabled={isEdit}
                                            >
                                                {formData.customer_id
                                                    ? (() => {
                                                        const customer = customers.find((c) => c.customer_id === formData.customer_id);
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
                                                    {(customers || []).map((c) => (
                                                        <CommandItem
                                                            key={c.customer_id}
                                                            value={`${c.display_name} ${c.company_name || ''} ${c.customer_id}`}
                                                            onSelect={() => {
                                                                handleCustomerChange(c.customer_id);
                                                                setCustomerPopoverOpen(false);
                                                            }}
                                                            className="rounded-lg mb-1 data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-400"
                                                        >
                                                            <Check
                                                                className={`mr-2 h-4 w-4 ${formData.customer_id === c.customer_id ? "opacity-100" : "opacity-0"
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
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Primary Contact Person</Label>
                                    <Select
                                        value={formData.contact_person_id?.toString() || "none"}
                                        onValueChange={(val) => setFormData({ ...formData, contact_person_id: val === "none" ? "" : val })}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white shadow-sm transition-all focus:ring-blue-500">
                                            <SelectValue placeholder="Optional contact selection" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                            <SelectItem value="none" className="text-xs font-bold">Default Contact</SelectItem>
                                            {(customerContacts || []).map((contact, idx) => (
                                                <SelectItem key={idx} value={idx.toString()} className="text-xs font-bold">
                                                    {contact.salutation} {contact.first_name} {contact.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-[1.5rem]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                        Note: Prospect details will be stored within this opportunity. You can finalize the customer record upon successful conversion.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Prospect Name <Mandatory /></Label>
                                        <Input
                                            className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                            required
                                            placeholder="Full name or business identity"
                                            value={formData.customer_details.display_name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, display_name: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Company Name</Label>
                                        <Input
                                            className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                            placeholder="Business entity name"
                                            value={formData.customer_details.company_name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, company_name: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Email Address</Label>
                                        <Input
                                            className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                            type="email"
                                            placeholder="contact@prospective-client.com"
                                            value={formData.customer_details.email}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, email: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Phone Number</Label>
                                        <Input
                                            className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.customer_details.phone}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, phone: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Address Details</Label>
                                        <Textarea
                                            className="min-h-[80px] rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white resize-none"
                                            placeholder="Physical or billing address..."
                                            value={formData.customer_details.address}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, address: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Prospect Notes</Label>
                                        <Textarea
                                            className="min-h-[60px] rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white resize-none"
                                            placeholder="Initial observations or historical context..."
                                            value={formData.customer_details.notes}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, notes: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Section 2: Sale Specifics */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                            Sale Specifics
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Opportunity Date <Mandatory /></Label>
                                <DatePicker
                                    date={formData.opportunity_date ? parseISO(formData.opportunity_date) : null}
                                    setDate={(date) => setFormData({ ...formData, opportunity_date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Inquiry Type <Mandatory /></Label>
                                <Select
                                    value={formData.opportunity_type}
                                    onValueChange={(val) => setFormData({ ...formData, opportunity_type: val })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                        <SelectItem value="New" className="text-xs font-bold">New Project</SelectItem>
                                        <SelectItem value="Existing" className="text-xs font-bold">Expansion / Renewal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Est. Value (₹) <Mandatory /></Label>
                                <Input
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={formData.opportunity_value}
                                    onChange={(e) => setFormData({ ...formData, opportunity_value: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Pipeline Stage <Mandatory /></Label>
                                <Select
                                    value={formData.status_id}
                                    onValueChange={(val) => setFormData({ ...formData, status_id: val })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
                                        <SelectValue placeholder="Select stage" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                        {(statuses || []).map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()} className="text-xs font-bold">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.status_color }} />
                                                    {s.status_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-slate-800">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Opportunity Owner <Mandatory /></Label>
                                <Popover open={ownerPopoverOpen} onOpenChange={setOwnerPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={ownerPopoverOpen}
                                            className="h-11 w-full justify-between px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 shadow-sm transition-all"
                                        >
                                            {formData.owner
                                                ? users.find((u) => u.username === formData.owner)?.name || formData.owner
                                                : "Select responsible team member"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-slate-900 dark:border-slate-800 rounded-xl" align="start">
                                        <Command className="dark:bg-slate-900">
                                            <CommandInput placeholder="Search team..." className="font-bold border-none focus:ring-0" />
                                            <CommandEmpty className="py-4 text-center text-xs font-bold text-gray-400">No member found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-auto p-2">
                                                {(users || []).map((u) => (
                                                    <CommandItem
                                                        key={u.username}
                                                        value={`${u.name || u.username} ${u.email || ''} ${u.username}`}
                                                        onSelect={() => {
                                                            setFormData({ ...formData, owner: u.username });
                                                            setOwnerPopoverOpen(false);
                                                        }}
                                                        className="rounded-lg mb-1 data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900/20 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-400"
                                                    >
                                                        <Check
                                                            className={`mr-2 h-4 w-4 ${formData.owner === u.username ? "opacity-100" : "opacity-0"
                                                                }`}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm">{u.name || u.username}</span>
                                                            {u.email && <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{u.email}</span>}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Last Interaction Date</Label>
                                <DatePicker
                                    date={formData.last_contacted_at ? parseISO(formData.last_contacted_at) : null}
                                    setDate={(date) => setFormData({ ...formData, last_contacted_at: date ? format(date, 'yyyy-MM-dd') : '' })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Section 3: Product & Sourcing */}
                <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                            Product & Sourcing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Involved Products / Services <Mandatory /></Label>
                                <Input
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                    required
                                    placeholder="Brief inventory or inquiry summary..."
                                    value={formData.product_services}
                                    onChange={(e) => setFormData({ ...formData, product_services: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Referral Source</Label>
                                <Input
                                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                    placeholder="Lead origin (e.g., Website, LinkedIn, Internal)"
                                    value={formData.referred_by || ""}
                                    onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Related Domain Identity</Label>
                                <Input
                                    className="h-11 px-4 rounded-xl font-bold text-sm md:font-mono bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                                    placeholder="primary-domain.com"
                                    value={formData.domain || ""}
                                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Confidential Remarks</Label>
                                <Textarea
                                    className="min-h-[100px] rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white resize-none"
                                    placeholder="Next immediate steps or internal blockers..."
                                    rows={3}
                                    value={formData.remarks || ""}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form Actions */}
                <div className="flex justify-end items-center gap-4 pt-4 pb-12">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`${baseUrl}/opportunities`)}
                        className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-bold"
                    >
                        Discard
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 h-11 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                Processing...
                            </div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {isEdit ? "Update Opportunity" : "Launch Opportunity"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default OpportunityForm;
