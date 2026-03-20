import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
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
  const processedPendingRef       = useRef(new Set());
  const isNative                  = Capacitor.isNativePlatform();

  const normalizeCallPayload = useCallback((data) => {
    const safeData = data || {};
    const phoneNumber = safeData.phoneNumber || safeData.number || '';
    const name = safeData.name || '';
    const duration = Number(safeData.duration ?? safeData.callDuration ?? 0) || 0;
    const callType = safeData.callType || safeData.type || 'incoming';
    return { phoneNumber, duration, callType, name };
  }, []);

  const toCallsArray = useCallback((pending) => {
    const rawCalls = pending?.calls;
    if (!rawCalls) return [];
    if (Array.isArray(rawCalls)) return rawCalls;

    try {
      const jsonParsed = JSON.parse(JSON.stringify(rawCalls));
      if (Array.isArray(jsonParsed)) return jsonParsed.filter(Boolean);
      if (jsonParsed && typeof jsonParsed === 'object') {
        return Object.values(jsonParsed).filter(Boolean);
      }
    } catch {
      // fall through to object handling below
    }

    if (typeof rawCalls === 'object') {
      if (typeof rawCalls.length === 'number') {
        return Array.from({ length: rawCalls.length }, (_, index) => rawCalls[index]).filter(Boolean);
      }
      return Object.values(rawCalls).filter(Boolean);
    }

    return [];
  }, []);

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
  // Handle Call Data (Resolve Number + Set State)
  // ------------------------------------------------------------------
  const handleCallData = useCallback(async (data) => {
    const { phoneNumber, duration, callType, name } = normalizeCallPayload(data);
    // Stable ID for this specific call event — used by PostCallDialog
    // to distinguish a new call (reset UI) from a resolve-update (refresh name only)
    const callId = `${phoneNumber}|${Date.now()}`;

    // 1. Set preliminary state immediately to trigger the popup
    setLastCall({
      callId,
      phoneNumber,
      duration,
      callType,
      timestamp: new Date().toISOString(),
      resolved: { 
        type: 'unknown', 
        loading: true,
        name: name || null,
        phone: phoneNumber
      }, 
    });

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
        name: name || null, company: null, phone: phoneNumber,
      };
    }

    // 2. Update resolved info — same callId, so PostCallDialog won't reset
    setLastCall(prev => ({
      ...prev,
      resolved: { 
        ...resolved, 
        loading: false,
        phone: resolved?.phone || prev?.phoneNumber || phoneNumber,
        // Priority: DB name → native contact name → null (popup handles null as number-only)
        name: (resolved?.name && resolved.name !== 'Unknown Number' && resolved.name !== 'Unknown Contact')
          ? resolved.name
          : (name && name.trim() ? name.trim() : null),
      },
    }));
  }, [normalizeCallPayload]);

  const getCallFingerprint = useCallback(({ phoneNumber, duration, callType }) => {
    return `${phoneNumber || 'unknown'}|${Number(duration) || 0}|${callType || 'incoming'}`;
  }, []);

  // ------------------------------------------------------------------
  // Subscribe to callEnded events when active
  // ------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const checkLaunchIntentCall = async () => {
      try {
        const launchData = await CallDetector.getLaunchCallData();
        const launchCall = launchData?.call || null;
        if (!mounted || !launchCall) return;

        const normalized = normalizeCallPayload(launchCall);
        if (!normalized.phoneNumber && normalized.duration <= 0) return;

        const fp = getCallFingerprint(normalized);
        if (processedPendingRef.current.has(fp)) return;

        console.log('[useCallDetector] Found launch intent call:', normalized);
        await handleCallData(normalized);
        processedPendingRef.current.add(fp);

        try {
          await CallDetector.clearLaunchCallData();
        } catch (clearErr) {
          console.warn('[useCallDetector] Failed to clear launch call data:', clearErr);
        }
      } catch (err) {
        console.error('[useCallDetector] Error checking launch intent call:', err);
      }
    };

    const checkPendingCalls = async () => {
      try {
        const pending = await CallDetector.getPendingCalls();
        const calls = toCallsArray(pending);

        if (!mounted || calls.length === 0) return;

        console.log('[useCallDetector] Found pending calls:', calls.length);
        let processedCount = 0;
        for (const call of calls) {
          if (!mounted) break;
          const normalized = normalizeCallPayload(call);
          if (!normalized.phoneNumber && normalized.duration <= 0) {
            continue;
          }
          const fp = getCallFingerprint(normalized);
          if (processedPendingRef.current.has(fp)) {
            continue;
          }
          await handleCallData(normalized);
          processedPendingRef.current.add(fp);
          processedCount += 1;
        }

        if (processedCount > 0) {
          try {
            await CallDetector.clearPendingCalls();
          } catch (clearErr) {
            console.warn('[useCallDetector] Failed to clear pending calls:', clearErr);
          }
        }
      } catch (err) {
        console.error('[useCallDetector] Error checking pending calls:', err);
      }
    };

    const subscribe = async () => {
      try {
        const handle = await CallDetector.addListener('callEnded', async (data) => {
          console.log('[useCallDetector] Call event received:', data);
          if (mounted) handleCallData(data);
        });

        const pendingHandle = await CallDetector.addListener('pendingCallsAdded', () => {
          console.log('[useCallDetector] Pending calls trigger received via native Plugin!');
          if (mounted) checkPendingCalls();
        });

        listenerRef.current = {
          remove: () => {
             handle.remove?.();
             pendingHandle.remove?.();
          }
        };
        console.log('[useCallDetector] Listeners subscribed successfully');
        
        // Initial check for pending calls (cold start)
        await checkLaunchIntentCall();
        await checkPendingCalls();
        
      } catch (err) {
        console.error('[useCallDetector] addListener failed:', err.message);
        // Even if listeners fail, still attempt to consume pending queue.
        if (mounted) {
          await checkLaunchIntentCall();
          await checkPendingCalls();
        }
      }
    };

    let appStateListener = null;
    const subscribeAppState = async () => {
      appStateListener = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive && mounted) {
          console.log('[useCallDetector] App resumed via Capacitor, checking for pending calls...');
          checkLaunchIntentCall();
          checkPendingCalls();
          
          // Poll multiple times to ensure we catch any queued data
          // and handle cases where the bridge is still initializing
          [500, 1500, 3000].forEach(delay => {
            setTimeout(() => {
              if (mounted) {
                checkLaunchIntentCall();
                checkPendingCalls();
              }
            }, delay);
          });
        }
      });
    };

    subscribeAppState();
    subscribe();

    // Extra startup polling for cases where bridge/plugin is late on app launch.
    [300, 900, 1800, 3200].forEach(delay => {
      setTimeout(() => {
        if (mounted) {
          checkLaunchIntentCall();
          checkPendingCalls();
        }
      }, delay);
    });

    return () => {
      mounted = false;
      if (appStateListener) {
        appStateListener.remove();
      }
      if (listenerRef.current) {
        listenerRef.current.remove?.();
        listenerRef.current = null;
      }
    };
  }, [getCallFingerprint, handleCallData, normalizeCallPayload, toCallsArray]);

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
