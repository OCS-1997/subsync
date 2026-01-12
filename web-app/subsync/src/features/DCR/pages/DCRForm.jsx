import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Clock, Building2, User, Mail, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountrySelect } from "@/components/ui/country-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactSelect from "react-select";
import Hamster from "@/components/animations/Hamster.jsx";
import { addDcrEntry, editDcrEntry, getDcrById, clearDcrState } from "../dcrSlice";
import { getDomainDetails, fetchAllDomains, createContactFromDcr } from "../services/dcrAPI";
import { timeToMinutes, minutesToTime } from "../utils/timeUtils";

export default function DCRForm() {
  const navigate = useNavigate();
  const { username, id } = useParams();
  const dispatch = useDispatch();
  const { currentEntry, loading } = useSelector((state) => state.dcr);

  const isEditing = !!id;
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState([]);
  const [domainDetails, setDomainDetails] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Customer and Contact toggles
  const [isExistingCustomer, setIsExistingCustomer] = useState(true);
  const [isExistingContact, setIsExistingContact] = useState(true);
  const [showAddToContacts, setShowAddToContacts] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    hours: "00",
    minutes: "05",
    call_type: "incoming",
    domain_id: null,
    domain_free_text: "",
    company_name: "",
    contact_name: "",
    contact_phone_country_code: "+91",
    contact_phone_number: "",
    contact_email: "",
    contact_id: null,
    notes: ""
  });

  // Load domains on mount
  useEffect(() => {
    fetchAllDomains()
      .then((data) => {
        const domainOptions = (data.domains || []).map((d) => ({
          value: d.domain_id,
          label: d.domain_name,
          domain: d
        }));
        setDomains(domainOptions);
      })
      .catch((err) => console.error("Error fetching domains:", err));
  }, []);

  // Load entry if editing
  useEffect(() => {
    if (isEditing && id) {
      dispatch(getDcrById(id));
    }
    return () => {
      dispatch(clearDcrState());
    };
  }, [isEditing, id, dispatch]);

  // Populate form when entry is loaded
  useEffect(() => {
    if (isEditing && currentEntry) {
      const entry = currentEntry;
      const timestamp = new Date(entry.timestamp);
      const dateStr = timestamp.toISOString().slice(0, 10);
      const totalMinutes = entry.time_spent_minutes || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      setFormData({
        date: dateStr,
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        call_type: entry.call_type || "incoming",
        domain_id: entry.domain_id || null,
        domain_free_text: entry.domain_free_text || "",
        company_name: entry.company_name || "",
        contact_name: entry.contact_name || "",
        contact_phone_country_code: entry.contact_phone_country_code || "+91",
        contact_phone_number: entry.contact_phone_number || "",
        contact_email: entry.contact_email || "",
        contact_id: entry.contact_id || null,
        notes: entry.notes || ""
      });

      if (entry.domain_id) {
        setSelectedDomain({ value: entry.domain_id, label: entry.domain_name });
        setIsExistingCustomer(true);
        loadDomainDetails(entry.domain_id);
      } else if (entry.domain_free_text) {
        setIsExistingCustomer(false);
        setShowAddToContacts(true);
      }
    } else if (!isEditing) {
      // Set current date for new entry
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      setFormData(prev => ({ ...prev, date: dateStr }));
    }
  }, [isEditing, currentEntry]);

  const loadDomainDetails = async (domainId) => {
    try {
      const data = await getDomainDetails(domainId);
      setDomainDetails(data);

      // Auto-fill company name if available
      if (data.company_name) {
        setFormData(prev => ({ ...prev, company_name: data.company_name }));
      }
    } catch (err) {
      console.error("Error loading domain details:", err);
      toast.error("Failed to load domain details");
    }
  };

  const handleDomainChange = (option) => {
    if (option) {
      setSelectedDomain(option);
      loadDomainDetails(option.value);
      setFormData(prev => ({
        ...prev,
        domain_id: option.value,
        domain_free_text: ""
      }));
    } else {
      setSelectedDomain(null);
      setDomainDetails(null);
      setFormData(prev => ({
        ...prev,
        domain_id: null,
        domain_free_text: ""
      }));
    }
  };

  const handleCustomerToggle = (isExisting) => {
    setIsExistingCustomer(isExisting);
    if (!isExisting) {
      // Reset to new customer flow
      setSelectedDomain(null);
      setDomainDetails(null);
      setFormData(prev => ({
        ...prev,
        domain_id: null,
        domain_free_text: prev.domain_free_text || "",
        company_name: ""
      }));
      setShowAddToContacts(true);
    } else {
      // Reset to existing customer flow
      setFormData(prev => ({
        ...prev,
        domain_free_text: "",
        company_name: ""
      }));
      setShowAddToContacts(false);
    }
  };

  const handleContactToggle = (isExisting) => {
    setIsExistingContact(isExisting);
    if (!isExisting) {
      // Clear contact selection for new contact
      setFormData(prev => ({
        ...prev,
        contact_id: null,
        contact_name: "",
        contact_phone_number: "",
        contact_email: ""
      }));
    }
  };

  const handleAddToContacts = async () => {
    if (!formData.domain_free_text || !formData.contact_name) {
      toast.error("Domain and contact name are required to add to contacts");
      return;
    }

    try {
      const contactData = {
        domain_free_text: formData.domain_free_text,
        company_name: formData.company_name,
        first_name: formData.contact_name.split(' ')[0] || formData.contact_name,
        last_name: formData.contact_name.split(' ').slice(1).join(' ') || "",
        email: formData.contact_email,
        country_code: formData.contact_phone_country_code,
        phone_number: formData.contact_phone_number,
        notes: formData.notes
      };

      const result = await createContactFromDcr(contactData);
      setFormData(prev => ({ ...prev, contact_id: result.contact_id }));
      toast.success("Contact added successfully!");
      setShowAddToContacts(false);
    } catch (err) {
      // Handle specific validation errors
      if (err.response?.status === 409) {
        const errorData = err.response.data;

        if (errorData.message) {
          toast.error(errorData.message, { autoClose: 5000 });
        } else {
          toast.error(errorData.error || "Failed to add contact");
        }

        // If domain exists in system, suggest using existing customer
        if (errorData.domain) {
          toast.info(`Tip: Switch to "Existing Customer" and search for "${errorData.domain.domain_name}"`, { autoClose: 7000 });
        }
      } else {
        toast.error(err.response?.data?.error || err.message || "Failed to add contact");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.date) {
        toast.error("Date is required");
        setSaving(false);
        return;
      }

      if (!formData.notes || formData.notes.trim() === "") {
        toast.error("Description is mandatory");
        setSaving(false);
        return;
      }

      // Calculate total time in minutes
      const totalMinutes = parseInt(formData.hours) * 60 + parseInt(formData.minutes);
      if (totalMinutes === 0) {
        toast.error("Time spent must be greater than 0");
        setSaving(false);
        return;
      }

      // Create timestamp from date (use current time)
      const now = new Date();
      const [year, month, day] = formData.date.split('-');
      const timestamp = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

      // Determine if we should add this contact to customer's other_contacts
      // This happens when: existing customer (domain_id) + new contact info (!contact_id) + contact provided
      const shouldAddToCustomer = isExistingCustomer &&
        formData.domain_id &&
        !formData.contact_id &&
        formData.contact_name &&
        !isExistingContact;

      const submitData = {
        timestamp: timestamp.toISOString(),
        call_type: formData.call_type,
        time_spent: `${formData.hours}:${formData.minutes}`,
        domain_id: isExistingCustomer ? formData.domain_id : null,
        domain_free_text: !isExistingCustomer ? formData.domain_free_text : null,
        company_name: formData.company_name || null,
        contact_name: formData.contact_name || null,
        contact_phone_country_code: formData.contact_phone_country_code || null,
        contact_phone_number: formData.contact_phone_number || null,
        contact_email: formData.contact_email || null,
        contact_id: formData.contact_id || null,
        notes: formData.notes || null,
        add_to_customer_contacts: shouldAddToCustomer // Add contact to customer's other_contacts
      };

      if (isEditing) {
        await dispatch(editDcrEntry({ id, entryData: submitData })).unwrap();
        toast.success("DCR entry updated successfully!");
      } else {
        await dispatch(addDcrEntry(submitData)).unwrap();
        if (shouldAddToCustomer) {
          toast.success("DCR entry created and contact added to customer!");
        } else {
          toast.success("DCR entry created successfully!");
        }
      }

      navigate(`/${username}/dashboard/dcr`);
    } catch (err) {
      toast.error(err || "Failed to save DCR entry");
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="p-6 flex flex-col justify-center items-center">
        <Hamster />
      </div>
    );
  }

  return (
    <div className="container py-8 max-w mx-auto px-4 md:px-0">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Daily Call Reports", href: `/${username}/dashboard/dcr` },
            { label: isEditing ? 'Edit Entry' : 'New Entry' }
          ]}
        />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
          {isEditing ? "Edit DCR Entry" : "New DCR Entry"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Fields */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
                Entry Date <span className="text-red-500 font-bold ml-1">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                className="max-w-[200px] h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
              />
              <p className="text-[10px] font-medium text-gray-400 dark:text-slate-500 ml-1">Default: Today</p>
            </div>

            {/* Time Spent */}
            <div className="flex flex-col gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
                Time Spent <span className="text-red-500 font-bold ml-1">*</span>
              </Label>
              <div className="flex gap-4">
                <div className="w-24">
                  <Select
                    value={formData.hours}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, hours: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                      {["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24"].map(h => (
                        <SelectItem key={h} value={h} className="text-xs font-bold">{h} h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Select
                    value={formData.minutes}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, minutes: value }))}
                  >
                    <SelectTrigger className="h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                        <SelectItem key={m} value={m} className="text-xs font-bold">{m} m</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Call Type */}
            <div className="flex flex-col gap-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">
                Call Type <span className="text-red-500 font-bold ml-1">*</span>
              </Label>
              <RadioGroup
                value={formData.call_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, call_type: value }))}
                className="flex gap-8"
              >
                <div className="flex items-center space-x-2 group">
                  <RadioGroupItem value="incoming" id="incoming" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500" />
                  <Label htmlFor="incoming" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-blue-500 transition-colors">Incoming</Label>
                </div>
                <div className="flex items-center space-x-2 group">
                  <RadioGroupItem value="outgoing" id="outgoing" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500" />
                  <Label htmlFor="outgoing" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-blue-500 transition-colors">Outgoing</Label>
                </div>
                <div className="flex items-center space-x-2 group">
                  <RadioGroupItem value="follow-up" id="follow-up" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-blue-500 data-[state=checked]:text-blue-500" />
                  <Label htmlFor="follow-up" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-blue-500 transition-colors">Follow-up</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Domain / Company Details */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Company Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {/* Customer Toggle */}
            <div className="flex flex-col gap-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">Classification</Label>
              <RadioGroup
                value={isExistingCustomer ? "existing" : "new"}
                onValueChange={(value) => handleCustomerToggle(value === "existing")}
                className="flex gap-8"
              >
                <div className="flex items-center space-x-2 group">
                  <RadioGroupItem value="existing" id="existing-customer" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-500" />
                  <Label htmlFor="existing-customer" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-indigo-500 transition-colors">Existing Customer</Label>
                </div>
                <div className="flex items-center space-x-2 group">
                  <RadioGroupItem value="new" id="new-customer" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-indigo-500 data-[state=checked]:text-indigo-500" />
                  <Label htmlFor="new-customer" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-indigo-500 transition-colors">New Contact</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Existing Customer Flow */}
            {isExistingCustomer && (
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Select Domain</Label>
                <ReactSelect
                  value={selectedDomain}
                  onChange={handleDomainChange}
                  options={domains}
                  placeholder="Search and select domain..."
                  isClearable
                  className="react-select-container"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--input))",
                      minHeight: "2.75rem",
                      borderRadius: "0.75rem",
                      fontSize: "0.875rem",
                      padding: "0px 8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "hsl(var(--ring))" },
                    }),
                    singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))", fontWeight: "600" }),
                    input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
                    menu: (base) => ({ ...base, backgroundColor: "hsl(var(--popover))", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? "hsl(var(--accent))" : state.isSelected ? "hsl(var(--primary))" : "transparent",
                      color: state.isFocused ? "hsl(var(--accent-foreground))" : state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                      "&:active": { backgroundColor: "hsl(var(--accent))" }
                    }),
                  }}
                />

                {/* Auto-filled Company Details */}
                {domainDetails && (
                  <div className="mt-4 p-5 bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500/70 mb-1 block">Connected Company</Label>
                    <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{domainDetails.company_name || domainDetails.customer_name || 'N/A'}</p>
                  </div>
                )}
              </div>
            )}

            {/* New Customer Flow */}
            {!isExistingCustomer && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="domain_free_text" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">
                    Domain Name <span className="text-red-500 font-bold ml-1">*</span>
                  </Label>
                  <Input
                    id="domain_free_text"
                    type="text"
                    placeholder="example.com"
                    value={formData.domain_free_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain_free_text: e.target.value }))}
                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                    required={!isExistingCustomer}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="company_name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="Legal entity name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Personal Representative
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {/* Contact Toggle */}
            {isExistingCustomer && domainDetails && domainDetails.contacts && domainDetails.contacts.length > 0 && (
              <div className="flex flex-col gap-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500">Contact Source</Label>
                <RadioGroup
                  value={isExistingContact ? "existing" : "new"}
                  onValueChange={(value) => handleContactToggle(value === "existing")}
                  className="flex gap-8"
                >
                  <div className="flex items-center space-x-2 group">
                    <RadioGroupItem value="existing" id="existing-contact" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-emerald-500 data-[state=checked]:text-emerald-500" />
                    <Label htmlFor="existing-contact" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-emerald-500 transition-colors">Existing Contact</Label>
                  </div>
                  <div className="flex items-center space-x-2 group">
                    <RadioGroupItem value="new" id="new-contact" className="border-gray-300 dark:border-slate-700 data-[state=checked]:border-emerald-500 data-[state=checked]:text-emerald-500" />
                    <Label htmlFor="new-contact" className="font-bold text-sm text-gray-700 dark:text-slate-300 cursor-pointer group-hover:text-emerald-500 transition-colors">Manual Entry</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Existing Contact Selection */}
            {isExistingCustomer && isExistingContact && domainDetails && domainDetails.contacts && domainDetails.contacts.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Search Contacts</Label>
                <ReactSelect
                  options={domainDetails.contacts.map(contact => ({
                    value: contact,
                    label: `${contact.is_primary ? '⭐ ' : ''}${contact.salutation || 'Mr.'} ${contact.first_name} ${contact.last_name || ''} ${contact.designation ? `(${contact.designation})` : ''} – ${contact.country_code || '+91'} ${contact.phone_number || ''}${contact.email ? ` • ${contact.email}` : ''}`.trim()
                  }))}
                  onChange={(option) => {
                    if (option) {
                      const contact = option.value;
                      setFormData(prev => ({
                        ...prev,
                        contact_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                        contact_phone_country_code: contact.country_code || '+91',
                        contact_phone_number: contact.phone_number || '',
                        contact_email: contact.email || '',
                        contact_id: contact.contact_id
                      }));
                    }
                  }}
                  placeholder="Select a registered contact..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--input))",
                      minHeight: "2.75rem",
                      borderRadius: "0.75rem",
                      fontSize: "0.875rem",
                      padding: "0px 8px",
                      boxShadow: "none",
                      "&:hover": { borderColor: "hsl(var(--ring))" },
                    }),
                    singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))", fontWeight: "600" }),
                    input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
                    menu: (base) => ({ ...base, backgroundColor: "hsl(var(--popover))", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused ? "hsl(var(--accent))" : state.isSelected ? "hsl(var(--primary))" : "transparent",
                      color: state.isFocused ? "hsl(var(--accent-foreground))" : state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                      "&:active": { backgroundColor: "hsl(var(--accent))" }
                    }),
                  }}
                />
              </div>
            )}

            {/* New Contact or Manual Entry Fields */}
            {(!isExistingContact || !domainDetails?.contacts || domainDetails.contacts.length === 0) && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact_name" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Full Name</Label>
                    <Input
                      id="contact_name"
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                      className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contact_email" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Email Address</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Phone Connectivity</Label>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <CountrySelect
                        value={formData.contact_phone_country_code}
                        onChange={(value) => setFormData(prev => ({ ...prev, contact_phone_country_code: value }))}
                        className="h-11 rounded-xl bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: "hsl(var(--background))",
                            borderColor: "hsl(var(--input))",
                            minHeight: "2.75rem",
                            borderRadius: "0.75rem",
                            fontSize: "0.875rem",
                            padding: "0px 8px",
                            boxShadow: "none",
                            "&:hover": { borderColor: "hsl(var(--ring))" },
                          }),
                          singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))", fontWeight: "600" }),
                          input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
                          menu: (base) => ({ ...base, backgroundColor: "hsl(var(--popover))", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "hsl(var(--accent))" : state.isSelected ? "hsl(var(--primary))" : "transparent",
                            color: state.isFocused ? "hsl(var(--accent-foreground))" : state.isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                            "&:active": { backgroundColor: "hsl(var(--accent))" }
                          }),
                        }}
                      />
                    </div>
                    <div className="md:col-span-9">
                      <Input
                        id="contact_phone_number"
                        type="text"
                        value={formData.contact_phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_number: e.target.value }))}
                        className="h-11 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white"
                        placeholder="e.g. 9876543210"
                      />
                    </div>
                  </div>
                </div>

                {isExistingCustomer && selectedDomain && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="domain_readonly" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-1">Inherited Domain</Label>
                    <Input
                      id="domain_readonly"
                      type="text"
                      value={selectedDomain.label}
                      readOnly
                      disabled
                      className="h-11 px-4 rounded-xl font-bold text-sm bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-500 cursor-not-allowed"
                    />
                  </div>
                )}

                {!isExistingCustomer && formData.domain_free_text && formData.contact_name && !formData.contact_id && (
                  <div className="p-6 bg-yellow-50/50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/10 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-inner">
                    <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 leading-relaxed max-w-md">
                      This domain identity is new. Would you like to register this representative to your permanent contacts?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddToContacts}
                      className="h-10 px-6 rounded-xl border-yellow-500/50 text-yellow-600 hover:bg-yellow-500 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all shrink-0"
                    >
                      Sync to Contacts
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="dark:bg-slate-900 dark:border-slate-800 rounded-[2rem] overflow-hidden border-gray-100 shadow-sm">
          <CardHeader className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              Session Narrative <span className="text-red-500 font-bold ml-1">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-10">
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={8}
              className="resize-none rounded-[1.5rem] px-6 py-4 text-sm font-medium bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white min-h-[200px] focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder="Detailed log of the discussion, action items, or resolutions... (Mandatory)"
              required
            />
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-4 ml-1 uppercase tracking-widest">
              Critical Step: Please ensure the narrative is clear for operational records.
            </p>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end items-center gap-4 pt-4 pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/${username}/dashboard/dcr`)}
            className="h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
          >
            Discard
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 h-11 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="w-3.5 h-3.5 mr-2" />
            {saving ? "Processing..." : isEditing ? "Update Report" : "Commit Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}
