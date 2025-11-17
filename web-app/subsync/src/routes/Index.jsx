import { createBrowserRouter } from 'react-router-dom';

import AddCustomer from '@/features/Customers/pages/AddCustomer.jsx';
import AddService from '@/features/Services/pages/AddService.jsx';
import AddTax from '@/features/Settings/AddTax.jsx';
import AddTaxGroup from '@/features/Settings/AddTaxGroup.jsx';
import AddVendor from '@/features/Vendors/pages/AddVendor.jsx';
import AllTaxes from '@/features/Settings/AllTaxes.jsx';
import CreateDomain from '@/features/Domains/pages/CreateDomain.jsx';
import CustomerDetails from '@/features/Customers/pages/CustomerDetails.jsx';
import Customers from '@/features/Customers/pages/Customers.jsx';
import Dashboard from '@/features/Dashboard/pages/Dashboard.jsx';
import DefaultTaxPreference from '@/features/Settings/DefaultTaxPreference.jsx';
import Domains from '@/features/Domains/pages/Domains.jsx';
import GSTSettings from '@/features/Settings/GSTSettings.jsx';
import Home from '@/features/Dashboard/components/Home.jsx';
import LoginPage from '@/features/Auth/pages/LoginPage';
import ServiceDetails from '@/features/Services/pages/ServiceDetails.jsx';
import Services from '@/features/Services/pages/Services.jsx';
import Settings from '@/features/Settings/Settings.jsx';
import Taxes from '@/features/Settings/Taxes.jsx';
import Vendors from '@/features/Vendors/pages/Vendors';
import VendorDetails from '@/features/Vendors/pages/VendorDetails';
import UserManagement from '@/features/Settings/UserManagement';
import AddUser from '@/features/Settings/AddUser';
import AdminActivityLog from '@/features/Settings/AdminActivityLog.jsx';
import ComingSoon from '@/features/ComingSoon/ComingSoon';
import SubscriptionsPage from '@/features/Subscriptions/pages/SubscriptionsPage.jsx';
import AddSubscription from '@/features/Subscriptions/pages/AddSubscription.jsx';
import EditSubscription from '@/features/Subscriptions/pages/EditSubscription.jsx';

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  {
    path: "/:username/dashboard",
    element: <Dashboard />,
    children: [
      { index: true, element: <Home /> },
      { path: "customers", element: <Customers /> },
      { path: "customers/:id", element: <CustomerDetails /> },
      { path: "customers/add", element: <AddCustomer /> },
      { path: "customers/:id/edit", element: <AddCustomer /> },

      { path: "domains", element: <Domains /> },
      { path: "domains/:id", element: <CreateDomain /> },
      { path: "domains/edit/:domainId", element: <CreateDomain /> },

      { path: "services", element: <Services /> },
      { path: "services/:id", element: <ServiceDetails /> },
      { path: "services/add", element: <AddService /> },
      { path: "services/:id/edit", element: <AddService /> },

      { path: "vendors", element: <Vendors /> },
      { path: "vendors/:id", element: <VendorDetails /> },
      { path: "vendors/add", element: <AddVendor /> },
      { path: "vendors/:id/edit", element: <AddVendor /> },

      { path: "subscriptions", element: <SubscriptionsPage /> },
      { path: "subscriptions/add", element: <AddSubscription /> },
      { path: "subscriptions/:id/edit", element: <EditSubscription /> },

      {
        path: "settings",
        element: <Settings />,
        children: [
          { path: "profile", element: <ComingSoon /> },
          {
            path: "taxes",
            element: <Taxes />,
            children: [
              { path: "tax-rates", element: <AllTaxes /> },
              { path: "tax-rates/add", element: <AddTax /> },
              { path: "tax-groups/add", element: <AddTaxGroup /> },
              { path: "tax-groups/edit/:id", element: <AddTaxGroup /> },
              { path: "tax-rates/edit/:id", element: <AddTax /> },
              { path: "default-tax-pref", element: <DefaultTaxPreference /> },
              { path: "gst-settings", element: <GSTSettings /> },
            ]
          },
          
          {path: "user-management", element: <UserManagement/>},
          {path: "user-management/add-user", element: <AddUser />},
          {path: "user-management/add-user/:editUsername", element: <AddUser />},
          {path: "activity-logs", element: <AdminActivityLog />},
        ]
      }
    ]
  }
]);

export default router;
