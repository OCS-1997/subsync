import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import {
  Loader2, Bell, Plus, Trash2, Save, X, Lock, GripVertical,
  AlertCircle, Search, ChevronDown, ChevronRight, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Checkbox } from "@/components/ui/checkbox.jsx";

const ReminderPolicies = () => {
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
      toast.error("Failed to load reminder policies");
      console.error(error);
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
      toast.error("Policy name is required");
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
        toast.success("Reminder policy updated successfully");
      } else {
        const { data } = await api.post("/reminder-policies", {
          name: policyForm.name,
          is_default: policyForm.is_default,
          offsets: offsets,
        });
        toast.success("Reminder policy created successfully");
        setSelectedPolicyId(data.policyId);
      }
      setShowPolicyDialog(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save reminder policy");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (policy) => {
    if (policy.is_default) {
      toast.info("Cannot delete default reminder policy");
      return;
    }

    try {
      await api.delete(`/reminder-policies/${policy.id}`);
      toast.success("Reminder policy deleted successfully");
      setShowDeleteConfirm(null);
      if (selectedPolicyId === policy.id) {
        setSelectedPolicyId(null);
        setPolicyForm({ id: null, name: "", is_default: false });
        setOffsets([]);
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete reminder policy");
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
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg font-medium animate-pulse">Loading Reminder Policies...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reminder Policies</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage reminder schedules for subscription renewals
              </p>
            </div>
            {canCreate && (
              <Button onClick={handleNewPolicy} className="shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> New Policy
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Policy List */}
        <div className="w-80 border-r border-border bg-card/20 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredPolicies.map((policy) => (
                <motion.div
                  key={policy.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleSelectPolicy(policy)}
                  className={`
                    relative px-4 py-3 cursor-pointer border-l-2 transition-all
                    ${selectedPolicyId === policy.id
                      ? 'bg-primary/5 border-l-blue-500'
                      : 'border-l-transparent hover:bg-accent/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm truncate ${selectedPolicyId === policy.id ? 'text-primary' : 'text-foreground'}`}>
                          {policy.name}
                        </h3>
                        {policy.is_default && (
                          <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" title="Default Policy" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {policy.offsets?.length || 0} reminder(s)
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredPolicies.length === 0 && (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No policies found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Policy Details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedPolicy ? (
            <>
              <div className="border-b border-border bg-card/30 p-6">
                <div className="max-w-4xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">Policy Details</h2>
                      <p className="text-sm text-muted-foreground">
                        Configure reminder schedule offsets
                      </p>
                    </div>
                    {selectedPolicy.is_default && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Default Policy
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="policy-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Policy Name
                      </Label>
                      <Input
                        id="policy-name"
                        value={policyForm.name}
                        onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                        placeholder="e.g. Standard Renewal Policy"
                        className="h-9"
                        disabled={selectedPolicy.is_default || !canUpdate}
                      />
                    </div>

                    {(canCreate || canUpdate) && !selectedPolicy.is_default && (
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleEditPolicy}
                          disabled={saving}
                          size="sm"
                          className="shadow-sm"
                        >
                          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                          Update Policy
                        </Button>
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(selectedPolicy)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete Policy
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Offsets Section */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Reminder Offsets</h3>
                    {canUpdate && !selectedPolicy.is_default && (
                      <Button onClick={addOffset} size="sm" variant="outline">
                        <Plus className="w-3 h-3 mr-2" />
                        Add Offset
                      </Button>
                    )}
                  </div>

                  {offsets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>No reminder offsets configured</p>
                      {canUpdate && !selectedPolicy.is_default && (
                        <Button onClick={addOffset} size="sm" className="mt-4" variant="outline">
                          Add First Offset
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {offsets.map((offset, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-4 bg-card/30 flex items-center gap-4"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveOffset(index, 'up')}
                                disabled={selectedPolicy.is_default || !canUpdate}
                              >
                                <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                              </Button>
                            )}
                            {index < offsets.length - 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveOffset(index, 'down')}
                                disabled={selectedPolicy.is_default || !canUpdate}
                              >
                                <ChevronRight className="w-3 h-3 rotate-90" />
                              </Button>
                            )}
                          </div>

                          <div className="flex-1 grid grid-cols-12 gap-4">
                            <div className="col-span-2">
                              <Label className="text-xs">Days Offset</Label>
                              <Input
                                type="number"
                                value={offset.days_offset}
                                onChange={(e) => updateOffset(index, { days_offset: parseInt(e.target.value) || 0 })}
                                className="h-9"
                                disabled={selectedPolicy.is_default || !canUpdate}
                                placeholder="-30"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {offset.days_offset < 0 ? `${Math.abs(offset.days_offset)} days before` :
                                 offset.days_offset === 0 ? 'On expiry' :
                                 `${offset.days_offset} days after`}
                              </p>
                            </div>

                            <div className="col-span-6">
                              <Label className="text-xs">Email Template</Label>
                              <Select
                                value={offset.template_key}
                                onValueChange={(value) => updateOffset(index, { template_key: value })}
                                disabled={selectedPolicy.is_default || !canUpdate}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                                <SelectContent>
                                  {templates.map((template) => (
                                    <SelectItem key={template.template_key} value={template.template_key}>
                                      {template.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="col-span-2 flex items-end">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`active-${index}`}
                                  checked={offset.active}
                                  onCheckedChange={(checked) => updateOffset(index, { active: checked })}
                                  disabled={selectedPolicy.is_default || !canUpdate}
                                />
                                <Label htmlFor={`active-${index}`} className="text-xs cursor-pointer">
                                  Active
                                </Label>
                              </div>
                            </div>

                            <div className="col-span-2 flex items-end justify-end">
                              {canUpdate && !selectedPolicy.is_default && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => removeOffset(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a policy to view details</p>
                <p className="text-sm mt-1">or create a new policy to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Policy Dialog */}
      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{policyForm.id ? "Edit Policy" : "Create New Policy"}</DialogTitle>
            <DialogDescription>
              {policyForm.id ? "Update policy information" : "Define a new reminder policy"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-policy-name">Policy Name *</Label>
              <Input
                id="dialog-policy-name"
                value={policyForm.name}
                onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                placeholder="e.g. Standard Renewal Policy"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-default"
                checked={policyForm.is_default}
                onCheckedChange={(checked) => setPolicyForm({ ...policyForm, is_default: checked })}
              />
              <Label htmlFor="is-default" className="cursor-pointer">
                Set as default policy
              </Label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Reminder Offsets</Label>
                <Button onClick={addOffset} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-2" />
                  Add Offset
                </Button>
              </div>

              {offsets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No offsets added yet
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {offsets.map((offset, index) => (
                    <div key={index} className="border rounded p-3 flex items-center gap-2">
                      <Input
                        type="number"
                        value={offset.days_offset}
                        onChange={(e) => updateOffset(index, { days_offset: parseInt(e.target.value) || 0 })}
                        placeholder="Days"
                        className="w-24 h-8"
                      />
                      <Select
                        value={offset.template_key}
                        onValueChange={(value) => updateOffset(index, { template_key: value })}
                      >
                        <SelectTrigger className="flex-1 h-8">
                          <SelectValue placeholder="Template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.template_key} value={template.template_key}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Checkbox
                        checked={offset.active}
                        onCheckedChange={(checked) => updateOffset(index, { active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeOffset(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPolicyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePolicy} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {policyForm.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Delete Policy</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePolicy(showDeleteConfirm)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete Policy
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReminderPolicies;

