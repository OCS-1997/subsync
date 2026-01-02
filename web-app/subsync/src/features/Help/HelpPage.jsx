import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.jsx";
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
    Shield,
    Bell,
    Mail,
    Palette,
    Zap,
    Calculator,
    Moon,
    Sun,
    Search,
    ChevronRight,
    Database,
    BookOpen,
    LayoutDashboard,
    TrendingUp,
    HelpCircle,
    Info,
    Calendar,
    Target
} from "lucide-react";

export default function HelpPage() {
    const shortcuts = [
        {
            category: "Navigation",
            icon: <Menu className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
            items: [
                { keys: ["Ctrl", "K"], description: "Open Search / Command Palette", icon: <Search className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "S"], description: "Toggle Sidebar", icon: <Menu className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "P"], description: "Open Settings Panel", icon: <Settings className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "Q"], description: "Quick DNS/WHOIS Tools", icon: <Link2 className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "H"], description: "Return to Dashboard", icon: <Home className="w-4 h-4" /> },
                { keys: ["Ctrl", "Shift", "C"], description: "Toggle Floating Calculator", icon: <Calculator className="w-4 h-4" /> },
            ]
        },
        {
            category: "Quick Actions",
            icon: <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
            items: [
                { keys: ["Esc"], description: "Close Modals / Cancel Actions", icon: <ChevronRight className="w-4 h-4" /> },
                { keys: ["Enter"], description: "Confirm / Submit Forms", icon: <ChevronRight className="w-4 h-4" /> },
            ]
        }
    ];

    const modules = [
        {
            title: "Pipeline & Opportunities",
            icon: <Target className="w-6 h-6" />,
            description: "Manage sales deals using Kanban boards. Supports New Customer details (JSON) for leads without existing records.",
            color: "blue"
        },
        {
            title: "Knowledge Base",
            icon: <BookOpen className="w-6 h-6" />,
            description: "Internal documentation hub with versioning, article categories, and tag-based searching.",
            color: "violet"
        },
        {
            title: "Subsync Billing",
            icon: <FileText className="w-6 h-6" />,
            description: "Track recursive subscriptions, manage reminder schedules, and view notification logs for clients.",
            color: "indigo"
        },
        {
            title: "Domain CRM",
            icon: <Globe className="w-6 h-6" />,
            description: "Centralized tracking for domains, including registration dates, renewal costs, and linked servers.",
            color: "cyan"
        },
        {
            title: "Customer Portal",
            icon: <Users className="w-6 h-6" />,
            description: "Complete list of active customers, their contacts, and linked services or subscriptions.",
            color: "green"
        },
        {
            title: "Quick Diagnostics",
            icon: <Link2 className="w-6 h-6" />,
            description: "Integrated DNS, SSL, and WHOIS lookup tools to troubleshoot domain issues instantly.",
            color: "sky"
        },
        {
            title: "Resource Management",
            icon: <Package className="w-6 h-6" />,
            description: "Manage Services and Vendors to maintain a consistent catalog of offerings and procurement sources.",
            color: "orange"
        },
        {
            title: "Backup & Recovery",
            icon: <Database className="w-6 h-6" />,
            description: "Automated daily backups with manual trigger support. Restore specific versions to maintain data integrity.",
            color: "red"
        },
    ];

    const faqs = [
        {
            question: "How do I create an opportunity for a 'Prospective' customer?",
            answer: "In the Opportunities module, click 'Create' and select 'New Customer Entry'. You can enter the customer's name, company, and contact details directly without creating a separate customer record first. These details stay with the opportunity until you're ready to convert them."
        },
        {
            question: "What happens when a subscription is archived?",
            answer: "Archiving a subscription stops all automated reminder emails and removes it from the 'Active' list. You can still view archived records in the 'Archived Subscriptions' view for audit purposes or to restore them if needed."
        },
        {
            question: "How do automated reminders work?",
            answer: "Reminders are governed by 'Reminder Policies' (found in Settings). You can define when to send emails (e.g., 7 days before expiry, on expiry day). The system automatically queues these based on the subscription's end date."
        },
        {
            question: "How can I change the owner of a deal or account?",
            answer: "Open the record (Opportunity or Customer) and click 'Edit'. Select the new owner from the 'Assign to User' or 'Owner' dropdown. This field automatically displays the full name of the user for better identification."
        },
        {
            question: "Is there a faster way to find data across the system?",
            answer: "Yes! Use the 'Command Palette' (Ctrl + K). It allows you to search for customers, subscription IDs, domains, or even navigate to settings pages instantly without using the sidebar."
        },
        {
            question: "How do I use the Quick Tools for DNS troubleshooting?",
            answer: "Click the link icon in the navigation bar or use Ctrl+Shift+Q. Enter a domain name to fetch its A records, MX records, and SSL certificate status. These tools are rate-limited to ensure system stability."
        },
        {
            question: "What should I do if a backup fails?",
            answer: "If an automated backup fails, check the 'Activity Logs' for specific error messages. You can manually re-trigger a backup from the 'Backups' module by clicking 'Trigger Backup'. If issues persist, contact support."
        },
        {
            question: "Can I customize my dashboard view?",
            answer: "The dashboard currently shows a fixed set of high-priority graphs and lists. You can toggle between different chart views (Monthly vs Yearly) and use the 'Birthday Widget' in the header to track upcoming customer milestones."
        }
    ];

    const adminSections = [
        { title: "User Roles (RBAC)", desc: "Define permission sets (e.g., Sales, Manager) to control who sees what.", icon: <Shield className="w-5 h-5" /> },
        { title: "Tax Calculation", desc: "Set up GST rates and tax groups for automated invoice generation.", icon: <Calculator className="w-5 h-5" /> },
        { title: "Activity Audit", desc: "View every single change made in the system, including who and when.", icon: <TrendingUp className="w-5 h-5" /> },
        { title: "Template Engine", desc: "Customize the content and layout of all automated system emails.", icon: <Mail className="w-5 h-5" /> }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-8 font-sans transition-colors duration-500">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-blue-600 p-8 md:p-12 text-white shadow-2xl shadow-blue-500/20">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="space-y-4 max-w-screen">
                            <Badge className="bg-blue-400/30 text-blue-50 border-none px-4 py-1 text-xs uppercase tracking-widest">RMS Help Center</Badge>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tight">How can we help you today?</h1>
                            <p className="text-blue-100 text-lg md:text-xl font-medium max-w-xl opacity-90">
                                Comprehensive documentation, useful guides, and technical support for your workflow.
                            </p>
                        </div>
                        <div className="hidden lg:block p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                            <HelpCircle size={100} className="text-blue-200 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-2 bg-blue-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">System Modules</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {modules.map((mod, idx) => (
                            <Card key={idx} className="group hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative">
                                <CardContent className="p-6 space-y-4">
                                    <div className={`p-3 rounded-2xl bg-${mod.color}-100 dark:bg-${mod.color}-900/30 text-${mod.color}-600 dark:text-${mod.color}-400 w-fit group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                                        {mod.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white">{mod.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{mod.description}</p>
                                    </div>
                                    <div className={`absolute top-0 right-0 p-1 bg-${mod.color}-500/10 rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity`}>
                                        <Info size={12} className={`text-${mod.color}-500`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* FAQ and Shortcuts Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* FAQ Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-2 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Common Questions</h2>
                        </div>
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
                            <CardContent className="p-4">
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, idx) => (
                                        <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-100 dark:border-slate-800">
                                            <AccordionTrigger className="text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 py-4 px-2">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-4 leading-relaxed italic border-l-4 border-blue-500">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shortcuts Sidebar */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-2 bg-amber-600 rounded-full"></div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Workflow Hacks</h2>
                        </div>
                        {shortcuts.map((section, idx) => (
                            <Card key={idx} className="border-amber-100 dark:border-amber-900/30 bg-white dark:bg-slate-900 overflow-hidden">
                                <CardHeader className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
                                    <div className="flex items-center gap-2">
                                        {section.icon}
                                        <CardTitle className="text-lg font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider">{section.category}</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    {section.items.map((item, itemIdx) => (
                                        <div key={itemIdx} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                    {item.icon}
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.description}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {item.keys.map((k, kIdx) => (
                                                    <kbd key={kIdx} className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded shadow-sm">
                                                        {k}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Administration Card */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-2 bg-green-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Administration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {adminSections.map((sect, idx) => (
                            <Card key={idx} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <CardContent className="p-5 flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                        {sect.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white">{sect.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{sect.desc}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Footer / Support */}
                <Card className="border-none shadow-2xl bg-gradient-to-tr from-slate-900 to-indigo-950 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                        <LayoutDashboard size={200} />
                    </div>
                    <CardContent className="p-12 relative z-10 text-center space-y-6">
                        <h3 className="text-3xl font-bold">Still stuck? No problem.</h3>
                        <p className="max-w-xl mx-auto text-slate-300">
                            Our technical support team is available for system integration assistance, bug reports, and hardware configuration queries.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <a href="mailto:hathish113@gmail.com" className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                                <Mail size={18} /> Email Support
                            </a>
                            <button onClick={() => window.print()} className="px-8 py-3 bg-slate-800 text-white rounded-full font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700">
                                <FileText size={18} /> Print Documentation
                            </button>
                        </div>
                        <div className="pt-6 flex items-center justify-center gap-6">
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Stable Build 1.8.4</Badge>
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Latency: 24ms</Badge>
                            <span className="text-slate-500 text-xs italic">&copy; 2026 OCS Renewal Management Systems</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
