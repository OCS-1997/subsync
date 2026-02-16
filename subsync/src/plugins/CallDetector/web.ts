import { WebPlugin } from '@capacitor/core';
import type { CallDetectorPlugin } from './index';

export class CallDetectorWeb extends WebPlugin implements CallDetectorPlugin {
  async startCallDetection(): Promise<void> {
    console.warn('CallDetector is not implemented on web');
  }

  async stopCallDetection(): Promise<void> {
    console.warn('CallDetector is not implemented on web');
  }

  async checkPermissions(): Promise<{ granted: boolean }> {
    console.warn('CallDetector is not implemented on web');
    return { granted: false };
  }
}
