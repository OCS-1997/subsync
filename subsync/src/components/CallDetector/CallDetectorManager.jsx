import { useEffect } from 'react';
import { useCallDetector } from '@/hooks/useCallDetector';
import PostCallDialog from './PostCallDialog';

export const CallDetectorManager = () => {
  const {
    isNative,
    isActive,
    lastCall,
    startDetection,
    checkPermissions,
    checkOverlayPermission,
    requestOverlayPermission,
  } = useCallDetector();

  useEffect(() => {
    if (isNative && !isActive) {
      // Auto-start call detection on native platforms
      checkPermissions().then((granted) => {
        if (granted) {
          startDetection();
        }
      });
    }
  }, [isNative, isActive, checkPermissions, startDetection]);

  // Handle Overlay Permission Prompt
  useEffect(() => {
    if (isNative) {
      checkOverlayPermission().then(granted => {
        if (!granted) {
          toast.info("Please enable 'Appear on top' permission to allow call logging from the home screen.", {
            autoClose: 10000,
            onClick: () => requestOverlayPermission()
          });
        }
      });
    }
  }, [isNative, checkOverlayPermission, requestOverlayPermission]);

  // Render the post-call dialog when a call ends
  return <PostCallDialog lastCall={lastCall} />;
};

export default CallDetectorManager;
