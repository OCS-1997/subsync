import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Breadcrumb } from "@/components/ui/breadcrumb.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
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
  const [roleUsers, setRoleUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // User Permission Overrides State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOverridesDialogOpen, setUserOverridesDialogOpen] = useState(false);
  const [userOverrides, setUserOverrides] = useState([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [overrideSearchTerm, setOverrideSearchTerm] = useState("");
  const [showClearOverridesConfirm, setShowClearOverridesConfirm] = useState(false);

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

  const fetchRoleUsers = async (roleId) => {
    if (!roleId) {
      setRoleUsers([]);
      return;
    }
    try {
      setLoadingUsers(true);
      const response = await api.get(`/rbac/roles/${roleId}/users`);
      setRoleUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch role users:', error);
      setRoleUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

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

    // Fetch users for this role
    fetchRoleUsers(role.id);
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

  // User Permission Override Functions
  const handleUserClick = async (user) => {
    if (!canAssignPerms) {
      toast.info("You don't have permission to manage user overrides");
      return;
    }

    setSelectedUser(user);
    setUserOverridesDialogOpen(true);
    await fetchUserPermissionOverrides(user.username);
  };

  const fetchUserPermissionOverrides = async (username) => {
    try {
      setLoadingOverrides(true);
      const response = await api.get(`/users/${username}/permission-overrides`);
      setUserOverrides(response.data || []);
    } catch (error) {
      console.error('Failed to fetch user overrides:', error);
      setUserOverrides([]);
      toast.error('Failed to load user permission overrides');
    } finally {
      setLoadingOverrides(false);
    }
  };

  const handleSaveUserOverrides = async () => {
    if (!selectedUser) return;

    try {
      setSavingOverrides(true);

      const overridesToSave = userOverrides
        .filter(override => override.override !== 'inherit')
        .map(override => ({
          permissionKey: override.permissionKey,
          isGranted: override.override === 'grant',
          reason: override.reason || null
        }));

      await api.post(`/users/${selectedUser.username}/permission-overrides`, {
        overrides: overridesToSave
      });

      toast.success('User permission overrides saved successfully');
      setUserOverridesDialogOpen(false);
      await fetchRoleUsers(selectedRoleId); // Refresh users list
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save permission overrides');
    } finally {
      setSavingOverrides(false);
    }
  };

  const handleOverrideChange = (permissionKey, value) => {
    setUserOverrides(prev => {
      const existing = prev.find(o => o.permissionKey === permissionKey);
      if (existing) {
        return prev.map(o =>
          o.permissionKey === permissionKey
            ? { ...o, override: value }
            : o
        );
      } else {
        // Find permission details
        const permission = permissions.find(p => p.permissionKey === permissionKey);
        return [...prev, {
          permissionKey,
          resource: permission?.resource,
          action: permission?.action,
          override: value,
          reason: null
        }];
      }
    });
  };

  const getPermissionOverrideState = (permissionKey) => {
    const override = userOverrides.find(o => o.permissionKey === permissionKey);
    if (override) {
      // If override has explicit 'override' field, use it
      if (override.override) {
        return override.override;
      }
      // Otherwise map isGranted (from database)
      if (override.isGranted !== undefined) {
        return override.isGranted ? 'grant' : 'deny';
      }
    }
    // No override: return inherit
    return 'inherit';
  };

  const handleClearAllOverrides = async () => {
    if (!selectedUser) return;
    setShowClearOverridesConfirm(true);
  };

  const confirmClearOverrides = async () => {
    try {
      setSavingOverrides(true);
      await api.delete(`/users/${selectedUser.username}/permission-overrides`);

      // Reset UI state to empty overrides
      setUserOverrides([]);

      toast.success('All overrides removed successfully');
      setShowClearOverridesConfirm(false);
      setUserOverridesDialogOpen(false);
      await fetchRoleUsers(selectedRoleId);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove overrides');
    } finally {
      setSavingOverrides(false);
    }
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
          <Breadcrumb
            items={[
              { label: "Settings", href: "./" },
              { label: "Roles & Permissions" }
            ]}
          />
          <div className="flex items-center justify-between">
            <div>
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

              {/* Users Section */}
              {selectedRoleId && (
                <div className="border-b border-border bg-gradient-to-r from-card/50 to-card/30 backdrop-blur-sm px-6 py-5">
                  <div className="max-w-6xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold">Users in this Role</h3>
                          <p className="text-xs text-muted-foreground">
                            {loadingUsers ? "Loading..." : `${roleUsers.length} user${roleUsers.length !== 1 ? 's' : ''} assigned`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-semibold">
                        <Info className="w-3 h-3" />
                        <span>View Only</span>
                      </div>
                    </div>

                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : roleUsers.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-dashed border-border rounded-lg bg-background/50">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm text-muted-foreground font-medium">No users assigned to this role</p>
                        <p className="text-xs text-muted-foreground mt-1">Users can be assigned roles from the User Management page</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <AnimatePresence>
                          {roleUsers.map((user, idx) => (
                            <motion.div
                              key={user.username || idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              onClick={() => handleUserClick(user)}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-background to-card/30 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                  {user.name || user.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                              </div>
                              {user.is_active ? (
                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Active" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" title="Inactive" />
                              )}
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Info note about per-user permissions */}
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-200/20 dark:border-blue-800/20">
                      <div className="flex gap-2">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <strong className="font-semibold block mb-1">About Per-User Permissions:</strong>
                          <p className="text-blue-600/90 dark:text-blue-400/90">
                            This system uses <strong>Role-Based Access Control (RBAC)</strong>. Permissions are assigned to roles, not individual users.
                            To customize a user's permissions, either: (1) Create a new role with the desired permissions, or (2) Implement user-specific permission overrides in your backend.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

      {/* User Permission Overrides Dialog */}
      <Dialog open={userOverridesDialogOpen} onOpenChange={setUserOverridesDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-blue-950/30">
          <DialogHeader className="pb-4 border-b border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Permission Overrides
                </DialogTitle>
                <DialogDescription className="text-blue-600/80 dark:text-blue-400/80 mt-1">
                  {selectedUser?.name || selectedUser?.username} ({selectedRole?.name})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto py-4">
            {/* Info Banner */}
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-semibold mb-1">How Permission Overrides Work:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                    <li><strong>Inherit</strong>: Use permission from role (default)</li>
                    <li><strong>Grant</strong>: Give permission even if role doesn't have it</li>
                    <li><strong>Deny</strong>: Remove permission even if role has it</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
                <Input
                  placeholder="Search permissions..."
                  value={overrideSearchTerm}
                  onChange={(e) => setOverrideSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Permissions Grid */}
            {loadingOverrides ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPermissions)
                  .filter(([resource]) =>
                    !overrideSearchTerm ||
                    resource.toLowerCase().includes(overrideSearchTerm.toLowerCase())
                  )
                  .map(([resource, perms]) => (
                    <div key={resource} className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900/50">
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 border-b border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-blue-700 dark:text-blue-300">
                          {resource}
                        </h4>
                      </div>
                      <div className="p-4 space-y-2">
                        {perms
                          .filter(perm =>
                            !overrideSearchTerm ||
                            perm.action.toLowerCase().includes(overrideSearchTerm.toLowerCase()) ||
                            perm.description?.toLowerCase().includes(overrideSearchTerm.toLowerCase())
                          )
                          .map((perm) => {
                            const hasFromRole = selectedPermissions.includes(perm.permissionKey);
                            const currentState = getPermissionOverrideState(perm.permissionKey);

                            return (
                              <div
                                key={perm.permissionKey}
                                className="flex items-center gap-3 p-3 rounded-md border border-blue-100 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-colors bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {perm.action}
                                    </p>
                                    {hasFromRole && currentState === 'inherit' && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        From Role
                                      </span>
                                    )}
                                  </div>
                                  {perm.description && (
                                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                                <Select
                                  value={currentState}
                                  onValueChange={(value) => handleOverrideChange(perm.permissionKey, value)}
                                >
                                  <SelectTrigger className="w-32 border-blue-200 dark:border-blue-800 focus:ring-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="inherit">
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Inherit
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="grant">
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Grant
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="deny">
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        Deny
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-blue-200 dark:border-blue-900 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleClearAllOverrides}
              disabled={savingOverrides || userOverrides.length === 0}
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Overrides
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setUserOverridesDialogOpen(false)}
                disabled={savingOverrides}
                className="border-blue-200 dark:border-blue-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveUserOverrides}
                disabled={savingOverrides}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
              >
                {savingOverrides ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Overrides
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Clear All Overrides Confirmation Dialog */}
      <Dialog open={showClearOverridesConfirm} onOpenChange={setShowClearOverridesConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Clear All Overrides?
            </DialogTitle>
            <DialogDescription>
              Remove all permission overrides for <strong>{selectedUser?.name || selectedUser?.username}</strong>?
              <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <p className="text-sm text-red-800 dark:text-red-300">
                  This will reset all permissions to inherit from their role. This action cannot be undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearOverridesConfirm(false)}
              disabled={savingOverrides}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearOverrides}
              disabled={savingOverrides}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {savingOverrides ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Overrides
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
