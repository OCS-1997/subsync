/* eslint-disable react/prop-types */
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip.jsx';
import { cn } from '@/lib/utils.js';

export default function SidebarTooltip({
  label,
  section,
  disabled = false,
  side = 'right',
  children,
  className,
}) {
  if (disabled || !label) return children;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={12}
        className={cn(
          'z-[80] max-w-[220px] border border-slate-700 bg-slate-900 px-3 py-2 text-white shadow-lg',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          className
        )}
      >
        <div className="flex flex-col gap-0.5">
          {section && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {section}
            </span>
          )}
          <span className="text-[13px] font-medium leading-snug">{label}</span>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
