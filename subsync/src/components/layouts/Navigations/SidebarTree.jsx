/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  Home,
  Pencil,
  Trash2,
  MoreVertical,
  Plus,
  Edit2,
  X,
  PlusCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils.js';
import { Badge } from '@/components/ui/badge.jsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';

const HOVER_TO_FOLDER_DELAY = 420;

function parseDropZoneId(id) {
  if (typeof id !== 'string') return null;
  if (id.startsWith('drop-before:')) return { kind: 'before', targetId: id.replace('drop-before:', '') };
  if (id.startsWith('drop-after:')) return { kind: 'after', targetId: id.replace('drop-after:', '') };
  return null;
}

function parseContainerId(id) {
  if (typeof id !== 'string') return null;
  if (id === 'container:root') return { kind: 'root' };
  if (id.startsWith('container:folder:')) return { kind: 'folder', folderId: id.replace('container:folder:', '') };
  return null;
}

function indexTree(nodes, map = new Map(), parentId = null) {
  nodes.forEach((node, index) => {
    map.set(node.id, { node, parentId, index });
    if (node.type === 'folder') indexTree(node.children, map, node.id);
  });
  return map;
}

function collectFolderIds(nodes, set = new Set()) {
  nodes.forEach((node) => {
    if (node.type === 'folder') {
      set.add(node.id);
      collectFolderIds(node.children, set);
    }
  });
  return set;
}

function folderContainsPath(node, path) {
  if (!path) return false;
  if (node.type === 'item') return node.path === path;
  return node.children.some((child) => folderContainsPath(child, path));
}

function SidebarIcon({ node, active = false }) {
  if (node.icon_type === 'material') {
    return <span className={`material-symbols-outlined text-[22px] ${active ? 'fill-1' : 'opacity-80'}`}>{node.icon}</span>;
  }
  return <Home size={22} className={active ? 'fill-white' : 'opacity-80'} />;
}

function DropLine({ id, data, isOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-2 right-2 rounded-full transition-all duration-150',
        isOpen ? 'h-2' : 'h-1.5',
        isOver ? 'bg-blue-500/70' : 'bg-transparent'
      )}
    />
  );
}

