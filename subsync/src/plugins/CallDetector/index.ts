import { registerPlugin } from '@capacitor/core';

export interface CallDetectorPlugin {
  /**
   * Start call detection service
   */
  startCallDetection(): Promise<void>;

  /**
   * Stop call detection service
   */
  stopCallDetection(): Promise<void>;

  /**
   * Check if required permissions are granted
   */
  checkPermissions(): Promise<{ granted: boolean }>;

  /**
   * Add listener for call started event
   */
  addListener(
    eventName: 'callStarted',
    listenerFunc: (data: CallStartedEvent) => void
  ): Promise<any>;

  /**
   * Add listener for call ended event
   */
  addListener(
    eventName: 'callEnded',
    listenerFunc: (data: CallEndedEvent) => void
  ): Promise<any>;

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(eventName?: string): Promise<void>;
}

export interface CallStartedEvent {
  phoneNumber: string;
  callType: 'incoming' | 'outgoing';
  timestamp: number;
}

export interface CallEndedEvent {
  phoneNumber: string;
  callType: 'incoming' | 'outgoing';
  duration: number; // seconds
  timestamp: number;
}

const CallDetector = registerPlugin<CallDetectorPlugin>('CallDetector', {
  web: () => import('./web').then((m) => new m.CallDetectorWeb()),
});

export default CallDetector;
