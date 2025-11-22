import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';
import router from '@/routes/Index'
import ErrorBoundary from './ErrorBoundary.jsx'
import FloatingCalculator from '@/components/FloatingCalculator/FloatingCalculator.jsx'

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
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <ToastContainer position="top-right" theme="colored" transition={Bounce} autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <FloatingCalculator />
    </>
  );
}

export default App;