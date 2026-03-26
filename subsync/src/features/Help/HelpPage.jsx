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
    Database
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
    { q: "How do I create an opportunity for a 'Prospective' customer?", a: "In the Opportunities module, click 'Create' and select 'New Customer Entry'. You can enter details directly without an existing record." },
    { q: "How do automated reminders work?", a: "They are governed by 'Reminder Policies' in Settings. Define your schedule (e.g., 7 days before expiry) and the system handles the rest." },
    { q: "Is there a faster way to find data?", a: "Yes! Use the Command Palette (Ctrl + K) to search for customers, subscription IDs, domains, or settings pages instantly." },
    { q: "How do I use the Phone Directory?", a: "The Phone Directory logs incoming call records and identifies callers from your database. You can view all synchronized records in the Phone Directory module." },
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
