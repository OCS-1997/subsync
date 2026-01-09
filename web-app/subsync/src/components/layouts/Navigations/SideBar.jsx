import { Link, useParams, useLocation } from 'react-router-dom';
import { Command, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button.jsx';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';

const sidebarItems = [
  { path: 'dashboard', title: 'Home', icon: 'home', permission: PERMISSIONS.DASHBOARD_VIEW },
  { path: 'dashboard/customers', title: 'Customers', icon: 'person', permission: PERMISSIONS.CUSTOMERS_VIEW },
  { path: 'dashboard/domains', title: 'Domains', icon: 'language', permission: PERMISSIONS.DOMAINS_VIEW },
  { path: 'dashboard/services', title: 'Services', icon: 'shop', permission: PERMISSIONS.SERVICES_VIEW },
  { path: 'dashboard/vendors', title: 'Vendors', icon: 'business', permission: PERMISSIONS.VENDORS_VIEW },
  { path: 'dashboard/subscriptions', title: 'Subscriptions', icon: 'subscriptions', permission: PERMISSIONS.SUBSCRIPTIONS_VIEW },
  { path: 'dashboard/dcr', title: 'DCR Module', icon: 'phone', permission: PERMISSIONS.DCR_VIEW },
  { path: 'dashboard/contacts', title: 'Contacts', icon: 'contacts', permission: PERMISSIONS.CONTACTS_VIEW },
  { path: 'dashboard/opportunities', title: 'Opportunities', icon: 'finance', permission: PERMISSIONS.OPPORTUNITIES_VIEW },
  { path: 'dashboard/birthdays', title: 'Birthdays', icon: 'cake', permission: PERMISSIONS.BIRTHDAYS_VIEW },
  { path: 'dashboard/kb', title: 'Knowledge Base', icon: 'book', permission: PERMISSIONS.KNOWLEDGE_BASE_VIEW },
];

function SideBar({ isOpen, toggleSidebar }) {
  const { username } = useParams();
  const location = useLocation();
  const { hasAnyPermission } = usePermissions();
  const sidebarRef = useRef(null);

  const handleOpenCommandPalette = () => {
    // Trigger custom event to open command palette in NavBar
    window.dispatchEvent(new CustomEvent('openCommandPalette'));
  };

  const isActive = (path) => {
    const fullPath = `/${username}/${path}`;
    return location.pathname === fullPath || (path === 'dashboard' && location.pathname === `/${username}/dashboard`);
  };

  // Close sidebar on click outside for mobile/floating states
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // Check if the click was not on a toggle button in the navbar
        const isNavBarToggle = event.target.closest('button')?.className?.includes('menu');
        if (!isNavBarToggle) {
          toggleSidebar();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        ref={sidebarRef}
        className={`lg:flex lg:flex-col fixed mr-2 top-0 left-0 z-40 min-h-screen bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-950 text-white dark:text-slate-100 
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto overflow-x-hidden flex flex-col shadow-2xl shadow-blue-500/20`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-white/5 h-20">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <div
                className="flex items-center gap-2 px-1 cursor-pointer hover:bg-white/5 rounded-xl transition-all duration-200 group/header"
                onClick={toggleSidebar}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
              >
                <div className="w-10 h-10 bg-white shadow-lg rounded-xl flex items-center justify-center p-1.5 group-hover/header:rotate-6 transition-transform">
                  <img src="/logo.png" alt="RMS" className="w-full h-full object-contain brightness-100 contrast-125" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tighter leading-none">RMS CRM</span>
                  <span className="text-[10px] text-blue-200 mt-1 uppercase tracking-widest font-black opacity-80">OCS System</span>
                </div>
              </div>

              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden text-white/70 hover:text-white hover:bg-white/10 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div
              className="w-full flex justify-center py-1 cursor-pointer hover:bg-white/5 rounded-xl transition-all duration-200 group/header"
              onClick={toggleSidebar}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
            >
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 p-2 shadow-inner group-hover/header:scale-110 transition-transform">
                <img src="/logo.png" alt="R" className="w-full h-full object-contain invert brightness-0" />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar mt-6">
          <ul className="space-y-1 px-3">
            <TooltipProvider>
              {sidebarItems
                .filter((item) => !item.permission || hasAnyPermission(item.permission))
                .map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.title || item.path} className="relative">
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Link
                            to={`/${username}/${item.path}`}
                            onClick={() => {
                              // On mobile, close sidebar after clicking a link
                              if (window.innerWidth < 1024) toggleSidebar();
                            }}
                            className={`group flex items-center gap-3 py-1 px-1 rounded-xl transition-all duration-300 relative
                            ${active
                                ? 'bg-white/20 shadow-lg text-white font-bold'
                                : 'text-blue-100 hover:text-white hover:bg-white/10'}
                            ${active || !isOpen ? '' : 'hover:translate-x-1.5'}
                            active:scale-[0.97]`}
                          >
                            <div className={`flex items-center justify-center w-10 h-10 shrink-0 rounded-xl transition-all duration-300
                            ${active ? '  text-white' : 'group-hover:bg-white/5'}`}>
                              <span className={`material-symbols-outlined text-[24px] ${active ? 'fill-1' : 'opacity-80'}`}>
                                {item.icon}
                              </span>
                            </div>

                            {isOpen && (
                              <span className={`text-sm whitespace-nowrap tracking-tight transition-all duration-300
                              ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                                {item.title}
                              </span>
                            )}

                            {active && isOpen && (
                              <motion.div
                                layoutId="activeSideIndicator"
                                className="absolute right-0 top-2 bottom-2 w-1 bg-white rounded-l-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                initial={{ opacity: 0, x: 5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                              />
                            )}
                          </Link>
                        </TooltipTrigger>
                        {!isOpen && (
                          <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700 font-black px-3 py-1.5 text-[10px] uppercase tracking-wider">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </li>
                  );
                })}
            </TooltipProvider>
          </ul>
        </nav>

        <div className="mt-auto border-t border-white/10 dark:border-white/5 p-4 bg-black/5 backdrop-blur-sm">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full h-12 flex items-center justify-${isOpen ? 'start' : 'center'} gap-3 px-3 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-all duration-300 group`}
                  onClick={handleOpenCommandPalette}
                >
                  <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl group-hover:bg-white/5 transition-colors">
                    <Command className={`h-5 w-5 ${isOpen ? '' : 'animate-pulse'}`} />
                  </div>
                  {isOpen && <span className="font-bold text-[10px] uppercase tracking-wider">Command Palette</span>}
                </Button>
              </TooltipTrigger>
              {!isOpen && (
                <TooltipContent side="right" className="bg-slate-900 text-white border-slate-700 font-black px-3 py-1.5 text-[10px] uppercase tracking-wider">
                  Command Palette (Ctrl+K)
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>
    </>
  );
}

export default SideBar;

