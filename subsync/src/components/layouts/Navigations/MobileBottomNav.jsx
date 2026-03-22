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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-border z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {visibleItems.map((item) => {
        const active = isActive(item.id);
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            to={item.path}
            className="relative flex flex-col items-center justify-center w-full h-full gap-1 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {active && (
              <motion.div
                layoutId="mobile-nav-indicator"
                className="absolute inset-0 bg-primary/10 rounded-xl m-1"
                initial={false}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <Icon 
              className={cn(
                "w-5 h-5 transition-transform", 
                active ? "text-primary scale-110 shadow-primary drop-shadow-md" : "text-muted-foreground/70"
              )} 
              strokeWidth={active ? 2.5 : 2} 
            />
            <span className={cn(
              "text-[10px] font-bold tracking-tight transition-colors",
              active ? "text-primary" : "text-muted-foreground/70"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
      
      {/* More Button (opens Sidebar) */}
      <button
        onClick={toggleSidebar}
        className="relative flex flex-col items-center justify-center w-full h-full gap-1 p-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 text-muted-foreground/70" strokeWidth={2} />
        <span className="text-[10px] font-bold tracking-tight text-muted-foreground/70">
          Menu
        </span>
      </button>
    </div>
  );
}
