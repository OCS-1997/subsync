/**
 * CallDetector — Capacitor JS plugin wrapper
 *
 * Registers the native CallDetectorPlugin for use in React.
 * On Android: bridges to CallDetectorPlugin.java
 * On Web/iOS: calls are no-ops (safe to include without native build)
 *
 * Usage:
 *   import { CallDetector } from '@/plugins/CallDetectorPlugin';
 *   await CallDetector.startListening();
 *   const handle = await CallDetector.addListener('callEnded', (data) => { ... });
 *   // cleanup:
 *   handle.remove();
 */
import { registerPlugin } from '@capacitor/core';

export const CallDetector = registerPlugin('CallDetector', {
  web: () => import('./CallDetectorWebImpl').then(m => new m.CallDetectorWebImpl()),
});
