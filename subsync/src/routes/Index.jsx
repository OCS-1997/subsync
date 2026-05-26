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
import DomainDetails from '@/features/Domains/pages/DomainDetails.jsx';
import GSTSettings from '@/features/Settings/GSTSettings.jsx';
import Home from '@/features/Dashboard/components/Home.jsx'
import DashboardHome from '@/features/Dashboard/pages/DashboardHome.jsx';
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
import Profile from '@/features/Settings/Profile.jsx';
import ComingSoon from '@/features/ComingSoon/ComingSoon';
import SubscriptionsPage from '@/features/Subscriptions/pages/SubscriptionsPage.jsx';
import AddSubscription from '@/features/Subscriptions/pages/AddSubscription.jsx';
import EditSubscription from '@/features/Subscriptions/pages/EditSubscription.jsx';
import ViewSubscriptionPage from '@/features/Subscriptions/pages/ViewSubscriptionPage.jsx';
import ArchivedSubscriptions from '@/features/Subscriptions/pages/ArchivedSubscriptions.jsx';
import RoleManagement from '@/features/Settings/RoleManagement.jsx';
import ReminderPolicies from '@/features/Settings/ReminderPolicies.jsx';
import EmailTemplates from '@/features/Settings/EmailTemplates.jsx';
import NotificationLogs from '@/features/Settings/NotificationLogs.jsx';
import QuickToolsAdmin from '@/features/QuickTools/pages/QuickToolsAdmin.jsx';
import DashboardSettings from '@/features/Settings/DashboardSettings.jsx';
import HelpPage from '@/features/Help/HelpPage.jsx';
import DCRList from '@/features/DCR/pages/DCRList.jsx';
import DCRForm from '@/features/DCR/pages/DCRForm.jsx';
import ViewDCR from '@/features/DCR/pages/ViewDCR.jsx';
import DcrDetailedReport from '@/features/DCR/pages/DcrDetailedReport.jsx';
import ContactsList from '@/features/Contacts/pages/ContactsList.jsx';
import ContactForm from '@/features/Contacts/pages/ContactForm.jsx';
import ContactDetails from '@/features/Contacts/pages/ContactDetails.jsx';
import OpportunitiesPage from '@/features/Opportunities/pages/OpportunitiesPage.jsx';
import OpportunityForm from '@/features/Opportunities/components/OpportunityForm.jsx';
import OpportunityView from '@/features/Opportunities/components/OpportunityView.jsx';
import OpportunityDetailedReport from '@/features/Opportunities/pages/OpportunityDetailedReport.jsx';
import BirthdaysPage from '@/features/Birthdays/pages/BirthdaysPage.jsx';
import BackupConfigurations from '@/features/Backups/pages/BackupConfigurations.jsx';
import BackupForm from '@/features/Backups/pages/BackupForm.jsx';
import BackupHistory from '@/features/Backups/pages/BackupHistory.jsx';
import KnowledgeBaseRoutes from '@/features/KnowledgeBase/index.jsx';
import ArticleView from '@/features/KnowledgeBase/pages/ArticleView.jsx';
import Assets from '@/features/Assets/pages/Assets.jsx';
import AddAsset from '@/features/Assets/pages/AddAsset.jsx';
import AssetDetails from '@/features/Assets/pages/AssetDetails.jsx';
import AssetSettings from '@/features/Assets/pages/AssetSettings.jsx';
import TeamsSettings from '@/features/Settings/TeamsSettings.jsx';
import TimeTracking from '@/features/TimeTracking';
import SettingsIndex from '@/features/Settings/SettingsIndex.jsx';
import AppearanceSettings from '@/features/Settings/AppearanceSettings.jsx';
import DeveloperControls from '@/features/Settings/DeveloperControls.jsx';
import PermissionGate from '@/components/auth/PermissionGate.jsx';
import { PERMISSIONS } from '@/constants/permissions.js';
import NotFoundPage from '@/pages/NotFoundPage.jsx';
import ForbiddenPage from '@/pages/ForbiddenPage.jsx';
import PhoneDirectory from '@/features/PhoneDirectory/pages/PhoneDirectory.jsx';
import DownloadPage from '@/features/Download/DownloadPage.jsx';
import AppraisalForm from '@/features/Appraisals/pages/AppraisalForm.jsx';
import AdminAppraisalManager from '@/features/Appraisals/pages/AdminAppraisalManager.jsx';
import AdminAppraisalSubmissions from '@/features/Appraisals/pages/AdminAppraisalSubmissions.jsx';
import LeavesPage from '@/features/Leaves/pages/LeavesPage.jsx';
import AdminLeavesPage from '@/features/Leaves/pages/AdminLeavesPage.jsx';
// Reports 360 removed

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  { path: "/kb/p/:slug", element: <ArticleView publicView={true} /> },
  { path: "/app/download", element: <DownloadPage /> },
  {
    path: "/:username/dashboard",
    element: (
      <PermissionGate required={PERMISSIONS.DASHBOARD_VIEW}>
        <Dashboard />
      </PermissionGate>
    ),
    children: [
      { index: true, element: <PermissionGate required={PERMISSIONS.DASHBOARD_VIEW}><DashboardHome /></PermissionGate> },
      { path: "customers", element: <PermissionGate required={PERMISSIONS.CUSTOMERS_VIEW}><Customers /></PermissionGate> },
      { path: "customers/:id", element: <PermissionGate required={PERMISSIONS.CUSTOMERS_VIEW}><CustomerDetails /></PermissionGate> },
      { path: "customers/add", element: <PermissionGate required={PERMISSIONS.CUSTOMERS_CREATE}><AddCustomer /></PermissionGate> },
      { path: "customers/:id/edit", element: <PermissionGate required={PERMISSIONS.CUSTOMERS_UPDATE}><AddCustomer /></PermissionGate> },

      { path: "domains", element: <PermissionGate required={PERMISSIONS.DOMAINS_VIEW}><Domains /></PermissionGate> },
      { path: "domains/add", element: <PermissionGate required={PERMISSIONS.DOMAINS_CREATE}><CreateDomain /></PermissionGate> },
      { path: "domains/:id", element: <PermissionGate required={PERMISSIONS.DOMAINS_VIEW}><DomainDetails /></PermissionGate> },
      { path: "domains/edit/:domainId", element: <PermissionGate required={PERMISSIONS.DOMAINS_UPDATE}><CreateDomain /></PermissionGate> },

      { path: "services", element: <PermissionGate required={PERMISSIONS.SERVICES_VIEW}><Services /></PermissionGate> },
      { path: "services/:id", element: <PermissionGate required={PERMISSIONS.SERVICES_VIEW}><ServiceDetails /></PermissionGate> },
      { path: "services/add", element: <PermissionGate required={PERMISSIONS.SERVICES_CREATE}><AddService /></PermissionGate> },
      { path: "services/:id/edit", element: <PermissionGate required={PERMISSIONS.SERVICES_UPDATE}><AddService /></PermissionGate> },

      { path: "vendors", element: <PermissionGate required={PERMISSIONS.VENDORS_VIEW}><Vendors /></PermissionGate> },
      { path: "vendors/:id", element: <PermissionGate required={PERMISSIONS.VENDORS_VIEW}><VendorDetails /></PermissionGate> },
      { path: "vendors/add", element: <PermissionGate required={PERMISSIONS.VENDORS_CREATE}><AddVendor /></PermissionGate> },
      { path: "vendors/:id/edit", element: <PermissionGate required={PERMISSIONS.VENDORS_UPDATE}><AddVendor /></PermissionGate> },

      { path: "subscriptions/*", element: <PermissionGate required={PERMISSIONS.SUBSCRIPTIONS_VIEW}><SubscriptionsPage /></PermissionGate> },
      { path: "subscriptions/add", element: <PermissionGate required={PERMISSIONS.SUBSCRIPTIONS_CREATE}><AddSubscription /></PermissionGate> },
      { path: "subscriptions/archived", element: <PermissionGate required={PERMISSIONS.SUBSCRIPTIONS_VIEW}><ArchivedSubscriptions /></PermissionGate> },
      { path: "subscriptions/:id", element: <PermissionGate required={PERMISSIONS.SUBSCRIPTIONS_VIEW}><ViewSubscriptionPage /></PermissionGate> },
      { path: "subscriptions/:id/edit", element: <PermissionGate required={PERMISSIONS.SUBSCRIPTIONS_UPDATE}><EditSubscription /></PermissionGate> },

      { path: "dcr", element: <PermissionGate required={PERMISSIONS.DCR_VIEW}><DCRList /></PermissionGate> },
      { path: "dcr/new", element: <PermissionGate required={PERMISSIONS.DCR_CREATE}><DCRForm /></PermissionGate> },
      { path: "dcr/:id/clone", element: <PermissionGate required={PERMISSIONS.DCR_CREATE}><DCRForm /></PermissionGate> },
      { path: "dcr/:id", element: <PermissionGate required={PERMISSIONS.DCR_VIEW}><ViewDCR /></PermissionGate> },
      { path: "dcr/:id/edit", element: <PermissionGate required={PERMISSIONS.DCR_UPDATE}><DCRForm /></PermissionGate> },
      { path: "dcr/detailed", element: <PermissionGate required={PERMISSIONS.DCR_VIEW}><DcrDetailedReport /></PermissionGate> },

      { path: "contacts", element: <PermissionGate required={PERMISSIONS.CONTACTS_VIEW}><ContactsList /></PermissionGate> },
      { path: "contacts/new", element: <PermissionGate required={PERMISSIONS.CONTACTS_CREATE}><ContactForm /></PermissionGate> },
      { path: "contacts/:id", element: <PermissionGate required={PERMISSIONS.CONTACTS_VIEW}><ContactDetails /></PermissionGate> },
      { path: "contacts/:id/edit", element: <PermissionGate required={PERMISSIONS.CONTACTS_UPDATE}><ContactForm /></PermissionGate> },

      { path: "opportunities", element: <PermissionGate required={PERMISSIONS.OPPORTUNITIES_VIEW}><OpportunitiesPage /></PermissionGate> },
      { path: "opportunities/new", element: <PermissionGate required={PERMISSIONS.OPPORTUNITIES_CREATE}><OpportunityForm /></PermissionGate> },
      { path: "opportunities/view/:id", element: <PermissionGate required={PERMISSIONS.OPPORTUNITIES_VIEW}><OpportunityView /></PermissionGate> },
      { path: "opportunities/edit/:id", element: <PermissionGate required={PERMISSIONS.OPPORTUNITIES_UPDATE}><OpportunityForm /></PermissionGate> },
      { path: "opportunities/detailed", element: <PermissionGate required={PERMISSIONS.OPPORTUNITIES_VIEW}><OpportunityDetailedReport /></PermissionGate> },

      { path: "birthdays", element: <PermissionGate required={PERMISSIONS.BIRTHDAYS_VIEW}><BirthdaysPage /></PermissionGate> },

      { path: "backups", element: <PermissionGate required={PERMISSIONS.BACKUPS_VIEW}><BackupConfigurations /></PermissionGate> },
      { path: "backups/new", element: <PermissionGate required={PERMISSIONS.BACKUPS_CREATE}><BackupForm /></PermissionGate> },
      { path: "backups/:id/edit", element: <PermissionGate required={PERMISSIONS.BACKUPS_UPDATE}><BackupForm /></PermissionGate> },
      { path: "backups/:configId/history", element: <PermissionGate required={PERMISSIONS.BACKUPS_VIEW}><BackupHistory /></PermissionGate> },
      { path: "backups/history", element: <PermissionGate required={PERMISSIONS.BACKUPS_VIEW}><BackupHistory /></PermissionGate> },

      { path: "kb/*", element: <PermissionGate required={PERMISSIONS.KNOWLEDGE_BASE_VIEW}><KnowledgeBaseRoutes /></PermissionGate> },

      // Assets
      { path: "assets", element: <PermissionGate required={PERMISSIONS.ASSETS_VIEW}><Assets /></PermissionGate> },
      { path: "assets/add", element: <PermissionGate required={PERMISSIONS.ASSETS_CREATE}><AddAsset /></PermissionGate> },
      { path: "assets/settings", element: <PermissionGate required={PERMISSIONS.ASSETS_MANAGE_CATEGORIES}><AssetSettings /></PermissionGate> },
      { path: "assets/:id", element: <PermissionGate required={PERMISSIONS.ASSETS_VIEW}><AssetDetails /></PermissionGate> },
      { path: "assets/:id/edit", element: <PermissionGate required={PERMISSIONS.ASSETS_UPDATE}><AddAsset /></PermissionGate> },

      // Time Tracking
      { path: "time-tracking", element: <PermissionGate required={PERMISSIONS.TIME_TRACKING_VIEW}><TimeTracking /></PermissionGate> },
      
      // Phone Directory
      { path: "phone-directory", element: <PermissionGate required={PERMISSIONS.DIRECTORY_VIEW}><PhoneDirectory /></PermissionGate> },
      
      // Appraisals
      { path: "appraisals", element: <PermissionGate required={PERMISSIONS.APPRAISALS_SUBMIT}><AppraisalForm /></PermissionGate> },
      { path: "admin/appraisals", element: <PermissionGate required={PERMISSIONS.APPRAISALS_MANAGE}><AdminAppraisalManager /></PermissionGate> },
      { path: "admin/appraisals/period/:periodId", element: <PermissionGate required={PERMISSIONS.APPRAISALS_VIEW_TEAM}><AdminAppraisalSubmissions /></PermissionGate> },

      // Leaves & Permissions
      { path: "leaves", element: <PermissionGate required={PERMISSIONS.LEAVES_VIEW}><LeavesPage /></PermissionGate> },
      { path: "admin/leaves", element: <PermissionGate required={PERMISSIONS.LEAVES_MANAGE_TYPES}><AdminLeavesPage /></PermissionGate> },

      // Reports 360
      // Reports 360 routes removed

      {
        path: "settings",
        element: (
          <PermissionGate any={[
            PERMISSIONS.SETTINGS_MANAGE,
            PERMISSIONS.USERS_VIEW,
            PERMISSIONS.ROLES_VIEW,
            PERMISSIONS.ACTIVITY_LOGS_VIEW,
            PERMISSIONS.TAXES_VIEW,
            PERMISSIONS.REMINDER_POLICIES_VIEW,
            PERMISSIONS.EMAIL_TEMPLATES_VIEW,
            PERMISSIONS.NOTIFICATION_LOGS_VIEW,
          ]}>
            <Settings />
          </PermissionGate>
        ),
        children: [
          { index: true, element: <SettingsIndex /> },
          { path: "profile", element: <Profile /> },
          {
            path: "taxes",
            element: (
              <PermissionGate required={PERMISSIONS.TAXES_VIEW}>
                <Taxes />
              </PermissionGate>
            ),
            children: [
              { path: "tax-rates", element: <PermissionGate required={PERMISSIONS.TAXES_VIEW}><AllTaxes /></PermissionGate> },
              { path: "tax-rates/add", element: <PermissionGate required={PERMISSIONS.TAXES_CREATE}><AddTax /></PermissionGate> },
              { path: "tax-groups/add", element: <PermissionGate required={PERMISSIONS.TAXES_CREATE}><AddTaxGroup /></PermissionGate> },
              { path: "tax-groups/edit/:id", element: <PermissionGate required={PERMISSIONS.TAXES_UPDATE}><AddTaxGroup /></PermissionGate> },
              { path: "tax-rates/edit/:id", element: <PermissionGate required={PERMISSIONS.TAXES_UPDATE}><AddTax /></PermissionGate> },
              { path: "default-tax-pref", element: <PermissionGate required={PERMISSIONS.TAXES_CONFIGURE}><DefaultTaxPreference /></PermissionGate> },
              { path: "gst-settings", element: <PermissionGate required={PERMISSIONS.TAXES_CONFIGURE}><GSTSettings /></PermissionGate> },
            ]
          },

          { path: "user-management", element: <PermissionGate required={PERMISSIONS.USERS_VIEW}><UserManagement /></PermissionGate> },
          { path: "user-management/add-user", element: <PermissionGate required={PERMISSIONS.USERS_CREATE}><AddUser /></PermissionGate> },
          { path: "user-management/add-user/:editUsername", element: <PermissionGate required={PERMISSIONS.USERS_UPDATE}><AddUser /></PermissionGate> },
          { path: "activity-logs", element: <PermissionGate required={PERMISSIONS.ACTIVITY_LOGS_VIEW}><AdminActivityLog /></PermissionGate> },
          { path: "roles", element: <PermissionGate required={PERMISSIONS.ROLES_VIEW}><RoleManagement /></PermissionGate> },
          { path: "reminder-policies", element: <PermissionGate required={PERMISSIONS.REMINDER_POLICIES_VIEW}><ReminderPolicies /></PermissionGate> },
          { path: "email-templates", element: <PermissionGate required={PERMISSIONS.EMAIL_TEMPLATES_VIEW}><EmailTemplates /></PermissionGate> },
          { path: "notification-logs", element: <PermissionGate required={PERMISSIONS.NOTIFICATION_LOGS_VIEW}><NotificationLogs /></PermissionGate> },
          { path: "quick-tools", element: <PermissionGate required={PERMISSIONS.QUICK_TOOLS_MANAGE}><QuickToolsAdmin /></PermissionGate> },
          { path: "dashboard-settings", element: <PermissionGate required={PERMISSIONS.DASHBOARD_CONFIGURE}><DashboardSettings /></PermissionGate> },
          { path: "teams", element: <PermissionGate required={PERMISSIONS.TEAMS_MANAGE}><TeamsSettings /></PermissionGate> },
          { path: "appearance", element: <AppearanceSettings /> },
          { path: "developer-controls", element: <PermissionGate required={PERMISSIONS.DEVELOPER_CONTROLS}><DeveloperControls /></PermissionGate> },
        ]
      },

      { path: "help", element: <HelpPage /> },

      // 403 Forbidden
      { path: "forbidden", element: <ForbiddenPage /> },

      // Catch-all for 404 within dashboard
      { path: "*", element: <NotFoundPage /> },
    ]
  },
  // 403 Forbidden (outside dashboard)
  { path: "/forbidden", element: <ForbiddenPage /> },
  // Catch-all for 404 outside dashboard
  { path: "*", element: <NotFoundPage /> }
]);

export default router;
