import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import {
  Bell, Plus, Trash2, Save, Lock, GripVertical,
  AlertCircle, Search, ChevronRight, AlertTriangle,
  Settings2, Mail, Clock, ShieldCheck, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";
import { cn } from "@/lib/utils";
import Hamster from "@/components/animations/Hamster.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";

const ReminderPolicies = () => {
  const { username } = useParams();
  const [policies, setPolicies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [policyForm, setPolicyForm] = useState({ id: null, name: "", is_default: false });
  const [offsets, setOffsets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.REMINDER_POLICIES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.REMINDER_POLICIES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.REMINDER_POLICIES_DELETE);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesRes, templatesRes] = await Promise.all([
        api.get("/reminder-policies"),
        api.get("/email-templates?active_only=true"),
      ]);
      setPolicies(policiesRes.data || []);
      setTemplates(templatesRes.data || []);

      if (policiesRes.data?.length > 0 && !selectedPolicyId) {
        const defaultPolicy = policiesRes.data.find(p => p.is_default) || policiesRes.data[0];
        setSelectedPolicyId(defaultPolicy.id);
        loadPolicy(defaultPolicy);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadPolicy = (policy) => {
    setPolicyForm({
      id: policy.id,
      name: policy.name,
      is_default: policy.is_default,
    });
    setOffsets(policy.offsets || []);
  };

  const handleSelectPolicy = (policy) => {
    setSelectedPolicyId(policy.id);
    loadPolicy(policy);
  };

  const handleNewPolicy = () => {
    setPolicyForm({ id: null, name: "", is_default: false });
    setOffsets([]);
    setShowPolicyDialog(true);
  };

  const handleEditPolicy = () => {
    setShowPolicyDialog(true);
  };

  const handleSavePolicy = async () => {
    if (!policyForm.name.trim()) {
      toast.error("Please enter a policy name");
      return;
    }

    setSaving(true);
    try {
      if (policyForm.id) {
        await api.put(`/reminder-policies/${policyForm.id}`, {
          name: policyForm.name,
          is_default: policyForm.is_default,
          offsets: offsets,
        });
        toast.success("Policy updated", { theme: "colored" });
      } else {
        const { data } = await api.post("/reminder-policies", {
          name: policyForm.name,
          is_default: policyForm.is_default,
          offsets: offsets,
        });
        toast.success("New policy created", { theme: "colored" });
        setSelectedPolicyId(data.policyId);
      }
      setShowPolicyDialog(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (policy) => {
    if (policy.is_default) {
      toast.info("Cannot delete the default policy");
      return;
    }

    try {
      await api.delete(`/reminder-policies/${policy.id}`);
      toast.success("Policy deleted", { theme: "colored" });
      setShowDeleteConfirm(null);
      if (selectedPolicyId === policy.id) {
        setSelectedPolicyId(null);
        setPolicyForm({ id: null, name: "", is_default: false });
        setOffsets([]);
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Delete failed");
    }
  };

  const addOffset = () => {
    setOffsets([...offsets, {
      days_offset: 0,
      template_key: "",
      active: true,
      sort_order: offsets.length,
    }]);
  };

  const updateOffset = (index, updates) => {
    const newOffsets = [...offsets];
    newOffsets[index] = { ...newOffsets[index], ...updates };
    setOffsets(newOffsets);
  };

  const removeOffset = (index) => {
    setOffsets(offsets.filter((_, i) => i !== index).map((o, i) => ({ ...o, sort_order: i })));
  };

  const moveOffset = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === offsets.length - 1)) {
      return;
    }
    const newOffsets = [...offsets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newOffsets[index], newOffsets[targetIndex]] = [newOffsets[targetIndex], newOffsets[index]];
    newOffsets[index].sort_order = index;
    newOffsets[targetIndex].sort_order = targetIndex;
    setOffsets(newOffsets);
  };

  const filteredPolicies = policies.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center my-32">
        <Hamster />
        <p className="mt-6 text-sm font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Loading Policies...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent max-w-[1600px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <Breadcrumb 
            items={[
              { label: "Settings", href: `/${username}/dashboard/settings` },
              { label: "Automated Reminders" }
            ]} 
          />
          <h1 className="text-4xl font-black uppercase tracking-tight">Reminder Policies</h1>
          <p className="text-slate-500 font-medium max-w-xl">Manage when reminders are sent to users for renewals and expirations.</p>
        </div>
        {canCreate && (
          <Button
            onClick={handleNewPolicy}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 mr-3" strokeWidth={3} /> Add Policy
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden min-h-[700px]">
        {/* Left Side - Navigator */}
        <div className="lg:w-[380px] flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="SEARCH POLICIES..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-14 pl-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-blue-500/20 font-black uppercase tracking-widest text-[10px]"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <AnimatePresence>
              {filteredPolicies.map((policy) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => handleSelectPolicy(policy)}
                  className={cn(
                    "group relative p-6 cursor-pointer rounded-3xl border transition-all duration-300",
                    selectedPolicyId === policy.id
                      ? "bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20 text-white"
                      : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-blue-500/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {policy.is_default ? (
                          <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", selectedPolicyId === policy.id ? "bg-white/20" : "bg-amber-500/10")}>
                            <Lock size={12} className={selectedPolicyId === policy.id ? "text-white" : "text-amber-500"} />
                          </div>
                        ) : (
                          <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", selectedPolicyId === policy.id ? "bg-white/20" : "bg-blue-500/10")}>
                            <Clock size={12} className={selectedPolicyId === policy.id ? "text-white" : "text-blue-500"} />
                          </div>
                        )}
                        <h3 className="font-black uppercase tracking-tight text-xs truncate">
                          {policy.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <History size={10} className="mt-0.5 opacity-60" />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                            {policy.offsets?.length || 0} STEPS
                          </span>
                        </div>
                        {!!policy.is_default && (
                          <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", selectedPolicyId === policy.id ? "bg-white/20" : "bg-amber-500/10 text-amber-500")}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className={cn("mt-1 transition-transform", selectedPolicyId === policy.id ? "text-white rotate-90" : "text-slate-300 group-hover:translate-x-1")} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredPolicies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-400">
                <AlertCircle className="w-10 h-10 mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Policies Found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Engine */}
        <div className="flex-1 flex flex-col min-w-0">
          <AnimatePresence mode="wait">
            {selectedPolicy ? (
              <motion.div
                key={selectedPolicy.id}
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full gap-6"
              >
                {/* Control Hub */}
                <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                          <Settings2 className="text-indigo-500" size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black uppercase tracking-tight">Policy Details</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy ID: #{String(selectedPolicy.id).slice(0, 8)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {(canCreate || canUpdate) && !selectedPolicy.is_default && (
                        <>
                          <Button
                            onClick={handleEditPolicy}
                            disabled={saving}
                            className="bg-slate-950 dark:bg-white dark:text-slate-950 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest text-[10px] flex-1 sm:flex-none shadow-lg active:scale-95 transition-all"
                          >
                            <Save className="w-4 h-4 mr-3" /> Save Changes
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              onClick={() => setShowDeleteConfirm(selectedPolicy)}
                              className="rounded-2xl h-12 w-12 border-slate-100 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                      {selectedPolicy.is_default && (
                        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <ShieldCheck size={16} />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Default Policy (Protected)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label htmlFor="policy_name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Policy Name</Label>
                      <Input
                        id="policy_name"
                        value={policyForm.name}
                        onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                        placeholder="e.g. Standard Policy"
                        className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 font-black tracking-tight uppercase"
                        disabled={selectedPolicy.is_default || !canUpdate}
                      />
                    </div>
                  </div>
                </div>

                {/* Automation Deck */}
                <div className="flex-1 overflow-visible">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Bell className="text-blue-500" size={16} />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Reminder Steps</h3>
                    </div>
                    {canUpdate && !selectedPolicy.is_default && (
                      <Button
                        onClick={addOffset}
                        variant="outline"
                        className="rounded-xl h-10 px-4 border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <Plus className="w-3 h-3 mr-2" /> Add Step
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 pb-20 overflow-y-auto custom-scrollbar pr-2 max-h-[800px]">
                    <AnimatePresence>
                      {offsets.map((offset, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all"
                        >
                          <div className="flex flex-col xl:flex-row items-start xl:items-center gap-6">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                  onClick={() => moveOffset(index, 'up')}
                                  disabled={selectedPolicy.is_default || !canUpdate || index === 0}
                                >
                                  <ChevronRight size={14} className="-rotate-90 text-slate-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                  onClick={() => moveOffset(index, 'down')}
                                  disabled={selectedPolicy.is_default || !canUpdate || index === offsets.length - 1}
                                >
                                  <ChevronRight size={14} className="rotate-90 text-slate-400" />
                                </Button>
                              </div>
                              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 font-black text-xs text-slate-400">
                                {String(index + 1).padStart(2, '0')}
                              </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 w-full font-black">
                              <div className="md:col-span-3 space-y-2">
                                <Label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-1">When to send</Label>
                                <div className="relative">
                                  <Input
                                    type="text"
                                    value={offset.days_offset ?? ""}
                                    onFocus={(e) => {
                                      if (e.target.value === "0") {
                                        updateOffset(index, { days_offset: "" });
                                      }
                                    }}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === "" || /^[+-]?\d*$/.test(val)) {
                                        const parsed = parseInt(val);
                                        updateOffset(index, { days_offset: isNaN(parsed) ? (val === "-" || val === "+" ? val : 0) : parsed });
                                      }
                                    }}
                                    className="h-12 rounded-xl border-slate-100 dark:border-slate-800 tabular-nums px-4 font-black"
                                    disabled={selectedPolicy.is_default || !canUpdate}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 uppercase">Days</div>
                                </div>
                                <p className="text-[9px] text-blue-500 uppercase tracking-widest pl-1 font-black">
                                  {offset.days_offset < 0 ? `${Math.abs(offset.days_offset)} days before expiry` :
                                    offset.days_offset === 0 || offset.days_offset === "" ? 'on the day of expiry' :
                                      `${offset.days_offset} days after expiry`}
                                </p>
                              </div>

                              <div className="md:col-span-6 space-y-2">
                                <Label className="text-[9px] uppercase tracking-[0.2em] text-slate-400 ml-1">Email Template</Label>
                                <Select
                                  value={offset.template_key}
                                  onValueChange={(value) => updateOffset(index, { template_key: value })}
                                  disabled={selectedPolicy.is_default || !canUpdate}
                                >
                                  <SelectTrigger className="h-12 rounded-xl border-slate-100 dark:border-slate-800 font-black uppercase text-[10px] tracking-widest">
                                    <SelectValue placeholder="SELECT TEMPLATE" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl dark:bg-slate-900 border-slate-800">
                                    {templates.map((template) => (
                                      <SelectItem key={template.template_key} value={template.template_key} className="rounded-xl my-1 mx-1 font-black uppercase text-[10px] tracking-widest">
                                        <div className="flex items-center gap-3">
                                          <Mail size={12} className="opacity-40" />
                                          {template.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="md:col-span-2 flex items-center h-12 mt-auto">
                                <label className="flex items-center gap-3 cursor-pointer group/check">
                                  <Checkbox
                                    checked={offset.active}
                                    onCheckedChange={(checked) => updateOffset(index, { active: checked })}
                                    disabled={selectedPolicy.is_default || !canUpdate}
                                    className="h-6 w-6 rounded-lg border-2 border-slate-200 dark:border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all"
                                  />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/check:text-blue-500 transition-colors">Enabled</span>
                                </label>
                              </div>

                              <div className="md:col-span-1 flex items-center justify-end h-12 mt-auto">
                                {canUpdate && !selectedPolicy.is_default && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
                                    onClick={() => removeOffset(index)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {offsets.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-400 italic">
                        <Mail className="w-16 h-16 mb-4 opacity-10" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4">No reminder steps configured</p>
                        {canUpdate && !selectedPolicy.is_default && (
                          <Button onClick={addOffset} variant="outline" className="rounded-2xl border-blue-500/20 text-blue-500 font-black uppercase tracking-widest text-[10px] h-12 px-6">
                            Add First Step
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="max-w-md text-center">
                  <div className="h-24 w-24 bg-slate-100 dark:bg-slate-900 rounded-[3rem] items-center justify-center flex mx-auto mb-8 border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Settings2 className="w-10 h-10 text-slate-300" strokeWidth={1} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No Policy Selected</h3>
                  <p className="text-slate-500 font-medium">Select a reminder policy from the left to manage its schedule.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Initialize Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-2xl rounded-[3rem] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-0 overflow-hidden">
          <DialogHeader className="p-10 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">{policyForm.id ? "Edit Policy" : "Add Policy"}</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Give your reminder policy a name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 space-y-8">
            <div className="space-y-3">
              <Label htmlFor="dialog-policy-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Policy Name</Label>
              <Input
                id="dialog-policy-name"
                value={policyForm.name}
                onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                placeholder="e.g. Enterprise Policy"
                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 font-black uppercase"
              />
            </div>

            <div className="flex items-center gap-4 p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <Checkbox
                id="is-default"
                checked={policyForm.is_default}
                onCheckedChange={(checked) => setPolicyForm({ ...policyForm, is_default: checked })}
                className="h-6 w-6 rounded-lg"
              />
              <div className="flex flex-col">
                <Label htmlFor="is-default" className="font-black uppercase tracking-widest text-[10px] text-amber-600 cursor-pointer">
                  Promote to Default
                </Label>
                <p className="text-[9px] text-amber-600/60 font-medium uppercase tracking-widest">This logic will replace existing system defaults.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="p-10 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 gap-4">
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)} className="rounded-2xl h-14 px-8 font-black uppercase text-[11px] tracking-widest">
              Cancel
            </Button>
            <Button onClick={handleSavePolicy} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 px-10 font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-500/25">
              {saving ? "Saving..." : (policyForm.id ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Termination Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-2xl p-10 max-w-md w-full text-center"
            >
              <div className="h-20 w-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Delete Policy?</h3>
              <p className="text-slate-500 font-medium mb-8">
                Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{showDeleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="destructive"
                  className="rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-rose-500/25"
                  onClick={() => handleDeletePolicy(showDeleteConfirm)}
                >
                  <Trash2 className="w-4 h-4 mr-3" /> Delete
                </Button>
                <Button variant="outline" className="rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] border-slate-100 dark:border-slate-800" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReminderPolicies;

