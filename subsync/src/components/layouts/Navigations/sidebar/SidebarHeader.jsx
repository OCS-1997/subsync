/* eslint-disable react/prop-types */
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import SidebarTooltip from './SidebarTooltip.jsx';

export default function SidebarHeader({
  expanded,
  onToggleDesktop,
  onCloseMobile,
  appName = 'OCS',
  subtitle = 'CRM Platform',
}) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center border-b border-sidebar-border',
        'transition-all duration-[250ms] ease-in-out',
        expanded ? 'h-[72px] gap-2 px-4' : 'h-16 justify-center px-2'
      )}
    >
      <div className={cn('flex min-w-0 items-center gap-3', expanded ? 'flex-1' : '')}>
        <SidebarTooltip label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
          <button
            type="button"
            onClick={onToggleDesktop}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
              'text-slate-600 dark:text-slate-300 transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40'
            )}
          >
            <Menu className="h-5 w-5" />
          </button>
        </SidebarTooltip>

        {expanded && (
          <div className="min-w-0 flex-1 animate-in fade-in-0 duration-200">
            <div className="truncate text-[15px] font-semibold leading-tight tracking-tight text-foreground">
              {appName}
            </div>
            <div className="mt-0.5 truncate text-[11px] font-medium leading-tight text-muted-foreground">
              {subtitle}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-slate-100 hover:text-foreground lg:hidden dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
