/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils.js';
import SidebarIcon from './SidebarIcon.jsx';
import SidebarTooltip from './SidebarTooltip.jsx';

export default function SidebarItem({
  node,
  username,
  active,
  expanded,
  depth = 0,
  badgeCount = 0,
  sectionLabel,
  dragHandleProps,
  isDragging = false,
  showIntent = false,
  intentReady = false,
  onNavigate,
  className,
}) {
  const content = (
    <Link
      to={`/${username}/${node.path}`}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      aria-label={
        !expanded
          ? sectionLabel
            ? `${node.title}, ${sectionLabel}`
            : node.title
          : undefined
      }
      className={cn(
        'group/item relative flex w-full items-center gap-2.5 rounded-md outline-none',
        'transition-colors duration-200',
        'focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1',
        expanded ? 'px-2.5 py-2 pl-3' : 'justify-center px-2 py-2.5',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-medium'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70',
        showIntent && 'ring-2 ring-blue-500/50',
        isDragging && 'opacity-50',
        className
      )}
      style={expanded && depth > 0 ? { paddingLeft: `${10 + depth * 12}px` } : undefined}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          aria-hidden="true"
        />
      )}

      {expanded && dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          aria-label={`Reorder ${node.title}`}
          className={cn(
            'absolute -left-0.5 top-1/2 z-10 flex h-5 w-4 -translate-y-1/2 items-center justify-center rounded text-slate-300',
            'opacity-0 transition-opacity duration-150',
            'group-hover/item:opacity-100 focus-visible:opacity-100',
            'hover:bg-slate-200/80 hover:text-slate-500 cursor-grab active:cursor-grabbing',
            isDragging && 'opacity-100'
          )}
        >
          <GripVertical size={12} aria-hidden="true" />
        </button>
      )}

      <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        <SidebarIcon node={node} active={active} size={18} />
        {!expanded && badgeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>

      {expanded && (
        <>
          <span className="min-w-0 flex-1 truncate text-[13px] leading-none">{node.title}</span>
          {badgeCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto h-5 min-w-[20px] justify-center border-none px-1 text-[10px] font-semibold shadow-none"
            >
              {badgeCount}
            </Badge>
          )}
          {showIntent && (
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {intentReady ? 'Release to folder' : 'Hold to folder'}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (!expanded) {
    return (
      <SidebarTooltip label={node.title} section={sectionLabel}>
        {content}
      </SidebarTooltip>
    );
  }

  return content;
}
