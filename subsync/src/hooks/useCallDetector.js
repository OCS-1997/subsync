import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { CallDetector } from '../plugins/CallDetectorPlugin';
import api from '@/lib/axiosInstance';

/**
 * useCallDetector — React hook for post-call DCR logging.
 *
 * Bridges the native CallDetectorPlugin (Android) to React.
 * Exposes:
 *   - isNative     : boolean — is this running on Android native
 *   - isActive     : boolean — is the call listener running
 *   - lastCall     : object | null — latest ended call data
 *   - startDetection  : fn — start listening for calls
 *   - stopDetection   : fn — stop listening
 *   - checkPermissions: fn — check/request permissions
 *
 * On Web (dev): responds to `window.dispatchEvent(new CustomEvent('dev:callEnded', { detail: {...} }))`
 */
export function useCallDetector() {
  const [isActive, setIsActive]   = useState(false);
  const [lastCall, setLastCall]   = useState(null);
  const listenerRef               = useRef(null);
  const isNative                  = Capacitor.isNativePlatform();

  // ------------------------------------------------------------------
  // Check / request permissions
  // ------------------------------------------------------------------
  const checkPermissions = useCallback(async () => {
    try {
      const status = await CallDetector.checkPermissions();
      console.log('[useCallDetector] Permission status:', status);
      
      if (status.phone !== 'granted') {
        console.log('[useCallDetector] Requesting phone permissions...');
        const requestStatus = await CallDetector.requestPermissions({ permissions: ['phone'] });
        console.log('[useCallDetector] Request result:', requestStatus);
        return requestStatus.phone === 'granted';
      }
      
      return status.phone === 'granted';
    } catch (err) {
      console.error('[useCallDetector] Permission check failed:', err);
      return false;
    }
  }, []);

  // ------------------------------------------------------------------
  // Start listening for call events
  // ------------------------------------------------------------------
  const startDetection = useCallback(async () => {
    try {
      await CallDetector.startListening();
      setIsActive(true);
    } catch (err) {
      console.warn('[useCallDetector] startListening failed:', err.message);
    }
  }, []);

  // ------------------------------------------------------------------
  // Stop listening
  // ------------------------------------------------------------------
  const stopDetection = useCallback(async () => {
    try {
      await CallDetector.stopListening();
      setIsActive(false);
    } catch { /* ignore */ }
  }, []);

  // ------------------------------------------------------------------
  // Subscribe to callEnded events when active
  // ------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const subscribe = async () => {
      try {
        const handle = await CallDetector.addListener('callEnded', async (data) => {
          console.log('[useCallDetector] Call event received:', data);
          if (!mounted) return;

          const { phoneNumber, duration, callType } = data;

          // Resolve the number immediately via backend
          let resolved = null;
          try {
            console.log('[useCallDetector] Resolving number:', phoneNumber);
            const response = await api.post('/resolve-number', { phone_number: phoneNumber });
            resolved = response.data?.data || null;
            console.log('[useCallDetector] Number resolved:', resolved);
          } catch (err) {
            console.error('[useCallDetector] Resolve failed:', err);
            resolved = {
              type: 'unknown', id: null,
              name: 'Unknown Number', company: null, phone: phoneNumber,
            };
          }

          if (mounted) {
            setLastCall({
              phoneNumber,
              duration,
              callType,
              timestamp: new Date().toISOString(),
              resolved,
            });
          }
        });

        listenerRef.current = handle;
        console.log('[useCallDetector] Listener subscribed successfully');
      } catch (err) {
        console.error('[useCallDetector] addListener failed:', err.message);
      }
    };

    subscribe();

    return () => {
      mounted = false;
      if (listenerRef.current) {
        listenerRef.current.remove?.();
        listenerRef.current = null;
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // Cleanup on unmount
  // ------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isNative,
    isActive,
    lastCall,
    startDetection,
    stopDetection,
    checkPermissions,
    checkOverlayPermission: async () => {
      try {
        const result = await CallDetector.checkOverlayPermission();
        return result.granted;
      } catch {
        return false;
      }
    },
    requestOverlayPermission: async () => {
      try {
        await CallDetector.requestOverlayPermission();
      } catch { /* ignore */ }
    },
  };
}
