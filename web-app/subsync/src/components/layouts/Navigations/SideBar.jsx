import { Link, useParams } from 'react-router-dom';
import { Command } from 'lucide-react';

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
  { path: 'dashboard/dcr', title: 'DCR', icon: 'call', permission: PERMISSIONS.DCR_VIEW },
  { path: 'dashboard/contacts', title: 'Contacts', icon: 'contacts', permission: PERMISSIONS.CONTACTS_VIEW },
  { path: 'dashboard/birthdays', title: 'Birthdays', icon: 'cake', permission: PERMISSIONS.BIRTHDAYS_VIEW },
  { path: 'dashboard/kb', title: 'Knowledge Base', icon: 'book', permission: PERMISSIONS.KNOWLEDGE_BASE_VIEW },
  // { 
  //   path: 'dashboard/settings',
  //   title: 'Settings',
  //   icon: 'settings',
  //   permission: [
  //     PERMISSIONS.SETTINGS_MANAGE,
  //     PERMISSIONS.USERS_VIEW,
  //     PERMISSIONS.ROLES_VIEW,
  //     PERMISSIONS.ACTIVITY_LOGS_VIEW,
  //     PERMISSIONS.TAXES_VIEW,
  //   ]
  // },
];

function SideBar({ isOpen, toggleSidebar }) {
  const { username } = useParams();
  const { hasAnyPermission } = usePermissions();

  const handleOpenCommandPalette = () => {
    // Trigger custom event to open command palette in NavBar
    window.dispatchEvent(new CustomEvent('openCommandPalette'));
  };

  return (
    <aside
      className={`lg:flex lg:flex-col fixed mr-2 top-0 left-0 z-40 min-h-screen bg-blue-500 dark:bg-sidebar text-white dark:text-sidebar-foreground 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-16'}
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto flex flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10 dark:border-sidebar-border">
        {isOpen && <span className="text-xl font-bold">SRMS</span>}
        <Button
          variant="ghost"
          size="icon"
          className="text-white dark:text-sidebar-foreground hover:bg-white/10 dark:hover:bg-sidebar-accent z-50"
          onClick={toggleSidebar}
        >
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="py-2">
          <TooltipProvider>
            {sidebarItems
              .filter((item) => !item.permission || hasAnyPermission(item.permission))
              .map((item) => (
                <li key={item.title || item.path}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/${username}/${item.path}`}
                        className="flex items-center space-x-2 py-3 px-4 w-full hover:bg-white/10 dark:hover:bg-sidebar-accent hover:translate-x-3 duration-300 ease-in-out transition-all"
                      >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        {isOpen && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent side="right">
                        {item.title}
                        {item.path === 'dashboard/settings' && (
                          <span className="ml-2 text-gray-400 dark:text-gray-600">
                            Ctrl+Shift+P
                          </span>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              ))}
          </TooltipProvider>
        </ul>
      </nav>

      {/* Bottom section with Command Palette */}
      <div className="border-t border-white/10 dark:border-sidebar-border p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full flex items-center justify-${isOpen ? 'start' : 'center'} gap-3 py-3 px-4 text-white dark:text-sidebar-foreground hover:bg-white/10 dark:hover:bg-sidebar-accent transition-all duration-200`}
                onClick={handleOpenCommandPalette}
              >
                <Command className="h-5 w-5" />
                {isOpen && <span>Command Palette</span>}
              </Button>
            </TooltipTrigger>
            {!isOpen && (
              <TooltipContent side="right">
                Command Palette (Ctrl+K)
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}

export default SideBar;

