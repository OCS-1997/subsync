import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { 
    User, Mail, KeyRound, Save, Eye, EyeOff, Loader2, 
    Palette, Zap, Calculator, Moon, Sun, Shield, 
    Calendar, AtSign, LogOut, Camera, 
    Settings2, Bell, Users, ChevronRight, CheckCircle2,
    Lock, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "@/features/Auth/authSlice";
import api from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Switch } from "@/components/ui/switch.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { useTheme } from "@/context/ThemeContext.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";

export default function Profile() {
    const currentUser = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("account");
    
    const [form, setForm] = useState({
        username: "",
        name: "",
        email: "",
        date_of_birth: "",
        password: "",
        confirmPassword: "",
    });
    const [userData, setUserData] = useState(null);
    const [userTeams, setUserTeams] = useState([]);

    // App Settings State
    const [preferences, setPreferences] = useState({
        showQuickTools: true,
        showCalculator: true,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.username) return;
            try {
                setFetching(true);
                const [userRes, teamsRes] = await Promise.all([
                    api.get(`/users/${currentUser.username}`),
                    api.get(`/users/${currentUser.username}/teams`)
                ]);
                
                setUserData(userRes.data);
                setForm({
                    username: userRes.data.username || "",
                    name: userRes.data.name || "",
                    email: userRes.data.email || "",
                    date_of_birth: userRes.data.date_of_birth || "",
                    password: "",
                    confirmPassword: "",
                });

                setUserTeams(teamsRes.data.teams || []);

            } catch (error) {
                toast.error("Error loading profile data");
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, [currentUser?.username]);

    useEffect(() => {
        const savedShowQuickTools = localStorage.getItem("showQuickTools") !== "false";
        const savedShowCalculator = localStorage.getItem("showCalculator") !== "false";
        setPreferences({
            showQuickTools: savedShowQuickTools,
            showCalculator: savedShowCalculator,
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePreferenceChange = (key, value) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
        localStorage.setItem(key, value.toString());
        toast.success("Setting updated");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) {
            return toast.error("Name and Email are required");
        }
        if (form.password && form.password.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }
        if (form.password && form.password !== form.confirmPassword) {
            return toast.error("Passwords do not match");
        }

        setLoading(true);
        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                date_of_birth: form.date_of_birth || null
            };
            if (form.password) payload.password = form.password;

            await api.put(`/users/${currentUser.username}`, payload);

            if (form.password) {
                toast.success("Password updated. Please log in again.");
                setTimeout(() => dispatch(logoutUser()), 2000);
            } else {
                toast.success("Profile updated successfully");
            }

            setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
            const response = await api.get(`/users/${currentUser.username}`);
            setUserData(response.data);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen  dark:bg-slate-950/50 pb-20 overflow-x-hidden">
            {/* Simple Top Banner */}
            <div className="h-48 w-full bg-slate-900 relative">
                <div className="absolute w inset-0 bg-blue-600/10" />
                <div className="max-w-6xl mx-auto h-full px-6 flex items-end pb-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-lg -mb-10 z-30">
                            <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                <User className="w-12 h-12 text-slate-400" />
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left z-30 text-white">
                            <h1 className="text-2xl font-bold">{userData?.name || "User"}</h1>
                            <p className="text-sm text-slate-400 font-medium">@{userData?.username}</p>
                        </div>
                        <div className="z-30 pb-1">
                             <Badge className="bg-blue-600 text-white border-none py-1 px-3 text-[10px] font-bold uppercase tracking-widest">
                                {userData?.role || "User"}
                             </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-2 shadow-sm bg-white dark:bg-slate-900">
                            <nav className="flex flex-col gap-1">
                                {[
                                    { id: 'account', icon: User, label: 'Account Details' },
                                    { id: 'teams', icon: Users, label: 'My Teams' },
                                    { id: 'settings', icon: Settings2, label: 'App Settings' },
                                    { id: 'security', icon: Lock, label: 'Security' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-xs uppercase tracking-wide ${
                                            activeTab === tab.id 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                <button 
                                    onClick={() => dispatch(logoutUser())}
                                    className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-medium text-xs uppercase tracking-wide"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </nav>
                        </Card>
                    </div>

                    {/* Content Panel */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            {activeTab === 'account' && (
                                <motion.div
                                    key="account"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm">
                                        <div className="mb-8">
                                            <h2 className="text-xl font-bold">Personal Information</h2>
                                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">Update your basic profile details.</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Username</Label>
                                                    <div className="relative">
                                                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input value={form.username} disabled className="pl-10 bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Full Name</Label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input name="name" value={form.name} onChange={handleChange} placeholder="Your Display Name" className="pl-10 border-slate-200 dark:border-slate-800" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</Label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="pl-10 border-slate-200 dark:border-slate-800" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Birthday</Label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className="pl-10 border-slate-200 dark:border-slate-800" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end pt-4">
                                                <Button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-xl h-11">
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                                    Save Profile
                                                </Button>
                                            </div>
                                        </form>
                                    </Card>
                                </motion.div>
                            )}

                            {activeTab === 'teams' && (
                                <motion.div
                                    key="teams"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userTeams.length > 0 ? userTeams.map((team) => (
                                            <Card key={team.id} className="rounded-2xl border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 bg-white dark:bg-slate-900 shadow-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 h-1 w-full" style={{ backgroundColor: team.color }} />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm" style={{ backgroundColor: team.color }}>
                                                        {team.team_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{team.team_name}</h3>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                            {team.members?.length || 0} Members
                                                        </p>
                                                    </div>
                                                </div>
                                                {team.description && (
                                                    <p className="text-xs text-slate-500 font-medium line-clamp-2">
                                                        {team.description}
                                                    </p>
                                                )}
                                                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {team.members?.slice(0, 3).map((m, i) => (
                                                            <div key={i} className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold">
                                                                {m.user_name?.charAt(0)}
                                                            </div>
                                                        ))}
                                                        {team.members?.length > 3 && (
                                                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold">
                                                                +{team.members.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {team.team_lead_username === currentUser.username && (
                                                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[8px] font-black uppercase px-2">Team Lead</Badge>
                                                    )}
                                                </div>
                                            </Card>
                                        )) : (
                                            <Card className="md:col-span-2 rounded-2xl border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900 shadow-sm opacity-60">
                                                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                                <h3 className="text-lg font-bold">No Teams Found</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">You aren't associated with any teams yet.</p>
                                            </Card>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'settings' && (
                                <motion.div
                                    key="settings"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Palette className="w-5 h-5 text-blue-600" />
                                                <h3 className="font-bold uppercase text-sm tracking-wide">Theme Preference</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <button 
                                                    onClick={toggleTheme}
                                                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-500 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 rounded-lg bg-blue-600 text-white shadow-md">
                                                            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-xs font-bold uppercase tracking-wide">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Click to Switch</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-all" />
                                                </button>
                                            </div>
                                        </Card>

                                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Zap className="w-5 h-5 text-indigo-600" />
                                                <h3 className="font-bold uppercase text-sm tracking-wide">Interface Tools</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wide">Quick Tools</p>
                                                        <p className="text-[9px] text-slate-500 font-medium">Show icons in navigation bar</p>
                                                    </div>
                                                    <Switch checked={preferences.showQuickTools} onCheckedChange={(v) => handlePreferenceChange("showQuickTools", v)} />
                                                </div>
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wide">Calculator Widget</p>
                                                        <p className="text-[9px] text-slate-500 font-medium">Access calculator anytime</p>
                                                    </div>
                                                    <Switch checked={preferences.showCalculator} onCheckedChange={(v) => handlePreferenceChange("showCalculator", v)} />
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'security' && (
                                <motion.div
                                    key="security"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-900 p-6 md:p-8 shadow-sm">
                                        <div className="mb-10 text-white">
                                            <h2 className="text-xl font-bold">Password & Security</h2>
                                            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Secure your account with a strong password.</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">New Password</Label>
                                                    <div className="relative">
                                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                        <Input 
                                                            type={showPassword ? "text" : "password"}
                                                            name="password"
                                                            value={form.password}
                                                            onChange={handleChange}
                                                            placeholder="Leave blank to keep current"
                                                            className="h-14 pl-12 pr-12 rounded-xl bg-white/5 border-white/10 text-white font-bold transition-all focus:ring-blue-500 block w-full outline-none" 
                                                        />
                                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Confirm Password</Label>
                                                    <div className="relative">
                                                        <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${form.confirmPassword && form.password === form.confirmPassword ? 'text-blue-500' : 'text-slate-500'}`} />
                                                        <Input 
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            value={form.confirmPassword}
                                                            onChange={handleChange}
                                                            placeholder="Repeat new password"
                                                            className="h-14 pl-12 pr-12 rounded-xl bg-white/5 border-white/10 text-white font-bold transition-all focus:ring-blue-500 block w-full outline-none" 
                                                        />
                                                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                                                <div className="flex items-center gap-3 text-slate-500">
                                                    <Info className="w-4 h-4" />
                                                    <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">Changing your password will log you out from all devices for security.</p>
                                                </div>
                                                <Button disabled={loading || !form.password} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-14 px-10 shadow-lg shadow-blue-600/20 uppercase tracking-widest text-[10px]">
                                                    Update Security
                                                </Button>
                                            </div>
                                        </form>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
