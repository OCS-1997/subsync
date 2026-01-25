import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';
import router from '@/routes/Index'
import ErrorBoundary from './ErrorBoundary.jsx'

import { PermissionsProvider } from '@/context/PermissionsContext.jsx'
import { ThemeProvider } from '@/context/ThemeContext.jsx'
import FloatingCalculator from '@/components/FloatingCalculator/FloatingCalculator.jsx'
import InstallPrompt from '@/components/PWA/InstallPrompt'

function App() {
  useEffect(() => {
    const handleOffline = () => {
      toast.error('You are offline. Please check your internet connection.', {
        toastId: 'offline',
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        draggable: false,
        pauseOnHover: false,
      });
    };
    const handleOnline = () => {
      // Dismiss offline snackbar first
      toast.dismiss('offline');
      // Show quick success animation
      toast.success('You are back online!', {
        toastId: 'online',
        autoClose: 1500,
        hideProgressBar: false,
        transition: Bounce,
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
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />
      <ErrorBoundary>
        <ThemeProvider>
          <PermissionsProvider>
            <RouterProvider router={router} />
            <InstallPrompt />
          </PermissionsProvider>
        </ThemeProvider>
      </ErrorBoundary>
      <FloatingCalculator />
    </>
  );
}


export default App;