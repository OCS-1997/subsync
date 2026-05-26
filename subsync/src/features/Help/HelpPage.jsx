import { useState } from "react";
import { 
    HelpCircle, 
    Search, 
    Command, 
    BookOpen, 
    Zap, 
    Shield, 
    Settings, 
    Mail, 
    ChevronRight,
    LayoutDashboard,
    Smartphone,
    Monitor,
    Download,
    Phone,
    Clock,
    Target,
    Globe,
    Users,
    FileText,
    Package,
    Database,
    RefreshCw,
    MousePointerClick,
    Sliders,
    Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.jsx";
import { Button } from "@/components/ui/button.jsx";

const MODULES = [
    { title: "CRM Module", icon: Users, desc: "Customers, Domains, Services, Vendors, Subscriptions, Assets, Contacts, and Opportunities", color: "blue" },
    { title: "Operations Module", icon: Zap, desc: "Time Tracking, Daily Call Reports, Phone Directory, Birthdays, and Knowledge Base", color: "indigo" },
    { title: "Self Service", icon: Target, desc: "Manage your own Leaves, Permissions, and Quarterly Appraisals", color: "emerald" },
    { title: "Administration", icon: Settings, desc: "Manage Appraisal periods, Leave types, and Global system configurations", color: "slate" },
    { title: "Backup & Recovery", icon: Database, desc: "Automated daily system backups and data persistence", color: "red" },
];

const SHORTCUTS = [
    { keys: ["Ctrl", "K"], desc: "Command Palette", icon: Search },
    { keys: ["Ctrl", "Shift", "S"], desc: "Toggle Sidebar", icon: LayoutDashboard },
    { keys: ["Ctrl", "Shift", "P"], desc: "Settings Panel", icon: Settings },
    { keys: ["Esc"], desc: "Close Modals", icon: Zap },
];

const FAQS = [
    { 
        q: "How do I customize the sidebar and reset it back to defaults?", 
        a: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Zap size={16} />
                        <span>Sidebar Gestures</span>
                    </div>
                    <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">Reordering</span>
                            <span className="px-2 py-1 bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 rounded font-mono text-[10px]">Drag Grip Handle ⠿</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">Folders</span>
                            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-555 dark:text-emerald-400 rounded font-mono text-[10px]">Drop item on item</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 dark:text-slate-350">Manage Folder</span>
                            <span className="px-2 py-1 bg-amber-500/10 text-amber-555 dark:text-amber-400 rounded font-mono text-[10px]">Options ⋯</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-red-500/5 dark:bg-red-950/20 p-4 rounded-xl border border-red-500/15 dark:border-red-500/30 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm mb-2">
                            <RefreshCw size={16} />
                            <span>Quick Reset Steps</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">Settings</span>
                            <ChevronRight size={12} className="text-slate-400" />
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">Appearance</span>
                            <ChevronRight size={12} className="text-slate-400" />
                            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-bold">Layout</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="inline-block text-[11px] font-bold text-red-500 dark:text-red-400 border border-red-500/30 bg-red-500/10 px-2.5 py-1 rounded-lg">
                            Click "Reset Sidebar Layout"
                        </span>
                    </div>
                </div>
            </div>
        )
    },
    { 
        q: "How do I access hidden developer diagnostics and controls?", 
        a: (
            <div className="mt-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full flex items-center justify-center text-[10px] font-bold text-amber-500">1</div>
                        <Settings size={20} className="mx-auto mb-2 text-slate-400 dark:text-slate-500" />
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">Go to Settings</span>
                        <span className="text-[10px] text-slate-500">Open active settings dashboard</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full flex items-center justify-center text-[10px] font-bold text-amber-500">2</div>
                        <MousePointerClick size={20} className="mx-auto mb-2 text-amber-500 animate-bounce" />
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">Click Gear 5x</span>
                        <span className="text-[10px] text-slate-500">Click settings header gear icon 5 times</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full flex items-center justify-center text-[10px] font-bold text-amber-500">3</div>
                        <Zap size={20} className="mx-auto mb-2 text-emerald-500" />
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">Access Utilities</span>
                        <span className="text-[10px] text-slate-500">Find 'Developer Controls' in list</span>
                    </div>
                </div>
                <div className="p-3 bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/10 dark:border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-750 dark:text-amber-400 font-semibold">Requirement Level:</span>
                    <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full font-bold uppercase text-[9px] tracking-wider">Admin Permissions Only</span>
                </div>
            </div>
        )
    },
    { 
        q: "How do I create an opportunity for a 'Prospective' customer?", 
        a: (
            <div className="mt-2 space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Create new deals or leads without requiring a pre-existing customer profile:</p>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                        <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Opportunities</p>
                            <p className="text-[10px] text-slate-500">Go to Opportunities tab</p>
                        </div>
                    </div>
                    <ChevronRight className="hidden md:block text-slate-400 shrink-0" size={16} />
                    <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                        <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Click + Create</p>
                            <p className="text-[10px] text-slate-500">Select Create button</p>
                        </div>
                    </div>
                    <ChevronRight className="hidden md:block text-slate-400 shrink-0" size={16} />
                    <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                        <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">New Customer</p>
                            <p className="text-[10px] text-slate-500">Toggle Customer Entry</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    { 
        q: "How do automated reminders work?", 
        a: (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs mb-2">
                            <Clock size={14} />
                            <span>Frequency</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Trigger Policy</p>
                        <p className="text-[10px] text-slate-500 leading-normal">Expiries and follow-ups are evaluated automatically daily.</p>
                    </div>
                    <span className="mt-3 w-fit px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-bold">Daily at 6:30 PM IST</span>
                </div>
                
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-blue-500 font-bold text-xs mb-2">
                            <Sliders size={14} />
                            <span>Configuration</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Templates & Setup</p>
                        <p className="text-[10px] text-slate-500 leading-normal">Define email templates & alerts (e.g. 7 days prior).</p>
                    </div>
                    <span className="mt-3 w-fit px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-bold">Settings &gt; Reminders</span>
                </div>
                
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs mb-2">
                            <FileText size={14} />
                            <span>Audit Trail</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Campaign Logs</p>
                        <p className="text-[10px] text-slate-500 leading-normal">View running campaigns and delivery status details.</p>
                    </div>
                    <span className="mt-3 w-fit px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold">Notification Logs</span>
                </div>
            </div>
        )
    },
    { 
        q: "Is there a faster way to find data?", 
        a: (
            <div className="mt-2 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-amber-500/0 border border-amber-500/10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                            <Search size={16} />
                            <span>Command Palette</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Search customers, domains, routes, or forms instantly.</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <kbd className="px-2 py-1 bg-background border border-b-2 rounded-lg shadow-sm text-xs font-bold font-mono">Ctrl</kbd>
                        <span className="text-slate-400 text-xs">+</span>
                        <kbd className="px-2 py-1 bg-background border border-b-2 rounded-lg shadow-sm text-xs font-bold font-mono">K</kbd>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="flex items-center gap-2 p-2 bg-slate-100/40 dark:bg-slate-800/30 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Instant Navigation across modules</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-100/40 dark:bg-slate-800/30 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Quick-launch system action items</span>
                    </div>
                </div>
            </div>
        )
    },
    { 
        q: "How do I use the Phone Directory?", 
        a: (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="text-blue-500 font-bold text-xs mb-2 flex items-center gap-1.5">
                            <Users size={14} />
                            <span>Caller Lookup</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">Auto Identity</p>
                        <p className="text-[10px] text-slate-500 leading-normal">Matches incoming numbers with customer records.</p>
                    </div>
                    <span className="mt-3 w-fit px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded text-[9px] font-bold">Auto-matching</span>
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="text-indigo-500 font-bold text-xs mb-2 flex items-center gap-1.5">
                            <Clock size={14} />
                            <span>Time Logs</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">Call Logs</p>
                        <p className="text-[10px] text-slate-500 leading-normal">Browse and audit previous incoming/outgoing calls.</p>
                    </div>
                    <span className="mt-3 w-fit px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-bold">Directory Logs</span>
                </div>

                <div className="bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                        <div className="text-emerald-500 font-bold text-xs mb-2 flex items-center gap-1.5">
                            <Sparkles size={14} />
                            <span>Actions</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">Inline Notes</p>
                        <p className="text-[10px] text-slate-500 leading-normal">Assign tags, add quick comments, and link to CRM.</p>
                    </div>
                    <span className="mt-3 w-fit px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-bold">Interactive Notes</span>
                </div>
            </div>
        )
    },
    { 
        q: "How does PWA offline synchronization operate?", 
        a: (
            <div className="mt-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                        <div className="mx-auto w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2.5">
                            <Download size={16} />
                        </div>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">1. Asset Caching</span>
                        <span className="text-[10px] text-slate-500 leading-normal">Loads instantly via local service worker.</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                        <div className="mx-auto w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2.5">
                            <Database size={16} />
                        </div>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">2. Offline Mode</span>
                        <span className="text-[10px] text-slate-500 leading-normal">Read details & queue edits offline.</span>
                    </div>
                    <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                        <div className="mx-auto w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2.5 animate-pulse">
                            <Globe size={16} />
                        </div>
                        <span className="block font-bold text-xs text-slate-800 dark:text-slate-200 mb-1">3. Auto Sync</span>
                        <span className="text-[10px] text-slate-500 leading-normal">Pushes queue online once reconnected.</span>
                    </div>
                </div>
            </div>
        )
    },
    { 
        q: "Where do I configure automated email templates?", 
        a: (
            <div className="mt-2 space-y-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                        <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Email Templates</p>
                            <p className="text-[10px] text-slate-500">Go to Settings &gt; Email Templates</p>
                        </div>
                    </div>
                    <ChevronRight className="hidden md:block text-slate-400 shrink-0" size={16} />
                    <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                        <div>
                            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Select Template</p>
                            <p className="text-[10px] text-slate-500">Choose template, e.g. DCR Report</p>
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/10 dark:border-purple-500/20 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400">Available Bind Placeholders:</p>
                    <div className="flex flex-wrap gap-2">
                        <code className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{"{{customer_name}}"}</code>
                        <code className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{"{{due_date}}"}</code>
                        <code className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">{"{{amount}}"}</code>
                    </div>
                </div>
            </div>
        )
    }
];

import { useNavigate, useParams } from "react-router-dom";
const DOWNLOADS = [
    { title: "PWA Web App", icon: Globe, desc: "Install from browser", link: "#", color: "blue" },
    { title: "Desktop App", icon: Monitor, desc: "Windows & macOS", link: "/download/desktop", color: "indigo" },
    { title: "Mobile App", icon: Smartphone, desc: "Android APK", link: "download", color: "emerald" },
];

export default function HelpPage() {
    const navigate = useNavigate();
    const { username } = useParams();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredModules = MODULES.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-8 md:p-16 text-white">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 translate-x-1/2" />
                <div className="relative z-10 space-y-6 max-w-2xl">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                        OCS Help Center
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                        What can we help you <span className="text-blue-200">solve</span> today?
                    </h1>
                    <div className="relative max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors h-5 w-5" />
                        <input 
                            type="text"
                            placeholder="Search for features, modules, or guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-12">
                    {/* Modules Grid */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="h-8 w-1.5 bg-blue-600 rounded-full" />
                                System Capabilities
                            </h2>
                            <Badge variant="outline" className="opacity-50 font-bold uppercase tracking-wider text-[10px]">
                                {filteredModules.length} Modules
                            </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredModules.map((mod, i) => (
                                <motion.div
                                    key={mod.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="group hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden border-b-4 hover:border-b-blue-600">
                                        <CardContent className="p-6">
                                            <div className={`p-3 rounded-xl bg-${mod.color}-500/10 text-${mod.color}-600 dark:text-${mod.color}-400 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                                <mod.icon size={24} />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{mod.title}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{mod.desc}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                            Frequently Asked Questions
                        </h2>
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                            <CardContent className="p-4">
                                <Accordion type="single" collapsible className="w-full">
                                    {FAQS.map((faq, i) => (
                                        <AccordionItem key={i} value={`faq-${i}`} className="border-slate-100 dark:border-slate-800">
                                            <AccordionTrigger className="text-left font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 py-5">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl px-6 py-5 leading-relaxed text-[0.95rem] border-l-4 border-indigo-500">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Releases Section */}
                    <section id="releases" className="space-y-6 pt-12 border-t border-slate-100 dark:border-slate-800">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
                            Latest Releases
                        </h2>
                        <Card className="border-slate-200 dark:border-slate-800 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                                <Zap size={80} className="text-emerald-600" />
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <Badge className="bg-emerald-600 text-white border-none py-1.5 px-4 font-black">v2.2.0</Badge>
                                    <span className="text-sm font-bold text-slate-500 italic">March 26, 2026</span>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Smart Sidebar & Module Grouping</h3>
                                    <ul className="space-y-3">
                                        {[
                                            "Completely overhauled navigation with 4 core preemptive modules.",
                                            "Added premium tooltips and flyout menus for collapsed sidebar items.",
                                            "Synchronized Command Palette (Ctrl+K) with the new module structure.",
                                            "Implemented preference-versioned state migration for all users."
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-[0.95rem] text-slate-600 dark:text-slate-400">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                    {/* Shortcuts */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Workflow Hacks</h3>
                        <div className="space-y-2">
                            {SHORTCUTS.map((s) => (
                                <div key={s.desc} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group hover:border-amber-500/30 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-amber-500 transition-colors">
                                            <s.icon size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.desc}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {s.keys.map(k => (
                                            <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-black bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm">{k}</kbd>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Platform Downloads */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-1">Get the App</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {DOWNLOADS.map((d) => (
                                <Button 
                                    key={d.title}
                                    variant="outline"
                                    className="group h-auto py-4 px-4 justify-start gap-4 rounded-2xl border-slate-200 dark:border-slate-800 hover:border-blue-500/30 bg-white dark:bg-slate-900 transition-all shadow-sm overflow-hidden relative"
                                    onClick={() => {
                                        if (d.link === "download") {
                                            navigate("/app/download");
                                        } else if (d.link !== "#") {
                                            window.location.href = d.link;
                                        }
                                    }}
                                >
                                    <div className={`p-2 rounded-xl bg-${d.color}-500/10 text-${d.color}-600 dark:text-${d.color}-400 group-hover:scale-110 transition-transform`}>
                                        <d.icon size={20} />
                                    </div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{d.title}</span>
                                        <span className="text-[10px] text-slate-500 font-bold">{d.desc}</span>
                                    </div>
                                    <Download size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 text-blue-600" />
                                </Button>
                            ))}
                        </div>
                    </section>

                    {/* Support Card */}
                    <Card className="bg-slate-900 text-white rounded-[2rem] border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                        <CardHeader className="relative z-10 pb-2">
                            <CardTitle className="text-xl font-black tracking-tight">Need 1-on-1 Help?</CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10 space-y-6">
                            <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                Our support team is here to assist with complex integrations, bug reports, and hardware setups.
                            </p>
                            <div className="space-y-3">
                                <Button className="w-full justify-start gap-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl py-6 font-black text-xs uppercase shadow-lg shadow-white/5 group" onClick={() => window.location.href = 'mailto:hathish113@gmail.com'}>
                                    <div className="p-1.5 bg-slate-900 rounded-md text-white group-hover:scale-110 transition-transform"><Mail size={14} /></div>
                                    Email Support
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3 text-white hover:bg-white/5 rounded-xl py-6 font-bold text-xs uppercase" onClick={() => window.print()}>
                                    <div className="p-1.5 bg-slate-800 rounded-md"><FileText size={14} /></div>
                                    Print Docs
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Version Badge */}
                    <div className="flex flex-col items-center gap-2 pt-4">
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1 text-[10px] items-center gap-1.5 font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Stable Build 2.2.0
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">&copy; 2026 OCS Platform</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
