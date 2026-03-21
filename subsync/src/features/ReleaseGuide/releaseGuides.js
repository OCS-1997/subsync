/**
 * PATCH GUIDES REGISTRY
 * =====================
 * Add a new entry here for each patch that should show a guide.
 *
 * How to add a new guide for the next patch:
 * 1. Bump the version in package.json (e.g. "1.1.0")
 * 2. Add a new object to RELEASE_GUIDES below with a unique `id`
 *    and a `version` that matches the new package.json version.
 * 3. Ship — the guide will appear once for every user on first load
 *    of that version, then never again after they dismiss it.
 *
 * Guide ID convention: "<version>-<slug>"
 *   e.g. "1.0.0-sidebar-folders"
 *
 * If you register two guides with the same version string, a warning
 * is logged in development and only the first one will be shown.
 */

/** @type {import('./releaseGuideService').ReleaseGuide[]} */
export const RELEASE_GUIDES = [
  {
    id: '1.0.0-sidebar-folders',
    version: '1.0.0',
    title: "What's New in 1.0",
    description: 'Here are the highlights from this release.',
    steps: [
      {
        id: 'step-sidebar-folders',
        title: '📁 Sidebar Folders',
        body: 'Drag any sidebar item onto another item to group them into a folder. Drop it outside a folder to move it back.',
      },
      {
        id: 'step-command-palette',
        title: '⌨️ Command Palette',
        body: 'Press Ctrl+K (or Cmd+K on Mac) anywhere in the app to instantly jump to any page or action.',
      },
    ],
    autoShow: true,
  },

  {
    id: '2.1.0-help-downloads',
    version: '2.1.0',
    title: "What's New in 2.1.0",
    description: 'Major UI overhaul and mobile accessibility improvements.',
    steps: [
      {
        id: 'step-help-center',
        title: '🆘 Revamped Help Center',
        body: 'A faster, cleaner, and searchable help page. High-performance design that fixes previous navigation issues.',
      },
      {
        id: 'step-mobile-downloads',
        title: '📱 Public Mobile Download',
        body: 'A dedicated public page at /app/download with an easy 6-step installation guide and QR code for mobile setup.',
      },
      {
        id: 'step-command-palette-directory',
        title: '📞 Phone Directory Integration',
        body: 'Access the Phone Directory instantly from the Command Palette (Ctrl+K). Search callers and logs without leaving your current page.',
      },
    ],
    autoShow: true,
  },
];
