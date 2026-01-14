import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axiosInstance";
import {
    Loader2,
    LayoutGrid,
    Package,
    Phone,
    Target,
    BookOpen,
    Save,
    ChevronDown,
    ChevronRight,
    Eye,
    EyeOff,
    Shield,
    Settings,
    RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";

import { Button } from "@/components/ui/button.jsx";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { Label } from "@/components/ui/label.jsx";

const TAB_ICONS = {
    overview: LayoutGrid,
    subscriptions: Package,
    dcr: Phone,
    opportunities: Target,
    kb: BookOpen,
};

const DashboardSettings = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [tabs, setTabs] = useState([]);
    const [widgets, setWidgets] = useState([]);
    const [tabPermissions, setTabPermissions] = useState({});
    const [widgetPermissions, setWidgetPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [saving, setSaving] = useState(false);
    const [expandedTabs, setExpandedTabs] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [originalTabPerms, setOriginalTabPerms] = useState({});
    const [originalWidgetPerms, setOriginalWidgetPerms] = useState({});

    const { hasPermission } = usePermissions();
    const canConfigure = hasPermission(PERMISSIONS.DASHBOARD_CONFIGURE);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedRoleId) {
            fetchRolePermissions(selectedRoleId);
        }
    }, [selectedRoleId]);

    // Track changes
    useEffect(() => {
        const tabsChanged = JSON.stringify(tabPermissions) !== JSON.stringify(originalTabPerms);
        const widgetsChanged = JSON.stringify(widgetPermissions) !== JSON.stringify(originalWidgetPerms);
        setHasChanges(tabsChanged || widgetsChanged);
    }, [tabPermissions, widgetPermissions, originalTabPerms, originalWidgetPerms]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [rolesRes, tabsRes, widgetsRes] = await Promise.all([
                api.get("/rbac/roles"),
                api.get("/dashboard/admin/tabs"),
                api.get("/dashboard/admin/widgets"),
            ]);

            setRoles(rolesRes.data || []);
            setTabs(tabsRes.data || []);
            setWidgets(widgetsRes.data || []);

            // Initialize expanded state for all tabs
            const expanded = {};
            (tabsRes.data || []).forEach(tab => {
                expanded[tab.tab_key] = true;
            });
            setExpandedTabs(expanded);

            // Auto-select first role
            if (rolesRes.data?.length > 0) {
                setSelectedRoleId(rolesRes.data[0].id);
            }
        } catch (error) {
            console.error("Failed to load dashboard settings:", error);
            toast.error("Failed to load dashboard settings");
        } finally {
            setLoading(false);
        }
    };

    const fetchRolePermissions = async (roleId) => {
        try {
            setLoadingPermissions(true);
            const [tabPermsRes, widgetPermsRes] = await Promise.all([
                api.get(`/dashboard/admin/tabs?roleId=${roleId}`),
                api.get(`/dashboard/admin/widgets?roleId=${roleId}`),
            ]);

            // Convert to lookup objects
            const tabPerms = {};
            (tabPermsRes.data || []).forEach(p => {
                tabPerms[p.tab_key] = p.is_visible === 1 || p.is_visible === true;
            });
            setTabPermissions(tabPerms);
            setOriginalTabPerms({ ...tabPerms });

            const widgetPerms = {};
            (widgetPermsRes.data || []).forEach(p => {
                widgetPerms[p.widget_key] = p.is_visible === 1 || p.is_visible === true;
            });
            setWidgetPermissions(widgetPerms);
            setOriginalWidgetPerms({ ...widgetPerms });

        } catch (error) {
            console.error("Failed to load role permissions:", error);
            toast.error("Failed to load role permissions");
        } finally {
            setLoadingPermissions(false);
        }
    };

    const handleRoleChange = (roleId) => {
        if (hasChanges) {
            if (!confirm("You have unsaved changes. Discard changes and switch role?")) {
                return;
            }
        }
        setSelectedRoleId(parseInt(roleId));
    };

    const handleTabToggle = (tabKey) => {
        if (!canConfigure) return;
        setTabPermissions(prev => ({
            ...prev,
            [tabKey]: !prev[tabKey]
        }));
    };

    const handleWidgetToggle = (widgetKey) => {
        if (!canConfigure) return;
        setWidgetPermissions(prev => ({
            ...prev,
            [widgetKey]: !prev[widgetKey]
        }));
    };

    const toggleTabExpanded = (tabKey) => {
        setExpandedTabs(prev => ({
            ...prev,
            [tabKey]: !prev[tabKey]
        }));
    };

    const handleSave = async () => {
        if (!selectedRoleId || !canConfigure) return;

        try {
            setSaving(true);

            // Prepare tab permissions
            const tabPermsArray = Object.entries(tabPermissions).map(([tabKey, isVisible]) => ({
                tabKey,
                isVisible
            }));

            // Prepare widget permissions
            const widgetPermsArray = Object.entries(widgetPermissions).map(([widgetKey, isVisible]) => ({
                widgetKey,
                isVisible
            }));

            await Promise.all([
                api.put(`/dashboard/admin/role/${selectedRoleId}/tabs`, { permissions: tabPermsArray }),
                api.put(`/dashboard/admin/role/${selectedRoleId}/widgets`, { permissions: widgetPermsArray }),
            ]);

            setOriginalTabPerms({ ...tabPermissions });
            setOriginalWidgetPerms({ ...widgetPermissions });
            setHasChanges(false);

            toast.success("Dashboard permissions saved successfully");
        } catch (error) {
            console.error("Failed to save permissions:", error);
            toast.error("Failed to save permissions");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAllTabs = (visible) => {
        if (!canConfigure) return;
        const newPerms = {};
        tabs.forEach(tab => {
            newPerms[tab.tab_key] = visible;
        });
        setTabPermissions(newPerms);
    };

    const handleToggleAllWidgetsInTab = (tabKey, visible) => {
        if (!canConfigure) return;
        const tabWidgets = widgetsByTab[tabKey] || [];
        const newPerms = { ...widgetPermissions };
        tabWidgets.forEach(w => {
            newPerms[w.widget_key] = visible;
        });
        setWidgetPermissions(newPerms);
    };

    // Group widgets by tab
    const widgetsByTab = useMemo(() => {
        const grouped = {};
        widgets.forEach(w => {
            const tabKey = w.tab_key || 'common';
            if (!grouped[tabKey]) grouped[tabKey] = [];
            grouped[tabKey].push(w);
        });
        return grouped;
    }, [widgets]);

    const selectedRole = useMemo(() => {
        return roles.find(r => r.id === selectedRoleId);
    }, [roles, selectedRoleId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!canConfigure) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                <Shield className="w-12 h-12 mb-4 opacity-50" />
                <p>You don't have permission to configure dashboard settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Dashboard Settings</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure which dashboard tabs and widgets are visible to each role
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRolePermissions(selectedRoleId)}
                        disabled={loadingPermissions}
                        className="rounded-xl"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loadingPermissions ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Role Selector */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <Label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                            Select Role to Configure
                        </Label>
                        <Select value={String(selectedRoleId || '')} onValueChange={handleRoleChange}>
                            <SelectTrigger className="w-full max-w-xs rounded-xl">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(role => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-blue-500" />
                                            {role.name}
                                            {role.isSystem && (
                                                <Badge variant="outline" className="ml-2 text-[10px]">System</Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedRole && (
                        <div className="text-sm text-slate-500">
                            <span className="font-medium">{selectedRole.description || 'No description'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading state for permissions */}
            {loadingPermissions ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-slate-500">Loading permissions...</span>
                </div>
            ) : (
                /* Tabs & Widgets Configuration */
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Quick Actions:</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAllTabs(true)}
                            className="rounded-lg text-xs"
                        >
                            <Eye className="w-3 h-3 mr-1" /> Show All Tabs
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAllTabs(false)}
                            className="rounded-lg text-xs"
                        >
                            <EyeOff className="w-3 h-3 mr-1" /> Hide All Tabs
                        </Button>
                    </div>

                    {/* Tab Cards */}
                    {tabs.map(tab => {
                        const Icon = TAB_ICONS[tab.tab_key] || Settings;
                        const isTabVisible = tabPermissions[tab.tab_key] !== false;
                        const isExpanded = expandedTabs[tab.tab_key];
                        const tabWidgets = widgetsByTab[tab.tab_key] || [];
                        const visibleWidgetCount = tabWidgets.filter(w => widgetPermissions[w.widget_key] !== false).length;

                        return (
                            <div
                                key={tab.tab_key}
                                className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all ${isTabVisible
                                        ? 'border-slate-200 dark:border-slate-800'
                                        : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
                                    }`}
                            >
                                {/* Tab Header */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    onClick={() => toggleTabExpanded(tab.tab_key)}
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTabExpanded(tab.tab_key);
                                            }}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            )}
                                        </button>
                                        <div className={`p-2 rounded-xl ${isTabVisible ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            <Icon className={`w-5 h-5 ${isTabVisible ? 'text-blue-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{tab.name}</h3>
                                            <p className="text-xs text-slate-500">{tab.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge
                                            variant="outline"
                                            className={`text-xs ${visibleWidgetCount === tabWidgets.length ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}`}
                                        >
                                            {visibleWidgetCount}/{tabWidgets.length} widgets
                                        </Badge>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Label className="text-xs text-slate-500">Tab Visible</Label>
                                            <Switch
                                                checked={isTabVisible}
                                                onCheckedChange={() => handleTabToggle(tab.tab_key)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Widgets List */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/30">
                                                {/* Widget Quick Actions */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-xs font-medium text-slate-400">Widgets:</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleAllWidgetsInTab(tab.tab_key, true)}
                                                        className="h-6 text-xs px-2"
                                                    >
                                                        Show All
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleAllWidgetsInTab(tab.tab_key, false)}
                                                        className="h-6 text-xs px-2"
                                                    >
                                                        Hide All
                                                    </Button>
                                                </div>

                                                {/* Widget Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {tabWidgets.map(widget => {
                                                        const isVisible = widgetPermissions[widget.widget_key] !== false;
                                                        return (
                                                            <div
                                                                key={widget.widget_key}
                                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isVisible
                                                                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                                                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50 opacity-60'
                                                                    }`}
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                                        {widget.name}
                                                                    </p>
                                                                </div>
                                                                <Switch
                                                                    checked={isVisible}
                                                                    onCheckedChange={() => handleWidgetToggle(widget.widget_key)}
                                                                    className="ml-2 shrink-0"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {tabWidgets.length === 0 && (
                                                    <p className="text-sm text-slate-400 text-center py-4">
                                                        No widgets configured for this tab
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Unsaved Changes Warning */}
            {hasChanges && (
                <div className="fixed bottom-6 right-6 z-50">
                    <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                        <span className="text-sm font-medium">You have unsaved changes</span>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-white text-amber-600 hover:bg-amber-50 rounded-xl"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardSettings;
