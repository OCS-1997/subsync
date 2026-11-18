import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppToaster, toast, dynaura } from '@/utils/toast';
import 'dynaura/styles.css';
import router from '@/routes/Index'
import ErrorBoundary from './ErrorBoundary.jsx'

import { PermissionsProvider } from '@/context/PermissionsContext.jsx'
import { ThemeProvider } from '@/context/ThemeContext.jsx'
import FloatingCalculator from '@/components/FloatingCalculator/FloatingCalculator.jsx'
import InstallPrompt from '@/components/PWA/InstallPrompt'
import { useTokenRefresh } from '@/hooks/useTokenRefresh'
import { useCapacitorAuth } from '@/hooks/useCapacitorAuth'
import { useCallDetectionSync } from '@/hooks/useCallDetectionSync'
import { CallLogManager } from '@/components/CallLogPrompt'
import CallDetectorManager from '@/components/CallDetector/CallDetectorManager'
import ReleaseGuideManager from '@/features/ReleaseGuide/ReleaseGuideManager'

function App() {
  // Enable auto-refresh token
  useTokenRefresh();
  
  // Enable Capacitor authentication persistence
  useCapacitorAuth();

  // Sync contacts to native call detector
  useCallDetectionSync();
  
  useEffect(() => {
    const handleOffline = () => {
      dynaura.error({
        id: 'offline',
        title: 'You are offline',
        description: 'Please check your internet connection.',
        duration: null,
      });
    };
    const handleOnline = () => {
      // Dismiss offline island first
      dynaura.dismiss('offline');
      // Show quick success animation with celebratory confetti
      dynaura.success({
        id: 'online',
        title: 'Back online',
        description: 'Internet connection restored.',
        duration: 2000,
        confetti: true,
      });
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <>
      <AppToaster position="top-center" />
      <ErrorBoundary>
        <ThemeProvider>
          <PermissionsProvider>
            <RouterProvider router={router} />
            <InstallPrompt />
          </PermissionsProvider>
        </ThemeProvider>
      </ErrorBoundary>
      <FloatingCalculator />
      <CallLogManager />
      <CallDetectorManager />
      <ReleaseGuideManager />
    </>
  );
}


export default App;