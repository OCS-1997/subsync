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
  } = useCallDetector();

  useEffect(() => {
    if (isNative && !isActive) {
      // Auto-start call detection on native platforms
      checkPermissions().then(() => {
        startDetection();
      });
    }
  }, [isNative, isActive, checkPermissions, startDetection]);

  // Render the post-call dialog when a call ends
  return <PostCallDialog lastCall={lastCall} />;
};

export default CallDetectorManager;
