import { useEffect } from 'react';
import { toast } from '@/utils/toast';
import { useCallDetector } from '@/hooks/useCallDetector';
import { CallDetector } from '@/plugins/CallDetectorPlugin';
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

  // Handle Permissions and Battery Optimization Prompts
  useEffect(() => {
    if (isNative) {
      // Check Overlay/Appear-on-top Permission
      checkOverlayPermission().then(granted => {
        if (!granted) {
          requestOverlayPermission();
          toast.info("Permission required", {
            description: "Please enable 'Appear on top' permission to allow call logging from the home screen.",
            duration: 2000,
            button: {
              title: "Enable",
              onClick: () => requestOverlayPermission()
            }
          });
        }
      });

      // Check Battery Optimization (Crucial for 2-day background reliability)
      const checkBattery = async () => {
        try {
          const { isIgnoring } = await CallDetector.checkBatteryOptimization();
          if (!isIgnoring) {
            toast.warn("Battery exemption needed", {
              description: "Subsync needs battery exemption to reliably track calls 24/7.",
              duration: null,
              button: {
                title: "Allow",
                onClick: () => CallDetector.requestIgnoreBatteryOptimization()
              }
            });
          }
        } catch (err) {
          console.error("Battery check failed:", err);
        }
      };
      
      checkBattery();
    }
  }, [isNative, checkOverlayPermission, requestOverlayPermission]);

  // Render the post-call dialog when a call ends
  return <PostCallDialog lastCall={lastCall} />;
};

export default CallDetectorManager;
