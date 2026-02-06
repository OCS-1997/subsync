import { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    Target,
    PartyPopper,
    Sparkles,
    Ghost,
    Smartphone,
    Monitor,
    Share,
    MoreVertical,
    Download,
    Clock
} from "lucide-react";
import { usePreferenceOrder } from "@/hooks/usePreferenceOrder.js";

function SupportBuddy() {
    const [isHovered, setIsHovered] = useState(false);
    const [message, setMessage] = useState("Need help?");

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    const messages = [
        "You're doing great!",
        "Drag the modules around!",
        "Ctrl+K is your friend.",
        "Need a coffee break?",
        "Subsync 1.9.4 is here!",
        "I like your style.",
        "Everything's stable."
    ];

    const handleClick = () => {
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setMessage(randomMsg);
    };

    return (
        <motion.div
            style={{
                perspective: "1000px",
                transformStyle: "preserve-3d"
            }}
            className="fixed bottom-12 right-12 z-[100] cursor-pointer group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20, rotateY: "-20deg" }}
                        animate={{ opacity: 1, scale: 1, x: 0, rotateY: "0deg" }}
                        exit={{ opacity: 0, scale: 0.8, x: 20, rotateY: "-20deg" }}
                        className="absolute right-full mr-6 bottom-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/20 whitespace-nowrap font-bold text-sm z-50 pointer-events-none"
                    >
                        {message}
                        <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white/90 dark:bg-slate-800/90 border-r border-t border-blue-500/20 rotate-45" />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d"
                }}
                className="relative w-20 h-20"
            >
                {/* Back Outer Glow */}
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />

                {/* Main Body Layers for 3D depth */}
                {/* Back shadow layer */}
                <div className="absolute inset-0 bg-slate-900/20 rounded-full blur-md translate-z-[-10px] scale-90" />

                {/* Layer 1 (Base) */}
                <div
                    className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-indigo-900 rounded-full shadow-inner border-b-4 border-black/20"
                    style={{ transform: "translateZ(0px)" }}
                />

                {/* Layer 2 (Middle) */}
                <div
                    className="absolute inset-1 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full border-2 border-white/10 shadow-lg"
                    style={{ transform: "translateZ(10px)" }}
                />

                {/* Layer 3 (Top / Face) */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center text-white"
                    style={{ transform: "translateZ(20px)" }}
                >
                    {isHovered ? <Sparkles size={34} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" /> : <Ghost size={34} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />}
                </motion.div>

                {/* Small floating accessory */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 180, 270, 360]
                    }}
                    transition={{
                        scale: { repeat: Infinity, duration: 2 },
                        rotate: { repeat: Infinity, duration: 8, ease: "linear" }
                    }}
                    style={{ transform: "translateZ(35px)" }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-white z-20"
                >
                    <Zap size={12} className="text-white fill-white" />
                </motion.div>

                {/* Shine effect */}
                <div className="absolute top-2 left-4 w-6 h-3 bg-white/20 rounded-full blur-[1px] rotate-[-25deg] pointer-events-none" style={{ transform: "translateZ(25px)" }} />
            </motion.div>
        </motion.div>
    );
}

