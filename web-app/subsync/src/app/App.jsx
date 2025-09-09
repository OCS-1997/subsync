import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';
import router from '@/routes/Index'

function App() {
  useEffect(() => {
    const handleOffline = () => {
      toast.error('You are offline. Please check your internet connection.', { toastId: 'offline' });
    };
    const handleOnline = () => {
      toast.dismiss('offline');
      toast.success('You are back online!', { toastId: 'online', autoClose: 2000 });
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
      <RouterProvider router={router} />
      <ToastContainer position="top-right" theme="colored" transition={Bounce} autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
}

export default App;