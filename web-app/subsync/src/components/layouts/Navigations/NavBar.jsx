import { HelpCircle, User, Settings, LogOut, X, UserCog, ReceiptIndianRupeeIcon, UserRound, FileText, Shield, Calculator, Bell, Mail, Link2, Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";

import { logoutUser } from "@/features/Auth/authSlice";
import { usePermissions } from "@/context/PermissionsContext.jsx";
import { PERMISSIONS } from "@/constants/permissions.js";
import QuickToolsWidget from "@/features/QuickTools/components/QuickToolsWidget.jsx";
import BirthdayNavWidget from "@/features/Dashboard/components/BirthdayNavWidget.jsx";

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const loginIp = user?.ip;
  const loginTime = user?.loginTime;
  const { hasPermission } = usePermissions();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+S - Toggle Sidebar
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+Shift+P - Toggle Settings Panel
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
      // Ctrl+Shift+H - Go to Home/Dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        navigate(`/${user?.username}/dashboard`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, navigate, user?.username]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.warn('Logout logging failed, proceeding with logout:', error);
    } finally {
      navigate('/');
    }
  };

  const handleCalculatorToggle = () => {
    // Trigger calculator toggle via custom event
    window.dispatchEvent(new CustomEvent('toggleCalculator'));
  };

  return (
    <nav className="bg-white shadow-md rounded-b-l border-b-2  border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex  justify-between items-center h-16">
        <div className="flex w-full items-start p-2 m-1">
          <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={toggleSidebar}>
            <span className="material-symbols-outlined">menu</span>
          </Button>
          <div className="flex-shrink-0 flex justify-end p-1 rounded">
            <img src="/logo.png" alt="" className="h-12  p-1 invert brightness-50" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {loginIp && loginTime && (
            <div className="px-4 py-2 text-xs text-gray-600 border-r border-gray-200">
              <div className="font-medium">IP: {formatIp(loginIp)}</div>
              <div className="text-gray-500">Logged in: {new Date(loginTime).toLocaleString()}</div>
            </div>
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
            className="h-10 w-10 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
            onClick={handleCalculatorToggle}
            title="Calculator (Ctrl+Shift+C)"
          >
            <Calculator className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => setSettingsOpen(true)}
            title="Settings (Ctrl+Shift+P)"
          >
            <Settings className="h-5 w-5" />
          </Button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                title="User Menu"
              >
                <User className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">

              {navItems.map((item) => (
                item.key === "logout" ? (
                  <button
                    key={item.key}
                    className="flex items-center w-full px-2 py-2 text-sm text-red-500 hover:bg-red-100 hover:border hover:translate-x-2 transition-all duration-200 ease-in-out hover:border-red-500 rounded-md"
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </button>
                ) : (
                  <Link
                    key={item.key}
                    to={item.path}
                    className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                )
              ))}
            </PopoverContent>
          </Popover>
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
              className="w-80 h-full bg-white shadow-xl z-50 p-6 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between  items-center mb-6 border-b pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  <h2 className="text-xl font-bold text-gray-800"> Settings</h2>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Links */}
              <ul className="flex flex-col space-y-4 text-sm font-medium">
                <Link
                  to="settings/profile"
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-700 hover:text-blue-600  hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                >
                  <UserRound className="h-5 w-5" />
                  Profile
                </Link>

                {hasPermission(PERMISSIONS.TAXES_VIEW) && (
                  <Link
                    to="settings/taxes/tax-rates"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <ReceiptIndianRupeeIcon className="h-5 w-5" />
                    Taxes
                  </Link>
                )}

                {hasPermission(PERMISSIONS.USERS_VIEW) && (
                  <Link
                    to="settings/user-management"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <UserCog className="h-5 w-5" />
                    Users Management
                  </Link>
                )}

                {hasPermission(PERMISSIONS.ACTIVITY_LOGS_VIEW) && (
                  <Link
                    to="settings/activity-logs"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Activity Logs
                  </Link>
                )}

                {hasPermission(PERMISSIONS.ROLES_VIEW) && (
                  <Link
                    to="settings/roles"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Shield className="h-5 w-5" />
                    Roles & Permissions
                  </Link>
                )}

                {hasPermission(PERMISSIONS.REMINDER_POLICIES_VIEW) && (
                  <Link
                    to="settings/reminder-policies"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Bell className="h-5 w-5" />
                    Reminder Policies
                  </Link>
                )}

                {hasPermission(PERMISSIONS.EMAIL_TEMPLATES_VIEW) && (
                  <Link
                    to="settings/email-templates"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Mail className="h-5 w-5" />
                    Email Templates
                  </Link>
                )}

                {hasPermission(PERMISSIONS.NOTIFICATION_LOGS_VIEW) && (
                  <Link
                    to="settings/notification-logs"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <FileText className="h-5 w-5" />
                    Notification Logs
                  </Link>
                )}

                {hasPermission(PERMISSIONS.QUICK_TOOLS_MANAGE) && (
                  <Link
                    to="settings/quick-tools"
                    onClick={() => setSettingsOpen(false)}
                    className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                  >
                    <Link2 className="h-5 w-5" />
                    Quick Tools
                  </Link>
                )}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default NavBar;
