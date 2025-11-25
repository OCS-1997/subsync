import { useEffect, useMemo, useState, useRef, Fragment } from "react";
import { toast } from "react-toastify";
import { ArrowLeft, Mail, Plus, Trash2, X, Building2, CreditCard, FileText, Users, Loader2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import api from "@/lib/axiosInstance.js";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table.jsx";
import ReactSelect from "react-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";

function toTimestamp(dateStr) {
  if (!dateStr) return null;
  return `${dateStr} 00:00:00`;
}
function fromTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function clampNumber(n, min, max = Infinity) {
  const num = Number(n);
  if (!isFinite(num)) return min;
  return Math.min(Math.max(num, min), max);
}

function ItemRow({ idx, item, services, onChange, onRemove, resolveDefaults, customerSelected, isNew }) {
  const svc = services.find(s => String(s.id) === String(item.service_id));
  return (
    <TableRow className={`hover:bg-gray-50 ${isNew ? "item-row-slide-in" : ""}`}>
      <TableCell className="w-2/5">
        <ReactSelect
          classNamePrefix="rs"
          placeholder="Type to search services..."
          value={services.find(x => String(x.id) === String(item.service_id)) || null}
          onChange={(svc) => {
            const defaults = resolveDefaults ? resolveDefaults(svc) : {};
            onChange(idx, {
              service_id: svc?.id || "",
              service_name: svc?.name || "",
              rate: clampNumber(defaults.rate ?? 0, 0),
              tax_percent: clampNumber(defaults.tax_percent ?? 0, 0)
            });
          }}
          options={services}
          getOptionValue={(s) => String(s.id)}
          getOptionLabel={(s) => s.name || ''}
          isSearchable={true}
          isClearable={false}
          filterOption={(option, inputValue) => {
            if (!inputValue) return true;
            const searchValue = inputValue.toLowerCase();
            const service = option.data || option;
            return (
              String(service.name || '').toLowerCase().includes(searchValue) ||
              String(service.id || '').toLowerCase().includes(searchValue)
            );
          }}
          formatOptionLabel={(s, { context }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: context === 'menu' ? 600 : 500 }}>{s.name}</span>
              <span style={{ color: '#4b5563', fontVariantNumeric: 'tabular-nums' }}>₹{Number(s.price || 0).toFixed(2)}</span>
            </div>
          )}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          styles={{
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            menu: (base) => ({ ...base, zIndex: 9999, minWidth: '520px' }),
            control: (base) => ({ ...base, minHeight: 40, borderColor: '#e5e7eb', boxShadow: 'none', '&:hover': { borderColor: '#d1d5db' } }),
            option: (base, state) => ({
              ...base,
              paddingTop: 10,
              paddingBottom: 10,
              paddingLeft: 12,
              paddingRight: 12,
              fontSize: 14,
              lineHeight: 1.4,
              backgroundColor: state.isFocused ? '#f3f4f6' : 'white',
              color: '#111827'
            }),
            menuList: (base) => ({ ...base, maxHeight: 360, paddingTop: 6, paddingBottom: 6 })
          }}
        />
      </TableCell>
      <TableCell className="w-24">
        <Input
          type="number"
          min="1"
          value={item.quantity || 1}
          onChange={e => onChange(idx, { quantity: clampNumber(e.target.value, 1) })}
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-32">
        <Input
          type="number"
          min="0"
          value={item.rate ?? (svc?.price || 0)}
          onChange={e => onChange(idx, { rate: clampNumber(e.target.value, 0) })}
          className="h-9"
        />
      </TableCell>
      <TableCell className="w-24">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0"
            value={item.tax_percent || 0}
            className="h-9"
            readOnly
            disabled={!customerSelected}
            placeholder={!customerSelected ? "Non-taxable" : undefined}
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium w-32">
        ₹{(Number(item.quantity || 0) * Number(item.rate || 0)).toFixed(2)}
      </TableCell>
      <TableCell className="text-right w-12">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemove(idx)}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function AddEditSubscription({ onBack, editId }) {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const id = editId || params.id;
  const isEdit = !!id;

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [gstSettings, setGstSettings] = useState(null);
  const [defaultTaxPreferences, setDefaultTaxPreferences] = useState({ intra: null, inter: null });
  const [taxGroups, setTaxGroups] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [inlineAddRowVisible, setInlineAddRowVisible] = useState(true);
  const [inlineAddRowKey, setInlineAddRowKey] = useState(0);
  const inlineRowTimerRef = useRef(null);
  const [recentlyAddedIndex, setRecentlyAddedIndex] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize with default dates
  const getDefaultDates = () => {
    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(today.getFullYear() + 1);
    return {
      start: today.toISOString().slice(0, 10),
      end: oneYearLater.toISOString().slice(0, 10)
    };
  };

  const defaultDates = getDefaultDates();

  const [form, setForm] = useState({
    domain_name: "",
    customerID: "",
    startDate: defaultDates.start,
    endDate: defaultDates.end,
    never_expires: false,
    repeat_every_value: "1",
    repeat_every_unit: "years",
    billing_cycle_type: "contract",
    currency: "INR",
    discount_type: "amount",
    discount_value: 0,
    rounding: 0,
    rounding_sign: '+',
    notes: "",
    terms_conditions: "",
    email_list: [],
    items: [{ service_id: "", quantity: 1, rate: 0, tax_percent: 0 }],
  });

  useEffect(() => {
    (async () => {
      try {
        const [cRes, sRes, dRes, gRes, taxPrefRes, taxGroupsRes, taxesRes] = await Promise.all([
          api.get('/all-customer-details'),
          api.get('/all-services?limit=1000'),
          api.get('/all-domains?limit=1000'),
          api.get('/get-gst-settings').catch(() => ({ data: {} })),
          api.get('/default-tax-preferences').catch(() => ({ data: { preferences: { intra: null, inter: null } } })),
          api.get('/tax-groups?include=members').catch(() => ({ data: { groups: [] } })),
          api.get('/all-taxes').catch(() => ({ data: { taxes: [] } }))
        ]);
        const cs = (cRes.data.customers || []).map(c => ({ id: c.customer_id, name: c.display_name, primary_email: c.primary_email, other_contacts: typeof c.other_contacts === 'string' ? JSON.parse(c.other_contacts || '[]') : (c.other_contacts || []) }));
        const ss = (sRes.data.services || []).map(s => ({ id: s.service_id, name: s.service_name, price: parseFloat((s.selling_price ?? 0)), tax_details: s.tax_details || {} }));
        const ds = (dRes.data.domains || []).map(d => ({ id: d.domain_id, name: d.domain_name, customer_id: d.customer_id, customer_name: d.customer_name }));
        setCustomers(cs);
        setServices(ss);
        setDomains(ds);
        setGstSettings((gRes.data && (gRes.data[0] || gRes.data.settings)) || null);
        setDefaultTaxPreferences((taxPrefRes.data.preferences || { intra: null, inter: null }));
        setTaxGroups((taxGroupsRes.data.groups || []));
        setTaxes((taxesRes.data.taxes || []));
      } catch (e) {
        toast.error(e.normalizedMessage || 'Failed to load form data');
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoadingInitial(true);
        const res = await api.get(`/subscriptions/${id}`);
        const sub = res.data.subscription;
        // Parse rounding to determine sign
        const roundingVal = Number(sub.rounding || 0);
        const rounding_sign = roundingVal >= 0 ? '+' : '-';
        const rounding_abs = Math.abs(roundingVal);

        setForm({
          domain_name: sub.domain_name || "",
          customerID: sub.customer_id,
          startDate: fromTimestamp(sub.start_date),
          endDate: sub.never_expires ? "" : fromTimestamp(sub.end_date),
          never_expires: !!sub.never_expires,
          repeat_every_value: sub.repeat_every_value ? String(sub.repeat_every_value) : "1",
          repeat_every_unit: sub.repeat_every_unit || "years",
          billing_cycle_type: sub.billing_cycle_type || "contract",
          currency: sub.currency || "INR",
          discount_type: sub.discount_type || "amount",
          discount_value: sub.discount_value || 0,
          rounding: rounding_abs,
          rounding_sign: rounding_sign,
          notes: sub.notes || "",
          terms_conditions: sub.terms_and_conditions || "",
          email_list: Array.isArray(sub.email_list) ? sub.email_list : [],
          items: (sub.items || []).map(it => ({ service_id: it.service_id, service_name: it.service_name, quantity: it.quantity, rate: it.rate, tax_percent: it.tax_percent || 0 })),
        });

        // Load customer details for tax calculation
        if (sub.customer_id) {
          try {
            const custRes = await api.get(`/customer/${sub.customer_id}`);
            setSelectedCustomerDetails(custRes.data.customer);
            // Tax recalculation will be handled by the useEffect that watches selectedCustomerDetails
          } catch { }
        }
      } catch (e) {
        toast.error(e.normalizedMessage || 'Failed to load subscription');
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, [isEdit, id]);

  const domainOptions = useMemo(() => domains.map(d => ({ value: d.id, label: d.name, customer_id: d.customer_id })), [domains]);

  // Helper to decide intra/inter/international and get tax rates
  const geoInfo = useMemo(() => {
    const companyState = (() => {
      try {
        if (!gstSettings?.gst_in) return 'Tamil Nadu'; // sensible default
        const code = String(gstSettings.gst_in).slice(0, 2);
        // 33 => Tamil Nadu
        if (code === '33') return 'Tamil Nadu';
        return 'Tamil Nadu';
      } catch { return 'Tamil Nadu'; }
    })();
    const cust = selectedCustomerDetails;
    if (!cust) return { scope: 'unknown', isIntra: false, intraRate: 0, interRate: 0 };
    const addr = (() => {
      try {
        const addrValue = typeof cust.customer_address === 'string'
          ? JSON.parse(cust.customer_address)
          : (cust.customer_address || {});
        // Handle case where state might be an object with value/label
        const stateVal = addrValue?.state;
        const stateStr = typeof stateVal === 'object' ? (stateVal?.value || stateVal?.label || '') : stateVal;
        return { ...addrValue, state: stateStr || addrValue?.state || '' };
      } catch { return {}; }
    })();
    const state = (addr?.state || '').trim();
    const countryVal = addr?.country;
    const country = typeof countryVal === 'object' ? (countryVal?.value || countryVal?.label || 'India') : (countryVal || 'India');
    const countryStr = country.trim();
    if (countryStr && countryStr.toLowerCase() !== 'india' && countryStr.toLowerCase() !== 'in') {
      return { scope: 'international', isIntra: false, intraRate: 0, interRate: 0 };
    }
    // Check if customer state matches company state (Tamil Nadu)
    const isIntra = state.toLowerCase().includes('tamil nadu') || state.toLowerCase().includes(companyState.toLowerCase());

    // Get tax rates from default preferences
    let intraRate = 0, interRate = 0;

    // Calculate intra-state rate (from tax group or tax)
    if (defaultTaxPreferences.intra && defaultTaxPreferences.intra.kind === 'group') {
      const group = taxGroups.find(g => g.group_id === defaultTaxPreferences.intra.id);
      if (group && group.members && group.members.length > 0) {
        // Sum up all tax rates from group members
        intraRate = group.members.reduce((sum, member) => sum + (parseFloat(member.tax_rate) || 0), 0);
      }
    } else if (defaultTaxPreferences.intra && defaultTaxPreferences.intra.kind === 'tax') {
      const tax = taxes.find(t => t.tax_id === defaultTaxPreferences.intra.id);
      intraRate = parseFloat(tax?.tax_rate || 0);
    }

    // Calculate inter-state rate (from IGST tax)
    if (defaultTaxPreferences.inter && defaultTaxPreferences.inter.kind === 'tax') {
      const tax = taxes.find(t => t.tax_id === defaultTaxPreferences.inter.id);
      interRate = parseFloat(tax?.tax_rate || 0);
    }

    return { scope: isIntra ? 'intra' : 'inter', isIntra, intraRate, interRate };
  }, [selectedCustomerDetails, gstSettings, defaultTaxPreferences, taxGroups, taxes]);

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((acc, it) => acc + Number(it.quantity || 0) * Number(it.rate || 0), 0);
    const nonTaxable = (selectedCustomerDetails?.tax_preference || '').toLowerCase() !== 'taxable' || geoInfo.scope === 'international';
    const tax_total = nonTaxable ? 0 : form.items.reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.rate || 0) * Number(it.tax_percent || 0)) / 100, 0);
    const discountAmt = form.discount_type === 'percent' ? (subtotal * Number(form.discount_value || 0)) / 100 : Number(form.discount_value || 0);
    const roundingAbs = Math.abs(Number(form.rounding || 0));
    const roundingSigned = (form.rounding_sign === '-') ? -roundingAbs : roundingAbs;
    const total = Math.max(0, subtotal + tax_total - (isFinite(discountAmt) ? discountAmt : 0) + roundingSigned);
    // breakup - for intra-state, split CGST/SGST equally; for inter-state, use IGST
    let cgst = 0, sgst = 0, igst = 0;
    if (!nonTaxable) {
      if (geoInfo.isIntra) {
        // For intra-state, split tax_total equally into CGST and SGST
        cgst = tax_total / 2;
        sgst = tax_total / 2;
      } else if (geoInfo.scope === 'inter') {
        // For inter-state, use IGST
        igst = tax_total;
      }
    }
    return { subtotal, tax_total, total, cgst, sgst, igst, nonTaxable };
  }, [form.items, form.discount_type, form.discount_value, form.rounding, form.rounding_sign, selectedCustomerDetails?.tax_preference, geoInfo]);

  const resolveServiceDefaults = (svc) => {
    if (!svc) return { rate: 0, tax_percent: 0 };
    const rate = Number(svc.price || 0);
    const nonTaxable = (selectedCustomerDetails?.tax_preference || '').toLowerCase() !== 'taxable' || geoInfo.scope === 'international';
    let taxPercent = 0;
    if (!nonTaxable) {
      // First try to use service-specific tax_details, otherwise fall back to default tax preferences
      if (geoInfo.isIntra) {
        const svcIntraRate = svc.tax_details?.intra?.tax_rate ?? svc.tax_details?.intra?.rate;
        taxPercent = svcIntraRate ? Number(svcIntraRate) : geoInfo.intraRate;
      } else {
        const svcInterRate = svc.tax_details?.inter?.tax_rate ?? svc.tax_details?.inter?.rate;
        taxPercent = svcInterRate ? Number(svcInterRate) : geoInfo.interRate;
      }
    }
    return { rate, tax_percent: taxPercent };
  };

  const updateItem = (idx, patch) => {
    const norm = { ...patch };
    if (norm.quantity !== undefined) norm.quantity = clampNumber(norm.quantity, 1);
    if (norm.rate !== undefined) norm.rate = clampNumber(norm.rate, 0);
    if (norm.tax_percent !== undefined) norm.tax_percent = clampNumber(norm.tax_percent, 0);
    setForm(f => ({ ...f, items: f.items.map((it, i) => i === idx ? { ...it, ...norm } : it) }));
  };
  const addItem = () => {
    let nextIndex = 0;
    setForm(f => {
      const updatedItems = [...f.items, { service_id: "", quantity: 1, rate: 0, tax_percent: 0 }];
      nextIndex = updatedItems.length - 1;
      return { ...f, items: updatedItems };
    });
    setRecentlyAddedIndex(nextIndex);
  };
  const handleAnimatedAddItem = () => {
    setInlineAddRowVisible(false);
    addItem();
    if (inlineRowTimerRef.current) {
      clearTimeout(inlineRowTimerRef.current);
    }
    inlineRowTimerRef.current = setTimeout(() => {
      setInlineAddRowKey(prev => prev + 1);
      setInlineAddRowVisible(true);
    }, 350);
  };
  const removeItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  // When customer or geo changes, recompute tax_percent for existing selected services
  useEffect(() => {
    if (!form.items?.length || !selectedCustomerDetails) return;
    setForm(f => ({
      ...f,
      items: f.items.map(it => {
        if (!it.service_id) return it;
        const svc = services.find(s => String(s.id) === String(it.service_id));
        const def = resolveServiceDefaults(svc);
        return { ...it, tax_percent: def.tax_percent || 0 };
      })
    }));
  }, [selectedCustomerDetails, geoInfo.isIntra, geoInfo.intraRate, geoInfo.interRate, taxGroups, taxes]);

  useEffect(() => {
    return () => {
      if (inlineRowTimerRef.current) {
        clearTimeout(inlineRowTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recentlyAddedIndex === null) return;
    const timer = setTimeout(() => setRecentlyAddedIndex(null), 600);
    return () => clearTimeout(timer);
  }, [recentlyAddedIndex]);

  const validateForm = () => {
    const next = {};
    if (!form.domain_name) next.domain_name = 'Select domain';
    if (!form.customerID) next.customerID = 'Select customer';
    if (!form.startDate) next.startDate = 'Select start date';
    if (!form.never_expires && !form.endDate) next.endDate = 'Select end date or enable Never Expires';
    if (!form.never_expires && form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end < start) next.endDate = 'End date must be after start date';
    }
    if (!form.items.length) next.items = 'Add at least one item';
    // Validate items have required fields
    form.items.forEach((item, idx) => {
      if (!item.service_id) next[`item_${idx}_service`] = `Item ${idx + 1}: Select a service`;
      if (!item.quantity || item.quantity < 1) next[`item_${idx}_quantity`] = `Item ${idx + 1}: Quantity must be at least 1`;
      if (!item.rate || item.rate <= 0) next[`item_${idx}_rate`] = `Item ${idx + 1}: Rate must be greater than 0`;
    });
    // Validate repeat_every_value
    if (form.repeat_every_value && parseInt(form.repeat_every_value, 10) < 1) {
      next.repeat_every_value = 'Repeat Every must be at least 1';
    }
    // Validate discount value
    if (form.discount_value && form.discount_value < 0) {
      next.discount_value = 'Discount cannot be negative';
    }
    if (form.discount_type === 'percent' && form.discount_value > 100) {
      next.discount_value = 'Discount percentage cannot exceed 100%';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async (send = false) => {
    if (!validateForm()) {
      toast.error('Please resolve highlighted fields');
      return;
    }

    // Validate repeat_every_value
    if (form.repeat_every_value && parseInt(form.repeat_every_value, 10) < 1) {
      toast.error('Repeat Every value must be at least 1');
      return;
    }

    // Apply rounding sign to rounding value before sending to backend
    const roundingAbs = Math.abs(Number(form.rounding || 0));
    const roundingSigned = (form.rounding_sign === '-') ? -roundingAbs : roundingAbs;

    // Ensure tax_percent is properly set for all items
    const itemsWithTax = form.items.map(it => {
      const svc = services.find(s => String(s.id) === String(it.service_id));
      if (svc && (!it.tax_percent || it.tax_percent === 0)) {
        const defaults = resolveServiceDefaults(svc);
        return { ...it, tax_percent: defaults.tax_percent || 0 };
      }
      return { ...it, tax_percent: it.tax_percent || 0 };
    });

    const payload = {
      ...form,
      items: itemsWithTax,
      startDate: toTimestamp(form.startDate),
      endDate: form.never_expires ? null : toTimestamp(form.endDate),
      terms_conditions: form.terms_conditions || '',
      rounding: roundingSigned,
      repeat_every_value: form.repeat_every_value ? parseInt(form.repeat_every_value, 10) : null
    };
    try {
      setIsSaving(true);
      const username = params.username || (location.pathname.split('/')?.[1] || '');
      if (isEdit) {
        await api.put(`/subscriptions/${id}`, payload);
        toast.success('Subscription updated');
        navigate(`/${username}/dashboard/subscriptions`);
      } else {
        await api.post('/subscriptions', payload);
        toast.success('Subscription created');
        navigate(`/${username}/dashboard/subscriptions`);
      }
      if (send) toast.info('Send email feature coming soon');
      onBack && onBack();
    } catch (e) {
      toast.error(e.normalizedMessage || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/subscriptions/${id}`);
      toast.success("Subscription deleted");
      setDeleteDialogOpen(false);
      const username = params.username || (location.pathname.split('/')?.[1] || '');
      navigate(`/${username}/dashboard/subscriptions`);
    } catch (e) {
      toast.error(e.normalizedMessage || "Failed to delete subscription");
    } finally {
      setIsDeleting(false);
    }
  };

  const initNewEmail = { salutation: '', first_name: '', last_name: '', email: '', mobile: '', designation: '' };
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState(initNewEmail);
  const [chipEmail, setChipEmail] = useState('');

  const addChip = (val) => {
    const email = String(val || '').trim();
    if (!email) return;
    const valid = /.+@.+\..+/.test(email);
    if (!valid) { toast.error('Invalid email'); return; }
    setForm(f => ({ ...f, email_list: Array.from(new Set([...(f.email_list || []), email])) }));
    setChipEmail('');
  };

  const goBack = () => {
    if (onBack) return onBack();
    const username = params.username || (location.pathname.split('/')?.[1] || '');
    navigate(`/${username}/dashboard/subscriptions`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={goBack}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="text-xs text-gray-500">
                  Subscriptions {`>`} {isEdit ? 'Edit' : 'New'}
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {isEdit ? 'Edit Subscription' : 'New Subscription'}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-6">
        {loadingInitial ? (
          <Fragment>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-10 bg-gray-100 rounded mb-4"></div>
                  <div className="h-24 bg-gray-100 rounded"></div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-5 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
                  <div className="h-40 bg-gray-100 rounded"></div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse sticky top-24">
                  <div className="h-5 w-24 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-3">
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </Fragment>
        ) : (
          <Fragment>
            <div className="grid grid-cols-1 gap-6">
              {/* Main Content */}
              <div className="space-y-6">
                {/* Domain Selection Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Domain & Customer</h2>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2">Domain Name</Label>
                    <ReactSelect
                      classNamePrefix="rs"
                      placeholder="Search and select a domain..."
                      value={(() => {
                        const d = domains.find(x => x.name === form.domain_name);
                        return d ? { value: d.id, label: d.name } : (form.domain_name ? { value: form.domain_name, label: form.domain_name } : null);
                      })()}
                      onChange={async (opt) => {
                        if (!opt) {
                          setSelectedCustomerDetails(null);
                          setForm(f => ({ ...f, domain_name: "", customerID: "", email_list: [] }));
                          return;
                        }
                        const match = domains.find(d => String(d.id) === String(opt?.value));
                        setForm(f => ({ ...f, domain_name: match?.name || "", customerID: match?.customer_id || f.customerID }));
                        if (match?.customer_id) {
                          try {
                            const res = await api.get(`/customer/${match.customer_id}`);
                            const cust = res.data.customer;
                            setSelectedCustomerDetails(cust);
                            setForm(f => ({ ...f, currency: (cust.currency_code?.value || cust.currency_code || f.currency), email_list: Array.isArray(cust.other_contacts) ? [cust.primary_email, ...cust.other_contacts.map(o => o.email).filter(Boolean)] : [cust.primary_email] }));
                          } catch { }
                        }
                      }}
                      options={domainOptions}
                      isClearable
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: '42px',
                          borderColor: '#e5e7eb',
                          '&:hover': { borderColor: '#d1d5db' }
                        })
                      }}
                    />
                    {errors.domain_name && <div className="text-xs text-red-600 mt-1">{errors.domain_name}</div>}
                  </div>

                  {selectedCustomerDetails && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Company</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {selectedCustomerDetails.company_name || selectedCustomerDetails.display_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Email</div>
                          <div className="text-sm text-gray-700">{selectedCustomerDetails.primary_email}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">GST Number</div>
                          <div className="text-sm text-gray-700">{selectedCustomerDetails.gst_in || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">GST Treatment</div>
                          <div className="text-sm text-gray-700">{selectedCustomerDetails.gst_treatment}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Address</div>
                          <div className="text-sm text-gray-700">
                            {(() => {
                              try {
                                const a = typeof selectedCustomerDetails.customer_address === 'string'
                                  ? JSON.parse(selectedCustomerDetails.customer_address)
                                  : selectedCustomerDetails.customer_address;
                                return [a?.address, a?.city, a?.state, a?.zip].filter(Boolean).join(', ');
                              } catch { return 'N/A' }
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Subscription Period Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Subscription Period</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Start Date</Label>
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={e => {
                          const newStartDate = e.target.value;
                          // Auto-update end date to 1 year later if never_expires is false
                          if (!form.never_expires && newStartDate) {
                            const startDate = new Date(newStartDate);
                            const endDate = new Date(startDate);
                            endDate.setFullYear(startDate.getFullYear() + 1);
                            setForm({
                              ...form,
                              startDate: newStartDate,
                              endDate: endDate.toISOString().slice(0, 10)
                            });
                          } else {
                            setForm({ ...form, startDate: newStartDate });
                          }
                        }}
                        className="h-10"
                      />
                      {errors.startDate && <div className="text-xs text-red-600 mt-1">{errors.startDate}</div>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">End Date</Label>
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                        disabled={form.never_expires}
                        min={form.startDate || undefined}
                        className="h-10"
                      />
                      {!form.never_expires && errors.endDate && <div className="text-xs text-red-600 mt-1">{errors.endDate}</div>}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Currency</Label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50 text-gray-700 font-medium">
                        {form.currency}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={form.never_expires}
                        onChange={e => setForm({ ...form, never_expires: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Never Expires</span>
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-gray-700">Repeat Every</span>
                      <Input
                        className="w-24 h-9 bg-white"
                        type="number"
                        value={form.repeat_every_value || ""}
                        onChange={e => {
                          const val = e.target.value;
                          // Allow empty string and any numeric value
                          if (val === "" || (!isNaN(Number(val)) && Number(val) >= 0)) {
                            setForm({ ...form, repeat_every_value: val });
                          }
                        }}
                        onBlur={e => {
                          const val = e.target.value.trim();
                          // If empty or invalid, set to 1
                          if (!val || isNaN(Number(val)) || Number(val) < 1) {
                            setForm({ ...form, repeat_every_value: "1" });
                          }
                        }}
                      />
                      {errors.repeat_every_value && <div className="text-xs text-red-600">{errors.repeat_every_value}</div>}
                      <select
                        className="border border-gray-300 rounded-md h-9 px-3 bg-white text-sm"
                        value={form.repeat_every_unit}
                        onChange={e => setForm({ ...form, repeat_every_unit: e.target.value })}
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2">Billing Cycle Type</Label>
                    <select
                      className="w-full border border-gray-300 rounded-md h-10 px-3 bg-white text-sm"
                      value={form.billing_cycle_type || "contract"}
                      onChange={e => setForm({ ...form, billing_cycle_type: e.target.value })}
                    >
                      <option value="contract">Contract-Based (default)</option>
                      <option value="financial_year">Financial Year (Apr–Mar)</option>
                      <option value="calendar_year">Calendar Year (Jan–Dec)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select how billing periods should be calculated for this subscription.
                    </p>
                  </div>
                </div>

                {/* Items Table Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Items Table <span className="text-sm font-normal text-gray-500">({form.items.length})</span>
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAnimatedAddItem}
                      className="bg-blue-600 hover:bg-blue-700 h-9"
                      disabled={loadingInitial}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  {errors.items && <div className="text-xs text-red-600 mb-2">{errors.items}</div>}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableCell as="th" className="font-semibold text-gray-700">Item Details</TableCell>
                          <TableCell as="th" className="font-semibold text-gray-700">Qty</TableCell>
                          <TableCell as="th" className="font-semibold text-gray-700">Rate</TableCell>
                          <TableCell as="th" className="font-semibold text-gray-700">Tax %</TableCell>
                          <TableCell as="th" className="text-right font-semibold text-gray-700">Amount</TableCell>
                          <TableCell as="th" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.items.map((it, idx) => {
                          const itemErrors = Object.keys(errors).filter(k => k.startsWith(`item_${idx}_`));
                          return (
                            <Fragment key={idx}>
                              <ItemRow
                                idx={idx}
                                item={it}
                                services={services}
                                onChange={(i, p) => updateItem(i, p)}
                                onRemove={removeItem}
                                resolveDefaults={resolveServiceDefaults}
                                customerSelected={!!selectedCustomerDetails}
                                isNew={idx === recentlyAddedIndex}
                              />
                              {itemErrors.length > 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-xs text-red-600 bg-red-50">
                                    {itemErrors.map(k => errors[k]).join(', ')}
                                  </TableCell>
                                </TableRow>
                              )}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {inlineAddRowVisible && (
                    <button
                      key={inlineAddRowKey}
                      type="button"
                      onClick={handleAnimatedAddItem}
                      className="inline-add-row mt-4  rounded-lg border border-dashed border-blue-300 bg-blue-50/70 py-3 px-4 text-blue-700 font-semibold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                      disabled={loadingInitial}
                    >
                      <Plus className="w-4 h-4" />

                    </button>
                  )}
                </div>

                {/* Summary (moved below Items) */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Inputs */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2">Discount</Label>
                        <div className="flex gap-2">
                          <select
                            className="border border-gray-300 rounded-md h-10 px-3 bg-white text-sm w-24"
                            value={form.discount_type}
                            onChange={e => setForm({ ...form, discount_type: e.target.value })}
                          >
                            <option value="amount">₹</option>
                            <option value="percent">%</option>
                          </select>
                          <Input
                            type="number"
                            value={form.discount_value}
                            onChange={e => setForm({ ...form, discount_value: e.target.value })}
                            className="h-10 flex-1 "
                            placeholder="0.00"
                            min={form.discount_type === 'percent' ? 0 : undefined}
                            max={form.discount_type === 'percent' ? 100 : undefined}
                          />
                        </div>
                        {errors.discount_value && <div className="text-xs text-red-600 mt-1">{errors.discount_value}</div>}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2">Round Off</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-3 border border-gray-300 rounded-md px-3 h-10 bg-white">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="roundsign"
                                checked={form.rounding_sign === '+'}
                                onChange={() => setForm({ ...form, rounding_sign: '+' })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm font-medium">+</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="roundsign"
                                checked={form.rounding_sign === '-'}
                                onChange={() => setForm({ ...form, rounding_sign: '-' })}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm font-medium">-</span>
                            </label>
                          </div>
                          <Input
                            className="flex-1 h-10"
                            type="number"
                            value={form.rounding}
                            onChange={e => setForm({ ...form, rounding: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Right: Totals */}
                    <div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Sub Total</span>
                          <span className="font-medium text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Discount</span>
                          <span className="font-medium text-gray-900">{form.discount_type === 'percent' ? `${Number(form.discount_value || 0).toFixed(2)}%` : `₹${Number(form.discount_value || 0).toFixed(2)}`}</span>
                        </div>
                        {totals.nonTaxable ? (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium text-gray-900">₹0.00</span>
                          </div>
                        ) : (
                          <>
                            {geoInfo.isIntra ? (
                              <>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">CGST</span>
                                  <span className="font-medium text-gray-900">₹{totals.cgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">SGST</span>
                                  <span className="font-medium text-gray-900">₹{totals.sgst.toFixed(2)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">IGST</span>
                                <span className="font-medium text-gray-900">₹{totals.igst.toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        )}
                        {Number(form.rounding) !== 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Round Off</span>
                            <span className="font-medium text-gray-900">{form.rounding_sign}{Math.abs(Number(form.rounding)).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                          <span className="text-base font-semibold text-gray-900">Total ({form.currency})</span>
                          <span className="text-xl font-bold text-blue-600">₹{totals.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-2">Payment Terms</div>
                        <div className="text-sm text-gray-700">
                          {form.repeat_every_value && form.repeat_every_unit ? (
                            <span>Recurring every {form.repeat_every_value} {form.repeat_every_unit}</span>
                          ) : (
                            <span className="text-gray-400">Not configured</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes, Terms & Recipients Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Notes / Instructions</Label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={4}
                        placeholder="Add any additional notes or instructions..."
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2">Terms & Conditions</Label>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={4}
                        placeholder="Add terms and conditions..."
                        value={form.terms_conditions || ''}
                        onChange={e => setForm({ ...form, terms_conditions: e.target.value })}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <Label className="text-sm font-medium text-gray-700">Email Recipients</Label>
                        </div>
                        <button
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          onClick={() => setAddEmailOpen(true)}
                        >
                          + Add New
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-3 min-h-[60px] bg-gray-50">
                        {(form.email_list || []).map((em, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-100 border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-900"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{em}</span>
                            <button
                              type="button"
                              className="text-blue-700 hover:text-blue-900"
                              onClick={() => setForm(f => ({ ...f, email_list: (f.email_list || []).filter(x => x !== em) }))}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        <input
                          className="flex-1 min-w-[200px] outline-none bg-transparent text-sm placeholder-gray-400"
                          placeholder="Type email and press Enter..."
                          value={chipEmail}
                          onChange={e => setChipEmail(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
                              e.preventDefault();
                              addChip(chipEmail.replace(/,+$/, ''));
                            }
                          }}
                          onBlur={() => addChip(chipEmail.replace(/,+$/, ''))}
                        />
                      </div>
                    </div>

                    {addEmailOpen && (
                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <h3 className="font-semibold text-gray-900 mb-4">Add New Recipient</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">First Name *</Label>
                            <Input
                              value={newEmail.first_name}
                              onChange={e => setNewEmail({ ...newEmail, first_name: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">Last Name</Label>
                            <Input
                              value={newEmail.last_name}
                              onChange={e => setNewEmail({ ...newEmail, last_name: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">Email *</Label>
                            <Input
                              type="email"
                              value={newEmail.email}
                              onChange={e => setNewEmail({ ...newEmail, email: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">Mobile</Label>
                            <Input
                              value={newEmail.mobile}
                              onChange={e => setNewEmail({ ...newEmail, mobile: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">Salutation</Label>
                            <Input
                              value={newEmail.salutation}
                              onChange={e => setNewEmail({ ...newEmail, salutation: e.target.value })}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700 mb-1">Designation</Label>
                            <Input
                              value={newEmail.designation}
                              onChange={e => setNewEmail({ ...newEmail, designation: e.target.value })}
                              className="h-10"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setAddEmailOpen(false); setNewEmail(initNewEmail); }}
                            className="h-10"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={async () => {
                              if (!selectedCustomerDetails) { toast.error('Select a domain/customer first'); return; }
                              if (!newEmail.first_name || !newEmail.email) { toast.error('Name and email are required'); return; }
                              try {
                                const res = await api.post(`/customer/${selectedCustomerDetails.customer_id || selectedCustomerDetails.customerId || form.customerID}/contacts`, {
                                  ...newEmail,
                                  is_subscriptions_recipient: true,
                                });
                                const contacts = res.data.contacts || [];
                                const emails = [selectedCustomerDetails.primary_email, ...contacts.map(c => c.email).filter(Boolean)];
                                setForm(f => ({ ...f, email_list: emails }));
                                setAddEmailOpen(false);
                                setNewEmail(initNewEmail);
                                toast.success('Recipient added');
                              } catch (e) {
                                toast.error(e.normalizedMessage || 'Failed to add recipient');
                              }
                            }}
                            className="h-10 bg-blue-600 hover:bg-blue-700"
                          >
                            Save Recipient
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - Below Recipients Section */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 px-6 -mx-6 mt-6 shadow-lg z-20">
                <div className="flex items-center justify-end gap-3 max-w-7xl mx-auto">
                {isEdit && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteConfirmValue("");
                      setDeleteDialogOpen(true);
                    }}
                    className="h-10 px-6 mr-auto"
                    disabled={isSaving || isDeleting}
                  >
                    Delete
                  </Button>
                )}
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    className="h-10 px-6"
                    disabled={isSaving || loadingInitial}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    className="h-10 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
                    disabled={isSaving || loadingInitial}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Save & Send
                  </Button>
                </div>
              </div>
            </div>
          </Fragment>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) setDeleteDialogOpen(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Type the subscription domain name <strong>{form.domain_name || "subscription"}</strong> to confirm deletion. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="delete-subscription-confirm">Subscription Name</Label>
            <Input
              id="delete-subscription-confirm"
              value={deleteConfirmValue}
              onChange={(e) => setDeleteConfirmValue(e.target.value)}
              placeholder="Enter subscription name"
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubscription}
              disabled={
                isDeleting ||
                !form.domain_name ||
                deleteConfirmValue.trim().toLowerCase() !== form.domain_name.trim().toLowerCase()
              }
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}