function SortableModule({ mod }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: mod.title });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className={`group hover:shadow-xl transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden relative h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
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
        </div>
    );
}

export default function HelpPage() {
    const { username } = useParams();
    const [showConfetti, setShowConfetti] = useState(false);

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
                { keys: ["Drag Icon"], description: "Reorder Sidebar Items", icon: <Menu className="w-4 h-4" /> },
                { keys: ["Esc"], description: "Close Modals / Cancel Actions", icon: <ChevronRight className="w-4 h-4" /> },
                { keys: ["Enter"], description: "Confirm / Submit Forms", icon: <ChevronRight className="w-4 h-4" /> },
            ]
        }
    ];

    const defaultModules = [
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
        {
            title: "Time Tracking",
            icon: <Clock className="w-6 h-6" />,
            description: "Track billable hours, manage timers, and generate detailed time reports for projects and clients.",
            color: "emerald"
        },
        {
            title: "Asset Management",
            icon: <Monitor className="w-6 h-6" />,
            description: "Maintain inventory of hardware and software assets with warranty tracking and assignment history.",
            color: "purple"
        },
        {
            title: "Settings & Configuration",
            icon: <Settings className="w-6 h-6" />,
            description: "Customize system preferences, manage users, roles, teams, and configure appearance settings.",
            color: "slate"
        },
    ];

    const { orderedItems: modules, reorderItems: setModules, isLoading } = usePreferenceOrder('help_modules_order', defaultModules, 'title');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = modules.findIndex(i => i.title === active.id);
            const newIndex = modules.findIndex(i => i.title === over.id);
            setModules(arrayMove(modules, oldIndex, newIndex));
        }
    };

    const faqs = [
        {
            question: "How do I create an opportunity for a 'Prospective' customer?",
            answer: "In the Opportunities module, click 'Create' and select 'New Customer Entry'. You can enter the customer's name, company, and contact details directly without creating a separate customer record first. These details stay with the opportunity until you're ready to convert them."
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
        },
        {
            question: "How do I reorder the sidebar menu?",
            answer: "The sidebar navigation is fully customizable! Simply click and hold any sidebar icon, then drag it to your preferred position. Your custom order is saved automatically to your profile and will persist across sessions."
        },
        {
            question: "How does time tracking work?",
            answer: "You can track time using the built-in timer or manually create time entries. Start a timer from the Time Tracking module or use Ctrl+K to quickly 'Start Timer'. All entries can be marked as billable or non-billable and can be associated with customers and projects for detailed reporting."
        },
        {
            question: "Can I customize the appearance of the application?",
            answer: "Yes! Navigate to Settings > Appearance to customize your experience. You can choose from multiple color themes (Blue, Purple, Green, etc.) and select different font families (Inter, Roboto, Poppins, etc.). Changes apply instantly without requiring a page reload."
        },
        {
            question: "How do I manage company assets?",
            answer: "The Asset Management module allows you to track hardware and software assets. You can record purchase dates, warranty information, assign assets to users, and maintain a complete history of assignments. Use the search and filter features to quickly find specific assets."
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
            <SupportBuddy />
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
                        <Badge variant="outline" className="ml-2 text-[10px] uppercase opacity-50">Draggable</Badge>
                    </div>

                    {isLoading && modules.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(11)].map((_, i) => (
                                <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-200 dark:border-slate-800" />
                            ))}
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={modules.map(m => m.title)}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {modules.map((mod) => (
                                        <SortableModule key={mod.title} mod={mod} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
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

                {/* PWA Installation Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-2 bg-violet-600 rounded-full"></div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">App Installation (PWA)</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* iOS */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:shadow-lg transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                        <Smartphone size={24} />
                                    </div>
                                    <CardTitle>iOS (iPhone/iPad)</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">1</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Open <b>RMS</b> in Safari</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">2</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Tap the <b>Share</b> button <Share size={14} className="inline mx-1" /></p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">3</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Select <b>Add to Home Screen</b></p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Android */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:shadow-lg transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                        <Zap size={24} />
                                    </div>
                                    <CardTitle>Android (Chrome)</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">1</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Open <b>RMS</b> in Chrome</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">2</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Tap the <b>Menu</b> <MoreVertical size={14} className="inline mx-1" /> (three dots)</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">3</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Tap <b>Install App</b> or <b>Add to Home Screen</b></p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Desktop */}
                        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:shadow-lg transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                                        <Monitor size={24} />
                                    </div>
                                    <CardTitle>Desktop (Chrome/Edge)</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">1</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Look for the <b>Install Icon</b> <Download size={14} className="inline mx-1" /> in address bar</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">2</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Click <b>Install</b></p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">3</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Launch from your <b>Applications</b> or <b>Desktop</b></p>
                                </div>
                            </CardContent>
                        </Card>
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
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    setShowConfetti(true);
                                    setTimeout(() => setShowConfetti(false), 3000);
                                }}
                                className="cursor-pointer relative"
                            >
                                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Stable Build 2.0.1</Badge>
                                {showConfetti && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 0 }}
                                        animate={{ opacity: 1, y: -50 }}
                                        className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none"
                                    >
                                        <PartyPopper className="text-amber-500 animate-bounce" />
                                    </motion.div>
                                )}
                            </motion.div>
                            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">Latency: 24ms</Badge>
                            <span className="text-slate-500 text-xs italic">&copy; 2026 OCS Renewal Management Systems</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
