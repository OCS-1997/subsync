/* eslint-disable react/prop-types */
import { useParams, useLocation } from 'react-router-dom';
import { Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@/components/ui/button.jsx';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/context/PermissionsContext.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import { useSidebarFolders } from '@/hooks/useSidebarFolders.js';
import { getMyActiveAppraisal } from '@/features/Appraisals/appraisalSlice';
import { fetchPendingCounts } from '@/features/Leaves/leavesSlice';
import SidebarTree from './SidebarTree.jsx';
import SidebarHeader from './sidebar/SidebarHeader.jsx';
import SidebarTooltip from './sidebar/SidebarTooltip.jsx';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  loadCollapsedPreference,
  saveCollapsedPreference,
} from './sidebar/sidebarUtils.js';

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

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (event) => setIsDesktop(event.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

function SideBar({ isOpen, toggleSidebar }) {
  const { username } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const { hasAnyPermission } = usePermissions();
  const sidebarRef = useRef(null);
  const isDesktop = useIsDesktop();

  const [desktopCollapsed, setDesktopCollapsed] = useState(() => loadCollapsedPreference());

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
  if (
    activeAppraisalInfo?.active &&
    activeAppraisalInfo?.appraisal?.status !== 'Submitted' &&
    activeAppraisalInfo?.appraisal?.status !== 'Reviewed'
  ) {
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
  } = useSidebarFolders(sidebarItems, permissionFilter);

  const handleOpenCommandPalette = () => {
    window.dispatchEvent(new CustomEvent('openCommandPalette'));
  };

  const isActive = (path) => {
    const fullPath = `/${username}/${path}`;
    return (
      location.pathname === fullPath ||
      (path === 'dashboard' && location.pathname === `/${username}/dashboard`)
    );
  };

  const navExpanded = isDesktop ? !desktopCollapsed : true;
  const mobileVisible = isOpen;

  const handleToggleDesktop = useCallback(() => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      saveCollapsedPreference(next);
      return next;
    });
  }, []);

  // Desktop collapse via the same shortcut NavBar uses for the drawer.
  // Stop propagation so NavBar does not also flip unused desktop isOpen state.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.ctrlKey && event.shiftKey && (event.key === 'S' || event.key === 's'))) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      handleToggleDesktop();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [handleToggleDesktop]);

  // Mobile: close on outside click
  useEffect(() => {
    if (isDesktop || !isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
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
  }, [isOpen, isDesktop, toggleSidebar]);

  // ESC closes mobile drawer
  useEffect(() => {
    if (isDesktop || !isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') toggleSidebar();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDesktop, isOpen, toggleSidebar]);

  const widthPx = navExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <>
      <AnimatePresence>
        {!isDesktop && mobileVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleSidebar}
            aria-hidden="true"
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        ref={sidebarRef}
        aria-label="Application sidebar"
        className={cn(
          'fixed left-0 top-0 z-[60] flex h-screen flex-col overflow-hidden',
          'border-r border-sidebar-border bg-white text-sidebar-foreground shadow-sm',
          'dark:bg-sidebar',
          'transition-[width,transform] duration-[250ms] ease-in-out',
          'lg:relative lg:z-40 lg:mr-0 lg:h-auto lg:min-h-screen lg:shadow-none',
          !isDesktop && (mobileVisible ? 'translate-x-0' : '-translate-x-full'),
          isDesktop && 'translate-x-0'
        )}
        style={{
          width: isDesktop ? widthPx : mobileVisible ? 'min(85vw, 300px)' : widthPx,
        }}
      >
        <TooltipProvider delayDuration={0}>
          <SidebarHeader
            expanded={navExpanded}
            onToggleDesktop={handleToggleDesktop}
            onCloseMobile={toggleSidebar}
          />

          <div
            className={cn(
              'flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar',
              navExpanded ? 'px-3 py-4' : 'px-2 py-3'
            )}
          >
            <SidebarTree
              nodes={nodes}
              expanded={navExpanded}
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
          </div>

          <div
            className={cn(
              'mt-auto shrink-0 border-t border-sidebar-border',
              navExpanded ? 'p-3' : 'p-2'
            )}
          >
            <SidebarTooltip label="Command Palette (Ctrl+K)" disabled={navExpanded}>
              <Button
                type="button"
                variant="ghost"
                aria-label="Open command palette"
                className={cn(
                  'h-10 w-full gap-2.5 rounded-md text-slate-500 transition-colors duration-200',
                  'hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800',
                  navExpanded ? 'justify-start px-2.5' : 'justify-center px-0'
                )}
                onClick={handleOpenCommandPalette}
              >
                <Command className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {navExpanded && (
                  <span className="text-[12px] font-medium">Command Palette</span>
                )}
              </Button>
            </SidebarTooltip>
          </div>
        </TooltipProvider>
      </aside>
    </>
  );
}

export default SideBar;
