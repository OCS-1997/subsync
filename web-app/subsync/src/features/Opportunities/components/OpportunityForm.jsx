import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, X, UserPlus, Building2, User, Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command.jsx";
import { toast } from "react-toastify";
import { PageHeader } from "@/components/ui/breadcrumb.jsx";

import { fetchStatuses, fetchOpportunityById, clearCurrentOpportunity } from "../opportunitySlice.js";
import opportunityService from "../services/opportunityService.js";
import api from "@/lib/axiosInstance.js";

const Mandatory = () => <span className="text-red-500 ml-1">*</span>;

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
        <div className="w-full space-y-6 pb-12 px-2 md:px-6">
            <PageHeader
                title={isEdit ? "Edit Opportunity" : "Create New Opportunity"}
                description={isEdit ? `Modifying opportunity ${id}` : "Register a new sales opportunity in the pipeline"}
                breadcrumbItems={breadcrumbItems}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`${baseUrl}/opportunities`)}>
                            <X className="h-4 w-4 mr-2" /> Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="h-4 w-4 mr-2" /> {loading ? "Saving..." : (isEdit ? "Update" : "Create")}
                        </Button>
                    </div>
                }
            />

            <Card className="border-none shadow-sm bg-white dark:bg-gray-800/50">
                <CardContent className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Customer Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Customer Details</h3>
                            </div>

                            {!isEdit && (
                                <RadioGroup
                                    value={customerMode}
                                    onValueChange={setCustomerMode}
                                    className="flex flex-wrap gap-8"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="existing" id="existing" className="text-blue-600" />
                                        <Label htmlFor="existing" className="cursor-pointer">Existing Customer</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="new" id="new" className="text-blue-600" />
                                        <Label htmlFor="new" className="cursor-pointer">New Customer Entry</Label>
                                    </div>
                                </RadioGroup>
                            )}

                            {customerMode === "existing" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm font-medium">
                                            Select Customer <Mandatory />
                                        </Label>
                                        <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={customerPopoverOpen}
                                                    className="h-11 w-full justify-between font-normal"
                                                    disabled={isEdit}
                                                >
                                                    {formData.customer_id
                                                        ? (() => {
                                                            const customer = customers.find((c) => c.customer_id === formData.customer_id);
                                                            return customer
                                                                ? `${customer.display_name}${customer.company_name ? ` (${customer.company_name})` : ''}`
                                                                : "Select customer";
                                                        })()
                                                        : "Begin typing company name..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-full p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search customers..." />
                                                    <CommandEmpty>No customer found.</CommandEmpty>
                                                    <CommandGroup className="max-h-64 overflow-auto">
                                                        {(customers || []).map((c) => (
                                                            <CommandItem
                                                                key={c.customer_id}
                                                                value={`${c.display_name} ${c.company_name || ''} ${c.customer_id}`}
                                                                onSelect={() => {
                                                                    handleCustomerChange(c.customer_id);
                                                                    setCustomerPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={`mr-2 h-4 w-4 ${formData.customer_id === c.customer_id ? "opacity-100" : "opacity-0"
                                                                        }`}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{c.display_name}</span>
                                                                    {c.company_name && (
                                                                        <span className="text-xs text-muted-foreground">{c.company_name}</span>
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
                                        <Label className="text-sm font-medium">Primary Contact Person</Label>
                                        <Select
                                            value={formData.contact_person_id?.toString() || "none"}
                                            onValueChange={(val) => setFormData({ ...formData, contact_person_id: val === "none" ? "" : val })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Optional contact selection" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Default Contact</SelectItem>
                                                {(customerContacts || []).map((contact, idx) => (
                                                    <SelectItem key={idx} value={idx.toString()}>
                                                        {contact.salutation} {contact.first_name} {contact.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 border-l-4 border-blue-500 pl-4">
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                                            <strong>Note:</strong> Customer details will be stored with this opportunity. You can convert this to a full customer record later.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center text-sm font-medium">Customer Name <Mandatory /></Label>
                                        <Input
                                            className="h-11"
                                            required
                                            placeholder="Full name or business name"
                                            value={formData.customer_details.display_name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, display_name: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Company Name</Label>
                                        <Input
                                            className="h-11"
                                            placeholder="Optional company name"
                                            value={formData.customer_details.company_name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, company_name: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Email Address</Label>
                                        <Input
                                            className="h-11"
                                            type="email"
                                            placeholder="contact@example.com"
                                            value={formData.customer_details.email}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, email: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Phone Number</Label>
                                        <Input
                                            className="h-11"
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.customer_details.phone}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, phone: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-medium">Address</Label>
                                        <Textarea
                                            className="min-h-[80px]"
                                            placeholder="Full address (optional)"
                                            value={formData.customer_details.address}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, address: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-medium">Notes</Label>
                                        <Textarea
                                            className="min-h-[60px]"
                                            placeholder="Any additional notes about this customer"
                                            value={formData.customer_details.notes}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                customer_details: { ...formData.customer_details, notes: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 2: Opportunity Metrics */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                <User className="h-5 w-5 text-indigo-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sale Specifics</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center text-sm font-medium">Opportunity Date <Mandatory /></Label>
                                    <Input
                                        className="h-11"
                                        type="date"
                                        required
                                        value={formData.opportunity_date}
                                        onChange={(e) => setFormData({ ...formData, opportunity_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center text-sm font-medium">Type <Mandatory /></Label>
                                    <Select
                                        value={formData.opportunity_type}
                                        onValueChange={(val) => setFormData({ ...formData, opportunity_type: val })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="New">New Project</SelectItem>
                                            <SelectItem value="Existing">Expansion / Renewal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center text-sm font-medium">Est. Value (₹) <Mandatory /></Label>
                                    <Input
                                        className="h-11"
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={formData.opportunity_value}
                                        onChange={(e) => setFormData({ ...formData, opportunity_value: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center text-sm font-medium">Current Stage <Mandatory /></Label>
                                    <Select
                                        value={formData.status_id}
                                        onValueChange={(val) => setFormData({ ...formData, status_id: val })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Pipeline Stage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(statuses || []).map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center text-sm font-medium">Owner <Mandatory /></Label>
                                    <Popover open={ownerPopoverOpen} onOpenChange={setOwnerPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={ownerPopoverOpen}
                                                className="h-11 w-full justify-between font-normal"
                                            >
                                                {formData.owner
                                                    ? users.find((u) => u.username === formData.owner)?.name || formData.owner
                                                    : "Select team member"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search users..." />
                                                <CommandEmpty>No user found.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {(users || []).map((u) => (
                                                        <CommandItem
                                                            key={u.username}
                                                            value={`${u.name || u.username} ${u.email || ''} ${u.username}`}
                                                            onSelect={() => {
                                                                setFormData({ ...formData, owner: u.username });
                                                                setOwnerPopoverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={`mr-2 h-4 w-4 ${formData.owner === u.username ? "opacity-100" : "opacity-0"
                                                                    }`}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{u.name || u.username}</span>
                                                                {u.email && <span className="text-xs text-muted-foreground">{u.email}</span>}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Last Contacted</Label>
                                    <Input
                                        className="h-11"
                                        type="date"
                                        value={formData.last_contacted_at}
                                        onChange={(e) => setFormData({ ...formData, last_contacted_at: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Product Info */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                                <UserPlus className="h-5 w-5 text-emerald-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product & Sourcing</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center text-sm font-medium">Products / Services <Mandatory /></Label>
                                    <Input
                                        className="h-11"
                                        required
                                        placeholder="Briefly describe the inquiry..."
                                        value={formData.product_services}
                                        onChange={(e) => setFormData({ ...formData, product_services: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Referral Source</Label>
                                    <Input
                                        className="h-11"
                                        placeholder="How did they find us?"
                                        value={formData.referred_by || ""}
                                        onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Related Domain</Label>
                                    <Input
                                        className="h-11 font-mono text-sm"
                                        placeholder="example.com"
                                        value={formData.domain || ""}
                                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Internal Remarks</Label>
                                    <Textarea
                                        placeholder="Confidential notes or next steps..."
                                        rows={3}
                                        value={formData.remarks || ""}
                                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-4 border-t border-gray-100 dark:border-gray-700">
                            <Button size="lg" variant="ghost" type="button" onClick={() => navigate(`${baseUrl}/opportunities`)}>
                                Discard Changes
                            </Button>
                            <Button size="lg" type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                                {loading ? "Processing..." : (isEdit ? "Update Opportunity" : "Save Opportunity")}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OpportunityForm;
