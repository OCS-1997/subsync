/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils.js';
import { formatSectionLabel } from './sidebarUtils.js';
import SidebarIcon from './SidebarIcon.jsx';

export default function SidebarFlyout({
  node,
  username,
  isActive,
  onNavigate,
  onClose,
}) {
  const renderNodes = (list, depth = 0) =>
    list.map((child) => {
      if (child.type === 'item') {
        const active = isActive(child.path);
        return (
          <Link
            key={child.id}
            to={`/${username}/${child.path}`}
            onClick={() => {
              onNavigate?.();
              onClose?.();
            }}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors duration-150',
              active
                ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            style={{ paddingLeft: `${10 + depth * 12}px` }}
          >
            {active && (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-500"
                aria-hidden="true"
              />
            )}
            <SidebarIcon node={child} active={active} size={16} />
            <span className="truncate">{child.title}</span>
          </Link>
        );
      }

      return (
        <div key={child.id} className="space-y-0.5">
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400"
            style={{ paddingLeft: `${10 + depth * 12}px` }}
          >
            <SidebarIcon node={child} expanded={false} size={14} />
            <span className="truncate">{formatSectionLabel(child.name)}</span>
          </div>
          {renderNodes(child.children, depth + 1)}
        </div>
      );
    });

  return (
    <div
      role="menu"
      aria-label={formatSectionLabel(node.name)}
      className="w-64 rounded-lg border border-sidebar-border bg-white p-2 text-sidebar-foreground shadow-xl dark:bg-sidebar"
    >
      <div className="mb-1.5 border-b border-sidebar-border px-2.5 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {formatSectionLabel(node.name)}
      </div>
      <div className="max-h-[360px] space-y-0.5 overflow-y-auto pr-0.5">{renderNodes(node.children)}</div>
    </div>
  );
}
