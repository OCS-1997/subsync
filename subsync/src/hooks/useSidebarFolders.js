import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/lib/axiosInstance.js';

const PREF_KEY = 'sidebar_folders_v3';
const LEGACY_PREF_KEY = 'sidebar_order';
const FOLDER_NAME = 'New Folder';

const FOLDER_COLORS = [
  'from-indigo-500/20 to-blue-500/10 border-indigo-300/30',
  'from-emerald-500/20 to-green-500/10 border-emerald-300/30',
  'from-rose-500/20 to-pink-500/10 border-rose-300/30',
  'from-amber-500/20 to-yellow-500/10 border-amber-300/30',
  'from-cyan-500/20 to-sky-500/10 border-cyan-300/30',
  'from-violet-500/20 to-purple-500/10 border-violet-300/30',
  'from-orange-500/20 to-red-500/10 border-orange-300/30',
];

function buildId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createItemNode(item) {
  return {
    type: 'item',
    id: item.path,
    ...item,
  };
}

function createFolderNode(children = [], name = FOLDER_NAME, color = null, icon = null) {
  return {
    type: 'folder',
    id: buildId('folder'),
    name,
    color,
    icon,
    children,
  };
}

function normalizeChildren(children, defaultByPath, visitedPaths) {
  if (!Array.isArray(children)) return [];

  const normalized = [];
  children.forEach((child) => {
    const normalizedNode = normalizeNode(child, defaultByPath, visitedPaths);
    if (normalizedNode) normalized.push(normalizedNode);
  });
  return normalized;
}

function normalizeNode(node, defaultByPath, visitedPaths) {
  if (!node || typeof node !== 'object') return null;

  if (node.type === 'folder') {
    const children = normalizeChildren(node.children, defaultByPath, visitedPaths);
    if (children.length === 0) return null;

    return {
      type: 'folder',
      id: node.id || buildId('folder'),
      name: typeof node.name === 'string' && node.name.trim() ? node.name.trim() : FOLDER_NAME,
      color: node.color || null,
      children,
    };
  }

  const path = node.path;
  if (!path || !defaultByPath.has(path) || visitedPaths.has(path)) return null;

  visitedPaths.add(path);
  const base = defaultByPath.get(path);
  return createItemNode(base);
}

function mergeWithDefaults(defaultItems, structure) {
  const defaultByPath = new Map(defaultItems.map((item) => [item.path, item]));
  const visitedPaths = new Set();

  const normalized = Array.isArray(structure)
    ? structure
        .map((node) => normalizeNode(node, defaultByPath, visitedPaths))
        .filter(Boolean)
    : [];

  defaultItems.forEach((item) => {
    if (!visitedPaths.has(item.path)) {
      normalized.push(createItemNode(item));
      visitedPaths.add(item.path);
    }
  });

  return normalized;
}

function serializeNode(node) {
  if (node.type === 'folder') {
    return {
      type: 'folder',
      id: node.id,
      name: node.name,
      color: node.color || null,
      icon: node.icon || null,
      children: node.children.map(serializeNode),
    };
  }

  return {
    type: 'item',
    id: node.id,
    path: node.path,
  };
}

function serializeNodes(nodes) {
  return nodes.map(serializeNode);
}

function updateNodeById(nodes, targetId, updater) {
  let changed = false;

  const next = nodes
    .map((node) => {
      if (node.id === targetId) {
        const updated = updater(node);
        changed = changed || updated !== node;
        return updated;
      }

      if (node.type !== 'folder') return node;

      const updatedChildren = updateNodeById(node.children, targetId, updater);
      if (updatedChildren !== node.children) {
        changed = true;
        return { ...node, children: updatedChildren };
      }
      return node;
    })
    .filter(Boolean);

  return changed ? next : nodes;
}

function removeNodeById(nodes, targetId) {
  let removed = null;

  const recurse = (list, parentId = null, parentChildren = null, rootIndex = null) => {
    const next = [];

    for (let i = 0; i < list.length; i += 1) {
      const node = list[i];
      const currentRootIndex = rootIndex == null ? i : rootIndex;
      if (node.id === targetId) {
        removed = {
          node,
          parentId,
          index: i,
          rootIndex: currentRootIndex,
          siblingsBeforeRemoval: list,
          parentChildren,
        };
        continue;
      }

      if (node.type === 'folder') {
        const childrenResult = recurse(node.children, node.id, node.children, currentRootIndex);
        if (childrenResult !== node.children) {
          next.push({ ...node, children: childrenResult });
        } else {
          next.push(node);
        }
      } else {
        next.push(node);
      }
    }

    return next;
  };

  const nextNodes = recurse(nodes, null, nodes);
  return { nextNodes, removed };
}