export default function SidebarTree({
  nodes,
  isOpen,
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
  const [collapsedFolderId, setCollapsedFolderId] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [folderNameDraft, setFolderNameDraft] = useState('');
  const [folderIntent, setFolderIntent] = useState(null);
  const [currentOverId, setCurrentOverId] = useState(null);

  const timerRef = useRef(null);
  const nodeMetaMap = useMemo(() => indexTree(nodes), [nodes]);
  const restoredSet = useMemo(() => new Set(restoredItemIds), [restoredItemIds]);
  const activePath = useMemo(() => {
    for (const node of nodeMetaMap.values()) {
      if (node.node.type === 'item' && isActive(node.node.path)) return node.node.path;
    }
    return null;
  }, [nodeMetaMap, isActive]);

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

  useEffect(() => {
    if (!activePath || !nodes.length || !isOpen) return;

    const folderIdsToExpand = [];
    const findParents = (list, path, parents = []) => {
      for (const node of list) {
        if (node.type === 'item' && node.path === path) return parents;
        if (node.type === 'folder') {
          const result = findParents(node.children, path, [...parents, node.id]);
          if (result) return result;
        }
      }
      return null;
    };

    const pathParents = findParents(nodes, activePath);
    if (pathParents && pathParents.length > 0) {
      setExpandedFolders((prev) => {
        let hasChanged = false;
        const next = { ...prev };
        pathParents.forEach((id) => {
          if (!next[id]) {
            next[id] = true;
            hasChanged = true;
          }
        });
        return hasChanged ? next : prev;
      });
    }
  }, [activePath, nodes, isOpen]);

  useEffect(() => {
    const valid = collectFolderIds(nodes);
    setExpandedFolders((prev) => {
      const next = {};
      Object.entries(prev).forEach(([id, val]) => { if (valid.has(id)) next[id] = val; });
      return next;
    });
    if (collapsedFolderId && !valid.has(collapsedFolderId)) setCollapsedFolderId(null);
    if (editingFolderId && !valid.has(editingFolderId)) {
      setEditingFolderId(null);
      setFolderNameDraft('');
    }
  }, [nodes, collapsedFolderId, editingFolderId]);

  const clearIntent = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setFolderIntent(null);
  }, []);

  const collisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args);
    return pointerHits.length ? pointerHits : closestCenter(args);
  }, []);

  const getDestination = useCallback((overId) => {
    const zone = parseDropZoneId(overId);
    if (zone) {
      const target = nodeMetaMap.get(zone.targetId);
      if (!target) return null;
      const index = target.index + (zone.kind === 'after' ? 1 : 0);
      return target.parentId ? { type: 'folder', folderId: target.parentId, index } : { type: 'root', index };
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
    if (target.node.type === 'folder') return { type: 'folder', folderId: target.node.id, index: target.node.children.length };
    return target.parentId ? { type: 'folder', folderId: target.parentId, index: target.index } : { type: 'root', index: target.index };
  }, [nodeMetaMap, nodes.length]);

  const onDragOver = useCallback(({ active, over }) => {
    const activeId = active ? String(active.id) : null;
    const overId = over ? String(over.id) : null;
    setCurrentOverId(overId);

    if (!activeId || !overId || overId.startsWith('drop-') || overId.startsWith('container:')) {
      clearIntent();
      return;
    }
    const activeMeta = nodeMetaMap.get(activeId);
    const overMeta = nodeMetaMap.get(overId);
    if (!activeMeta || !overMeta || activeMeta.node.type !== 'item' || overMeta.node.type !== 'item' || activeId === overId) {
      clearIntent();
      return;
    }
    if (folderIntent && folderIntent.sourceId === activeId && folderIntent.targetId === overId) return;

    clearIntent();
    setFolderIntent({ sourceId: activeId, targetId: overId, ready: false });
    timerRef.current = setTimeout(() => {
      setFolderIntent((prev) => (prev && prev.sourceId === activeId && prev.targetId === overId ? { ...prev, ready: true } : prev));
    }, HOVER_TO_FOLDER_DELAY);
  }, [clearIntent, folderIntent, nodeMetaMap]);

  const onDragEnd = useCallback(({ active, over }) => {
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
  }, [clearIntent, createFolderFromDrop, folderIntent, getDestination, move]);

  const renderFlyoutNodes = useCallback((list, depth = 0) => {
    return list.map((child) => {
      if (child.type === 'item') {
        return (
          <Link
            key={child.id}
            to={`/${username}/${child.path}`}
            onClick={() => {
              setCollapsedFolderId(null);
              if (window.innerWidth < 1024) toggleSidebar();
            }}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors ${isActive(child.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}
            style={{ paddingLeft: `${10 + depth * 12}px` }}
          >
            <SidebarIcon node={child} active={isActive(child.path)} />
            <span className="truncate">{child.title}</span>
          </Link>
        );
      }

      return (
        <div key={child.id} className="space-y-1">
          <div
            className="rounded-lg px-2.5 py-2 text-[11px] font-bold uppercase tracking-wide text-sidebar-foreground/75"
            style={{ paddingLeft: `${10 + depth * 12}px` }}
          >
            {child.name}
          </div>
          {renderFlyoutNodes(child.children, depth + 1)}
        </div>
      );
    });
  }, [isActive, toggleSidebar, username]);

  function NodeList({ list, parentId = null, depth = 0 }) {
    const containerId = parentId ? `container:folder:${parentId}` : 'container:root';
    const { setNodeRef, isOver } = useDroppable({ id: containerId });

    return (
      <ul ref={setNodeRef} className={`space-y-1 ${isOver ? 'rounded-lg ring-2 ring-blue-500/60 ring-offset-2 ring-offset-sidebar' : ''}`}>
        <SortableContext items={list.map((node) => node.id)} strategy={verticalListSortingStrategy}>
          {list.map((node) => <NodeRow key={node.id} node={node} parentId={parentId} depth={depth} />)}
        </SortableContext>
      </ul>
    );
  }

  function NodeRow({ node, depth }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 60 : 'auto', opacity: isDragging ? 0.5 : 1 };
    const indent = isOpen ? 8 + depth * 14 : 0;
    const showIntent = folderIntent?.targetId === node.id;
    const badgeCount = badgeCounts[node.path];

    const handle = (
      <div {...attributes} {...listeners} className={`flex h-7 w-7 items-center justify-center rounded-md ${isDragging ? 'cursor-grabbing bg-sidebar-accent/60' : 'cursor-grab hover:bg-sidebar-accent/40'}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}>
        <GripVertical size={14} className="opacity-70" />
      </div>
    );

    return (
      <motion.li ref={setNodeRef} style={style} className="relative list-none" layout initial={node.type === 'item' && restoredSet.has(node.id) ? { opacity: 0, scale: 0.92 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}>
        <DropLine id={`drop-before:${node.id}`} isOpen={isOpen} data={{}} />
        <div className="pt-1">
          {node.type === 'item' ? (
            <Link to={`/${username}/${node.path}`} onClick={() => window.innerWidth < 1024 && toggleSidebar()} className={`relative flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 ${isActive(node.path) ? 'bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'} ${showIntent ? 'ring-2 ring-blue-500/70' : ''}`} style={{ paddingLeft: `${indent}px` }}>
              {handle}
              <div className="flex h-8 w-8 items-center justify-center rounded-lg relative">
                <SidebarIcon node={node} active={isActive(node.path)} />
                {!isOpen && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg ring-1 ring-white/20">
                    {badgeCount}
                  </span>
                )}
              </div>
              {isOpen && <span className="truncate text-sm flex-1">{node.title}</span>}
              {isOpen && badgeCount > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] justify-center px-1 text-[10px] font-black border-none shadow-sm animate-pulse">
                  {badgeCount}
                </Badge>
              )}
              {showIntent && isOpen && <span className="ml-auto rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">{folderIntent?.ready ? 'Release to folder' : 'Hold to folder'}</span>}
            </Link>
          ) : (
            (() => {
              const row = (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => (isOpen ? setExpandedFolders((prev) => ({ ...prev, [node.id]: !prev[node.id] })) : setCollapsedFolderId((prev) => (prev === node.id ? null : node.id)))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (isOpen) {
                        setExpandedFolders((prev) => ({ ...prev, [node.id]: !prev[node.id] }));
                      } else {
                        setCollapsedFolderId((prev) => (prev === node.id ? null : node.id));
                      }
                    }
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl border bg-gradient-to-r px-2 py-1.5 text-left transition-all duration-200 ${node.color || 'from-slate-500/15 to-slate-500/5 border-slate-400/20'} ${folderContainsPath(node, activePath) ? 'text-sidebar-accent-foreground shadow-md ring-1 ring-sidebar-accent-foreground/30' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/40'} ${currentOverId === node.id ? 'ring-2 ring-blue-500/70' : ''}`}
                  style={{ paddingLeft: `${indent}px` }}
                >
                  {handle}
                  <div className={`flex h-8 items-center justify-between rounded-lg bg-sidebar-accent/5 px-2 py-1 ${isDragging ? 'opacity-50' : 'opacity-100'}`}>{isOpen && expandedFolders[node.id] ? <FolderOpen size={18} /> : <Folder size={18} />}</div>
                  {isOpen && (
                    <>
                      {editingFolderId === node.id ? (
                        <input autoFocus value={folderNameDraft} onChange={(event) => setFolderNameDraft(event.target.value)} onClick={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Enter') { event.preventDefault(); renameFolder(node.id, folderNameDraft); setEditingFolderId(null); setFolderNameDraft(''); } if (event.key === 'Escape') { event.preventDefault(); setEditingFolderId(null); setFolderNameDraft(''); } }} className="h-7 flex-1 rounded-md border border-sidebar-border bg-sidebar px-2 text-sm outline-none" />
                      ) : (
                        <span className="flex-1 truncate text-sm font-semibold">{node.name}</span>
                      )}
                      {editingFolderId === node.id ? (
                        <button type="button" className="rounded-md p-1 hover:bg-sidebar-accent/50" onClick={(event) => { event.stopPropagation(); renameFolder(node.id, folderNameDraft); setEditingFolderId(null); setFolderNameDraft(''); }}><Check size={14} /></button>
                      ) : (
                        <>
                          <button type="button" className="rounded-md p-1 hover:bg-sidebar-accent/50" onClick={(event) => { event.stopPropagation(); setEditingFolderId(node.id); setFolderNameDraft(node.name || 'New Folder'); }}><Pencil size={14} /></button>
                          <button type="button" className="rounded-md p-1 hover:bg-red-500/20 hover:text-red-600" onClick={(event) => { event.stopPropagation(); deleteFolder(node.id); }}><Trash2 size={14} /></button>
                          <ChevronRight size={16} className={`transition-transform ${expandedFolders[node.id] ? 'rotate-90' : 'rotate-0'}`} />
                        </>
                      )}
                    </>
                  )}
                </div>
              );

              if (!isOpen) {
                return (
                  <Popover open={collapsedFolderId === node.id} onOpenChange={(open) => setCollapsedFolderId(open ? node.id : null)}>
                    <PopoverTrigger asChild>{row}</PopoverTrigger>
                    <PopoverContent side="right" align="start" sideOffset={10} className="w-72 rounded-2xl border-sidebar-border bg-sidebar p-2 text-sidebar-foreground">
                      <div className="mb-2 border-b border-sidebar-border px-2 pb-2 text-xs font-black uppercase tracking-widest text-sidebar-foreground/70">{node.name}</div>
                      <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
                        {renderFlyoutNodes(node.children)}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              }

              return row;
            })()
          )}
        </div>
        <DropLine id={`drop-after:${node.id}`} isOpen={isOpen} data={{}} />
        <AnimatePresence initial={false}>
          {node.type === 'folder' && isOpen && expandedFolders[node.id] && (
            <motion.div layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="ml-2 mt-1 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/10 p-1">
              <NodeList list={node.children} parentId={node.id} depth={depth + 1} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>
    );
  }

  const activeNode = activeDragId ? nodeMetaMap.get(activeDragId)?.node : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => { setActiveDragId(String(active.id)); clearIntent(); }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => { setActiveDragId(null); setCurrentOverId(null); clearIntent(); }}
    >
      {isLoading && nodes.length === 0 ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <div key={i} className="mx-2 h-10 animate-pulse rounded-xl bg-sidebar-accent/20" />)}
        </div>
      ) : (
        <NodeList list={nodes} />
      )}

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
        {activeNode ? (
          <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar px-3 py-2 shadow-xl">
            {activeNode.type === 'folder' ? <Folder size={16} /> : <SidebarIcon node={activeNode} />}
            <span className="text-xs font-bold">{activeNode.type === 'folder' ? activeNode.name : activeNode.title}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
