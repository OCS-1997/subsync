import { HelpCircle, User, Settings, LogOut, X, UserCog, ReceiptIndianRupeeIcon, UserRound, FileText } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {motion, AnimatePresence} from "framer-motion";
import { useState } from "react";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "@/components/ui/button.jsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.jsx";

import { logout } from "@/features/Auth/authSlice";

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
  const role = useSelector(state => state.auth.role);
  const isAdmin = role && role.toLowerCase() === 'admin';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md rounded-b-lg border-b-2  border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex">
          <Button variant="ghost" size="icon" className="mr-2 lg:hidden" onClick={toggleSidebar}>
            <span className="material-symbols-outlined">menu</span>
          </Button>
          <div className="flex-shrink-0 flex items-center p-1 rounded">
            <img src="/logo.png" alt="" className="h-10 w-auto p-1 rounded-sm bg-[#39a0e4] " />
          </div>
        </div>
        <div className="flex items-center">
            {loginIp && loginTime && (
                <div className="px-3 py-2  justify-end items-end text-xs text-gray-500  mb-2">
                  <div>IP: {formatIp(loginIp)}</div>
                  <div>Logged in: {new Date(loginTime).toLocaleString()}</div>
                </div>
            )}
          <Button
            variant="ghost"
            className="h-6 w-6 p-3  rounded-full hover:bg-gray-100"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-6 w-6 " />
          </Button>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-3 rounded-full border-1 border-gray-300">
                <User />
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

              <Link
                to="settings/taxes/tax-rates"
                onClick={() => setSettingsOpen(false)}
                className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
              >
                <ReceiptIndianRupeeIcon className="h-5 w-5" />
                Taxes
              </Link>

              <Link
                to="settings/user-management"
                onClick={() => setSettingsOpen(false)}
                className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
              >
                <UserCog className="h-5 w-5" />
                Users Management
              </Link>

              {isAdmin && (
                <Link
                  to="settings/activity-logs"
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-700 hover:text-blue-600 hover:translate-x-2 transition-all duration-200 ease-in-out flex items-center gap-2"
                >
                  <FileText className="h-5 w-5" />
                  Activity Logs
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
