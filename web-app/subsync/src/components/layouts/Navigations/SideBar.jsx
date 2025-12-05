import { Link, useParams } from 'react-router-dom';

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

  return (
    <aside
      className={`lg:flex lg:flex-col fixed mr-2 top-0 left-0 z-40 min-h-screen bg-blue-500 text-primary-foreground 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-16'}
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto`}
    >
      <div className="flex items-center justify-between p-4 border-b border-primary-foreground/10">
        {isOpen && <span className="text-xl font-bold">SRMS</span>}
        <Button
          variant="primary"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 z-50"
          onClick={toggleSidebar}
        >
          <span className="material-symbols-outlined">{isOpen ? 'close' : 'menu'}</span>
        </Button>
      </div>

      <nav className="h-[calc(100%-4rem)] overflow-y-auto">
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
                        className="flex items-center space-x-2 py-3 px-4 w-full hover:bg-primary-foreground/10 hover:translate-x-3   duration-300 ease-in-out transition-all"
                      >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        {isOpen && <span>{item.title}</span>}
                      </Link>
                    </TooltipTrigger>
                    {!isOpen && (
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </li>
              ))}
          </TooltipProvider>
        </ul>
      </nav>
    </aside>
  );
}

export default SideBar;
