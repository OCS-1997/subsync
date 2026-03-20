/**
 * Release Guide Service
 * =====================
 * Handles all business logic for the patch-scoped guide system.
 * Pure JS — no React dependency.
 *
 * Data model:
 *   ReleaseGuide = {
 *     id: string,           // unique key — "1.0.0-sidebar-folders"
 *     version: string,      // must match __APP_VERSION__
 *     title: string,
 *     description?: string,
 *     autoShow?: boolean,   // default true
 *     steps: Array<{
 *       id: string,
 *       title?: string,
 *       body: string,
 *       target?: string,    // CSS selector (future use)
 *       placement?: 'top'|'bottom'|'left'|'right'|'center',
 *     }>,
 *   }
 */

import { RELEASE_GUIDES } from './releaseGuides';

const STORAGE_KEY = 'subsync_dismissed_guides';

// ─── Version Resolution ───────────────────────────────────────────────────────

/**
 * Returns the running app version injected by Vite at build time.
 * Falls back to '0.0.0' if somehow unavailable.
 */
export function getAppVersion() {
  try {
    // __APP_VERSION__ is defined in vite.config.js via the `define` block
    return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

/**
 * Returns the array of dismissed guide IDs from localStorage.
 * Always resilient — returns [] on any parse error.
 */
function getDismissedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Saves the full array of dismissed guide IDs to localStorage.
 */
function saveDismissedIds(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error('[ReleaseGuide] Failed to save dismissed state:', err);
  }
}

/**
 * Marks a guide as dismissed/completed permanently.
 * @param {string} guideId
 */
export function dismissGuide(guideId) {
  const ids = getDismissedIds();
  if (!ids.includes(guideId)) {
    saveDismissedIds([...ids, guideId]);
  }
}

/**
 * Returns true if the guide with this ID has already been dismissed.
 * @param {string} guideId
 */
export function isGuideDismissed(guideId) {
  return getDismissedIds().includes(guideId);
}

// ─── Guide Resolution ─────────────────────────────────────────────────────────

/**
 * Validates and de-duplicates guides at startup (dev-only warnings).
 */
function resolveGuideRegistry() {
  const seen = new Map();
  const deduped = [];

  for (const guide of RELEASE_GUIDES) {
    if (!guide?.id || !guide?.version) {
      if (import.meta.env.DEV) {
        console.warn('[ReleaseGuide] Skipping malformed guide entry:', guide);
      }
      continue;
    }

    if (seen.has(guide.version)) {
      if (import.meta.env.DEV) {
        console.warn(
          `[ReleaseGuide] Duplicate version "${guide.version}" found. ` +
          `Keeping "${seen.get(guide.version)}", skipping "${guide.id}".`
        );
      }
      continue;
    }

    seen.set(guide.version, guide.id);
    deduped.push(guide);
  }

  return deduped;
}

/**
 * Returns the active guide for the current app version, or null if:
 * - no guide is registered for this version
 * - the guide has already been dismissed/completed
 * - autoShow is explicitly set to false
 *
 * @returns {import('./releaseGuides').ReleaseGuide | null}
 */
export function getActiveGuide() {
  try {
    const currentVersion = getAppVersion();
    const guides = resolveGuideRegistry();

    const match = guides.find((g) => g.version === currentVersion);
    if (!match) return null;
    if (match.autoShow === false) return null;
    if (isGuideDismissed(match.id)) return null;

    return match;
  } catch (err) {
    // Graceful fallback — never break app startup
    if (import.meta.env.DEV) {
      console.error('[ReleaseGuide] Error resolving active guide:', err);
    }
    return null;
  }
}

// ─── Dev Utilities ────────────────────────────────────────────────────────────

/**
 * Exposes a reset function on window in development mode.
 * Usage in browser console: window.__resetReleaseGuides()
 */
if (import.meta.env.DEV) {
  window.__resetReleaseGuides = () => {
    localStorage.removeItem(STORAGE_KEY);
    console.info(
      '[ReleaseGuide] ✅ All dismissed guides cleared. Refresh the page to see guides again.'
    );
  };

  window.__releaseGuideInfo = () => {
    console.info('[ReleaseGuide] Current version:', getAppVersion());
    console.info('[ReleaseGuide] Dismissed guide IDs:', getDismissedIds());
    console.info('[ReleaseGuide] Active guide:', getActiveGuide());
  };
}
