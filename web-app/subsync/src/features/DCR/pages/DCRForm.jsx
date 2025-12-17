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
    <div className="p-6">
      <Breadcrumb
        items={[
          { label: "Daily Call Reports", href: `/${username}/dashboard/dcr` },
          { label: isEditing ? 'Edit Entry' : 'New Entry' }
        ]}
        className="mb-4"
      />

      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        {isEditing ? "Edit DCR Entry" : "New DCR Entry"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Fields */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Core Fields</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Date */}
            <div>
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
                className="mt-2"
              />
              <p className="text-xs text-gray-500 mt-1">Default: Today</p>
            </div>

            {/* Time Spent */}
            <div>
              <Label>
                Time Spent <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-4 mt-2">
                <div className="w-32">
                  <Label htmlFor="hours" className="text-sm">Hours</Label>
                  <Select
                    value={formData.hours}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, hours: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="01">01</SelectItem>
                      <SelectItem value="02">02</SelectItem>
                      <SelectItem value="03">03</SelectItem>
                      <SelectItem value="04">04</SelectItem>
                      <SelectItem value="05">05</SelectItem>
                      <SelectItem value="06">06</SelectItem>
                      <SelectItem value="07">07</SelectItem>
                      <SelectItem value="08">08</SelectItem>
                      <SelectItem value="09">09</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="13">13</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="17">17</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="19">19</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="21">21</SelectItem>
                      <SelectItem value="22">22</SelectItem>
                      <SelectItem value="23">23</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Label htmlFor="minutes" className="text-sm">Minutes</Label>
                  <Select
                    value={formData.minutes}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, minutes: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="01">01</SelectItem>
                      <SelectItem value="02">02</SelectItem>
                      <SelectItem value="03">03</SelectItem>
                      <SelectItem value="04">04</SelectItem>
                      <SelectItem value="05">05</SelectItem>
                      <SelectItem value="06">06</SelectItem>
                      <SelectItem value="07">07</SelectItem>
                      <SelectItem value="08">08</SelectItem>
                      <SelectItem value="09">09</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="13">13</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="17">17</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="19">19</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="21">21</SelectItem>
                      <SelectItem value="22">22</SelectItem>
                      <SelectItem value="23">23</SelectItem>
                      <SelectItem value="24">24</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="26">26</SelectItem>
                      <SelectItem value="27">27</SelectItem>
                      <SelectItem value="28">28</SelectItem>
                      <SelectItem value="29">29</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="31">31</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="33">33</SelectItem>
                      <SelectItem value="34">34</SelectItem>
                      <SelectItem value="35">35</SelectItem>
                      <SelectItem value="36">36</SelectItem>
                      <SelectItem value="37">37</SelectItem>
                      <SelectItem value="38">38</SelectItem>
                      <SelectItem value="39">39</SelectItem>
                      <SelectItem value="40">40</SelectItem>
                      <SelectItem value="41">41</SelectItem>
                      <SelectItem value="42">42</SelectItem>
                      <SelectItem value="43">43</SelectItem>
                      <SelectItem value="44">44</SelectItem>
                      <SelectItem value="45">45</SelectItem>
                      <SelectItem value="46">46</SelectItem>
                      <SelectItem value="47">47</SelectItem>
                      <SelectItem value="48">48</SelectItem>
                      <SelectItem value="49">49</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="51">51</SelectItem>
                      <SelectItem value="52">52</SelectItem>
                      <SelectItem value="53">53</SelectItem>
                      <SelectItem value="54">54</SelectItem>
                      <SelectItem value="55">55</SelectItem>
                      <SelectItem value="56">56</SelectItem>
                      <SelectItem value="57">57</SelectItem>
                      <SelectItem value="58">58</SelectItem>
                      <SelectItem value="59">59</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Call Type */}
            <div>
              <Label>
                Call Type <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={formData.call_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, call_type: value }))}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="incoming" id="incoming" />
                  <Label htmlFor="incoming" className="font-normal cursor-pointer">Incoming</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outgoing" id="outgoing" />
                  <Label htmlFor="outgoing" className="font-normal cursor-pointer">Outgoing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="follow-up" id="follow-up" />
                  <Label htmlFor="follow-up" className="font-normal cursor-pointer">Follow-up</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Domain / Company Details */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Domain / Company Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Customer Toggle */}
            <div>
              <Label className="mb-3 block">Customer Type</Label>
              <RadioGroup
                value={isExistingCustomer ? "existing" : "new"}
                onValueChange={(value) => handleCustomerToggle(value === "existing")}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing-customer" />
                  <Label htmlFor="existing-customer" className="font-normal cursor-pointer">Existing Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new-customer" />
                  <Label htmlFor="new-customer" className="font-normal cursor-pointer">New Contact</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Existing Customer Flow */}
            {isExistingCustomer && (
              <div>
                <Label>Domain</Label>
                <ReactSelect
                  value={selectedDomain}
                  onChange={handleDomainChange}
                  options={domains}
                  placeholder="Search domain..."
                  isClearable
                  className="react-select-container mt-2"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: 'transparent',
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      '&:hover': { borderColor: '#9ca3af' }
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--select-menu-bg, white)',
                      color: 'var(--select-menu-text, black)'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? 'var(--select-option-hover, #e5e7eb)'
                        : 'transparent',
                      color: 'var(--select-option-text, black)',
                      '&:hover': { backgroundColor: 'var(--select-option-hover, #e5e7eb)' }
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'var(--select-value-text, black)'
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'var(--select-input-text, black)'
                    })
                  }}
                />

                {/* Auto-filled Company Details */}
                {domainDetails && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <Label className="text-sm font-semibold">Company Name</Label>
                    <p className="mt-1 text-sm dark:text-white">{domainDetails.company_name || domainDetails.customer_name || 'N/A'}</p>
                  </div>
                )}
              </div>
            )}

            {/* New Customer Flow */}
            {!isExistingCustomer && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="domain_free_text">
                    Domain <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="domain_free_text"
                    type="text"
                    placeholder="Enter domain name"
                    value={formData.domain_free_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, domain_free_text: e.target.value }))}
                    className="mt-2"
                    required={!isExistingCustomer}
                  />
                </div>

                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    placeholder="Enter company name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Save customer entity only if DCR is saved successfully
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Contact Toggle */}
            {isExistingCustomer && domainDetails && domainDetails.contacts && domainDetails.contacts.length > 0 && (
              <div>
                <Label className="mb-3 block">Contact Type</Label>
                <RadioGroup
                  value={isExistingContact ? "existing" : "new"}
                  onValueChange={(value) => handleContactToggle(value === "existing")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing-contact" />
                    <Label htmlFor="existing-contact" className="font-normal cursor-pointer">Existing Contact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new-contact" />
                    <Label htmlFor="new-contact" className="font-normal cursor-pointer">New Contact</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Existing Contact Selection */}
            {isExistingCustomer && isExistingContact && domainDetails && domainDetails.contacts && domainDetails.contacts.length > 0 && (
              <div>
                <Label className="text-sm">Select Contact Person</Label>
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
                  placeholder="Select contact person"
                  className="mt-2 react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: 'transparent',
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      '&:hover': { borderColor: '#9ca3af' }
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--select-menu-bg, white)',
                      color: 'var(--select-menu-text, black)'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? 'var(--select-option-hover, #e5e7eb)'
                        : 'transparent',
                      color: 'var(--select-option-text, black)',
                      '&:hover': { backgroundColor: 'var(--select-option-hover, #e5e7eb)' }
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: 'var(--select-value-text, black)'
                    }),
                    input: (base) => ({
                      ...base,
                      color: 'var(--select-input-text, black)'
                    })
                  }}
                />
              </div>
            )}

            {/* New Contact or Manual Entry Fields */}
            {(!isExistingContact || !domainDetails?.contacts || domainDetails.contacts.length === 0) && (
              <div className="space-y-4">
                {/* Contact Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input
                      id="contact_name"
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                      className="mt-2"
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="mt-2"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <Label className="mb-2">Phone Number</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contact_phone_country_code" className="text-sm">Country Code</Label>
                      <CountrySelect
                        value={formData.contact_phone_country_code}
                        onChange={(value) => setFormData(prev => ({ ...prev, contact_phone_country_code: value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="contact_phone_number" className="text-sm">Phone Number</Label>
                      <Input
                        id="contact_phone_number"
                        type="text"
                        value={formData.contact_phone_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_number: e.target.value }))}
                        className="mt-1"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Domain readonly if inherited */}
                {isExistingCustomer && selectedDomain && (
                  <div>
                    <Label htmlFor="domain_readonly">Domain (readonly)</Label>
                    <Input
                      id="domain_readonly"
                      type="text"
                      value={selectedDomain.label}
                      readOnly
                      disabled
                      className="mt-2 bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                )}

                {/* Add to Contacts Button */}
                {!isExistingCustomer && formData.domain_free_text && formData.contact_name && !formData.contact_id && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-600 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                      This domain is not in the database. Would you like to add the contact to your contacts list?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddToContacts}
                    >
                      Add to Contacts
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Description <span className="text-red-500">*</span></CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={6}
              className="resize-none"
              placeholder="Enter call description and any additional notes... (Mandatory)"
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              This field is mandatory and stores clean, readable text
            </p>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/${username}/dashboard/dcr`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : isEditing ? "Update Entry" : "Create Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
