import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Select from "react-select";
import Hamster from "@/components/animations/Hamster.jsx";
import { addDcrEntry, editDcrEntry, getDcrById, clearDcrState } from "../dcrSlice";
import { getDomainDetails, fetchAllDomains, createContactFromDcr } from "../services/dcrAPI";
import { timeToMinutes, minutesToTime } from "../utils/timeUtils";

// Generate time options in 10-minute increments (00:10 to 08:00)
const generateTimeOptions = () => {
  const options = [];
  for (let hours = 0; hours <= 8; hours++) {
    for (let minutes = 0; minutes < 60; minutes += 10) {
      if (hours === 0 && minutes === 0) continue; // Skip 00:00
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      options.push({ value: timeStr, label: timeStr });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export default function DCRForm() {
  const navigate = useNavigate();
  const { username, id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentEntry, loading } = useSelector((state) => state.dcr);

  const isEditing = !!id;
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState([]);
  const [domainDetails, setDomainDetails] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isFreeTextDomain, setIsFreeTextDomain] = useState(false);
  const [showAddToContacts, setShowAddToContacts] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    call_type: "inbound",
    time_spent: "00:30",
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
      const dateTimeStr = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}T${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;
      
      setFormData({
        timestamp: dateTimeStr,
        call_type: entry.call_type || "inbound",
        time_spent: entry.time_spent || minutesToTime(entry.time_spent_minutes || 0),
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
        setIsFreeTextDomain(false);
        loadDomainDetails(entry.domain_id);
      } else if (entry.domain_free_text) {
        setIsFreeTextDomain(true);
        setShowAddToContacts(true);
      }
    } else if (!isEditing) {
      // Set current date/time for new entry
      const now = new Date();
      const dateTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, timestamp: dateTimeStr }));
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
      setIsFreeTextDomain(false);
      setShowAddToContacts(false);
      loadDomainDetails(option.value);
      setFormData(prev => ({
        ...prev,
        domain_id: option.value,
        domain_free_text: ""
      }));
    } else {
      setSelectedDomain(null);
      setDomainDetails(null);
      setIsFreeTextDomain(false);
      setFormData(prev => ({
        ...prev,
        domain_id: null,
        domain_free_text: ""
      }));
    }
  };

  const handleFreeTextDomainToggle = () => {
    setIsFreeTextDomain(!isFreeTextDomain);
    if (!isFreeTextDomain) {
      setSelectedDomain(null);
      setDomainDetails(null);
      setFormData(prev => ({
        ...prev,
        domain_id: null,
        domain_free_text: prev.domain_free_text || ""
      }));
      setShowAddToContacts(true);
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
      toast.error(err.response?.data?.error || "Failed to add contact");
    }
  };

  const handleTimeSpentChange = (value) => {
    // Validate HH:MM format
    if (/^\d{2}:\d{2}$/.test(value)) {
      const [hours, minutes] = value.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && minutes % 10 === 0) {
        setFormData(prev => ({ ...prev, time_spent: value }));
      }
    } else if (value === "") {
      setFormData(prev => ({ ...prev, time_spent: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.timestamp) {
        toast.error("Date and time are required");
        setSaving(false);
        return;
      }

      if (!formData.time_spent || !/^\d{2}:\d{2}$/.test(formData.time_spent)) {
        toast.error("Time spent must be in HH:MM format (e.g., 00:30)");
        setSaving(false);
        return;
      }

      const timeMinutes = timeToMinutes(formData.time_spent);
      if (timeMinutes === 0) {
        toast.error("Time spent must be greater than 0");
        setSaving(false);
        return;
      }

      const submitData = {
        timestamp: new Date(formData.timestamp).toISOString(),
        call_type: formData.call_type,
        time_spent: formData.time_spent,
        domain_id: isFreeTextDomain ? null : formData.domain_id,
        domain_free_text: isFreeTextDomain ? formData.domain_free_text : null,
        company_name: formData.company_name || null,
        contact_name: formData.contact_name || null,
        contact_phone_country_code: formData.contact_phone_country_code || null,
        contact_phone_number: formData.contact_phone_number || null,
        contact_email: formData.contact_email || null,
        contact_id: formData.contact_id || null,
        notes: formData.notes || null
      };

      if (isEditing) {
        await dispatch(editDcrEntry({ id, entryData: submitData })).unwrap();
        toast.success("DCR entry updated successfully!");
      } else {
        await dispatch(addDcrEntry(submitData)).unwrap();
        toast.success("DCR entry created successfully!");
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
    <div className="p-4 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/${username}/dashboard/dcr`)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600">
          Dashboard / DCR / {isEditing ? "Edit Entry" : "New Entry"}
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit DCR Entry" : "New DCR Entry"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time */}
        <div>
          <Label htmlFor="timestamp">Date & Time *</Label>
          <Input
            id="timestamp"
            type="datetime-local"
            value={formData.timestamp}
            onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
            required
          />
        </div>

        {/* Call Type */}
        <div>
          <Label>Call Type *</Label>
          <RadioGroup
            value={formData.call_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, call_type: value }))}
            className="flex gap-6 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inbound" id="inbound" />
              <Label htmlFor="inbound" className="font-normal cursor-pointer">Inbound</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="outbound" id="outbound" />
              <Label htmlFor="outbound" className="font-normal cursor-pointer">Outbound</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Time Spent */}
        <div>
          <Label htmlFor="time_spent">Time Spent (HH:MM) *</Label>
          <div className="flex gap-2 mt-2">
            <Select
              value={TIME_OPTIONS.find(opt => opt.value === formData.time_spent) || null}
              onChange={(option) => option && handleTimeSpentChange(option.value)}
              options={TIME_OPTIONS}
              placeholder="Select time"
              className="flex-1"
            />
            <Input
              id="time_spent"
              type="text"
              placeholder="00:30"
              value={formData.time_spent}
              onChange={(e) => handleTimeSpentChange(e.target.value)}
              pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
              required
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Format: HH:MM (e.g., 00:30, 01:15). Must be multiple of 10 minutes.</p>
        </div>

        {/* Domain Selection */}
        <div>
          <Label>Domain</Label>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="freeTextDomain"
              checked={isFreeTextDomain}
              onChange={handleFreeTextDomainToggle}
              className="w-4 h-4"
            />
            <Label htmlFor="freeTextDomain" className="font-normal cursor-pointer">
              Domain not in database
            </Label>
          </div>

          {!isFreeTextDomain ? (
            <Select
              value={selectedDomain}
              onChange={handleDomainChange}
              options={domains}
              placeholder="Select domain"
              isClearable
              className="mt-2"
            />
          ) : (
            <Input
              type="text"
              placeholder="Enter domain name"
              value={formData.domain_free_text}
              onChange={(e) => setFormData(prev => ({ ...prev, domain_free_text: e.target.value }))}
              className="mt-2"
            />
          )}

          {domainDetails && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold">{domainDetails.company_name || domainDetails.customer_name}</p>
              {domainDetails.contacts && domainDetails.contacts.length > 0 && (
                <div className="mt-2">
                  <Label>Contact Person</Label>
                  <Select
                    options={domainDetails.contacts.map(contact => ({
                      value: contact,
                      label: `${contact.salutation || 'Mr.'} ${contact.first_name} ${contact.last_name || ''} ${contact.designation ? `(${contact.designation})` : ''} – ${contact.country_code || '+91'} ${contact.phone_number || ''}`.trim()
                    }))}
                    onChange={(option) => {
                      if (option) {
                        const contact = option.value;
                        setFormData(prev => ({
                          ...prev,
                          contact_name: `${contact.first_name} ${contact.last_name || ''}`.trim(),
                          contact_phone_country_code: contact.country_code || '+91',
                          contact_phone_number: contact.phone_number || '',
                          contact_email: contact.email || ''
                        }));
                      }
                    }}
                    placeholder="Select contact person"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Company Name */}
        <div>
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            className="mt-2"
          />
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              className="mt-2"
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
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_phone_country_code">Country Code</Label>
            <Input
              id="contact_phone_country_code"
              type="text"
              value={formData.contact_phone_country_code}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_country_code: e.target.value }))}
              className="mt-2"
              placeholder="+91"
            />
          </div>
          <div>
            <Label htmlFor="contact_phone_number">Phone Number</Label>
            <Input
              id="contact_phone_number"
              type="text"
              value={formData.contact_phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone_number: e.target.value }))}
              className="mt-2"
            />
          </div>
        </div>

        {/* Add to Contacts Button */}
        {isFreeTextDomain && formData.domain_free_text && formData.contact_name && !formData.contact_id && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">
              This domain is not in the database. Would you like to add the contact to your contacts list?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddToContacts}
              className="bg-yellow-100 hover:bg-yellow-200"
            >
              Add to Contacts
            </Button>
          </div>
        )}

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes / Remarks</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="mt-2"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/${username}/dashboard/dcr`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}


