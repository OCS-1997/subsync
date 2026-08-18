export const SIDEBAR_EXPANDED_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const SIDEBAR_TRANSITION_MS = 250;

export const STORAGE_KEYS = {
  collapsed: 'sidebar_desktop_collapsed',
  expandedGroups: 'sidebar_expanded_groups',
};

const SECTION_LABELS = {
  'MY WORK': 'MY WORK',
  'MARKETING': 'MARKETING',
  'CUSTOMER': 'CUSTOMER',
  'SERVICES': 'SERVICES',
  'HR': 'HR',
  'ADMIN': 'ADMIN',
  'Operations Module': 'MY WORK',
  'CRM Module': 'CUSTOMER',
  'Self Service': 'HR',
  Administration: 'ADMIN',
};

export function formatSectionLabel(name = '') {
  if (SECTION_LABELS[name]) return SECTION_LABELS[name];
  return String(name)
    .replace(/\s*Module$/i, '')
    .trim()
    .toUpperCase();
}

export function parseDropZoneId(id) {
  if (typeof id !== 'string') return null;
  if (id.startsWith('drop-before:')) return { kind: 'before', targetId: id.replace('drop-before:', '') };
  if (id.startsWith('drop-after:')) return { kind: 'after', targetId: id.replace('drop-after:', '') };
  return null;
}

export function parseContainerId(id) {
  if (typeof id !== 'string') return null;
  if (id === 'container:root') return { kind: 'root' };
  if (id.startsWith('container:folder:')) return { kind: 'folder', folderId: id.replace('container:folder:', '') };
  return null;
}

export function indexTree(nodes, map = new Map(), parentId = null) {
  nodes.forEach((node, index) => {
    map.set(node.id, { node, parentId, index });
    if (node.type === 'folder') indexTree(node.children, map, node.id);
  });
  return map;
}

export function collectFolderIds(nodes, set = new Set()) {
  nodes.forEach((node) => {
    if (node.type === 'folder') {
      set.add(node.id);
      collectFolderIds(node.children, set);
    }
  });
  return set;
}

export function folderContainsPath(node, path) {
  if (!path) return false;
  if (node.type === 'item') return node.path === path;
  return node.children.some((child) => folderContainsPath(child, path));
}

export function findParentFolderIds(nodes, path, parents = []) {
  for (const node of nodes) {
    if (node.type === 'item' && node.path === path) return parents;
    if (node.type === 'folder') {
      const result = findParentFolderIds(node.children, path, [...parents, node.id]);
      if (result) return result;
    }
  }
  return null;
}

/**
 * Flatten the tree for collapsed (icon-rail) mode.
 * Folders are skipped — every leaf item is shown with its section label.
 */
export function flattenCollapsedItems(nodes, sectionLabel = null, result = []) {
  nodes.forEach((node) => {
    if (node.type === 'item') {
      result.push({
        node,
        sectionLabel,
        sectionKey: sectionLabel || '__root__',
      });
      return;
    }

    if (node.type === 'folder') {
      flattenCollapsedItems(node.children, formatSectionLabel(node.name), result);
    }
  });
  return result;
}

export function loadExpandedGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.expandedGroups);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveExpandedGroups(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.expandedGroups, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function loadCollapsedPreference() {
  try {
    return localStorage.getItem(STORAGE_KEYS.collapsed) === 'true';
  } catch {
    return false;
  }
}

export function saveCollapsedPreference(collapsed) {
  try {
    localStorage.setItem(STORAGE_KEYS.collapsed, String(Boolean(collapsed)));
  } catch {
    // ignore
  }
}
