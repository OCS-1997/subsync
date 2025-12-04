import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import {
    Keyboard,
    Menu,
    Settings,
    Link2,
    Home,
    Users,
    Globe,
    Package,
    Building2,
    FileText,
    Calendar,
    Shield,
    Bell,
    Mail,
    Palette,
    Zap,
    Calculator,
    Moon,
    Sun,
    Search,
    ChevronRight
} from "lucide-react";

export default function HelpPage() {
    const shortcuts = [
        {
            category: "Navigation",
            icon: <Menu className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
            items: [
                { keys: ["Ctrl", "Shift", "S"], description: "Toggle Sidebar", icon: <Menu className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "P"], description: "Open Settings Panel", icon: <Settings className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "Q"], description: "Open Quick Tools", icon: <Link2 className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "H"], description: "Go to Home/Dashboard", icon: <Home className="w-4 h-4" /> },
            ]
        },
        {
            category: "Quick Actions",
            icon: <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
            items: [
                { keys: ["Ctrl", "K"], description: "Quick Search", icon: <Search className="w-4 h-4" /> },
                { keys: ["Esc"], description: "Close Dialogs/Modals", icon: <ChevronRight className="w-4 h-4" /> },
                { keys: ["Enter"], description: "Submit Forms", icon: <ChevronRight className="w-4 h-4" /> },
            ]
        }
    ];

    const features = [
        {
            title: "Dashboard",
            icon: <Home className="w-6 h-6" />,
            description: "View key metrics, analytics, and quick access to important features",
            color: "blue"
        },
        {
            title: "Customers",
            icon: <Users className="w-6 h-6" />,
            description: "Manage customer information, contacts, and relationships",
            color: "green"
        },
        {
            title: "Domains",
            icon: <Globe className="w-6 h-6" />,
            description: "Track and manage domain registrations and renewals",
            color: "purple"
        },
        {
            title: "Services",
            icon: <Package className="w-6 h-6" />,
            description: "Configure and manage service offerings and pricing",
            color: "orange"
        },
        {
            title: "Vendors",
            icon: <Building2 className="w-6 h-6" />,
            description: "Maintain vendor relationships and procurement details",
            color: "red"
        },
        {
            title: "Subscriptions",
            icon: <FileText className="w-6 h-6" />,
            description: "Track recurring subscriptions and billing cycles",
            color: "indigo"
        },
        {
            title: "Quick Tools",
            icon: <Link2 className="w-6 h-6" />,
            description: "Access diagnostic tools for domain analysis (DNS, SSL, WHOIS, etc.)",
            color: "blue"
        },
    ];

    const settingsFeatures = [
        {
            title: "Profile Settings",
            icon: <Shield className="w-5 h-5" />,
            description: "Update personal information, email, and password"
        },
        {
            title: "User Management",
            icon: <Users className="w-5 h-5" />,
            description: "Add, edit, and manage user accounts and permissions"
        },
        {
            title: "Role Management",
            icon: <Shield className="w-5 h-5" />,
            description: "Configure roles and permission sets for different user types"
        },
        {
            title: "Tax Settings",
            icon: <FileText className="w-5 h-5" />,
            description: "Configure tax rates, groups, and GST settings"
        },
        {
            title: "Reminder Policies",
            icon: <Bell className="w-5 h-5" />,
            description: "Set up automated reminder schedules for subscriptions"
        },
        {
            title: "Email Templates",
            icon: <Mail className="w-5 h-5" />,
            description: "Customize email templates for notifications and reminders"
        },
        {
            title: "Activity Logs",
            icon: <FileText className="w-5 h-5" />,
            description: "View system activity and audit trails"
        },
        {
            title: "Quick Tools Admin",
            icon: <Link2 className="w-5 h-5" />,
            description: "Manage diagnostic tools available to users"
        },
    ];

    const preferences = [
        {
            title: "Theme",
            icon: <Palette className="w-5 h-5" />,
            options: [
                { icon: <Sun className="w-4 h-4" />, label: "Light Mode", description: "Bright, clean interface" },
                { icon: <Moon className="w-4 h-4" />, label: "Dark Mode", description: "Easy on the eyes" }
            ]
        },
        {
            title: "Quick Tools Widget",
            icon: <Link2 className="w-5 h-5" />,
            description: "Toggle visibility of Quick Tools in the header"
        },
        {
            title: "Floating Calculator",
            icon: <Calculator className="w-5 h-5" />,
            description: "Show/hide the floating calculator widget"
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-gray-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Help & Documentation</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Everything you need to know about using the application
                    </p>
                </div>

                {/* Keyboard Shortcuts */}
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Keyboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Keyboard Shortcuts
                        </CardTitle>
                        <CardDescription>Speed up your workflow with these shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {shortcuts.map((section, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    {section.icon}
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                        {section.category}
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {section.items.map((item, itemIdx) => (
                                        <div
                                            key={itemIdx}
                                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                    {item.icon}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {item.description}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {item.keys.map((key, keyIdx) => (
                                                    <span key={keyIdx} className="flex items-center gap-1">
                                                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                                                            {key}
                                                        </kbd>
                                                        {keyIdx < item.keys.length - 1 && (
                                                            <span className="text-gray-400">+</span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Main Features */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Main Features</CardTitle>
                        <CardDescription>Core modules and their functionalities</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors space-y-2"
                                >
                                    <div className={`p-2 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/30 text-${feature.color}-600 dark:text-${feature.color}-400 w-fit`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Settings & Administration */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            Settings & Administration
                        </CardTitle>
                        <CardDescription>Configure system settings and manage users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {settingsFeatures.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{feature.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* User Preferences */}
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            User Preferences
                        </CardTitle>
                        <CardDescription>Customize your experience (Settings → Profile)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {preferences.map((pref, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                        {pref.icon}
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">{pref.title}</h4>
                                </div>
                                {pref.options ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-8">
                                        {pref.options.map((option, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-800/50"
                                            >
                                                {option.icon}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">{pref.description}</p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Quick Tips */}
                <Card className="border-green-200 dark:border-green-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
                            Quick Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong>Quick Tools:</strong> Access diagnostic tools instantly with Ctrl+Shift+Q or click the link icon in the header
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong>Theme Toggle:</strong> Switch between light and dark mode in Settings → Profile → Preferences
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong>Sidebar:</strong> Toggle the sidebar with Ctrl+Shift+S for more screen space
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong>Settings Panel:</strong> Quick access with Ctrl+Shift+P to open settings
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong>Permissions:</strong> Contact your administrator if you don't have access to certain features
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    <strong>Data Persistence:</strong> All your preferences are automatically saved to your browser
                                </span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Support */}
                <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
                    <CardContent className="p-6 text-center space-y-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Need More Help?
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Contact your system administrator or IT support team for additional assistance
                        </p>
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                            <Mail className="w-4 h-4" />
                            <a
                                href="mailto:hathish113@gmail.com"
                                className="font-medium hover:underline transition-all"
                            >
                                Tech Support
                            </a>
                        </div>
                        <Badge className="bg-blue-600 text-white mt-2">
                            Version 1.0.0
                        </Badge>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
