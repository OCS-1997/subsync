import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, Phone, Users, MoreHorizontal, ContactIcon } from 'lucide-react';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function MobileBottomNav({ toggleSidebar }) {
  const { username } = useParams();
  const location = useLocation();
  const { hasAnyPermission } = usePermissions();

  const isActive = (pathPart) => {
    return location.pathname.includes(`/${pathPart}`) || 
           (pathPart === 'dashboard' && location.pathname === `/${username}/dashboard`);
  };

  const navItems = [
    {
      id: 'dashboard',
      icon: Home,
      label: 'Home',
      path: `/${username}/dashboard`,
      permission: PERMISSIONS.DASHBOARD_VIEW,
    },
    {
      id: 'dcr',
      icon: Phone,
      label: 'DCR',
      path: `/${username}/dashboard/dcr`,
      permission: PERMISSIONS.DCR_VIEW,
    },
    {
      id: 'contacts',
      icon: ContactIcon,
      label: 'Contacts',
      path: `/${username}/dashboard/contacts`,
      permission: PERMISSIONS.CONTACTS_VIEW,
    },
    {
      id: 'customers',
      icon: Users,
      label: 'Customers',
      path: `/${username}/dashboard/customers`,
      permission: PERMISSIONS.CUSTOMERS_VIEW,
    }
  ];

  // Filter items based on permissions
  const visibleItems = navItems.filter(item => !item.permission || hasAnyPermission(item.permission));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 pb-safe pt-2 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-14">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.id);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 transition-all duration-300 gap-1",
                active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all",
                active && "bg-blue-50 dark:bg-blue-900/20"
              )}>
                <Icon className={cn("w-5 h-5", active ? "stroke-[2.5px]" : "stroke-[2px]")} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-opacity",
                active ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* More Button (opens Sidebar) */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center flex-1 transition-all duration-300 gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <div className="p-1 rounded-xl">
            <MoreHorizontal className="w-5 h-5 stroke-[2px]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
