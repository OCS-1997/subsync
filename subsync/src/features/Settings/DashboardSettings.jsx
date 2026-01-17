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
    Check,
    Shield,
    Settings,
    RefreshCw,
    LayoutDashboard,
    Search,
    AlertCircle
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.jsx";

import { cn } from "@/lib/utils";

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
    const [activeTab, setActiveTab] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalTabPerms, setOriginalTabPerms] = useState({});
    const [originalWidgetPerms, setOriginalWidgetPerms] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

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
            const validTabs = tabsRes.data || [];
            setTabs(validTabs);
            setWidgets(widgetsRes.data || []);

            if (validTabs.length > 0) {
                setActiveTab(validTabs[0].tab_key);
            }

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

    const handleTabToggle = (tabKey, checked) => {
        if (!canConfigure) return;
        setTabPermissions(prev => ({
            ...prev,
            [tabKey]: checked
        }));
    };

    const handleWidgetToggle = (widgetKey, checked) => {
        if (!canConfigure) return;
        setWidgetPermissions(prev => ({
            ...prev,
            [widgetKey]: checked
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

            toast.success("Dashboard permissions updated successfully");
        } catch (error) {
            console.error("Failed to save permissions:", error);
            toast.error("Failed to save permissions");
        } finally {
            setSaving(false);
        }
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
            <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading settings...</p>
            </div>
        );
    }

    if (!canConfigure) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                <p>You don't have permission to configure dashboard settings.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] max-w-7xl mx-auto space-y-6 p-1">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm p-6 rounded-2xl border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Dashboard Configuration
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Customize visibility of dashboard tabs and widgets per role.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                     <Select value={String(selectedRoleId || '')} onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-full md:w-[280px] h-10 border-muted-foreground/20 bg-background/50 backdrop-blur-sm shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Shield className="w-4 h-4 text-primary shrink-0" />
                                <SelectValue placeholder="Select a role" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {roles.map(role => (
                                <SelectItem key={role.id} value={String(role.id)} className="cursor-pointer">
                                    <span className="font-medium">{role.name}</span>
                                    {role.isSystem && (
                                        <Badge variant="outline" className="ml-2 py-0 h-5 text-[10px] border-primary/20 text-primary">System</Badge>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchRolePermissions(selectedRoleId)}
                        disabled={loadingPermissions}
                        title="Refresh permissions"
                        className="shrink-0"
                    >
                        <RefreshCw className={cn("w-4 h-4", loadingPermissions && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                
                {/* Left Sidebar - Tabs List */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                    <Card className="h-full border-muted-foreground/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b bg-muted/30">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-1">
                                Modules
                            </h3>
                             {/* Search Tabs */}
                             <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Search tabs..."
                                    className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-2 space-y-1">
                                {tabs
                                    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(tab => {
                                        const Icon = TAB_ICONS[tab.tab_key] || LayoutDashboard;
                                        const isActive = activeTab === tab.tab_key;
                                        const isVisible = tabPermissions[tab.tab_key] !== false;
                                        const tabWidgets = widgetsByTab[tab.tab_key] || [];
                                        const activeWidgets = tabWidgets.filter(w => widgetPermissions[w.widget_key] !== false).length;

                                        return (
                                            <button
                                                key={tab.tab_key}
                                                onClick={() => setActiveTab(tab.tab_key)}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                                    isActive 
                                                     ? "bg-primary text-primary-foreground shadow-md"
                                                     : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 z-10">
                                                    <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                                                    <span>{tab.name}</span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 z-10">
                                                    {!isVisible && !isActive && (
                                                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" title="Hidden" />
                                                    )}
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded-full border",
                                                        isActive 
                                                            ? "border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground/90" 
                                                            : "border-border bg-background/50 text-muted-foreground"
                                                    )}>
                                                        {activeWidgets}/{tabWidgets.length}
                                                    </span>
                                                </div>
                                                
                                                {/* Active Indicator */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="absolute inset-0 bg-primary z-0"
                                                        initial={false}
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                            </button>
                                        );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Content - Tab Details & Widgets */}
                <div className="flex-1 min-w-0 h-full flex flex-col gap-4">
                     {activeTab && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="h-full flex flex-col gap-4"
                            >
                                {/* Tab Configuration Card */}
                                <Card className="border-border/60 shadow-sm">
                                    <div className="p-6 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h2 className="text-xl font-bold">{tabs.find(t => t.tab_key === activeTab)?.name}</h2>
                                                <Badge variant={tabPermissions[activeTab] !== false ? "default" : "secondary"} className="text-xs">
                                                    {tabPermissions[activeTab] !== false ? "Visible" : "Hidden"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground max-w-2xl">
                                                {tabs.find(t => t.tab_key === activeTab)?.description || "Configure visibility for this tab and its widgets."}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border/50">
                                            <div className="flex flex-col items-end gap-0.5">
                                                <Label htmlFor="tab-visibility" className="text-sm font-semibold cursor-pointer">
                                                    Show Tab
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Global Toggle</span>
                                            </div>
                                            <Switch 
                                                id="tab-visibility"
                                                checked={tabPermissions[activeTab] !== false}
                                                onCheckedChange={(checked) => handleTabToggle(activeTab, checked)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Widgets Section */}
                                <Card className="flex-1 border-muted-foreground/10 shadow-sm flex flex-col overflow-hidden bg-muted/10">
                                    <div className="p-4 border-b bg-card flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                                            <h3 className="font-semibold text-sm">Widgets Configuration</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleToggleAllWidgetsInTab(activeTab, true)}
                                                className="h-8 text-xs hover:bg-primary/10 hover:text-primary"
                                            >
                                                Select All
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => handleToggleAllWidgetsInTab(activeTab, false)}
                                                className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                Deselect All
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-muted/10 p-4 overflow-y-auto custom-scrollbar">
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {(widgetsByTab[activeTab] || []).map(widget => {
                                                const isVisible = widgetPermissions[widget.widget_key] !== false;
                                                return (
                                                    <motion.div
                                                        layout
                                                        key={widget.id}
                                                        className={cn(
                                                            "group relative overflow-hidden rounded-xl border p-4 transition-all duration-200",
                                                            isVisible 
                                                                ? "bg-card border-border shadow-sm ring-1 ring-primary/5 hover:shadow-md hover:ring-primary/20" 
                                                                : "bg-muted/50 border-transparent opacity-70 hover:opacity-100"
                                                        )}
                                                    >
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={cn("font-semibold text-sm mb-1 truncate", isVisible ? "text-foreground" : "text-muted-foreground")}>
                                                                    {widget.name}
                                                                </h4>
                                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                                    {widget.description || "Controls visibility for this widget on the dashboard."}
                                                                </p>
                                                            </div>
                                                            <Switch 
                                                                checked={isVisible}
                                                                onCheckedChange={(checked) => handleWidgetToggle(widget.widget_key, checked)}
                                                                className={cn("mt-1", isVisible ? "data-[state=checked]:bg-emerald-500" : "")}
                                                            />
                                                        </div>
                                                        <div className={cn(
                                                            "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent transition-all duration-500",
                                                            isVisible ? "w-full opacity-100" : "w-0 opacity-0"
                                                        )} />
                                                    </motion.div>
                                                );
                                            })}
                                            
                                            {(widgetsByTab[activeTab] || []).length === 0 && (
                                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground/50 border-2 border-dashed rounded-xl">
                                                    <AlertCircle className="w-10 h-10 mb-3 opacity-50" />
                                                    <p>No widgets found in this category.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                     )}
                </div>
            </div>

            {/* Floating Save Button */}
            <AnimatePresence>
                {hasChanges && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 right-8 z-50 p-2"
                    >
                        <Card className="border-primary/20 shadow-2xl bg-card/80 backdrop-blur-md overflow-hidden">
                            <div className="p-2 pl-4 flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">Unsaved Changes</span>
                                    <span className="text-xs text-muted-foreground">You have modified role permissions.</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if(confirm("Discard all changes?")) {
                                                setTabPermissions({...originalTabPerms});
                                                setWidgetPermissions({...originalWidgetPerms});
                                                setHasChanges(false);
                                            }
                                        }}
                                        className="h-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                    >
                                        Discard
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={saving}
                                        size="sm"
                                        className="h-8 shadow-lg shadow-primary/20"
                                    >
                                        {saving ? (
                                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-3.5 h-3.5 mr-2" />
                                        )}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DashboardSettings;
