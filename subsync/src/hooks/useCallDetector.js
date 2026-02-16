import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import CallDetector from '@/plugins/CallDetector';

export const useCallDetector = () => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [lastCall, setLastCall] = useState(null);
  const [error, setError] = useState(null);

  // Only run on native platforms
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) {
      console.log('[useCallDetector] Running on web, call detection disabled');
      return;
    }

    // Check permissions on mount
    checkPermissions();

    // Set up event listeners
    const callStartedListener = CallDetector.addListener(
      'callStarted',
      (event) => {
        console.log('[useCallDetector] Call started:', event);
      }
    );

    const callEndedListener = CallDetector.addListener(
      'callEnded',
      (event) => {
        console.log('[useCallDetector] Call ended:', event);
        setLastCall(event);
      }
    );

    return () => {
      callStartedListener.then((l) => l.remove());
      callEndedListener.then((l) => l.remove());
    };
  }, [isNative]);

  const checkPermissions = useCallback(async () => {
    if (!isNative) return;

    try {
      const result = await CallDetector.checkPermissions();
      setHasPermissions(result.granted);
    } catch (err) {
      console.error('[useCallDetector] Failed to check permissions:', err);
      setError('Failed to check permissions');
    }
  }, [isNative]);

  const startDetection = useCallback(async () => {
    if (!isNative) {
      console.warn('[useCallDetector] Cannot start detection on web');
      return;
    }

    try {
      setError(null);
      await CallDetector.startCallDetection();
      setIsActive(true);
      console.log('[useCallDetector] Call detection started');
    } catch (err) {
      console.error('[useCallDetector] Failed to start detection:', err);
      setError(err.message || 'Failed to start call detection');
      setIsActive(false);
    }
  }, [isNative]);

  const stopDetection = useCallback(async () => {
    if (!isNative) return;

    try {
      await CallDetector.stopCallDetection();
      setIsActive(false);
      console.log('[useCallDetector] Call detection stopped');
    } catch (err) {
      console.error('[useCallDetector] Failed to stop detection:', err);
      setError(err.message || 'Failed to stop call detection');
    }
  }, [isNative]);

  return {
    isNative,
    isActive,
    hasPermissions,
    lastCall,
    error,
    startDetection,
    stopDetection,
    checkPermissions,
  };
};
