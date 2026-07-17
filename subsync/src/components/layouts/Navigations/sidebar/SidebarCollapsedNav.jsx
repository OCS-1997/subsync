/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import SidebarItem from './SidebarItem.jsx';
import { flattenCollapsedItems } from './sidebarUtils.js';

/**
 * Icon-rail navigation for collapsed sidebar.
 * Skips folder/section chrome and lists every leaf item with tooltips
 * so users can see what each icon is without expanding the sidebar.
 */
export default function SidebarCollapsedNav({
  nodes,
  username,
  isActive,
  badgeCounts = {},
  onNavigate,
}) {
  const flatItems = useMemo(() => flattenCollapsedItems(nodes), [nodes]);

  if (!flatItems.length) return null;

  return (
    <nav aria-label="Collapsed navigation" className="flex flex-col gap-0.5">
      {flatItems.map((entry, index) => {
        const prev = flatItems[index - 1];
        const showDivider = Boolean(
          prev && prev.sectionKey !== entry.sectionKey
        );

        return (
          <div key={entry.node.id}>
            {showDivider && (
              <div
                className="mx-2 my-1.5 border-t border-sidebar-border"
                aria-hidden="true"
              />
            )}
            <SidebarItem
              node={entry.node}
              username={username}
              active={isActive(entry.node.path)}
              expanded={false}
              badgeCount={badgeCounts[entry.node.path] || 0}
              sectionLabel={entry.sectionLabel}
              onNavigate={onNavigate}
            />
          </div>
        );
      })}
    </nav>
  );
}
