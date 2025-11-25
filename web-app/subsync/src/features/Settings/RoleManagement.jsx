import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import {
  Loader2, Shield, Trash2, Save, Plus, Check, Lock, Users,
  AlertCircle, Search, ChevronDown, ChevronRight, Info,
  CheckSquare, Square, MinusSquare, X, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.jsx";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleForm, setRoleForm] = useState({ id: null, roleKey: "", name: "", description: "" });
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [originalPermissions, setOriginalPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const pendingActionRef = useRef(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.ROLES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ROLES_DELETE);
  const canAssignPerms = hasPermission(PERMISSIONS.ROLES_ASSIGN_PERMISSIONS);

  useEffect(() => {
    fetchData();
  }, []);

  // Track unsaved changes
  useEffect(() => {
    const sortedSelected = [...selectedPermissions].sort();
    const sortedOriginal = [...originalPermissions].sort();
    const permissionsChanged = JSON.stringify(sortedSelected) !== JSON.stringify(sortedOriginal);
    setHasUnsavedChanges(permissionsChanged);
  }, [selectedPermissions, originalPermissions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get("/rbac/roles"),
        api.get("/rbac/permissions"),
      ]);
      const roleList = rolesRes.data || [];
      setRoles(roleList);
      setPermissions(permsRes.data || []);
      const collapsedState = {};
      (permsRes.data || []).forEach(perm => {
        if (!(perm.resource in collapsedState)) {
          collapsedState[perm.resource] = false;
        }
      });
      setExpandedCategories(collapsedState);

      if (roleList.length) {
        const preferredId = roleForm.id || selectedRoleId;
        const nextRole = roleList.find((role) => role.id === preferredId) || roleList[0];
        if (nextRole) {
          applyRoleSelection(nextRole);
        }
      } else {
        resetForm();
      }
    } catch (error) {
      toast.error("Failed to load roles or permissions");
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc, perm) => {
      acc[perm.resource] = acc[perm.resource] ? [...acc[perm.resource], perm] : [perm];
      return acc;
    }, {});
  }, [permissions]);

  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.roleKey.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const applyRoleSelection = (role) => {
    if (!role) return;
    setSelectedRoleId(role.id);
    setRoleForm({
      id: role.id,
      roleKey: role.roleKey,
      name: role.name,
      description: role.description || "",
    });
    const rolePerms = role.permissions || [];
    setSelectedPermissions(rolePerms);
    setOriginalPermissions(rolePerms);
    setHasUnsavedChanges(false);
  };

  const requestUnsavedConfirmation = (action) => {
    if (hasUnsavedChanges) {
      pendingActionRef.current = action;
      setUnsavedDialogOpen(true);
    } else {
      action();
    }
  };

  const handleSelectRole = (role) => {
    if (!role) return;
    requestUnsavedConfirmation(() => applyRoleSelection(role));
  };

  const handleRoleInputChange = (event) => {
    const { name, value } = event.target;
    setRoleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRole = async (event) => {
    event.preventDefault();
    if (!canCreate && !canUpdate) {
      toast.error("You do not have permission to save roles");
      return;
    }
    setSavingRole(true);
    try {
      if (roleForm.id) {
        await api.put(`/rbac/roles/${roleForm.id}`, {
          roleKey: roleForm.roleKey,
          name: roleForm.name,
          description: roleForm.description,
        });
        toast.success("Role updated successfully");
      } else {
        const { data } = await api.post(`/rbac/roles`, {
          roleKey: roleForm.roleKey,
          name: roleForm.name,
          description: roleForm.description,
        });
        toast.success("Role created successfully");
        setSelectedRoleId(data.roleId);
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!canDelete) {
      toast.error("You do not have permission to delete roles");
      return;
    }
    if (role.isSystem) {
      toast.info("System roles cannot be deleted");
      return;
    }
    try {
      await api.delete(`/rbac/roles/${role.id}`);
      toast.success("Role deleted successfully");
      setSelectedRoleId(null);
      setShowDeleteConfirm(null);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete role");
    }
  };

  const togglePermission = (permissionKey) => {
    if (!canAssignPerms) return;
    setSelectedPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((key) => key !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleAllInCategory = (category, perms) => {
    if (!canAssignPerms) return;
    const categoryPermKeys = perms.map(p => p.permissionKey);
    const allSelected = categoryPermKeys.every(key => selectedPermissions.includes(key));

    if (allSelected) {
      // Deselect all in category
      setSelectedPermissions(prev => prev.filter(key => !categoryPermKeys.includes(key)));
    } else {
      // Select all in category
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        categoryPermKeys.forEach(key => {
          if (!newPerms.includes(key)) {
            newPerms.push(key);
          }
        });
        return newPerms;
      });
    }
  };

  const getCategorySelectionState = (perms) => {
    const categoryPermKeys = perms.map(p => p.permissionKey);
    const selectedCount = categoryPermKeys.filter(key => selectedPermissions.includes(key)).length;

    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermKeys.length) return 'all';
    return 'some';
  };

  const handleSavePermissions = async () => {
    if (!canAssignPerms) {
      toast.error("You do not have permission to assign permissions");
      return;
    }
    if (!selectedRoleId) {
      toast.error("Select a role first");
      return;
    }
    setSavingPermissions(true);
    try {
      await api.put(`/rbac/roles/${selectedRoleId}/permissions`, {
        permissions: selectedPermissions,
      });
      toast.success("Permissions updated successfully");
      setOriginalPermissions(selectedPermissions);
      setHasUnsavedChanges(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const performReset = () => {
    setRoleForm({ id: null, roleKey: "", name: "", description: "" });
    setSelectedPermissions([]);
    setOriginalPermissions([]);
    setSelectedRoleId(null);
    setHasUnsavedChanges(false);
  };

  const resetForm = () => {
    requestUnsavedConfirmation(() => performReset());
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const userCount = selectedRole?.userCount || 0; // Assuming this comes from API

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg font-medium animate-pulse">Loading Access Control...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Breadcrumb */}
      <div className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <span>Settings</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">Roles & Permissions</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Access Control</h1>
            </div>
            {canCreate && (
              <Button
                onClick={resetForm}
                className="shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" /> New Role
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Role Navigator */}
        <div className="w-80 border-r border-border bg-card/20 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {/* Roles List */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredRoles.map((role) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleSelectRole(role)}
                  className={`
                    relative px-4 py-3 cursor-pointer border-l-2 transition-all
                    ${selectedRoleId === role.id
                      ? 'bg-primary/5 border-l-blue-500'
                      : 'border-l-transparent hover:bg-accent/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold text-sm truncate ${selectedRoleId === role.id ? 'text-primary' : 'text-foreground'}`}>
                          {role.name}
                        </h3>
                        {role.isSystem && (
                          <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" title="System Role" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">{role.roleKey}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {role.permissions?.length || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {role.userCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredRoles.length === 0 && (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No roles found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Role Details & Permissions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedRoleId || !roleForm.id ? (
            <>
              {/* Role Details Section */}
              <div className="border-b border-border bg-card/30 p-6">
                <div className="max-w-4xl">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">
                        {roleForm.id ? "Role Details" : "Create New Role"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {roleForm.id ? "Update role information and metadata" : "Define a new role with specific permissions"}
                      </p>
                    </div>
                    {roleForm.id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{userCount} {userCount === 1 ? "user" : "users"}</span>
                      </div>
                    )}
                    {selectedRole?.isSystem && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        System Role
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Display Name<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={roleForm.name}
                        onChange={handleRoleInputChange}
                        placeholder="e.g. Finance Manager"
                        className="h-9"
                        disabled={selectedRole?.isSystem}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roleKey" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Role Key<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="roleKey"
                        name="roleKey"
                        value={roleForm.roleKey}
                        onChange={handleRoleInputChange}
                        placeholder="e.g. finance_manager"
                        disabled={roleForm.id && roles.find((r) => r.id === roleForm.id)?.isSystem}
                        className="font-mono text-sm h-9"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Description
                      </Label>
                      <textarea
                        id="description"
                        name="description"
                        value={roleForm.description}
                        onChange={handleRoleInputChange}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-none"
                        placeholder="Describe the role's responsibilities and scope..."
                        disabled={selectedRole?.isSystem}
                      />
                    </div>
                  </div>

                  {(canCreate || canUpdate) && !selectedRole?.isSystem && (
                    <div className="mt-4 flex items-center gap-3">
                      <Button
                        onClick={handleSaveRole}
                        disabled={savingRole}
                        size="sm"
                        className="shadow-sm"
                      >
                        {savingRole ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                        {roleForm.id ? "Update Role" : "Create Role"}
                      </Button>
                      {canDelete && roleForm.id && !selectedRole?.isSystem && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(selectedRole)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete Role
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions Section */}
              {selectedRoleId && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Permissions Header */}
                  <div className="border-b border-border bg-card/20 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div>
                      <h2 className="text-lg font-semibold mb-1">Permissions</h2>
                      <p className="text-sm text-muted-foreground">
                        {selectedPermissions.length} of {permissions.length} permissions assigned
                      </p>
                    </div>
                    {hasUnsavedChanges && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Unsaved Changes
                      </div>
                    )}
                  </div>

                  {/* Permissions Grid */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl space-y-4">
                      {Object.entries(groupedPermissions).map(([resource, perms]) => {
                        const isExpanded = expandedCategories[resource];
                        const selectionState = getCategorySelectionState(perms);

                        return (
                          <div key={resource} className="border border-border rounded-lg overflow-hidden bg-card/30">
                            {/* Category Header */}
                            <div
                              className="flex items-center justify-between px-4 py-3 bg-accent/30 cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => toggleCategory(resource)}
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAllInCategory(resource, perms);
                                  }}
                                  disabled={!canAssignPerms}
                                  className="hover:bg-background/50 rounded p-0.5 transition-colors disabled:opacity-50"
                                >
                                  {selectionState === 'all' && <CheckSquare className="w-4 h-4 text-primary" />}
                                  {selectionState === 'some' && <MinusSquare className="w-4 h-4 text-primary" />}
                                  {selectionState === 'none' && <Square className="w-4 h-4 text-muted-foreground" />}
                                </button>
                                <h3 className="font-semibold text-sm uppercase tracking-wide">
                                  {resource}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  {perms.filter(p => selectedPermissions.includes(p.permissionKey)).length}/{perms.length}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {/* Category Permissions */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
                                    {perms.map((perm) => {
                                      const isSelected = selectedPermissions.includes(perm.permissionKey);
                                      return (
                                        <div
                                          key={perm.permissionKey}
                                          onClick={() => togglePermission(perm.permissionKey)}
                                          className={`
                                            group flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all text-sm
                                            ${isSelected
                                              ? 'bg-primary/5 border-primary/30 text-primary'
                                              : 'bg-background/50 border-border/50 hover:border-primary/20 hover:bg-accent/50'
                                            }
                                            ${!canAssignPerms ? 'opacity-60 cursor-not-allowed' : ''}
                                          `}
                                        >
                                          <div className={`
                                            w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                                            ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}
                                          `}>
                                            {isSelected && <Check className="w-2.5 h-2.5" />}
                                          </div>
                                          <span className="truncate font-medium">{perm.action}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a role to view details</p>
                <p className="text-sm mt-1">or create a new role to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Bar */}
      {hasUnsavedChanges && canAssignPerms && selectedRoleId && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 bg-card border border-border rounded-lg shadow-2xl p-4 flex items-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-medium">You have unsaved permission changes</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPermissions(originalPermissions);
                setHasUnsavedChanges(false);
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSavePermissions}
              disabled={savingPermissions}
              className="shadow-sm"
            >
              {savingPermissions ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
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
                  <h3 className="text-lg font-semibold mb-2">Delete Role</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRole(showDeleteConfirm)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete Role
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={unsavedDialogOpen} onOpenChange={(open) => {
        if (!open) {
          pendingActionRef.current = null;
          setUnsavedDialogOpen(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved permission changes. If you continue, those changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => {
              pendingActionRef.current = null;
              setUnsavedDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingActionRef.current) {
                  pendingActionRef.current();
                }
                pendingActionRef.current = null;
                setUnsavedDialogOpen(false);
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
