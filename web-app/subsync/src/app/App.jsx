import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bounce } from 'react-toastify';
import router from '@/routes/Index'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer position="top-right" theme="colored" transition={Bounce} autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </>
  );
}

export default App;
