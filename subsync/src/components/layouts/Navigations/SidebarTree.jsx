/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';

import SidebarIcon from './sidebar/SidebarIcon.jsx';
import SidebarItem from './sidebar/SidebarItem.jsx';
import SidebarGroup from './sidebar/SidebarGroup.jsx';
import SidebarSection from './sidebar/SidebarSection.jsx';
import SidebarCollapsedNav from './sidebar/SidebarCollapsedNav.jsx';
import {
  collectFolderIds,
  findParentFolderIds,
  formatSectionLabel,
  indexTree,
  loadExpandedGroups,
  parseContainerId,
  parseDropZoneId,
  saveExpandedGroups,
} from './sidebar/sidebarUtils.js';

const HOVER_TO_FOLDER_DELAY = 420;

function DropLine({ id, expanded }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: {} });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-2 right-2 rounded-full transition-all duration-150',
        expanded ? 'h-1.5' : 'h-1',
        isOver ? 'bg-blue-500/70' : 'bg-transparent'
      )}
    />
  );
}

export default function SidebarTree({
  nodes,
  expanded,
  isLoading,
  username,
  isActive,
  toggleSidebar,
  restoredItemIds,
  clearRestoredHighlights,
  move,
  createFolderFromDrop,
  renameFolder,
  deleteFolder,
  badgeCounts = {},
}) {
  const [activeDragId, setActiveDragId] = useState(null);
  const [flyoutFolderId, setFlyoutFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(() => loadExpandedGroups() || {});
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [folderNameDraft, setFolderNameDraft] = useState('');
  const [folderIntent, setFolderIntent] = useState(null);
  const [currentOverId, setCurrentOverId] = useState(null);
  const [deleteFolderId, setDeleteFolderId] = useState(null);
  const [deleteFolderName, setDeleteFolderName] = useState('');
  const [hasHydratedExpansion, setHasHydratedExpansion] = useState(false);

  const timerRef = useRef(null);
  const nodeMetaMap = useMemo(() => indexTree(nodes), [nodes]);
  const restoredSet = useMemo(() => new Set(restoredItemIds), [restoredItemIds]);

  const activePath = useMemo(() => {
    for (const entry of nodeMetaMap.values()) {
      if (entry.node.type === 'item' && isActive(entry.node.path)) return entry.node.path;
    }
    return null;
  }, [nodeMetaMap, isActive]);

  const parentSectionByItemId = useMemo(() => {
    const map = new Map();
    const walk = (list, sectionLabel = null) => {
      list.forEach((node) => {
        if (node.type === 'item') {
          map.set(node.id, sectionLabel);
        } else if (node.type === 'folder') {
          walk(node.children, formatSectionLabel(node.name));
        }
      });
    };
    walk(nodes);
    return map;
  }, [nodes]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!restoredItemIds.length) return undefined;
    const id = setTimeout(() => clearRestoredHighlights(), 360);
    return () => clearTimeout(id);
  }, [restoredItemIds, clearRestoredHighlights]);

  // Seed defaults once nodes load (expand all on first visit)
  useEffect(() => {
    if (!nodes.length || hasHydratedExpansion) return;

    const stored = loadExpandedGroups();
    if (stored) {
      setExpandedFolders(stored);
    } else {
      const defaults = {};
      collectFolderIds(nodes).forEach((id) => {
        defaults[id] = true;
      });
      setExpandedFolders(defaults);
      saveExpandedGroups(defaults);
    }
    setHasHydratedExpansion(true);
  }, [nodes, hasHydratedExpansion]);

  // Auto-expand parents of the active route
  useEffect(() => {
    if (!activePath || !nodes.length || !expanded) return;

    const pathParents = findParentFolderIds(nodes, activePath);
    if (!pathParents?.length) return;

    setExpandedFolders((prev) => {
      let changed = false;
      const next = { ...prev };
      pathParents.forEach((id) => {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      });
      if (changed) saveExpandedGroups(next);
      return changed ? next : prev;
    });
  }, [activePath, nodes, expanded]);

  // Prune stale folder ids
  useEffect(() => {
    const valid = collectFolderIds(nodes);
    setExpandedFolders((prev) => {
      const next = {};
      let changed = false;
      Object.entries(prev).forEach(([id, val]) => {
        if (valid.has(id)) next[id] = val;
        else changed = true;
      });
      if (changed) saveExpandedGroups(next);
      return changed ? next : prev;
    });
    if (flyoutFolderId && !valid.has(flyoutFolderId)) setFlyoutFolderId(null);
    if (editingFolderId && !valid.has(editingFolderId)) {
      setEditingFolderId(null);
      setFolderNameDraft('');
    }
  }, [nodes, flyoutFolderId, editingFolderId]);

  // Close flyout when expanding sidebar
  useEffect(() => {
    if (expanded) setFlyoutFolderId(null);
  }, [expanded]);

  // ESC closes flyout
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && flyoutFolderId) {
        setFlyoutFolderId(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [flyoutFolderId]);

  const clearIntent = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setFolderIntent(null);
  }, []);

  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    return pointerHits.length ? pointerHits : closestCenter(args);
  }, []);

  const getDestination = useCallback(
    (overId) => {
      const zone = parseDropZoneId(overId);
      if (zone) {
        const target = nodeMetaMap.get(zone.targetId);
        if (!target) return null;
        const index = target.index + (zone.kind === 'after' ? 1 : 0);
        return target.parentId
          ? { type: 'folder', folderId: target.parentId, index }
          : { type: 'root', index };
      }

      const container = parseContainerId(overId);
      if (container?.kind === 'root') return { type: 'root', index: nodes.length };
      if (container?.kind === 'folder') {
        const target = nodeMetaMap.get(container.folderId);
        if (!target || target.node.type !== 'folder') return null;
        return { type: 'folder', folderId: container.folderId, index: target.node.children.length };
      }

      const target = nodeMetaMap.get(overId);
      if (!target) return null;
      if (target.node.type === 'folder') {
        return { type: 'folder', folderId: target.node.id, index: target.node.children.length };
      }
      return target.parentId
        ? { type: 'folder', folderId: target.parentId, index: target.index }
        : { type: 'root', index: target.index };
    },
    [nodeMetaMap, nodes.length]
  );

  const onDragOver = useCallback(
    ({ active, over }) => {
      const activeId = active ? String(active.id) : null;
      const overId = over ? String(over.id) : null;
      setCurrentOverId(overId);

      if (!activeId || !overId || overId.startsWith('drop-') || overId.startsWith('container:')) {
        clearIntent();
        return;
      }
      const activeMeta = nodeMetaMap.get(activeId);
      const overMeta = nodeMetaMap.get(overId);
      if (
        !activeMeta ||
        !overMeta ||
        activeMeta.node.type !== 'item' ||
        overMeta.node.type !== 'item' ||
        activeId === overId
      ) {
        clearIntent();
        return;
      }
      if (folderIntent && folderIntent.sourceId === activeId && folderIntent.targetId === overId) return;

      clearIntent();
      setFolderIntent({ sourceId: activeId, targetId: overId, ready: false });
      timerRef.current = setTimeout(() => {
        setFolderIntent((prev) =>
          prev && prev.sourceId === activeId && prev.targetId === overId
            ? { ...prev, ready: true }
            : prev
        );
      }, HOVER_TO_FOLDER_DELAY);
    },
    [clearIntent, folderIntent, nodeMetaMap]
  );

  const onDragEnd = useCallback(
    ({ active, over }) => {
      const activeId = active ? String(active.id) : null;
      const overId = over ? String(over.id) : null;
      setActiveDragId(null);
      setCurrentOverId(null);

      const intent = folderIntent;
      clearIntent();
      if (!activeId || !overId) return;
      if (intent?.ready && intent.sourceId === activeId && intent.targetId === overId) {
        createFolderFromDrop(activeId, overId);
        return;
      }
      if (activeId === overId) return;
      const destination = getDestination(overId);
      if (destination) move(activeId, destination);
    },
    [clearIntent, createFolderFromDrop, folderIntent, getDestination, move]
  );

  const toggleGroup = useCallback((folderId) => {
    setExpandedFolders((prev) => {
      const next = { ...prev, [folderId]: !prev[folderId] };
      saveExpandedGroups(next);
      return next;
    });
  }, []);

  const handleNavigate = useCallback(() => {
    if (window.innerWidth < 1024) toggleSidebar();
  }, [toggleSidebar]);

  function NodeList({ list, parentId = null, depth = 0 }) {
    const containerId = parentId ? `container:folder:${parentId}` : 'container:root';
    const { setNodeRef, isOver } = useDroppable({ id: containerId });

    return (
      <ul
        ref={setNodeRef}
        className={cn('space-y-0.5', isOver && 'rounded-md ring-2 ring-blue-500/30 ring-offset-1')}
      >
        <SortableContext items={list.map((node) => node.id)} strategy={verticalListSortingStrategy}>
          {list.map((node, index) => {
            const prev = list[index - 1];
            const showDivider =
              depth === 0 &&
              expanded &&
              prev?.type === 'item' &&
              node.type === 'folder';

            return (
              <NodeRow
                key={node.id}
                node={node}
                parentId={parentId}
                depth={depth}
                showDivider={showDivider}
              />
            );
          })}
        </SortableContext>
      </ul>
    );
  }

  function NodeRow({ node, depth, showDivider = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: node.id,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 60 : 'auto',
      opacity: isDragging ? 0.5 : 1,
    };
    const showIntent = folderIntent?.targetId === node.id;
    const badgeCount = badgeCounts[node.path] || 0;
    const dragHandleProps = { attributes, listeners };

    if (node.type === 'item') {
      return (
        <motion.li
          ref={setNodeRef}
          style={style}
          className="relative list-none"
          layout
          initial={restoredSet.has(node.id) ? { opacity: 0, scale: 0.96 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.18 }}
        >
          {showDivider && (
            <div className="mx-2 my-2 border-t border-sidebar-border" aria-hidden="true" />
          )}
          <DropLine id={`drop-before:${node.id}`} expanded={expanded} />
          <div className="py-0.5">
            <SidebarItem
              node={node}
              username={username}
              active={isActive(node.path)}
              expanded={expanded}
              depth={depth}
              badgeCount={badgeCount}
              sectionLabel={parentSectionByItemId.get(node.id)}
              dragHandleProps={dragHandleProps}
              isDragging={isDragging}
              showIntent={showIntent}
              intentReady={Boolean(folderIntent?.ready)}
              onNavigate={handleNavigate}
            />
          </div>
          <DropLine id={`drop-after:${node.id}`} expanded={expanded} />
        </motion.li>
      );
    }

    return (
      <motion.li
        ref={setNodeRef}
        style={style}
        className="relative list-none"
        layout
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        {showDivider && (
          <div className="mx-2 my-2 border-t border-sidebar-border" aria-hidden="true" />
        )}
        <DropLine id={`drop-before:${node.id}`} expanded={expanded} />
        <SidebarSection className="py-0.5">
          <SidebarGroup
            node={node}
            expanded={expanded}
            isGroupExpanded={Boolean(expandedFolders[node.id])}
            activePath={activePath}
            username={username}
            isActive={isActive}
            onToggle={() => toggleGroup(node.id)}
            onOpenFlyout={() => setFlyoutFolderId((prev) => (prev === node.id ? null : node.id))}
            flyoutOpen={flyoutFolderId === node.id}
            onFlyoutOpenChange={(open) => setFlyoutFolderId(open ? node.id : null)}
            onNavigate={handleNavigate}
            editing={editingFolderId === node.id}
            folderNameDraft={folderNameDraft}
            setFolderNameDraft={setFolderNameDraft}
            onStartRename={() => {
              setEditingFolderId(node.id);
              setFolderNameDraft(node.name || 'New Folder');
            }}
            onCommitRename={() => {
              renameFolder(node.id, folderNameDraft);
              setEditingFolderId(null);
              setFolderNameDraft('');
            }}
            onCancelRename={() => {
              setEditingFolderId(null);
              setFolderNameDraft('');
            }}
            onRequestDelete={() => {
              setDeleteFolderId(node.id);
              setDeleteFolderName(node.name || 'New Folder');
            }}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            isDropTarget={currentOverId === node.id}
          >
            <NodeList list={node.children} parentId={node.id} depth={depth + 1} />
          </SidebarGroup>
        </SidebarSection>
        <DropLine id={`drop-after:${node.id}`} expanded={expanded} />
      </motion.li>
    );
  }

  const activeNode = activeDragId ? nodeMetaMap.get(activeDragId)?.node : null;

  // Collapsed icon-rail: skip folders entirely — show every leaf item with tooltips
  if (!expanded) {
    return (
      <>
        {isLoading && nodes.length === 0 ? (
          <div className="space-y-2 px-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="mx-auto h-9 w-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
            ))}
          </div>
        ) : (
          <SidebarCollapsedNav
            nodes={nodes}
            username={username}
            isActive={isActive}
            badgeCounts={badgeCounts}
            onNavigate={handleNavigate}
          />
        )}
      </>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => {
        setActiveDragId(String(active.id));
        clearIntent();
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveDragId(null);
        setCurrentOverId(null);
        clearIntent();
      }}
    >
      {isLoading && nodes.length === 0 ? (
        <div className="space-y-2 px-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/60" />
          ))}
        </div>
      ) : (
        <nav aria-label="Main navigation">
          <NodeList list={nodes} />
        </nav>
      )}

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {activeNode
          ? createPortal(
              <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-white px-3 py-2 shadow-xl dark:bg-sidebar">
                <SidebarIcon node={activeNode} size={16} />
                <span className="text-xs font-medium">
                  {activeNode.type === 'folder'
                    ? formatSectionLabel(activeNode.name)
                    : activeNode.title}
                </span>
              </div>,
              document.body
            )
          : null}
      </DragOverlay>

      <AlertDialog open={deleteFolderId !== null} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <AlertDialogContent className="z-[80] max-w-sm rounded-xl border border-sidebar-border bg-white p-6 text-foreground shadow-2xl dark:bg-sidebar">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold tracking-tight text-red-500">
              Delete section
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-sm text-muted-foreground">
              Delete <span className="font-semibold text-foreground">&quot;{deleteFolderName}&quot;</span>?
              Items inside will return to the main list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <AlertDialogCancel className="mt-0 rounded-lg border border-sidebar-border px-4 py-2 text-xs font-semibold transition-colors hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteFolderId) {
                  deleteFolder(deleteFolderId);
                  setDeleteFolderId(null);
                  setDeleteFolderName('');
                }
              }}
              className="rounded-lg border-none bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}
