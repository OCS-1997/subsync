import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext.jsx";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "@/features/Auth/authSlice.js";
import { toast } from "react-toastify";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command.jsx";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog.jsx";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import {
    Home,
    Users,
    Globe,
    Package,
    Building2,
    FileText,
    Calendar,
    Settings,
    UserPlus,
    Plus,
    Search,
    Shield,
    Bell,
    Mail,
    Link2,
    HelpCircle,
    LogOut,
    Cake,
    Contact,
    Receipt,
    UserCog,
    ClipboardList,
    Database,
    Sun,
    Moon,
    Monitor,
    Users2,
    Layers,
    Clock,
    Play,
    Palette,
    CheckSquare,
    Target,
    BarChart3,
    History,
    Sliders,
    Terminal,
    LifeBuoy,
    Tag,
} from "lucide-react";

// Command palette items configuration
const createCommandItems = (username, hasPermission, dispatch, navigate, theme, toggleTheme) => {
    const baseUrl = `/${username}/dashboard`;

    return [
        // Account & Session
        {
            id: "logout",
            category: "Account",
            icon: LogOut,
            title: "Logout",
            subtitle: "Sign out of your account",
            shortcut: ["Ctrl", "Q"],
            action: async () => {
                try {
                    await dispatch(logoutUser()).unwrap();
                    toast.success("Logged out successfully");
                    navigate("/");
                } catch (error) {
                    console.error("Logout failed:", error);
                }
            },
            keywords: ["signout", "exit", "leave", "logout", "account"],
            permission: null,
        },

        // Appearances
        {
            id: "theme-toggle",
            category: "Appearance",
            icon: theme === "dark" ? Sun : Moon,
            title: theme === "dark" ? "Light Mode" : "Dark Mode",
            subtitle: `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
            shortcut: ["Ctrl", "T"],
            action: () => {
                toggleTheme();
            },
            keywords: ["theme", "dark", "light", "mode", "color", "design", "appearance"],
            permission: null,
        },

        // Navigation - Main Modules
        {
            id: "dashboard",
            category: "Navigation",
            icon: Home,
            title: "Dashboard",
            subtitle: "Go to main dashboard",
            path: baseUrl,
            shortcut: ["G", "H"],
            keywords: ["home", "main", "overview", "dashboard"],
            permission: PERMISSIONS.DASHBOARD_VIEW,
        },
        {
            id: "tasks",
            category: "MY WORK",
            icon: CheckSquare,
            title: "Tasks",
            subtitle: "View and manage assigned tasks",
            path: `${baseUrl}/tasks`,
            shortcut: ["G", "T"],
            keywords: ["tasks", "todo", "work", "my work", "assignment", "action items", "tickets"],
            permission: PERMISSIONS.TASKS_VIEW,
        },
        {
            id: "task-analytics",
            category: "MY WORK",
            icon: BarChart3,
            title: "Task Analytics",
            subtitle: "High-level task & team operational insights",
            path: `${baseUrl}/tasks/analytics`,
            keywords: ["tasks", "analytics", "insights", "charts", "kpi", "reports", "workload", "team", "performance"],
            permission: [PERMISSIONS.TASKS_VIEW_ANALYTICS, PERMISSIONS.TASKS_VIEW_ALL, PERMISSIONS.TASKS_MANAGE_ALL],
        },
        {
            id: "time-tracking",
            category: "MY WORK",
            icon: Clock,
            title: "Time Tracking",
            subtitle: "Track time and manage entries",
            path: `${baseUrl}/time-tracking`,
            keywords: ["timer", "hours", "timesheet", "billing", "work", "time-tracking", "ops"],
            permission: PERMISSIONS.TIME_TRACKING_VIEW,
        },
        {
            id: "dcr",
            category: "MY WORK",
            icon: FileText,
            title: "DCR Module",
            subtitle: "Daily call reports",
            path: `${baseUrl}/dcr`,
            keywords: ["reports", "calls", "daily", "dcr", "ops"],
            permission: PERMISSIONS.DCR_VIEW,
        },
        {
            id: "dcr-detailed",
            category: "MY WORK",
            icon: BarChart3,
            title: "DCR Detailed Report",
            subtitle: "Comprehensive call analytics",
            path: `${baseUrl}/dcr/detailed`,
            keywords: ["reports", "calls", "analytics", "detailed", "dcr", "ops"],
            permission: PERMISSIONS.DCR_VIEW,
        },

        // MARKETING
        {
            id: "opportunities",
            category: "MARKETING",
            icon: Layers,
            title: "Opportunities",
            subtitle: "Manage sales opportunities",
            path: `${baseUrl}/opportunities`,
            keywords: ["sales", "leads", "pipeline", "deals", "opportunities", "crm"],
            permission: PERMISSIONS.OPPORTUNITIES_VIEW,
        },
        {
            id: "opportunity-detailed",
            category: "MARKETING",
            icon: BarChart3,
            title: "Opportunity Analytics",
            subtitle: "Detailed sales pipeline report",
            path: `${baseUrl}/opportunities/detailed`,
            keywords: ["sales", "pipeline", "analytics", "detailed", "reports", "ops"],
            permission: PERMISSIONS.OPPORTUNITIES_VIEW,
        },
        {
            id: "phone-directory",
            category: "MARKETING",
            icon: Contact,
            title: "Phone Directory",
            subtitle: "View caller identification records",
            path: `${baseUrl}/phone-directory`,
            keywords: ["calls", "caller id", "overlay", "contacts", "directory", "phone", "ops"],
            permission: PERMISSIONS.DIRECTORY_VIEW,
        },
        {
            id: "contacts",
            category: "MARKETING",
            icon: Contact,
            title: "Contacts",
            subtitle: "Manage contact information",
            path: `${baseUrl}/contacts`,
            keywords: ["people", "persons", "directory", "contacts", "crm"],
            permission: PERMISSIONS.CONTACTS_VIEW,
        },

        // CUSTOMER
        {
            id: "customers",
            category: "CUSTOMER",
            icon: Users,
            title: "Customers",
            subtitle: "View all customers",
            path: `${baseUrl}/customers`,
            shortcut: ["G", "C"],
            keywords: ["clients", "accounts", "company", "customers", "crm"],
            permission: PERMISSIONS.CUSTOMERS_VIEW,
        },
        {
            id: "subscriptions",
            category: "CUSTOMER",
            icon: FileText,
            title: "Subscriptions",
            subtitle: "Track recurring subscriptions",
            path: `${baseUrl}/subscriptions`,
            keywords: ["recurring", "billing", "plans", "subscriptions", "crm"],
            permission: PERMISSIONS.SUBSCRIPTIONS_VIEW,
        },
        {
            id: "archived-subscriptions",
            category: "CUSTOMER",
            icon: History,
            title: "Archived Subscriptions",
            subtitle: "View archived or cancelled subscriptions",
            path: `${baseUrl}/subscriptions/archived`,
            keywords: ["archived", "old", "cancelled", "history", "subscriptions", "crm"],
            permission: PERMISSIONS.SUBSCRIPTIONS_VIEW,
        },
        {
            id: "domains",
            category: "CUSTOMER",
            icon: Globe,
            title: "Domains",
            subtitle: "Manage domain registrations",
            path: `${baseUrl}/domains`,
            keywords: ["websites", "hostings", "dns", "domains", "crm"],
            permission: PERMISSIONS.DOMAINS_VIEW,
        },

        // SERVICES
        {
            id: "services",
            category: "SERVICES",
            icon: Package,
            title: "Services",
            subtitle: "View service offerings",
            path: `${baseUrl}/services`,
            keywords: ["products", "plans", "offerings", "services", "crm"],
            permission: PERMISSIONS.SERVICES_VIEW,
        },
        {
            id: "vendors",
            category: "SERVICES",
            icon: Building2,
            title: "Vendors",
            subtitle: "Manage vendor relationships",
            path: `${baseUrl}/vendors`,
            keywords: ["suppliers", "partners", "providers", "vendors", "crm"],
            permission: PERMISSIONS.VENDORS_VIEW,
        },

        // HR
        {
            id: "goals",
            category: "HR",
            icon: Target,
            title: "Goals",
            subtitle: "Manage company & team goals",
            path: `${baseUrl}/goals`,
            shortcut: ["G", "G"],
            keywords: ["goals", "targets", "okr", "kpi", "milestones", "objectives", "ops"],
            permission: PERMISSIONS.GOALS_VIEW,
        },
        {
            id: "leaves",
            category: "HR",
            icon: Calendar,
            title: "Leaves & Permissions",
            subtitle: "Manage your time off requests",
            path: `${baseUrl}/leaves`,
            shortcut: ["G", "L"],
            keywords: ["holiday", "vacation", "permission", "hr", "self", "leaves"],
            permission: PERMISSIONS.LEAVES_VIEW,
        },
        {
            id: "admin-leaves",
            category: "HR",
            icon: UserCog,
            title: "Leave Admin",
            subtitle: "Manage leave types and approvals",
            path: `${baseUrl}/admin/leaves`,
            keywords: ["management", "hr", "admin", "vacation", "leaves"],
            permission: PERMISSIONS.LEAVES_MANAGE_TYPES,
        },
        {
            id: "admin-appraisals",
            category: "HR",
            icon: Settings,
            title: "Appraisal Admin",
            subtitle: "Manage appraisal templates and periods",
            path: `${baseUrl}/admin/appraisals`,
            keywords: ["management", "hr", "admin", "performance", "appraisal"],
            permission: PERMISSIONS.APPRAISALS_MANAGE,
        },
        {
            id: "appraisals",
            category: "HR",
            icon: ClipboardList,
            title: "Self Appraisal",
            subtitle: "Submit your quarterly performance review",
            path: `${baseUrl}/appraisals`,
            keywords: ["review", "performance", "feedback", "hr", "self", "appraisal"],
            permission: PERMISSIONS.APPRAISALS_SUBMIT,
        },

        // ADMIN
        {
            id: "settings",
            category: "ADMIN",
            icon: Settings,
            title: "Global Settings",
            subtitle: "Configure system preferences",
            path: `${baseUrl}/settings`,
            shortcut: ["Ctrl", "Shift", "P"],
            keywords: ["config", "admin", "preferences", "settings"],
            permission: PERMISSIONS.SETTINGS_MANAGE,
        },
        {
            id: "birthdays",
            category: "ADMIN",
            icon: Cake,
            title: "Birthdays",
            subtitle: "View upcoming birthdays",
            path: `${baseUrl}/birthdays`,
            keywords: ["celebrations", "dates", "anniversary", "birthdays", "ops"],
            permission: PERMISSIONS.BIRTHDAYS_VIEW,
        },
        {
            id: "assets",
            category: "ADMIN",
            icon: Monitor,
            title: "Assets",
            subtitle: "Manage company assets & inventory",
            path: `${baseUrl}/assets`,
            keywords: ["hardware", "software", "inventory", "it", "devices", "assets", "crm"],
            permission: PERMISSIONS.ASSETS_VIEW,
        },
        {
            id: "kb-articles",
            category: "ADMIN",
            icon: FileText,
            title: "Knowledge Base",
            subtitle: "Browse documentation articles",
            path: `${baseUrl}/kb`,
            shortcut: ["G", "K"],
            keywords: ["docs", "help", "kb", "knowledge", "articles", "ops"],
            permission: PERMISSIONS.KNOWLEDGE_BASE_VIEW,
        },
        {
            id: "backups",
            category: "ADMIN",
            icon: Database,
            title: "Backups",
            subtitle: "Manage database backup configurations",
            path: `${baseUrl}/backups`,
            keywords: ["database", "restore", "recovery", "export", "admin", "backups"],
            permission: PERMISSIONS.BACKUPS_VIEW,
        },
        {
            id: "backup-history",
            category: "ADMIN",
            icon: History,
            title: "Backup History",
            subtitle: "View database backup execution history",
            path: `${baseUrl}/backups/history`,
            keywords: ["database", "history", "logs", "restore", "admin", "backups"],
            permission: PERMISSIONS.BACKUPS_VIEW,
        },

        // Quick Actions - Add New
        {
            id: "add-task",
            category: "Quick Actions",
            icon: Plus,
            title: "Create Task",
            subtitle: "Create a new task",
            path: `${baseUrl}/tasks?action=create`,
            keywords: ["new", "create", "task", "todo", "add"],
            permission: PERMISSIONS.TASKS_CREATE,
        },
        {
            id: "add-goal",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Goal",
            subtitle: "Create a new goal",
            path: `${baseUrl}/goals/add`,
            keywords: ["new", "create", "goal", "target", "add"],
            permission: PERMISSIONS.GOALS_CREATE,
        },
        {
            id: "add-customer",
            category: "Quick Actions",
            icon: UserPlus,
            title: "Add Customer",
            subtitle: "Create a new customer",
            path: `${baseUrl}/customers/add`,
            keywords: ["new", "create", "client", "customer", "add"],
            permission: PERMISSIONS.CUSTOMERS_CREATE,
        },
        {
            id: "add-domain",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Domain",
            subtitle: "Register a new domain",
            path: `${baseUrl}/domains/add`,
            keywords: ["new", "create", "register", "domain", "add"],
            permission: PERMISSIONS.DOMAINS_CREATE,
        },
        {
            id: "add-service",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Service",
            subtitle: "Create a new service",
            path: `${baseUrl}/services/add`,
            keywords: ["new", "create", "product", "service", "add"],
            permission: PERMISSIONS.SERVICES_CREATE,
        },
        {
            id: "add-vendor",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Vendor",
            subtitle: "Add a new vendor",
            path: `${baseUrl}/vendors/add`,
            keywords: ["new", "create", "supplier", "vendor", "add"],
            permission: PERMISSIONS.VENDORS_CREATE,
        },
        {
            id: "add-subscription",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Subscription",
            subtitle: "Create a new subscription",
            path: `${baseUrl}/subscriptions/add`,
            keywords: ["new", "create", "recurring", "subscription", "add"],
            permission: PERMISSIONS.SUBSCRIPTIONS_CREATE,
        },
        {
            id: "add-dcr",
            category: "Quick Actions",
            icon: Plus,
            title: "New DCR Entry",
            subtitle: "Create a new DCR entry",
            path: `${baseUrl}/dcr/new`,
            keywords: ["new", "create", "report", "dcr", "add"],
            permission: PERMISSIONS.DCR_CREATE,
        },
        {
            id: "add-contact",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Contact",
            subtitle: "Create a new contact",
            path: `${baseUrl}/contacts/new`,
            keywords: ["new", "create", "person", "contact", "add"],
            permission: PERMISSIONS.CONTACTS_CREATE,
        },
        {
            id: "add-opportunity",
            category: "Quick Actions",
            icon: Plus,
            title: "Add Opportunity",
            subtitle: "Create a new sales opportunity",
            path: `${baseUrl}/opportunities/new`,
            keywords: ["new", "create", "sale", "lead", "opportunity", "add"],
            permission: PERMISSIONS.OPPORTUNITIES_CREATE,
        },
        {
            id: "add-asset",
            category: "Quick Actions",
            icon: Plus,
            title: "Create Asset",
            subtitle: "Register a new company asset",
            path: `${baseUrl}/assets/add`,
            keywords: ["new", "create", "inventory", "device", "asset", "add"],
            permission: PERMISSIONS.ASSETS_CREATE,
        },
        {
            id: "add-kb-article",
            category: "Quick Actions",
            icon: Plus,
            title: "Create Article",
            subtitle: "Add to Knowledge Base",
            path: `${baseUrl}/kb/new`,
            keywords: ["new", "create", "article", "docs", "kb", "add"],
            permission: PERMISSIONS.KNOWLEDGE_BASE_CREATE,
        },
        {
            id: "add-user",
            category: "Quick Actions",
            icon: UserPlus,
            title: "Add User",
            subtitle: "Create a new user account",
            path: `${baseUrl}/settings/user-management/add-user`,
            keywords: ["new", "create", "user", "account", "add"],
            permission: PERMISSIONS.USERS_CREATE,
        },
        {
            id: "add-backup-config",
            category: "Quick Actions",
            icon: Plus,
            title: "New Backup Config",
            subtitle: "Configure new database backup",
            path: `${baseUrl}/backups/new`,
            keywords: ["new", "create", "backup", "database", "add"],
            permission: PERMISSIONS.BACKUPS_CREATE,
        },
        {
            id: "start-timer",
            category: "Quick Actions",
            icon: Play,
            title: "Start Timer",
            subtitle: "Begin tracking time",
            path: `${baseUrl}/time-tracking?action=start`,
            keywords: ["new", "track", "start", "begin", "timer"],
            permission: PERMISSIONS.TIME_TRACKING_USE,
        },

        // Settings Sub-Modules
        {
            id: "settings-profile",
            category: "Settings",
            icon: Settings,
            title: "Profile Settings",
            subtitle: "Update personal information",
            path: `${baseUrl}/settings/profile`,
            keywords: ["account", "preferences", "user", "profile", "settings"],
            permission: null,
        },
        {
            id: "settings-dashboard",
            category: "Settings",
            icon: Sliders,
            title: "Dashboard Settings",
            subtitle: "Configure dashboard widgets & layout",
            path: `${baseUrl}/settings/dashboard-settings`,
            keywords: ["dashboard", "widgets", "configure", "layout", "settings"],
            permission: PERMISSIONS.DASHBOARD_CONFIGURE,
        },
        {
            id: "settings-taxes",
            category: "Settings",
            icon: Receipt,
            title: "Tax Settings",
            subtitle: "Configure tax rates and groups",
            path: `${baseUrl}/settings/taxes/tax-rates`,
            keywords: ["gst", "rates", "invoice", "tax", "settings"],
            permission: PERMISSIONS.TAXES_VIEW,
        },
        {
            id: "settings-default-tax",
            category: "Settings",
            icon: Receipt,
            title: "Default Tax Preferences",
            subtitle: "Manage global tax defaults",
            path: `${baseUrl}/settings/taxes/default-tax-pref`,
            keywords: ["tax", "preference", "default", "gst", "settings"],
            permission: PERMISSIONS.TAXES_CONFIGURE,
        },
        {
            id: "settings-gst",
            category: "Settings",
            icon: Receipt,
            title: "GST Settings",
            subtitle: "Configure GST identification numbers",
            path: `${baseUrl}/settings/taxes/gst-settings`,
            keywords: ["gst", "tax", "tin", "settings"],
            permission: PERMISSIONS.TAXES_CONFIGURE,
        },
        {
            id: "settings-users",
            category: "Settings",
            icon: UserCog,
            title: "User Management",
            subtitle: "Manage user accounts",
            path: `${baseUrl}/settings/user-management`,
            keywords: ["accounts", "access", "admin", "users", "settings"],
            permission: PERMISSIONS.USERS_VIEW,
        },
        {
            id: "settings-roles",
            category: "Settings",
            icon: Shield,
            title: "Roles & Permissions",
            subtitle: "Configure roles and access",
            path: `${baseUrl}/settings/roles`,
            keywords: ["access", "permission", "security", "roles", "settings"],
            permission: PERMISSIONS.ROLES_VIEW,
        },
        {
            id: "settings-teams",
            category: "Settings",
            icon: Users2,
            title: "Teams Management",
            subtitle: "Manage functional teams",
            path: `${baseUrl}/settings/teams`,
            keywords: ["groups", "members", "collaboration", "organization", "teams", "settings"],
            permission: PERMISSIONS.TEAMS_MANAGE,
        },
        {
            id: "settings-reminders",
            category: "Settings",
            icon: Bell,
            title: "Reminder Policies",
            subtitle: "Configure automated reminders",
            path: `${baseUrl}/settings/reminder-policies`,
            keywords: ["notifications", "alerts", "schedule", "reminders", "settings"],
            permission: PERMISSIONS.REMINDER_POLICIES_VIEW,
        },
        {
            id: "settings-email-templates",
            category: "Settings",
            icon: Mail,
            title: "Email Templates",
            subtitle: "Customize email templates",
            path: `${baseUrl}/settings/email-templates`,
            keywords: ["templates", "notifications", "mail", "email", "settings"],
            permission: PERMISSIONS.EMAIL_TEMPLATES_VIEW,
        },
        {
            id: "settings-notification-logs",
            category: "Settings",
            icon: FileText,
            title: "Notification Logs",
            subtitle: "View notification history",
            path: `${baseUrl}/settings/notification-logs`,
            keywords: ["history", "emails", "sent", "notifications", "settings"],
            permission: PERMISSIONS.NOTIFICATION_LOGS_VIEW,
        },
        {
            id: "settings-activity-logs",
            category: "Settings",
            icon: FileText,
            title: "Activity Logs",
            subtitle: "View system activity",
            path: `${baseUrl}/settings/activity-logs`,
            keywords: ["audit", "history", "tracking", "activity", "settings"],
            permission: PERMISSIONS.ACTIVITY_LOGS_VIEW,
        },
        {
            id: "settings-quick-tools",
            category: "Settings",
            icon: Link2,
            title: "Quick Tools Admin",
            subtitle: "Manage diagnostic tools",
            path: `${baseUrl}/settings/quick-tools`,
            keywords: ["dns", "ssl", "whois", "tools", "settings"],
            permission: PERMISSIONS.QUICK_TOOLS_MANAGE,
        },
        {
            id: "settings-appearance",
            category: "Settings",
            icon: Palette,
            title: "Appearance Settings",
            subtitle: "Customize themes and fonts",
            path: `${baseUrl}/settings/appearance`,
            keywords: ["theme", "colors", "fonts", "design", "ui", "appearance", "settings"],
            permission: null,
        },
        {
            id: "settings-birthday-exp",
            category: "Settings",
            icon: Cake,
            title: "Birthday Experience",
            subtitle: "Configure birthday wishes & templates",
            path: `${baseUrl}/settings/birthday-experience`,
            keywords: ["birthday", "wishes", "celebration", "greetings", "settings"],
            permission: PERMISSIONS.SETTINGS_MANAGE,
        },
        {
            id: "settings-helpdesk",
            category: "Settings",
            icon: LifeBuoy,
            title: "Helpdesk Settings",
            subtitle: "Configure support & ticketing options",
            path: `${baseUrl}/settings/helpdesk`,
            keywords: ["helpdesk", "support", "tickets", "help", "settings"],
            permission: PERMISSIONS.SETTINGS_MANAGE,
        },
        {
            id: "settings-developer-controls",
            category: "Settings",
            icon: Terminal,
            title: "Developer Controls",
            subtitle: "System developer options & tools",
            path: `${baseUrl}/settings/developer-controls`,
            keywords: ["developer", "dev", "system", "code", "settings"],
            permission: PERMISSIONS.DEVELOPER_CONTROLS,
        },
        {
            id: "settings-goal-masters",
            category: "Settings",
            icon: Target,
            title: "Goal Masters Settings",
            subtitle: "Configure goal categories & metrics",
            path: `${baseUrl}/settings/goal-masters`,
            keywords: ["goals", "categories", "masters", "configure", "settings"],
            permission: PERMISSIONS.GOALS_CONFIGURE_CATEGORIES,
        },
        {
            id: "settings-asset",
            category: "Settings",
            icon: Tag,
            title: "Asset Categories & Settings",
            subtitle: "Manage asset types and categories",
            path: `${baseUrl}/assets/settings`,
            keywords: ["asset", "categories", "hardware", "software", "settings"],
            permission: PERMISSIONS.ASSETS_MANAGE_CATEGORIES,
        },
        {
            id: "manage-kb-categories",
            category: "Settings",
            icon: Settings,
            title: "Manage KB Categories",
            subtitle: "Organize KB articles",
            path: `${baseUrl}/kb/categories`,
            keywords: ["categories", "organize", "kb", "knowledge", "settings"],
            permission: PERMISSIONS.KNOWLEDGE_BASE_MANAGE_CATEGORIES,
        },

        // Help & Docs
        {
            id: "kb-guide",
            category: "Other",
            icon: HelpCircle,
            title: "Releases Guide",
            subtitle: "View latest version changelog",
            path: `${baseUrl}/help#releases`,
            keywords: ["version", "changelog", "new", "features", "release", "help"],
            permission: null,
        },
        {
            id: "help",
            category: "Other",
            icon: HelpCircle,
            title: "Help & Documentation",
            subtitle: "View help and shortcuts",
            path: `${baseUrl}/help`,
            keywords: ["documentation", "guide", "shortcuts", "help"],
            permission: null,
        },
    ];
};

