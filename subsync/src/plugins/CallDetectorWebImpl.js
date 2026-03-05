/**
 * CallDetectorWebImpl — Web fallback for the CallDetector plugin.
 *
 * On browsers (during development), the native plugin doesn't exist.
 * This stub makes it safe to import and use the plugin without crashing.
 *
 * To test the popup during web development, dispatch a custom event:
 *   window.dispatchEvent(new CustomEvent('dev:callEnded', {
 *     detail: { phoneNumber: '9843012769', duration: 120, callType: 'incoming' }
 *   }));
 */
export class CallDetectorWebImpl {
  async startListening() {
    console.debug('[CallDetector] Web stub: startListening (no-op on web)');
    return { status: 'web_stub' };
  }

  async stopListening() {
    console.debug('[CallDetector] Web stub: stopListening (no-op on web)');
    return { status: 'web_stub' };
  }

  async checkPermissions() {
    return { phonePermission: false, callLogPermission: false, allGranted: false };
  }

  addListener(eventName, callback) {
    // On web, allow dev testing via a custom DOM event
    const handler = (e) => {
      if (eventName === 'callEnded') {
        callback(e.detail);
      }
    };
    window.addEventListener('dev:callEnded', handler);
    return Promise.resolve({
      remove: () => window.removeEventListener('dev:callEnded', handler),
    });
  }

  removeAllListeners() {
    return Promise.resolve();
  }
}
