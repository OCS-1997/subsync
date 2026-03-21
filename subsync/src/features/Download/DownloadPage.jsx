import { motion } from "framer-motion";
import { 
    Smartphone, 
    Download, 
    ShieldCheck, 
    Zap, 
    Bell, 
    CheckCircle2, 
    ArrowRight,
    QrCode,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";

export default function DownloadPage() {
    const handleDownload = () => {
        window.location.href = "/download/subsync.apk";
    };

    const steps = [
        { title: "Download APK", desc: "Click the download button to get the latest OCS Mobile installer." },
        { title: "Enable Sideloading", desc: "Go to Settings > Security and enable 'Install from Unknown Sources'." },
        { title: "Install & Launch", desc: "Open the downloaded file and follow the prompts to install the app." },
        { title: "Grant Permissions", desc: "Agree to all permissions (Phone, Contacts, Logs) for full features." },
        { title: "Enable Overlay", desc: "Enable 'Display over other apps' to allow caller ID popups." },
        { title: "Sign In", desc: "Use your OCS credentials to sync your data and start tracking." },
    ];

    const features = [
        { icon: ShieldCheck, title: "Call Overlay", desc: "Identify customers instantly when they call." },
        { icon: Zap, title: "Real-time Sync", desc: "DCR and Timer updates reflect instantly on web." },
        { icon: Bell, title: "Push Notifications", desc: "Stay updated on reminders and assignments." },
    ];

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <Badge className="bg-blue-500/10 text-blue-600 border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">
                            Available for Android
                        </Badge>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05]">
                            Take OCS <br />
                            <span className="text-blue-600 italic">Everywhere.</span>
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
                            Stay connected with your customers, manage your pipeline, and log your calls directly from your mobile device.
                        </p>
                    </div>

                    <div className="flex items-center flex-col sm:flex-row gap-4">
                        <Button 
                            size="lg" 
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-8 text-lg font-black shadow-xl shadow-blue-500/20 group transition-all"
                            onClick={handleDownload}
                        >
                            <Download className="mr-3 group-hover:bounce" />
                            Download APK
                        </Button>
                        <div className="flex justify-center items-center gap-4 px-6 py-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group/qr overflow-hidden relative">
                            <div className="w-32 h-32 bg-white p-2 rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/download/subsync.apk')}`} 
                                    alt="QR Code"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Scan to Install</span>
                                <span className="text-[9px] font-bold text-slate-500 max-w-[80px] leading-tight mt-1 underline decoration-dotted">Mobile APK</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Trusted by <span className="text-blue-600">1+</span> Professionals
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <motion.div 
                        initial={{ scale: 0.8, rotate: -5, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 mx-auto w-[280px] h-[580px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl p-4 overflow-hidden group"
                    >
                        {/* Status Bar */}
                        <div className="flex justify-between px-6 pt-6 pb-2 text-[10px] font-bold text-white/40">
                            <span>9:41</span>
                            <div className="flex gap-1.5">
                                <div className="w-4 h-2 bg-white/20 rounded-sm" />
                                <div className="w-4 h-2 bg-white/20 rounded-sm" />
                            </div>
                        </div>
                        
                        {/* App UI Mockup */}
                        <div className="mt-8 space-y-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/40">
                                <img src="/pwa-192x192.png" className="w-10 h-10 object-contain" alt="Logo" />
                            </div>
                            <div className="space-y-3 px-4 text-center">
                                <div className="h-4 w-2/3 bg-white/10 rounded-full mx-auto" />
                                <div className="h-2 w-1/2 bg-white/5 rounded-full mx-auto" />
                            </div>
                            <div className="grid grid-cols-2 gap-3 px-4 pt-4">
                                <div className="h-24 bg-white/5 rounded-2xl" />
                                <div className="h-24 bg-white/5 rounded-2xl" />
                                <div className="h-24 bg-white/5 rounded-2xl" />
                                <div className="h-24 bg-white/5 rounded-2xl" />
                            </div>
                        </div>

                        {/* Incoming Call Mockup */}
                        <motion.div 
                            initial={{ y: 200 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="absolute bottom-4 left-4 right-4 bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Bell size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Incoming Call</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Acme Corp. (John Doe)</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Decorative Elements */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[60px] animate-pulse" />
                </div>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((f, i) => (
                    <Card key={i} className="border-none shadow-sm dark:bg-slate-900/50 hover:shadow-xl transition-all duration-300 group">
                        <CardContent className="p-8 space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <f.icon size={24} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{f.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Installation Steps */}
            <div className="bg-slate-50 dark:bg-slate-950 rounded-[3rem] p-8 md:p-16 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
                <div className="absolute top-0 right-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />
                <div className="relative z-10 space-y-12">
                    <div className="text-center space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-4">
                            <Smartphone className="text-blue-600" />
                            How to Install
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs">A comprehensive 6-step guide to get you up and running</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {steps.map((step, i) => (
                            <div key={i} className="relative group">
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center text-xl font-black text-blue-600 z-10 group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <div className="h-full p-8 pt-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-all">
                                    <h4 className="font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{step.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-center justify-center gap-3 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl max-w-3xl mx-auto">
                <Info className="text-amber-500 shrink-0" size={20} />
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500 leading-relaxed uppercase tracking-tighter">
                    Important: This application is not yet listed on the Google Play Store. You must install it manually by following the sideloading instructions above.
                </p>
            </div>
        </div>
    );
}