// Group items by category
const groupByCategory = (items) => {
    return items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});
};

export default function CommandPalette({ open, onOpenChange }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const { hasPermission } = usePermissions();

    const { theme, toggleTheme } = useTheme();

    // Create command items with permission filtering
    const commandItems = useMemo(() => {
        if (!user?.username) return [];

        const items = createCommandItems(user.username, hasPermission, dispatch, navigate, theme, toggleTheme);

        // Filter items based on permissions
        return items.filter((item) => {
            if (item.permission === null) return true;
            if (Array.isArray(item.permission)) {
                return item.permission.some((p) => hasPermission(p));
            }
            return hasPermission(item.permission);
        });
    }, [user?.username, hasPermission, dispatch, navigate, theme, toggleTheme]);

    // Group items by category
    const groupedItems = useMemo(() => {
        return groupByCategory(commandItems);
    }, [commandItems]);

    const handleSelect = useCallback(
        (item) => {
            // Brief 120ms timeout to allow visual feedback (item selection highlight) before closing modal and navigating
            setTimeout(() => {
                onOpenChange(false);

                // Handle special actions
                if (item.action) {
                    item.action();
                    return;
                }

                // Navigate to path
                if (item.path) {
                    navigate(item.path);
                }
            }, 120);
        },
        [navigate, onOpenChange]
    );

    // Keyboard shortcut listener
    useEffect(() => {
        let lastKey = null;
        let lastKeyTime = 0;

        const down = (e) => {
            // Ignore if typing in an input, textarea, or editable element
            const target = e.target;
            const isEditing = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable ||
                target.getAttribute('role') === 'textbox'
            );

            // Ctrl+Shift+P - Open Settings Menu
            if (e.key === "P" && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                if (open) onOpenChange(false);
                window.dispatchEvent(new CustomEvent('openSettingsMenu'));
                return;
            }
            // Ctrl+K - Open Command Palette
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
                return;
            }

            // Do not trigger G-shortcuts if currently typing in an input or if Command Palette modal is open
            if (isEditing || open || !user?.username) return;

            const now = Date.now();
            const key = e.key.toLowerCase();

            // "G" sequence shortcuts (Go To...)
            if (lastKey === 'g' && now - lastKeyTime < 1000) {
                const baseUrl = `/${user.username}/dashboard`;
                if (key === 'h' && hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
                    e.preventDefault();
                    navigate(baseUrl);
                } else if (key === 't' && hasPermission(PERMISSIONS.TASKS_VIEW)) {
                    e.preventDefault();
                    navigate(`${baseUrl}/tasks`);
                } else if (key === 'g' && hasPermission(PERMISSIONS.GOALS_VIEW)) {
                    e.preventDefault();
                    navigate(`${baseUrl}/goals`);
                } else if (key === 'c' && hasPermission(PERMISSIONS.CUSTOMERS_VIEW)) {
                    e.preventDefault();
                    navigate(`${baseUrl}/customers`);
                } else if (key === 'k' && hasPermission(PERMISSIONS.KNOWLEDGE_BASE_VIEW)) {
                    e.preventDefault();
                    navigate(`${baseUrl}/kb`);
                } else if (key === 'l' && hasPermission(PERMISSIONS.LEAVES_VIEW)) {
                    e.preventDefault();
                    navigate(`${baseUrl}/leaves`);
                }
                lastKey = null;
                return;
            }

            if (key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                lastKey = 'g';
                lastKeyTime = now;
            } else {
                lastKey = null;
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange, navigate, user?.username, hasPermission]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                aria-describedby={undefined}
                className="overflow-hidden p-0 max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 shadow-2xl"
            >
                <DialogTitle className="sr-only">Command Palette</DialogTitle>
                <Command className="bg-transparent">
                    <div className="flex items-center border-b border-gray-200 dark:border-gray-700/50 px-4 py-3">

                        <CommandInput
                            placeholder="Type a command or search..."
                            className="flex h-10 w-full text-lg bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none text-base border-0"
                            autoFocus
                        />
                        <kbd className="ml-2 hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2 font-mono text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            ESC
                        </kbd>
                    </div>
                    <CommandList className="max-h-[420px] overflow-y-auto p-2 scrollbar-thin scrollbar-track-gray-100 dark:scrollbar-track-gray-800 scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        <CommandEmpty className="py-8 text-center text-gray-500 dark:text-gray-400">
                            <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm">No results found</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                        </CommandEmpty>

                        {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
                            <CommandGroup
                                key={category}
                                heading={category}
                                className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-gray-500 dark:[&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2"
                            >
                                {items.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        value={`${item.title} ${item.subtitle} ${item.category} ${item.keywords ? item.keywords.join(" ") : ""}`}
                                        onSelect={() => handleSelect(item)}
                                        className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-all duration-150 group
                                            ${item.id === 'logout'
                                                ? "data-[selected=true]:bg-red-500 data-[selected=true]:text-white hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-500"
                                                : "data-[selected=true]:bg-blue-100 dark:data-[selected=true]:bg-blue-600/20 data-[selected=true]:text-blue-700 dark:data-[selected=true]:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                                            }`}
                                    >
                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-150
                                            ${item.id === 'logout'
                                                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 group-data-[selected=true]:bg-white group-data-[selected=true]:text-red-600 group-data-[selected=true]:border-transparent"
                                                : "bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:border-blue-300 dark:group-hover:border-blue-600/40 group-data-[selected=true]:bg-blue-100 dark:group-data-[selected=true]:bg-blue-600/20 group-data-[selected=true]:border-blue-300 dark:group-data-[selected=true]:border-blue-500/50 group-data-[selected=true]:text-blue-600 dark:group-data-[selected=true]:text-blue-400"
                                            }`}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className={`text-sm font-medium truncate ${item.id === 'logout' ? "group-data-[selected=true]:text-white" : "text-gray-800 dark:text-gray-100 group-data-[selected=true]:text-gray-900 dark:group-data-[selected=true]:text-white"}`}>
                                                {item.title}
                                            </span>
                                            <span className={`text-xs truncate ${item.id === 'logout' ? "text-red-400 dark:text-red-500 group-data-[selected=true]:text-red-100" : "text-gray-500 dark:text-gray-500 group-data-[selected=true]:text-gray-600 dark:group-data-[selected=true]:text-gray-400"}`}>
                                                {item.subtitle}
                                            </span>
                                        </div>
                                        {item.shortcut && (
                                            <div className="hidden sm:flex items-center gap-1 ml-auto">
                                                {item.shortcut.map((key, i) => (
                                                    <kbd
                                                        key={i}
                                                        className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                                                    >
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        )}
                                    </CommandItem>
                                ))}
                                {categoryIndex < Object.entries(groupedItems).length - 1 && (
                                    <CommandSeparator className="my-2 bg-gray-200 dark:bg-gray-700/30" />
                                )}
                            </CommandGroup>
                        ))}
                    </CommandList>

                    {/* Footer */}
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700/50 px-4 py-2.5 text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">↑</kbd>
                                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">↓</kbd>
                                <span className="text-gray-400 dark:text-gray-500">Navigate</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">↵</kbd>
                                <span className="text-gray-400 dark:text-gray-500">Select</span>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">Esc</kbd>
                                <span className="text-gray-400 dark:text-gray-500">Close</span>
                            </span>
                        </div>
                        <span className="text-gray-400 dark:text-gray-600">
                            Ctrl+K
                        </span>
                    </div>
                </Command>
            </DialogContent>
        </Dialog>
    );
}

