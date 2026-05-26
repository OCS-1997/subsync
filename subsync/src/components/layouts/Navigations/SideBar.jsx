/* eslint-disable react/prop-types */
import { useParams, useLocation } from 'react-router-dom';
import { Command, X, LayoutDashboard, Calculator, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@/components/ui/button.jsx';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import { useSidebarFolders } from '@/hooks/useSidebarFolders.js';
import { getMyActiveAppraisal } from '@/features/Appraisals/appraisalSlice';
import { fetchPendingCounts } from '@/features/Leaves/leavesSlice';
import SidebarTree from './SidebarTree.jsx';

const sidebarItems = [
  { path: 'dashboard', title: 'Home', icon: 'home', icon_type: 'lucide', permission: PERMISSIONS.DASHBOARD_VIEW },
  // CRM Module
  { path: 'dashboard/customers', title: 'Customers', icon: 'person', icon_type: 'material', permission: PERMISSIONS.CUSTOMERS_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/domains', title: 'Domains', icon: 'language', icon_type: 'material', permission: PERMISSIONS.DOMAINS_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/services', title: 'Services', icon: 'shop', icon_type: 'material', permission: PERMISSIONS.SERVICES_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/vendors', title: 'Vendors', icon: 'business', icon_type: 'material', permission: PERMISSIONS.VENDORS_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/subscriptions', title: 'Subscriptions', icon: 'subscriptions', icon_type: 'material', permission: PERMISSIONS.SUBSCRIPTIONS_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/assets', title: 'Assets', icon: 'devices', icon_type: 'material', permission: PERMISSIONS.ASSETS_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/contacts', title: 'Contacts', icon: 'contacts', icon_type: 'material', permission: PERMISSIONS.CONTACTS_VIEW, folder: 'CRM Module' },
  { path: 'dashboard/opportunities', title: 'Opportunities', icon: 'finance', icon_type: 'material', permission: PERMISSIONS.OPPORTUNITIES_VIEW, folder: 'CRM Module' },
  // Operations Module
  { path: 'dashboard/time-tracking', title: 'Time Tracking', icon: 'schedule', icon_type: 'material', permission: PERMISSIONS.TIME_TRACKING_VIEW, folder: 'Operations Module' },
  { path: 'dashboard/dcr', title: 'DCR Module', icon: 'phone', icon_type: 'material', permission: PERMISSIONS.DCR_VIEW, folder: 'Operations Module' },
  { path: 'dashboard/phone-directory', title: 'Phone Directory', icon: 'contact_phone', icon_type: 'material', permission: PERMISSIONS.DIRECTORY_VIEW, folder: 'Operations Module' },
  { path: 'dashboard/birthdays', title: 'Birthdays', icon: 'cake', icon_type: 'material', permission: PERMISSIONS.BIRTHDAYS_VIEW, folder: 'Operations Module' },
  { path: 'dashboard/kb', title: 'Knowledge Base', icon: 'book', icon_type: 'material', permission: PERMISSIONS.KNOWLEDGE_BASE_VIEW, folder: 'Operations Module' },
  // Self Service Module
  { path: 'dashboard/leaves', title: 'Leaves & Permissions', icon: 'event_available', icon_type: 'material', permission: PERMISSIONS.LEAVES_VIEW, folder: 'Self Service' },
  { path: 'dashboard/appraisals', title: 'Self Appraisal', icon: 'assignment', icon_type: 'material', permission: PERMISSIONS.APPRAISALS_SUBMIT, folder: 'Self Service' },
  // Administration Module
  { path: 'dashboard/admin/appraisals', title: 'Appraisal Admin', icon: 'admin_panel_settings', icon_type: 'material', permission: PERMISSIONS.APPRAISALS_MANAGE, folder: 'Administration' },
  { path: 'dashboard/admin/leaves', title: 'Leave Admin', icon: 'settings_accessibility', icon_type: 'material', permission: PERMISSIONS.LEAVES_MANAGE_TYPES, folder: 'Administration' },
  { path: 'dashboard/settings', title: 'Settings', icon: 'settings', icon_type: 'material', permission: PERMISSIONS.SETTINGS_MANAGE, folder: 'Administration' },
];

function SideBar({ isOpen, toggleSidebar }) {
  const { username } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { hasAnyPermission } = usePermissions();
  const sidebarRef = useRef(null);

  const { activeAppraisalInfo } = useSelector((state) => state.appraisals);

  useEffect(() => {
    if (hasAnyPermission(PERMISSIONS.APPRAISALS_SUBMIT)) {
      dispatch(getMyActiveAppraisal());
    }
    if (hasAnyPermission([PERMISSIONS.LEAVES_APPROVE, PERMISSIONS.PERMISSIONS_APPROVE])) {
      dispatch(fetchPendingCounts());
    }
  }, [dispatch, hasAnyPermission]);

  const { pendingCounts } = useSelector((state) => state.leaves);

  const badgeCounts = {};
  if (activeAppraisalInfo?.active && 
      activeAppraisalInfo?.appraisal?.status !== 'Submitted' && 
      activeAppraisalInfo?.appraisal?.status !== 'Reviewed') {
    badgeCounts['dashboard/appraisals'] = 1;
  }

  if (pendingCounts?.total > 0) {
    badgeCounts['dashboard/leaves'] = pendingCounts.total;
  }

  const permissionFilter = useCallback(
    (item) => !item.permission || hasAnyPermission(item.permission),
    [hasAnyPermission]
  );

  const {
    nodes,
    isLoading,
    restoredItemIds,
    clearRestoredHighlights,
    move,
    createFolderFromDrop,
    renameFolder,
    deleteFolder,
  } = useSidebarFolders(
    sidebarItems,
    permissionFilter
  );

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('openCommandPalette'));
  };

  const isActive = (path) => {
    const fullPath = `/${username}/${path}`;
    return location.pathname === fullPath || (path === 'dashboard' && location.pathname === `/${username}/dashboard`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        // If click/touch is inside a Radix UI portal, popover content, or dialog, do not close the sidebar
        if (
          event.target.closest('[data-radix-portal]') ||
          event.target.closest('[data-radix-popper-content-wrapper]') ||
          event.target.closest('[role="dialog"]')
        ) {
          return;
        }
        const isNavBarToggle = event.target.closest('button')?.className?.includes('menu');
        if (!isNavBarToggle) toggleSidebar();
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

    <aside
      ref={sidebarRef}
      className={`fixed lg:relative top-0 left-0 z-[60] lg:z-40 transition-all duration-300 ease-in-out
        flex flex-col shadow-2xl border-r border-sidebar-border overflow-hidden
        bg-sidebar text-sidebar-foreground h-screen lg:h-auto lg:min-h-screen lg:mr-2
        ${isOpen ? "w-[85vw] lg:w-64 translate-x-0" : "w-20 -translate-x-full lg:translate-x-0"}
      `}
    >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16 lg:h-20">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <div
                className="flex items-center gap-3 px-1 cursor-pointer hover:bg-sidebar-accent/30 rounded-xl transition-all duration-200 group/header"
                onClick={toggleSidebar}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
              >
                <div className="w-9 h-9 lg:w-11 lg:h-11 bg-white shadow-lg rounded-xl flex items-center justify-center p-1 group-hover/header:rotate-6 transition-transform overflow-hidden">
                  <img src="/pwa-192x192.png" alt="Subsync" className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg lg:text-xl font-black tracking-tighter leading-none">OCS</span>
                  <span className="text-[9px] lg:text-[10px] text-sidebar-foreground/60 mt-1 uppercase tracking-widest font-black">CRM Platform</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div
              className="w-full flex justify-center py-1 cursor-pointer hover:bg-sidebar-accent/30 rounded-xl transition-all duration-200 group/header"
              onClick={toggleSidebar}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSidebar()}
            >
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-sidebar-accent/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-sidebar-border p-1.5 shadow-inner group-hover/header:scale-110 transition-transform overflow-hidden">
                <img src="/pwa-192x192.png" alt="S" className="w-full h-full object-contain" />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar mt-6">
          <div className="px-3">
            <TooltipProvider>
              <SidebarTree
                nodes={nodes}
                isOpen={isOpen}
                isLoading={isLoading}
                username={username}
                isActive={isActive}
                toggleSidebar={toggleSidebar}
                restoredItemIds={restoredItemIds}
                clearRestoredHighlights={clearRestoredHighlights}
                move={move}
                createFolderFromDrop={createFolderFromDrop}
                renameFolder={renameFolder}
                deleteFolder={deleteFolder}
                badgeCounts={badgeCounts}
              />
            </TooltipProvider>
          </div>
        </nav>

        <div className="mt-auto border-t border-sidebar-border p-4 bg-sidebar-accent/5 backdrop-blur-sm space-y-2">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full h-12 flex items-center justify-${isOpen ? 'start' : 'center'} gap-3 px-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-300 group`}
                  onClick={handleOpenCommandPalette}
                >
                  <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-xl group-hover:bg-sidebar-accent/30 transition-colors">
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
