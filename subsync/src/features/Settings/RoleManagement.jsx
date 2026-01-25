import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import {
  Loader2,
  Shield,
  Trash2,
  Save,
  Plus,
  Check,
  Lock,
  Users,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  AlertTriangle,
  Fingerprint,
  Settings,
  ShieldAlert,
  MoreHorizontal,
  X,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";

import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog.jsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.jsx";
import { Badge } from "@/components/ui/badge.jsx";

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
  const [permissionSearchTerm, setPermissionSearchTerm] = useState("");
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
  const [expandedOverrideCategories, setExpandedOverrideCategories] = useState({});
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
    if (!role || role.id === selectedRoleId) return;
    requestUnsavedConfirmation(() => applyRoleSelection(role));
  };

  const handleRoleInputChange = (event) => {
    const { name, value } = event.target;
    setRoleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveRole = async () => {
    if (!canCreate && !canUpdate) {
      toast.error("Permission denied");
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
        toast.success("Role saved");
      } else {
        const { data } = await api.post(`/rbac/roles`, {
          roleKey: roleForm.roleKey,
          name: roleForm.name,
          description: roleForm.description,
        });
        toast.success("Role created");
        setSelectedRoleId(data.roleId);
      }
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || "Save failed");
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!canDelete || role.isSystem) return;
    try {
      await api.delete(`/rbac/roles/${role.id}`);
      toast.success("Role deleted");
      setSelectedRoleId(null);
      setShowDeleteConfirm(null);
      await fetchData();
    } catch (error) {
      toast.error("Purge failed");
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
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleAllInCategory = (category, perms) => {
    if (!canAssignPerms) return;
    const categoryPermKeys = perms.map(p => p.permissionKey);
    const allSelected = categoryPermKeys.every(key => selectedPermissions.includes(key));
    setSelectedPermissions(prev =>
      allSelected ? prev.filter(key => !categoryPermKeys.includes(key)) : [...new Set([...prev, ...categoryPermKeys])]
    );
  };

  const handleSavePermissions = async () => {
    if (!canAssignPerms || !selectedRoleId) return;
    setSavingPermissions(true);
    try {
      await api.put(`/rbac/roles/${selectedRoleId}/permissions`, { permissions: selectedPermissions });
      toast.success("Permissions saved");
      setOriginalPermissions(selectedPermissions);
      setHasUnsavedChanges(false);
      await fetchData();
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setSavingPermissions(false);
    }
  };

  const resetForm = () => {
    requestUnsavedConfirmation(() => {
      setRoleForm({ id: null, roleKey: "", name: "", description: "" });
      setSelectedPermissions([]);
      setOriginalPermissions([]);
      setSelectedRoleId(null);
      setHasUnsavedChanges(false);
    });
  };

  const handleUserClick = async (user) => {
    if (!canAssignPerms) return;
    setSelectedUser(user);
    setUserOverridesDialogOpen(true);
    setLoadingOverrides(true);
    try {
      const response = await api.get(`/users/${user.username}/permission-overrides`);
      setUserOverrides(response.data || []);
    } catch (err) { toast.error("Failed to load permissions"); }
    finally {
      setLoadingOverrides(false);
      setExpandedOverrideCategories({});
      setOverrideSearchTerm("");
    }
  };

  const handleSaveUserOverrides = async () => {
    if (!selectedUser) return;
    setSavingOverrides(true);
    try {
      const overridesToSave = userOverrides
        .filter(o => o.override !== 'inherit')
        .map(o => ({ permissionKey: o.permissionKey, isGranted: o.override === 'grant' }));
      await api.post(`/users/${selectedUser.username}/permission-overrides`, { overrides: overridesToSave });
      toast.success("User permissions saved");
      setUserOverridesDialogOpen(false);
      fetchRoleUsers(selectedRoleId);
    } catch (err) { toast.error("Save failed"); }
    finally { setSavingOverrides(false); }
  };

  const handleOverrideChange = (permissionKey, value) => {
    setUserOverrides(prev => {
      const existing = prev.find(o => o.permissionKey === permissionKey);
      if (existing) return prev.map(o => o.permissionKey === permissionKey ? { ...o, override: value } : o);
      const permission = permissions.find(p => p.permissionKey === permissionKey);
      return [...prev, { permissionKey, resource: permission?.resource, action: permission?.action, override: value }];
    });
  };

  const getPermissionOverrideState = (permissionKey) => {
    const override = userOverrides.find(o => o.permissionKey === permissionKey);
    if (!override) return 'inherit';
    return override.override || (override.isGranted !== undefined ? (override.isGranted ? 'grant' : 'deny') : 'inherit');
  };

  const getCategorySelectionState = (perms) => {
    const categoryPermKeys = perms.map(p => p.permissionKey);
    const selectedCount = categoryPermKeys.filter(key => selectedPermissions.includes(key)).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === categoryPermKeys.length) return 'all';
    return 'some';
  };

  const handleClearAllOverrides = async () => {
    if (!selectedUser) return;
    setSavingOverrides(true);
    try {
      await api.delete(`/users/${selectedUser.username}/permission-overrides`);
      setUserOverrides([]);
      toast.success("All personal permissions reset");
      setUserOverridesDialogOpen(false);
      fetchRoleUsers(selectedRoleId);
    } catch (err) {
      toast.error("Reset failed");
    } finally {
      setSavingOverrides(false);
      setShowClearOverridesConfirm(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  if (loading) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-10 gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">Loading roles...</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Role Sidebar */}
      <aside className="w-72 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black tracking-widest uppercase opacity-40">User Roles</h2>
            {canCreate && (
              <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md hover:bg-blue-600 hover:text-white transition-colors" onClick={resetForm}>
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-xs bg-background border-none ring-1 ring-border shadow-none"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {filteredRoles.map((role, idx) => (
            <button
              key={role.id || `role-${idx}`}
              onClick={() => handleSelectRole(role)}
              className={`w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden flex items-center gap-3
                ${selectedRoleId === role.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-muted/60 text-foreground/70'}
              `}
            >
              <Shield className={`w-4 h-4 flex-shrink-0 ${selectedRoleId === role.id ? 'text-white' : 'text-blue-500/50 group-hover:text-blue-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate leading-none mb-1">{role.name}</p>
                <div className="flex items-center gap-2 opacity-60 text-[9px] font-black tracking-widest uppercase">
                  <span>{role.permissions?.length || 0} PERMS</span>
                  <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                  <span>{role.userCount || 0} USERS</span>
                </div>
              </div>
              {role.isSystem ? (
                <Lock className={`w-3 h-3 ${selectedRoleId === role.id ? 'text-white/60' : 'text-amber-500/60'}`} />
              ) : (
                <Shield className={`w-3 h-3 ${selectedRoleId === role.id ? 'text-white/60' : 'text-blue-500/60'}`} />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {selectedRoleId || !roleForm.id ? (
          <>
            {/* Context Header */}
            <header className="p-4 border-b bg-card flex items-center justify-between gap-4 sticky top-0 z-20">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-base font-black tracking-tight truncate">
                      {roleForm.id ? roleForm.name : "Create New Role"}
                    </h1>
                    {selectedRole?.isSystem ? (
                       <Badge className="rounded-md bg-amber-500/10 text-amber-600 border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> SYSTEM PROTECTED
                       </Badge>
                    ) : roleForm.id && (
                       <Badge className="rounded-md bg-blue-500/10 text-blue-600 border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 flex items-center gap-1">
                        <Fingerprint className="w-2.5 h-2.5" /> CUSTOM ROLE
                       </Badge>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-xl">
                    {roleForm.id ? (roleForm.description || "No description provided for this role.") : "Describe what this role is for and choose a unique key."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 border-l pl-4 border-border/50">
                {hasUnsavedChanges && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest animate-pulse border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3" /> Unsynced
                  </div>
                )}
                {roleForm.id && !selectedRole?.isSystem && canDelete && (
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(selectedRole)} className="h-9 px-3 rounded-lg text-red-600 hover:bg-red-50 font-bold text-xs">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Role
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={savingRole || savingPermissions}
                  onClick={hasUnsavedChanges ? handleSavePermissions : handleSaveRole}
                  className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/10"
                >
                  {(savingRole || savingPermissions) ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                  {hasUnsavedChanges ? "Save Permissions" : "Save Role"}
                </Button>
              </div>
            </header>

            <Tabs defaultValue="permissions" className="flex-1 flex flex-col min-h-0">
              <div className="px-6 border-b bg-muted/10">
                <TabsList className="bg-transparent h-12 p-0 gap-12">
                  {[
                    { id: 'permissions', label: 'What they can do' },
                    { id: 'personnel', label: 'Assigned Users' },
                    { id: 'profile', label: 'About this Role' }
                  ].map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-transparent shadow-none px-0"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="h-full flex flex-col">
                  <TabsContent value="permissions" className="p-4 m-0 space-y-6 flex-1">
                    <div className="sticky top-0 z-10 pb-4 bg-background/95 backdrop-blur-sm -mx-4 px-4 sticky-banner">
                      <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                        <Input
                          placeholder="Search permissions..."
                          value={permissionSearchTerm}
                          onChange={e => setPermissionSearchTerm(e.target.value)}
                          className="pl-10 h-11 bg-muted/20 border-border/50 focus:bg-background transition-all rounded-xl"
                        />
                        {permissionSearchTerm && (
                          <button
                            onClick={() => setPermissionSearchTerm("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(groupedPermissions).map(([resource, perms]) => {
                        const filteredPerms = perms.filter(p =>
                          !permissionSearchTerm ||
                          p.action.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                          p.resource.toLowerCase().includes(permissionSearchTerm.toLowerCase())
                        );

                        if (filteredPerms.length === 0) return null;

                        const isSearchMode = permissionSearchTerm.length > 0;
                        const isExpanded = isSearchMode ? true : expandedCategories[resource];
                        const selectionState = getCategorySelectionState(perms);

                        return (
                          <section key={resource} className={`border rounded-xl bg-background shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-blue-600/10' : ''}`}>
                            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b cursor-pointer group" onClick={() => toggleCategory(resource)}>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleAllInCategory(resource, perms); }}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all 
                                      ${selectionState === 'all' ? 'bg-blue-600 border-blue-600 text-white' :
                                      selectionState === 'some' ? 'bg-blue-600/20 border-blue-600 text-blue-600' : 'bg-background border-border'}
                                    `}
                                >
                                  {selectionState === 'all' && <Check className="w-3 h-3" />}
                                  {selectionState === 'some' && <div className="w-1.5 h-0.5 bg-current" />}
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/70">{resource} AREAS</span>
                                <span className="text-[9px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{perms.filter(p => selectedPermissions.includes(p.permissionKey)).length} / {perms.length}</span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-muted-foreground/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 bg-background/50">
                                    {filteredPerms.map(perm => {
                                      const active = selectedPermissions.includes(perm.permissionKey);
                                      return (
                                        <div
                                          key={perm.permissionKey}
                                          onClick={() => togglePermission(perm.permissionKey)}
                                          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all select-none
                                            ${active ? 'bg-blue-600/5 border-blue-600/20 text-blue-600' : 'bg-background border-transparent hover:border-border hover:bg-muted/30'}
                                          `}
                                        >
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${active ? 'bg-blue-600 border-blue-600 text-white' : 'border-border bg-background'}`}>
                                            {active && <Check className="w-3 h-3" />}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-tight truncate leading-none mb-0.5">{perm.action}</p>
                                            <p className="text-[9px] opacity-60 font-medium truncate">{perm.description || 'Action definition'}</p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </section>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="personnel" className="p-4 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {loadingUsers ? (
                        Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)
                      ) : roleUsers.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center text-muted-foreground opacity-30 select-none">
                          <Users className="w-12 h-12 mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest">No users assigned to this role</p>
                        </div>
                      ) : (
                        roleUsers.map((user, idx) => (
                          <button
                            key={user.username || `user-${idx}`}
                            onClick={() => handleUserClick(user)}
                            className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-blue-600/30 hover:shadow-lg transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border flex items-center justify-center text-blue-600 text-sm font-black ring-1 ring-blue-500/5 group-hover:scale-110 transition-transform">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black uppercase tracking-tight truncate leading-none mb-1">{user.name || user.username}</p>
                              <p className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase tracking-widest">@{user.username}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500" />
                          </button>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="profile" className="p-6 m-0 max-w-2xl bg-muted/5 h-full border-t">
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Unique identifier (Key)</Label>
                          <Input
                            name="roleKey"
                            value={roleForm.roleKey}
                            onChange={handleRoleInputChange}
                            disabled={selectedRole?.isSystem}
                            placeholder="ADMIN_USER"
                            className="h-10 text-xs font-black uppercase bg-background border-none ring-1 ring-border focus-visible:ring-blue-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Display Name</Label>
                          <Input
                            name="name"
                            value={roleForm.name}
                            onChange={handleRoleInputChange}
                            disabled={selectedRole?.isSystem}
                            placeholder="e.g. Sales Manager"
                            className="h-10 text-xs font-bold bg-background border-none ring-1 ring-border focus-visible:ring-blue-500/50"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">About this role</Label>
                          <textarea
                            name="description"
                            value={roleForm.description}
                            onChange={handleRoleInputChange}
                            disabled={selectedRole?.isSystem}
                            className="w-full h-32 p-4 text-xs font-medium rounded-xl bg-background ring-1 ring-border border-none resize-none focus:outline-none focus:ring-blue-500/50 transition-all"
                            placeholder="Explain what this role does..."
                          />
                        </div>
                      </div>

                      {selectedRole?.isSystem ? (
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-3">
                          <Lock className="w-4 h-4 text-amber-500 mt-0.5" />
                          <p className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest leading-relaxed">System Role: This role is essential for the application to work and cannot be changed.</p>
                        </div>
                      ) : roleForm.id && (
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
                          <Fingerprint className="w-4 h-4 text-blue-500 mt-0.5" />
                          <p className="text-[10px] font-bold text-blue-700/80 uppercase tracking-widest leading-relaxed">Custom Role: You have full control over this role's description and permission configuration.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 gap-6 opacity-20 select-none grayscale">
            <div className="w-24 h-24 rounded-[32px] bg-muted flex items-center justify-center">
              <Shield className="w-12 h-12" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Role Settings</h3>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mt-2">Create a new role or select one from the list to manage it</p>
            </div>
          </div>
        )}
      </main>

      {/* Modals - Simplified */}
      <Dialog open={userOverridesDialogOpen} onOpenChange={setUserOverridesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden border-none rounded-2xl shadow-2xl bg-background flex flex-col">
          <div className="bg-blue-600 p-6 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-black shadow-inner">{selectedUser?.name?.charAt(0) || 'U'}</div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Personal Permissions</h3>
                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{selectedUser?.username} • Base Role: {selectedRole?.name}</p>
              </div>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
              <Input
                placeholder="Find specific permission..."
                autoComplete="off"
                value={overrideSearchTerm}
                onChange={e => setOverrideSearchTerm(e.target.value)}
                className="bg-white/20 border-none text-white placeholder:text-white/40 h-10 text-xs font-bold rounded-xl ring-1 ring-white/10 focus-visible:ring-white/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            {loadingOverrides ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading permissions...</p>
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([resource, perms]) => {
                const filteredPerms = perms.filter(p =>
                  !overrideSearchTerm ||
                  p.action.toLowerCase().includes(overrideSearchTerm.toLowerCase()) ||
                  p.resource.toLowerCase().includes(overrideSearchTerm.toLowerCase())
                );

                if (filteredPerms.length === 0) return null;

                const isExpanded = overrideSearchTerm ? true : expandedOverrideCategories[resource];

                return (
                  <div key={resource} className="border rounded-2xl bg-muted/5 overflow-hidden transition-all duration-300">
                    <div
                      className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 cursor-pointer group"
                      onClick={() => setExpandedOverrideCategories(prev => ({ ...prev, [resource]: !prev[resource] }))}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full transition-colors ${isExpanded ? 'bg-blue-600' : 'bg-muted-foreground/30'}`} />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">{resource}</h4>
                        <Badge variant="outline" className="text-[8px] font-black border-muted/50 text-muted-foreground/70">{filteredPerms.length} PERMISSIONS</Badge>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredPerms.map(perm => {
                              const mode = getPermissionOverrideState(perm.permissionKey);
                              return (
                                <div key={perm.permissionKey} className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${mode === 'grant' ? 'bg-emerald-500/5 border-emerald-500/10' : mode === 'deny' ? 'bg-red-500/5 border-red-500/10' : 'bg-background border-border/50 shadow-sm'}`}>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-tight truncate mb-0.5">{perm.action}</p>
                                    <p className="text-[9px] font-medium text-muted-foreground truncate opacity-70">Normally: {selectedRole?.name} setting</p>
                                  </div>
                                  <Select value={mode} onValueChange={v => handleOverrideChange(perm.permissionKey, v)}>
                                    <SelectTrigger className={`w-28 h-8 text-[10px] font-black uppercase border-none ring-1 transition-all ${mode === 'grant' ? 'bg-emerald-600 text-white ring-emerald-600' : mode === 'deny' ? 'bg-red-600 text-white ring-red-600' : 'bg-background ring-border focus:ring-blue-500/40'}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-none shadow-2xl">
                                      <SelectItem value="inherit" className="text-[10px] font-black uppercase">Neutral</SelectItem>
                                      <SelectItem value="grant" className="text-[10px] font-black uppercase text-emerald-600 font-black">Grant Access</SelectItem>
                                      <SelectItem value="deny" className="text-[10px] font-black uppercase text-red-600 font-black">Deny Access</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex items-center justify-between gap-4 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setShowClearOverridesConfirm(true)} disabled={savingOverrides || userOverrides.length === 0} className="text-red-600 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl">Clear personal settings</Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setUserOverridesDialogOpen(false)} disabled={savingOverrides} className="text-[10px] font-black uppercase tracking-widest px-6 h-10 rounded-xl">Cancel</Button>
              <Button size="sm" onClick={handleSaveUserOverrides} disabled={savingOverrides} className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-8 h-10 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Save Permissions</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDeleteConfirm} onOpenChange={o => !o && setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-none p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-red-600 text-white text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tight">Delete Role?</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-2">permanently removing "{showDeleteConfirm?.name}"</p>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-xs font-bold text-muted-foreground uppercase text-center leading-relaxed">This will remove this role from all assigned users and delete it forever.</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold text-xs" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button className="flex-1 bg-red-600 text-white font-black text-xs h-11" onClick={() => handleDeleteRole(showDeleteConfirm)}>Confirm Delete</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showClearOverridesConfirm} onOpenChange={setShowClearOverridesConfirm}>
        <DialogContent className="max-w-sm rounded-2xl border-none p-0 overflow-hidden shadow-2xl">
          <div className="p-8 bg-amber-500 text-white text-center">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tight">Reset Permissions?</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mt-2">removing custom settings for {selectedUser?.username} and going back to the default role settings</p>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-xs font-bold text-muted-foreground uppercase text-center leading-relaxed">This will permanently remove all custom permission grants and denials for this user.</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 font-bold text-xs" onClick={() => setShowClearOverridesConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-amber-500 text-white font-black text-xs h-11" onClick={handleClearAllOverrides}>Reset All</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