function getNodeById(nodes, targetId) {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.type === 'folder') {
      const found = getNodeById(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function isDescendant(nodes, ancestorId, maybeChildId) {
  const ancestor = getNodeById(nodes, ancestorId);
  if (!ancestor || ancestor.type !== 'folder') return false;

  const walk = (children) => {
    for (const child of children) {
      if (child.id === maybeChildId) return true;
      if (child.type === 'folder' && walk(child.children)) return true;
    }
    return false;
  };

  return walk(ancestor.children);
}

function flattenItemDescendants(node) {
  if (node.type === 'item') return [node];

  const items = [];
  node.children.forEach((child) => {
    items.push(...flattenItemDescendants(child));
  });
  return items;
}

function normalizeFolders(nodes) {
  const normalized = [];

  nodes.forEach((node) => {
    if (node.type !== 'folder') {
      normalized.push(node);
      return;
    }

    const children = normalizeFolders(node.children);

    if (children.length === 0) {
      return;
    }

    if (children.length === 1) {
      normalized.push(children[0]);
      return;
    }

    normalized.push({ ...node, children });
  });

  return normalized;
}

function insertNodeAtRoot(nodes, node, index = nodes.length) {
  const safeIndex = Math.max(0, Math.min(index, nodes.length));
  const next = [...nodes];
  next.splice(safeIndex, 0, node);
  return next;
}

function insertIntoFolder(nodes, folderId, node, index = null) {
  return updateNodeById(nodes, folderId, (folder) => {
    if (!folder || folder.type !== 'folder') return folder;

    const children = [...folder.children];
    const safeIndex = index == null ? children.length : Math.max(0, Math.min(index, children.length));
    children.splice(safeIndex, 0, node);
    return { ...folder, children };
  });
}

function moveNode(nodes, sourceId, destination) {
  const sourceNodeBeforeRemoval = getNodeById(nodes, sourceId);
  if (!sourceNodeBeforeRemoval) return nodes;

  if (
    sourceNodeBeforeRemoval.type === 'folder' &&
    destination.type === 'folder' &&
    isDescendant(nodes, sourceId, destination.folderId)
  ) {
    return nodes;
  }

  const { nextNodes: withoutSource, removed } = removeNodeById(nodes, sourceId);
  if (!removed) return nodes;

  const sourceNode = removed.node;

  if (destination.type === 'root') {
    let insertIndex = destination.index;
    if (removed.parentId == null && insertIndex > removed.index) {
      insertIndex -= 1;
    }
    const inserted = insertNodeAtRoot(withoutSource, sourceNode, insertIndex);
    return normalizeFolders(inserted);
  }

  if (destination.type === 'folder') {
    if (sourceNode.id === destination.folderId) return nodes;
    let insertIndex = destination.index;
    if (removed.parentId === destination.folderId && insertIndex > removed.index) {
      insertIndex -= 1;
    }
    const inserted = insertIntoFolder(withoutSource, destination.folderId, sourceNode, insertIndex);
    return normalizeFolders(inserted);
  }

  return nodes;
}

function getFolderColor(existingFoldersCount) {
  const color = FOLDER_COLORS[existingFoldersCount % FOLDER_COLORS.length];
  return color;
}

function countFolders(nodes) {
  let count = 0;
  const walk = (list) => {
    list.forEach((node) => {
      if (node.type === 'folder') {
        count += 1;
        walk(node.children);
      }
    });
  };
  walk(nodes);
  return count;
}

function createFolderFromItems(nodes, sourceId, targetId) {
  if (sourceId === targetId) return nodes;

  const sourceNode = getNodeById(nodes, sourceId);
  const targetNode = getNodeById(nodes, targetId);
  if (!sourceNode || !targetNode) return nodes;
  if (sourceNode.type !== 'item' || targetNode.type !== 'item') return nodes;

  const sourceRemoval = removeNodeById(nodes, sourceId);
  if (!sourceRemoval.removed) return nodes;

  const targetRemoval = removeNodeById(sourceRemoval.nextNodes, targetId);
  if (!targetRemoval.removed) return nodes;

  const { removed: targetMeta, nextNodes: withoutBoth } = targetRemoval;
  const parentId = targetMeta.parentId;

  const folder = createFolderNode(
    [targetMeta.node, sourceRemoval.removed.node],
    FOLDER_NAME,
    getFolderColor(countFolders(nodes))
  );

  let next;
  if (parentId) {
    next = insertIntoFolder(withoutBoth, parentId, folder, targetMeta.index);
  } else {
    next = insertNodeAtRoot(withoutBoth, folder, targetMeta.index);
  }

  return normalizeFolders(next);
}

function deleteFolderAndRestoreItems(nodes, folderId) {
  const removal = removeNodeById(nodes, folderId);
  if (!removal.removed || removal.removed.node.type !== 'folder') {
    return { nodes, restoredIds: [] };
  }

  const folder = removal.removed.node;
  const flattenedItems = flattenItemDescendants(folder).map((item) => ({ ...item }));

  let withRestored = removal.nextNodes;

  if (removal.removed.parentId) {
    const parentId = removal.removed.parentId;
    const insertionIndex = removal.removed.index;
    withRestored = updateNodeById(withRestored, parentId, (node) => {
      if (!node || node.type !== 'folder') return node;
      const children = [...node.children];
      const safeIndex = Math.max(0, Math.min(insertionIndex, children.length));
      children.splice(safeIndex, 0, ...flattenedItems);
      return { ...node, children };
    });
  } else {
    const insertionIndex = Math.max(
      0,
      Math.min(removal.removed.rootIndex ?? removal.removed.index, withRestored.length)
    );
    withRestored = [...withRestored];
    withRestored.splice(insertionIndex, 0, ...flattenedItems);
  }

  return {
    nodes: normalizeFolders(withRestored),
    restoredIds: flattenedItems.map((item) => item.id),
  };
}

function parseMaybeJson(value) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function getLegacyCacheKey(username) {
  return `pref_order_${username}_${LEGACY_PREF_KEY}`;
}

function getFolderCacheKey(username) {
  return `pref_order_${username}_${PREF_KEY}`;
}

function fromLegacyOrder(defaultItems, legacyOrder) {
  if (!Array.isArray(legacyOrder)) {
    return defaultItems.map(createItemNode);
  }

  const byPath = new Map(defaultItems.map((item) => [item.path, item]));
  const used = new Set();
  const ordered = [];

  legacyOrder.forEach((path) => {
    if (typeof path === 'string' && byPath.has(path) && !used.has(path)) {
      ordered.push(createItemNode(byPath.get(path)));
      used.add(path);
    }
  });

  defaultItems.forEach((item) => {
    if (!used.has(item.path)) {
      ordered.push(createItemNode(item));
      used.add(item.path);
    }
  });

  return ordered;
}

function groupByFolder(items) {
  const root = [];
  const folderMap = new Map();
  let folderCount = 0;

  const folderIcons = {
    'CRM Module': 'users',
    'Operations Module': 'zap',
    'Self Service': 'target',
    'Administration': 'settings',
  };

  items.forEach((item) => {
    if (item.folder) {
      if (!folderMap.has(item.folder)) {
        const folder = createFolderNode(
          [],
          item.folder,
          getFolderColor(folderCount),
          folderIcons[item.folder] || null
        );
        folderMap.set(item.folder, folder);
        root.push(folder);
        folderCount += 1;
      }
      folderMap.get(item.folder).children.push(createItemNode(item));
    } else {
      root.push(createItemNode(item));
    }
  });

  return root;
}

export function useSidebarFolders(defaultItems, filterFn) {
  const { username } = useParams();

  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoredItemIds, setRestoredItemIds] = useState([]);

  const filteredDefaults = useMemo(
    () => (filterFn ? defaultItems.filter(filterFn) : defaultItems),
    [defaultItems, filterFn]
  );

  const persistToCacheAndBackend = useCallback((nextNodes) => {
    if (!username) return;

    const structure = serializeNodes(nextNodes);
    const cacheKey = getFolderCacheKey(username);
    localStorage.setItem(cacheKey, JSON.stringify(structure));

    api.put(`/preferences/${username}/${PREF_KEY}`, { value: structure })
      .catch((err) => console.error('sidebar folders save error:', err));
  }, [username]);

  const setAuthoritativeNodes = useCallback((updater) => {
    setNodes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (next === prev) return prev;

      persistToCacheAndBackend(next);
      return next;
    });
  }, [persistToCacheAndBackend]);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    setIsLoading(true);

    const folderCacheKey = getFolderCacheKey(username);
    const legacyCacheKey = getLegacyCacheKey(username);

    const seedFromLocal = () => {
      const folderCached = parseMaybeJson(localStorage.getItem(folderCacheKey));
      if (Array.isArray(folderCached)) {
        return mergeWithDefaults(filteredDefaults, folderCached);
      }

      const legacyCached = parseMaybeJson(localStorage.getItem(legacyCacheKey));
      if (Array.isArray(legacyCached)) {
        const migrated = fromLegacyOrder(filteredDefaults, legacyCached);
        localStorage.setItem(folderCacheKey, JSON.stringify(serializeNodes(migrated)));
        return migrated;
      }

      return groupByFolder(filteredDefaults);
    };

    setNodes(seedFromLocal());

    const load = async () => {
      try {
        const folderRes = await api.get(`/preferences/${username}/${PREF_KEY}`);
        const value = parseMaybeJson(folderRes?.data?.value);

        if (Array.isArray(value)) {
          if (!cancelled) {
            const merged = mergeWithDefaults(filteredDefaults, value);
            setNodes(merged);
            localStorage.setItem(folderCacheKey, JSON.stringify(serializeNodes(merged)));
          }
          return;
        }

        const legacyRes = await api.get(`/preferences/${username}/${LEGACY_PREF_KEY}`);
        const legacyValue = parseMaybeJson(legacyRes?.data?.value);

        if (Array.isArray(legacyValue) && !cancelled) {
          const migrated = fromLegacyOrder(filteredDefaults, legacyValue);
          setNodes(migrated);
          const serialized = serializeNodes(migrated);
          localStorage.setItem(folderCacheKey, JSON.stringify(serialized));

          api.put(`/preferences/${username}/${PREF_KEY}`, { value: serialized })
            .catch((err) => console.error('sidebar folders migration save error:', err));
        }
      } catch {
        // Ignore network sync failures and keep local state.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [username, filteredDefaults]);

  const move = useCallback((sourceId, destination) => {
    setRestoredItemIds([]);
    setAuthoritativeNodes((prev) => {
      const next = moveNode(prev, sourceId, destination);
      return next;
    });
  }, [setAuthoritativeNodes]);

  const reorderRoot = useCallback((newRootNodes) => {
    setRestoredItemIds([]);
    setAuthoritativeNodes(normalizeFolders(newRootNodes));
  }, [setAuthoritativeNodes]);

  const createFolderFromDrop = useCallback((sourceId, targetId) => {
    setRestoredItemIds([]);
    setAuthoritativeNodes((prev) => createFolderFromItems(prev, sourceId, targetId));
  }, [setAuthoritativeNodes]);

  const renameFolder = useCallback((folderId, name) => {
    const nextName = (name || '').trim() || FOLDER_NAME;
    setRestoredItemIds([]);
    setAuthoritativeNodes((prev) => updateNodeById(prev, folderId, (node) => {
      if (!node || node.type !== 'folder') return node;
      if (node.name === nextName) return node;
      return { ...node, name: nextName };
    }));
  }, [setAuthoritativeNodes]);

  const deleteFolder = useCallback((folderId) => {
    setAuthoritativeNodes((prev) => {
      const result = deleteFolderAndRestoreItems(prev, folderId);
      setRestoredItemIds(result.restoredIds);
      return result.nodes;
    });
  }, [setAuthoritativeNodes]);

  const clearRestoredHighlights = useCallback(() => {
    setRestoredItemIds([]);
  }, []);

  return {
    nodes,
    isLoading,
    restoredItemIds,
    clearRestoredHighlights,
    move,
    reorderRoot,
    createFolderFromDrop,
    renameFolder,
    deleteFolder,
    serializeNodes,
  };
}
