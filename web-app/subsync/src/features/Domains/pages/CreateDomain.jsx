import { Plus, Trash2, ArrowLeft, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { toast, ToastContainer, Bounce } from "react-toastify";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDomainById, createDomain, updateDomain } from "../domainSlice";

import api from "@/lib/axiosInstance.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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
        const options = res.data.customers?.map(c => ({
          value: c.customer_id,
          label: c.company_name || c.display_name || `${c.first_name || ""} ${c.last_name || ""}`.trim(),
        })) || [];
        setAllCustomers(options);
        setFilteredCustomers(options);
      } catch (err) {
        toast.error("Failed to fetch customers.");
      }
    }
    fetchAllCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") return setFilteredCustomers(allCustomers);
    setFilteredCustomers(allCustomers.filter(c =>
      c.label.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [searchTerm, allCustomers]);

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
      setSelectedCustomer({ value: d.customer_id, label: d.customer_name });
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
      setSelectedCustomer({ value: currentDomain.customer_id, label: currentDomain.customer_name });
    }
  }, [currentDomain, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId || !formData.domainName || !formData.registrationDate || !formData.registeredWith) {
      return toast.error("Please fill all required fields.");
    }
    const payload = {
      customer_id: formData.customerId,
      customer_name: selectedCustomer?.label,
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
            disabled={loading}
          >
            <ArrowLeft size={16} />
          </button>
          <span>Domains</span>
          <span>{`>`}</span>
          <span className="font-medium text-gray-900 dark:text-white">{isEditing ? 'Edit' : 'New'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-3xl font-bold">{isEditing ? "Edit Domain" : "Add Domain"}</h1>
        <button
          type="button"
          className="ml-2 p-1 rounded hover:bg-gray-200"
          title="Name Server Settings"
          onClick={() => setShowNSSettings((v) => !v)}
        >
          <Settings size={20} />
        </button>
        {showNSSettings && (
          <div className="ml-4 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded shadow">
            <span className="text-sm">Default Name Servers:</span>
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
              className="w-16 px-2 py-1 border rounded"
            />
            <span className="text-xs text-gray-500">(applies to new domains)</span>
          </div>
        )}
      </div>
      <hr className="mb-6 border-blue-500" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Status<span className="text-red-800">*</span></Label>
          <div className="flex flex-row rounded-md shadow-sm w-max mt-2" role="group">
            <Button
              type="button"
              variant={formData.domainStatus === "Active" ? "default" : "outline"}
              className={`rounded-r-none ${formData.domainStatus === "Active" ? 'bg-green-600 hover:bg-green-700 text-white' : 'border-green-600 text-green-600 hover:bg-green-50'}`}
              onClick={() => setFormData({ ...formData, domainStatus: "Active" })}
            >
              Active
            </Button>
            <Button
              type="button"
              variant={formData.domainStatus === "Expired" ? "destructive" : "outline"}
              className={`rounded-l-none ${formData.domainStatus === "Expired" ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-600 text-red-600 hover:bg-red-50'}`}
              onClick={() => setFormData({ ...formData, domainStatus: "Expired" })}
            >
              Expired
            </Button>
          </div>
        </div>
        <div>
          <Label>Customer Name<span className="text-red-800">*</span></Label>
          <Select
            options={filteredCustomers}
            inputValue={searchTerm}
            onInputChange={(val, { action }) => {
              if (action === "input-change") setSearchTerm(val);
              if (action === "menu-close") setSearchTerm("");
            }}
            onChange={(s) => {
              setFormData({ ...formData, customerId: s?.value || "" });
              setSelectedCustomer(s || null);
              setSearchTerm("");
            }}
            value={selectedCustomer}
            placeholder="Search customer"
            isClearable
          />
          {selectedCustomer && (
            <p className="text-xs text-muted-foreground mt-1">Customer ID: {selectedCustomer.value}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Domain Name<span className="text-red-800">*</span></Label>
            <Input required value={formData.domainName} onChange={(e) => setFormData({ ...formData, domainName: e.target.value })} />
          </div>
          <div>
            <Label>Registration Date<span className="text-red-800">*</span></Label>
            <Input type="date" required value={formData.registrationDate} onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })} />
          </div>
          <div>
            <Label>Registered With<span className="text-red-800">*</span></Label>
            <Select
              options={registeredWithOptions}
              value={registeredWithOptions.find(opt => opt.value === formData.registeredWith)}
              onChange={(s) =>
                setFormData({
                  ...formData,
                  registeredWith: s?.value || "",
                  otherProvider: s?.value === "Others" ? formData.otherProvider : ""
                })
              }
              isClearable
              placeholder="Select registrar"
            />
          </div>
          {formData.registeredWith === "Others" && (
            <div>
              <Label>Other Registrar</Label>
              <Input value={formData.otherProvider} onChange={(e) => setFormData({ ...formData, otherProvider: e.target.value })} />
            </div>
          )}

        </div>

        <div>
          <Label>Name Servers</Label>
          {formData.nameServers.map((ns, index) => (
            <div key={index} className="flex items-center gap-2 mt-2">
              <Input value={ns} onChange={(e) => handleNameServerChange(index, e.target.value)} placeholder="Enter name server" />
              <Button variant="destructive" type="button" size="icon" onClick={() => removeNameServer(index)} disabled={formData.nameServers.length === 1}>
                <Trash2 className="w-3 h-3" />
              </Button>
              {index === formData.nameServers.length - 1 && (
                <Button type="button" size="icon" onClick={addNameServer}>
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Mail Services<span className="text-red-800">*</span></Label>
            <Select
              options={mailServicesOptions}
              value={mailServicesOptions.find(opt => opt.value === formData.mailServices)}
              onChange={(s) => setFormData({ ...formData, mailServices: s?.value || "" })}
              isClearable
              placeholder="Select mail service"
            />
          </div>
          {formData.mailServices === "Others" && (
            <div>
              <Label>Other Mail Service</Label>
              <Input value={formData.mailServicesOther} onChange={(e) => setFormData({ ...formData, mailServicesOther: e.target.value })} />
            </div>
          )}
        </div>

        <div>
          <Label>Description (optional)</Label>
          <Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
        </div>

        <div className="pt-6">
          <Button type="submit" className="ml-4 bg-blue-500">{isEditing ? "Update Domain" : "Create Domain"}</Button>
          <Button type="button" variant="secondary" className="ml-4" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AddDomain;
