import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    User, 
    Users, 
    Shield, 
    Activity, 
    Receipt, 
    Bell, 
    Mail, 
    FileText, 
    Wrench, 
    LayoutDashboard, 
    ChevronRight,
    Settings as SettingsIcon,
    ShieldCheck,
    Search,
    Clock,
    X,
    LayoutGrid,
    Navigation
} from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SettingsIndex = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const settingGroups = useMemo(() => [
        {
            id: 'account',
            title: "Account",
            icon: User,
            description: "Personal settings",
            items: [
                {
                    id: 'profile',
                    title: "My Profile",
                    description: "Details & security",
                    icon: User,
                    path: "profile",
                    color: "text-blue-500",
                    permission: null
                }
            ]
        },
        {
            id: 'organization',
            title: "Organization",
            icon: Users,
            description: "Teams & members",
            items: [
                {
                    id: 'users',
                    title: "User Management",
                    description: "Manage accounts",
                    icon: Users,
                    path: "user-management",
                    color: "text-indigo-500",
                    permission: PERMISSIONS.USERS_VIEW
                },
                {
                    id: 'teams',
                    title: "Teams",
                    description: "Functional units",
                    icon: ShieldCheck,
                    path: "teams",
                    color: "text-emerald-500",
                    permission: PERMISSIONS.TEAMS_MANAGE
                },
                {
                    id: 'roles',
                    title: "Roles & Permissions",
                    description: "Access control",
                    icon: Shield,
                    path: "roles",
                    color: "text-violet-500",
                    permission: PERMISSIONS.ROLES_VIEW
                }
            ]
        },
        {
            id: 'system',
            title: "System",
            icon: LayoutDashboard,
            description: "Core configuration",
            items: [
                {
                    id: 'taxes',
                    title: "Tax Settings",
                    description: "GST & regional",
                    icon: Receipt,
                    path: "taxes/tax-rates",
                    color: "text-rose-500",
                    permission: PERMISSIONS.TAXES_VIEW
                },
                {
                    id: 'reminders',
                    title: "Reminder Policies",
                    description: "Auto notifications",
                    icon: Bell,
                    path: "reminder-policies",
                    color: "text-amber-500",
                    permission: PERMISSIONS.REMINDER_POLICIES_VIEW
                },
                {
                    id: 'templates',
                    title: "Email Templates",
                    description: "System emails",
                    icon: Mail,
                    path: "email-templates",
                    color: "text-cyan-500",
                    permission: PERMISSIONS.EMAIL_TEMPLATES_VIEW
                },
                {
                    id: 'dashboard-config',
                    title: "Dashboard Config",
                    description: "Layout settings",
                    icon: LayoutDashboard,
                    path: "dashboard-settings",
                    color: "text-orange-500",
                    permission: PERMISSIONS.DASHBOARD_CONFIGURE
                }
            ]
        },
        {
            id: 'logs',
            title: "Utilities",
            icon: Wrench,
            description: "Logs & diagnosis",
            items: [
                {
                    id: 'activity',
                    title: "Activity Logs",
                    description: "Audit trails",
                    icon: Activity,
                    path: "activity-logs",
                    color: "text-slate-500",
                    permission: PERMISSIONS.ACTIVITY_LOGS_VIEW
                },
                {
                    id: 'notifications',
                    title: "Notification Logs",
                    description: "Sent history",
                    icon: FileText,
                    path: "notification-logs",
                    color: "text-slate-600",
                    permission: PERMISSIONS.NOTIFICATION_LOGS_VIEW
                },
                {
                    id: 'quick-tools',
                    title: "Quick Tools",
                    description: "System tools",
                    icon: Wrench,
                    path: "quick-tools",
                    color: "text-pink-500",
                    permission: PERMISSIONS.QUICK_TOOLS_MANAGE
                }
            ]
        }
    ], []);

    const filteredGroups = useMemo(() => {
        return settingGroups.map(group => {
            const visibleItems = group.items.filter(item => {
                const hasPerm = item.permission === null || hasPermission(item.permission);
                const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     item.description.toLowerCase().includes(searchTerm.toLowerCase());
                return hasPerm && matchesSearch;
            });
            return { ...group, items: visibleItems };
        }).filter(group => group.items.length > 0);
    }, [searchTerm, hasPermission, settingGroups]);

    return (
        <div className="container py-8 max-w-7xl mx-auto px-4 min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="text-left">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
                            <SettingsIcon className="w-4 h-4" />
                        </div>
                        Settings
                    </h1>
                </div>

                <div className="relative w-full md:w-80 overflow-hidden">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Filter list..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-10 pl-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold focus:ring-0 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Simplfied Side-by-Side Categorized Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                {filteredGroups.map((group) => (
                    <div key={group.id} className="space-y-6 text-left">
                        {/* Group Header */}
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                <group.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                    {group.title}
                                </h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                                    {group.items.length} Options
                                </p>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(`/${username}/dashboard/settings/${item.path}`)}
                                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group text-left"
                                >
                                    <div className={cn("w-2 h-2 rounded-full shrink-0 transition-all", item.color.replace('text-', 'bg-'))} />
                                    <div className="min-w-0">
                                        <div className="text-[13px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">
                                            {item.title}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-medium truncate">
                                            {item.description}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-all text-slate-300 group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Search className="w-12 h-12 text-slate-200 mb-4" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Nothing matches your search</h3>
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="mt-4 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline"
                    >
                        Show everything
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsIndex;
