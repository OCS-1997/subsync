/* eslint-disable react/prop-types */
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import SidebarTooltip from './SidebarTooltip.jsx';

export default function SidebarCollapseButton({ collapsed, onToggle, className }) {
  return (
    <SidebarTooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} disabled={!collapsed}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className={cn(
          'hidden lg:inline-flex h-8 w-8 shrink-0 rounded-md text-muted-foreground',
          'hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800',
          'transition-colors duration-200',
          className
        )}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </Button>
    </SidebarTooltip>
  );
}
