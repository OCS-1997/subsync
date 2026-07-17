/* eslint-disable react/prop-types */
import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { cn } from '@/lib/utils.js';
import { formatSectionLabel, folderContainsPath } from './sidebarUtils.js';
import SidebarIcon from './SidebarIcon.jsx';
import SidebarTooltip from './SidebarTooltip.jsx';
import SidebarFlyout from './SidebarFlyout.jsx';

export default function SidebarGroup({
  node,
  expanded,
  isGroupExpanded,
  activePath,
  username,
  isActive,
  onToggle,
  onOpenFlyout,
  flyoutOpen,
  onFlyoutOpenChange,
  onNavigate,
  editing,
  folderNameDraft,
  setFolderNameDraft,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRequestDelete,
  dragHandleProps,
  isDragging = false,
  isDropTarget = false,
  children,
}) {
  const inputRef = useRef(null);
  const cancelledRef = useRef(false);
  const hasActiveChild = folderContainsPath(node, activePath);
  const label = formatSectionLabel(node.name);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (expanded) onToggle();
      else onOpenFlyout();
    }
    if (event.key === 'ArrowRight' && expanded && !isGroupExpanded) {
      event.preventDefault();
      onToggle();
    }
    if (event.key === 'ArrowLeft' && expanded && isGroupExpanded) {
      event.preventDefault();
      onToggle();
    }
    if (event.key === 'Escape' && flyoutOpen) {
      event.preventDefault();
      onFlyoutOpenChange(false);
    }
  };

  const headerButton = (
    <button
      type="button"
      onClick={() => (expanded ? onToggle() : onOpenFlyout())}
      onKeyDown={handleKeyDown}
      aria-expanded={expanded ? isGroupExpanded : flyoutOpen}
      aria-label={`${label} section`}
      className={cn(
        'group/section relative flex w-full items-center gap-2 rounded-md outline-none',
        'transition-colors duration-200',
        'focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1',
        expanded ? 'px-2 py-2 pl-3' : 'justify-center px-2 py-2.5',
        hasActiveChild && !expanded
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/70',
        isDropTarget && 'ring-2 ring-blue-500/40',
        isDragging && 'opacity-50'
      )}
    >
      {expanded && dragHandleProps && (
        <span
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className={cn(
            'absolute -left-0.5 top-1/2 z-10 flex h-5 w-4 -translate-y-1/2 items-center justify-center rounded text-slate-300',
            'opacity-0 transition-opacity duration-150 cursor-grab active:cursor-grabbing',
            'group-hover/section:opacity-100 focus-visible:opacity-100',
            'hover:bg-slate-200/80 hover:text-slate-500',
            isDragging && 'opacity-100'
          )}
        >
          <GripVertical size={12} aria-hidden="true" />
        </span>
      )}

      <SidebarIcon
        node={node}
        active={hasActiveChild && !expanded}
        expanded={expanded && isGroupExpanded}
        size={18}
      />

      {expanded && (
        <>
          {editing ? (
            <input
              ref={inputRef}
              value={folderNameDraft}
              aria-label="Rename section"
              onChange={(event) => setFolderNameDraft(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onBlur={() => {
                if (!cancelledRef.current) onCommitRename();
                cancelledRef.current = false;
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onCommitRename();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  cancelledRef.current = true;
                  onCancelRename();
                }
              }}
              className="h-7 min-w-0 flex-1 rounded-md border border-sidebar-border bg-background px-2 text-xs font-semibold uppercase tracking-wider outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          ) : (
            <span className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {label}
            </span>
          )}

          {editing ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded p-1 hover:bg-slate-200/80"
              onClick={(event) => {
                event.stopPropagation();
                onCommitRename();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.stopPropagation();
                  onCommitRename();
                }
              }}
            >
              <Check size={14} />
            </span>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Section options for ${label}`}
                    className={cn(
                      'rounded p-1 text-slate-300 opacity-0 transition-opacity',
                      'group-hover/section:opacity-100 focus-visible:opacity-100',
                      'hover:bg-slate-200/80 hover:text-slate-600'
                    )}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <MoreVertical size={14} aria-hidden="true" />
                  </span>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  sideOffset={4}
                  className="z-[70] w-32 rounded-lg border border-sidebar-border bg-white p-1 shadow-lg dark:bg-sidebar"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={(event) => {
                      event.stopPropagation();
                      onStartRename();
                    }}
                  >
                    <Pencil size={12} />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      onRequestDelete();
                    }}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </PopoverContent>
              </Popover>

              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cn(
                  'shrink-0 text-slate-400 transition-transform duration-200',
                  isGroupExpanded ? 'rotate-0' : '-rotate-90'
                )}
              />
            </>
          )}
        </>
      )}
    </button>
  );

  return (
    <div className="w-full">
      {!expanded ? (
        <Popover open={flyoutOpen} onOpenChange={onFlyoutOpenChange}>
          <SidebarTooltip label={label}>
            <PopoverTrigger asChild>{headerButton}</PopoverTrigger>
          </SidebarTooltip>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={12}
            className="z-[70] border-0 bg-transparent p-0 shadow-none"
            onEscapeKeyDown={() => onFlyoutOpenChange(false)}
            onInteractOutside={() => onFlyoutOpenChange(false)}
          >
            <SidebarFlyout
              node={node}
              username={username}
              isActive={isActive}
              onNavigate={onNavigate}
              onClose={() => onFlyoutOpenChange(false)}
            />
          </PopoverContent>
        </Popover>
      ) : (
        headerButton
      )}

      <AnimatePresence initial={false}>
        {expanded && isGroupExpanded && (
          <motion.div
            key={`${node.id}-children`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 space-y-0.5 pl-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
