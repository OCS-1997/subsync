import { HelpCircle, User, Settings, LogOut, X, UserCog, ReceiptIndianRupeeIcon, UserRound, FileText, Shield, Calculator, Bell, Mail, Link2, Search, Database, Clock, LayoutDashboard, Users as UsersIcon, Palette, Globe, ShieldCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";
import { toast } from "@/utils/toast";

import { logoutUser, logout } from "@/features/Auth/authSlice";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import QuickToolsWidget from "@/features/QuickTools/components/QuickToolsWidget.jsx";
import BirthdayNavWidget from "@/features/Dashboard/components/BirthdayNavWidget.jsx";
import CommandPalette from "@/components/CommandPalette/CommandPalette.jsx";
import QuickTimerButton from "@/components/QuickTimer/QuickTimerButton.jsx";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { BirthdayBadge } from "@/modules/birthday";

const navItems = [
  { path: "help", title: "Help", key: "help", icon: HelpCircle },
  { path: "logout", title: "Logout", key: "logout", icon: LogOut },
];

function formatIp(ip) {
  // Remove IPv6 prefix if present
  if (typeof ip === "string" && ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  return ip;
}

function NavBar({ toggleSidebar }) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const loginIp = user?.ip;
  const loginTime = user?.loginTime;
  const { hasPermission } = usePermissions();
  const { theme, setTheme, themes } = useTheme();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+S - Toggle Sidebar
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        toggleSidebar();
      }
      // Note: Ctrl+Shift+P is now handled by CommandPalette component
      // Ctrl+Shift+H - Go to Home/Dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        navigate(`/${user?.username}/dashboard`);
      }
    };

    // Listen for openCommandPalette event from sidebar
    const handleOpenCommandPalette = () => {
      setCommandPaletteOpen(true);
    };

    // Listen for openSettingsMenu event from CommandPalette
    const handleOpenSettingsMenu = () => {
      setSettingsOpen(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openCommandPalette', handleOpenCommandPalette);
    window.addEventListener('openSettingsMenu', handleOpenSettingsMenu);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openCommandPalette', handleOpenCommandPalette);
      window.removeEventListener('openSettingsMenu', handleOpenSettingsMenu);
    };
  }, [toggleSidebar, navigate, user?.username]);

  const performLogout = async () => {
    const loadingId = toast.loading("Logging out...");
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.warn('Logout logging failed, proceeding with local logout:', error);
    } finally {
      dispatch(logout());
      toast.dismiss(loadingId);
      toast.success("Logged out successfully");
      navigate('/');
    }
  };

  const promptLogout = () => {
    setOpen(false);
    toast.confirm("Log Out of SubSync?", {
      description: "Are you sure you want to end your active session?",
      button: {
        title: "Yes, Log Out",
        onClick: performLogout,
      },
      secondaryButton: {
        title: "Cancel",
        onClick: () => {
          // Toast closes automatically
        },
      },
    });
  };

  const handleCalculatorToggle = () => {
    // Trigger calculator toggle via custom event
    window.dispatchEvent(new CustomEvent('toggleCalculator'));
  };

  return (
    <nav className="bg-background dark:bg-background shadow-md rounded-b-l border-b-2 border-border sticky top-0 z-50">
      <div className="max-w-full mx-auto px-2 sm:px-6 lg:px-8 flex  justify-between items-center h-16">
        <div className="flex flex-1 items-center p-1 overflow-hidden">
          <Button variant="ghost" size="icon" className="mr-1 lg:hidden h-10 w-10 shrink-0" onClick={toggleSidebar}>
            <span className="material-symbols-outlined text-2xl">menu</span>
          </Button>
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2.5 p-1 rounded overflow-hidden">
            <img 
              src="/logo.png"
               onClick={() => navigate(`/dashboard`)}
              alt="OCS Logo" 
              className="h-7 sm:h-9 w-fit object-contain transition-transform hover:scale-105 cursor-pointer" 
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loginTime && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/30 border border-border/30 hover:bg-accent/50 transition-all duration-300 whitespace-nowrap group"
            >
              <Clock className="h-3.5 w-3.5 text-primary/60 group-hover:text-primary transition-colors" />
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="text-[10px] uppercase tracking-tighter opacity-40 group-hover:opacity-60 transition-opacity">Login:</span>
                <span className="text-foreground/80 tabular-nums">
                  {new Date(loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="opacity-20">/</span>
                <span className="text-muted-foreground tabular-nums font-medium">
                  {new Date(loginTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </motion.div>
          )}

          {/* On mobile, group secondary tools into a popover */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex sm:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-accent/20">
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="grid grid-cols-4 gap-2">
                    {hasPermission(PERMISSIONS.TIME_TRACKING_VIEW) && <QuickTimerButton />}
                    {hasPermission(PERMISSIONS.QUICK_TOOLS_VIEW) && <QuickToolsWidget />}
                    {hasPermission(PERMISSIONS.DASHBOARD_VIEW) && <BirthdayNavWidget />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-xl"
                      onClick={handleCalculatorToggle}
                    >
                      <Calculator className="h-5 w-5" />
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Desktop View Widgets */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              {hasPermission(PERMISSIONS.TIME_TRACKING_VIEW) && (
                <QuickTimerButton />
              )}
              {hasPermission(PERMISSIONS.QUICK_TOOLS_VIEW) && (
                <QuickToolsWidget />
              )}
              {hasPermission(PERMISSIONS.DASHBOARD_VIEW) && (
                <BirthdayNavWidget />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
                onClick={handleCalculatorToggle}
                title="Calculator (Ctrl+Shift+C)"
              >
                <Calculator className="h-5 w-5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-accent transition-colors shrink-0"
              onClick={() => setSettingsOpen(prev => !prev)}
              title="Settings (Ctrl+Shift+P)"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* User Popover Profile Card */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <div>
                <BirthdayBadge showBadgeLabel={false}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-border hover:bg-accent transition-colors shrink-0 cursor-pointer"
                    title="User Account Menu"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </BirthdayBadge>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 rounded-2xl shadow-xl border-border bg-popover" align="end">
              {/* User Header Profile Card */}
              <div className="p-3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-500/10 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-slate-900/40 rounded-xl border border-blue-500/15 dark:border-blue-900/30 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                    {(user?.name || user?.display_name || user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {user?.name || user?.display_name || user?.username}
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      @{user?.username}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
                  <span className="font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    {user?.role || 'Staff'}
                  </span>
                  {loginIp && (
                    <span className="font-mono text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3 h-3 text-muted-foreground/70" />
                      IP: {formatIp(loginIp)}
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 py-1">
                <Link
                  to={`/${user?.username}/dashboard/settings/profile`}
                  className="flex items-center px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <UserRound className="mr-2.5 h-4 w-4 text-blue-500" />
                  My Profile & Settings
                </Link>

                <Link
                  to={`/${user?.username}/dashboard/help`}
                  className="flex items-center px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <HelpCircle className="mr-2.5 h-4 w-4 text-slate-400" />
                  Help & Documentation
                </Link>
              </div>

              {/* Quick Sign Out inside Popover */}
              <div className="pt-2 mt-1 border-t border-border">
                <button
                  className="group flex items-center justify-center gap-2 w-full py-2.5 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-xl border border-rose-200/60 dark:border-rose-900/40 transition-all duration-300 ease-out cursor-pointer active:scale-95 shadow-2xs"
                  onClick={promptLogout}
                >
                  <LogOut className="h-4 w-4 text-rose-500 group-hover:text-white transition-all duration-300 ease-out transform group-hover:translate-x-1.5 group-hover:scale-110 group-hover:-rotate-6" />
                  <span>Log Out</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* External Logout Button - Kept at the Very Top Right Corner */}
          <Button
            variant="ghost"
            size="sm"
            className="group relative flex items-center gap-2 h-9 px-2.5 sm:px-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white font-bold text-xs transition-all duration-300 ease-out active:scale-95 shadow-2xs hover:shadow-md hover:shadow-rose-500/20 shrink-0 cursor-pointer overflow-hidden ml-1"
            onClick={promptLogout}
            title="Log Out of your account"
          >
            <span className="relative flex items-center justify-center">
              <LogOut className="h-4 w-4 text-rose-500 group-hover:text-white transition-all duration-300 ease-out transform group-hover:translate-x-1 group-hover:scale-110 group-hover:-rotate-6" />
            </span>
            
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              className="w-80 h-full bg-background dark:bg-background shadow-xl z-50 p-6 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between  items-center mb-6 border-b border-border pb-3">
                 <div 
                  className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors select-none"
                  onClick={() => {
                    setSettingsOpen(false);
                    navigate(`/${user?.username}/dashboard/settings`);
                  }}
                  role="button"
                >
                  <Settings className="h-6 w-6" />
                  <h2 className="text-xl font-bold"> Settings</h2>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(false)}
                  className="hover:bg-accent"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Links */}
              <ul className="flex flex-col space-y-4 text-sm font-medium">
                {hasPermission(PERMISSIONS.TAXES_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/taxes/tax-rates`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <ReceiptIndianRupeeIcon className="h-5 w-5" />
                    Taxes
                  </Link>
                )}

                {hasPermission(PERMISSIONS.USERS_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/user-management`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <UserCog className="h-5 w-5" />
                    Users Management
                  </Link>
                )}

                {hasPermission(PERMISSIONS.TEAMS_MANAGE) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/teams`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <UsersIcon className="h-5 w-5" />
                    Teams Management
                  </Link>
                )}

                {hasPermission(PERMISSIONS.ROLES_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/roles`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Shield className="h-5 w-5" />
                    Roles & Permissions
                  </Link>
                )}

                {hasPermission(PERMISSIONS.DASHBOARD_CONFIGURE) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/dashboard-settings`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard Settings
                  </Link>
                )}

                {hasPermission(PERMISSIONS.REMINDER_POLICIES_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/reminder-policies`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Bell className="h-5 w-5" />
                    Reminder Policies
                  </Link>
                )}

                {hasPermission(PERMISSIONS.EMAIL_TEMPLATES_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/email-templates`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    Email Templates
                  </Link>
                )}

                {hasPermission(PERMISSIONS.ACTIVITY_LOGS_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/activity-logs`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Activity Logs
                  </Link>
                )}

                {hasPermission(PERMISSIONS.NOTIFICATION_LOGS_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/notification-logs`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Notification Logs
                  </Link>
                )}

                {hasPermission(PERMISSIONS.QUICK_TOOLS_MANAGE) && (
                  <Link
                    to={`/${user?.username}/dashboard/settings/quick-tools`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Link2 className="h-5 w-5" />
                    Quick Tools
                  </Link>
                )}

                <Link
                  to={`/${user?.username}/dashboard/settings/appearance`}
                  onClick={() => setSettingsOpen(false)}
                  className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                >
                  <Palette className="h-5 w-5" />
                  Appearance & Themes
                </Link>

                

                {hasPermission(PERMISSIONS.BACKUPS_VIEW) && (
                  <Link
                    to={`/${user?.username}/dashboard/backups`}
                    onClick={() => setSettingsOpen(false)}
                    className="text-foreground hover:text-primary hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Database className="h-5 w-5" />
                    Backups
                  </Link>
                )}

                {/* Quick Appearance Section */}
                <div className="pt-6 mt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Quick Themes</label>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 rounded-full"
                      onClick={() => {
                        const eligible = themes.filter(t => t.id !== 'system' && t.id !== 'custom');
                        const random = eligible[Math.floor(Math.random() * eligible.length)];
                        setTheme(random.id);
                      }}
                      title="Random Theme"
                    >
                      <Palette className="h-3.5 w-3.5 text-purple-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {themes.filter(t => ["light", "dark", "champagne", "midnight-gold", "soft-lavender"].includes(t.id)).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "h-8 rounded-lg border-2 transition-all hover:scale-110",
                          theme === t.id ? "border-primary shadow-lg" : "border-border hover:border-muted-foreground"
                        )}
                        style={{ backgroundColor: t.id === 'system' ? 'transparent' : `hsl(${t.tokens["--background"]})` }}
                        title={t.name}
                      >
                        <div 
                          className="h-2 w-4 mx-auto mt-2 rounded-full" 
                          style={{ backgroundColor: t.id === 'system' ? 'gray' : `hsl(${t.tokens["--primary"]})` }} 
                        />
                      </button>
                    ))}
                    <Link 
                      to={`/${user?.username}/dashboard/settings/appearance`}
                      onClick={() => setSettingsOpen(false)}
                      className="h-8 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:bg-accent transition-all hover:border-solid"
                      title="More Appearance Settings"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                </div>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </nav>
  );
}

export default NavBar;
