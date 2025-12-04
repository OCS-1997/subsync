import express from 'express';
import { isAuthenticated, authorize } from '../middlewares/auth.js';
import { validateLogin, logoutUser } from '../controllers/loginController.js';

import { createCustomer, updateCustomerDetails, fetchAllCustomers, fetchAllCustomerDetails, customerDetailsByID, importCustomers, addCustomerContactController } from '../controllers/customerController.js';
import { getPaymentTerms, getPaymentTerm, createPaymentTerm, updatePaymentTermById, deletePaymentTermById, setDefaultPaymentTerm } from '../controllers/paymentTermsController.js';
import { createDomain, updateDomainDetails, fetchAllDomains, domainDetailsByID, importDomains, getDomainDetailsForDcr } from '../controllers/domainController.js';
import { createDcr, getDcrList, getDcrById, updateDcr, deleteDcr, getWeekMeta, getDcrStats, getDcrUsers } from '../controllers/dcrController.js';
import { createContact, getContacts, getContactById, updateContact, deleteContact, createContactFromDcrController, getContactByIdController } from '../controllers/contactController.js';
import { createServiceController, getAllServicesController, getServiceByIdController, updateServiceController, deleteServiceController } from '../controllers/serviceController.js';
import { createVendorController, getAllVendorsController, getVendorByIdController, updateVendorController, deleteVendorController } from "../controllers/vendorController.js";
import { createItemGroupController, getAllItemGroupsController, getItemGroupByIdController, updateItemGroupController, deleteItemGroupController } from "../controllers/itemGroupController.js";
import { getSubscriptionsController, createSubscription, getSubscriptionByIdController, updateSubscriptionController, deleteSubscriptionController, sendReminderController, getSubscriptionHistoryController } from '../controllers/subscriptionController.js';
import { renewSubscriptionController, archiveSubscriptionController, enqueueRemindersController } from '../controllers/subscriptionReminderController.js';
import { listReminderPoliciesController, getReminderPolicyController, createReminderPolicyController, updateReminderPolicyController, deleteReminderPolicyController } from '../controllers/reminderPolicyController.js';
import { listEmailTemplatesController, getEmailTemplateController, upsertEmailTemplateController, updateEmailTemplateController, deleteEmailTemplateController, previewEmailTemplateController } from '../controllers/emailTemplateController.js';
import { listNotificationLogsController, getNotificationLogController } from '../controllers/notificationLogController.js';
import { getAllTaxes, getTaxByIdController, createTax, editTax, deleteTax, getDefaultTaxPref, setDefaultTaxPref, getAllActiveTaxRates, getAllTaxGroupsController, getTaxGroupByIdController, createTaxGroupController, updateTaxGroupController, deleteTaxGroupController, getDefaultTaxPreferencesController, setDefaultTaxPreferencesController } from '../controllers/taxController.js';
import { getGSTSettingsController, updateGSTSettingsController } from '../controllers/gstSettingsController.js';
import { getallUsers, getUser, createUserController, updateUserController, deleteUserController } from '../controllers/userController.js';
import { getLogs } from '../controllers/activityLogController.js';
import { listRolesController, createRoleController, updateRoleController, deleteRoleController, assignPermissionsController, listPermissionsController } from '../controllers/rbacController.js';
import {
    getDashboardController,
    getRenewalsController,
    getExpiredServicesController,
    getBirthdaysController
} from '../controllers/dashboardController.js';
import {
    listToolsController,
    listAllToolsController,
    getToolController,
    createToolController,
    updateToolController,
    deleteToolController,
    previewUrlController
} from '../controllers/quickToolsController.js';
import { PERMISSIONS } from '../constants/permissions.js';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});

// Login/Logout
router.post('/login/user', validateLogin);
router.post('/logout', isAuthenticated, logoutUser);

// Customers
router.post('/create-customer', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_CREATE), createCustomer);
router.get('/all-customers', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_VIEW), fetchAllCustomers);
router.get('/customer/:cid', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_VIEW), customerDetailsByID);
router.get('/all-customer-details', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_VIEW), fetchAllCustomerDetails);
router.put('/update-customer/:cid', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_UPDATE), updateCustomerDetails);
router.post('/import-customers', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_CREATE), importCustomers);
router.post('/customer/:cid/contacts', isAuthenticated, authorize(PERMISSIONS.CUSTOMERS_UPDATE), addCustomerContactController);

// Payment Terms
router.get('/payment-terms', isAuthenticated, authorize(PERMISSIONS.SETTINGS_MANAGE), getPaymentTerms);
router.get('/payment-terms/:id', isAuthenticated, authorize(PERMISSIONS.SETTINGS_MANAGE), getPaymentTerm);
router.post('/payment-terms', isAuthenticated, authorize(PERMISSIONS.SETTINGS_MANAGE), createPaymentTerm);
router.put('/payment-terms/:id', isAuthenticated, authorize(PERMISSIONS.SETTINGS_MANAGE), updatePaymentTermById);
router.delete('/payment-terms/:id', isAuthenticated, authorize(PERMISSIONS.SETTINGS_MANAGE), deletePaymentTermById);
router.put('/payment-terms/:id/default', isAuthenticated, authorize(PERMISSIONS.SETTINGS_MANAGE), setDefaultPaymentTerm)

//Domain
router.post('/create-domain', isAuthenticated, authorize(PERMISSIONS.DOMAINS_CREATE), createDomain);
router.put('/update-domain/:did', isAuthenticated, authorize(PERMISSIONS.DOMAINS_UPDATE), updateDomainDetails);
router.get('/all-domains', isAuthenticated, authorize(PERMISSIONS.DOMAINS_VIEW), fetchAllDomains);
router.get('/all-domain-details', isAuthenticated, authorize(PERMISSIONS.DOMAINS_VIEW), domainDetailsByID);
router.post('/import-domains', isAuthenticated, authorize(PERMISSIONS.DOMAINS_CREATE), importDomains);
router.get('/domains/:id/details', isAuthenticated, authorize(PERMISSIONS.DOMAINS_VIEW), getDomainDetailsForDcr);

// Services
router.get('/all-services', isAuthenticated, authorize(PERMISSIONS.SERVICES_VIEW), getAllServicesController);
router.post('/create-service', isAuthenticated, authorize(PERMISSIONS.SERVICES_CREATE), createServiceController);
router.get('/service/:id', isAuthenticated, authorize(PERMISSIONS.SERVICES_VIEW), getServiceByIdController);
router.put('/update-service/:id', isAuthenticated, authorize(PERMISSIONS.SERVICES_UPDATE), updateServiceController);
router.delete('/delete-service/:id', isAuthenticated, authorize(PERMISSIONS.SERVICES_DELETE), deleteServiceController);

// Vendors
router.post('/create-vendor', isAuthenticated, authorize(PERMISSIONS.VENDORS_CREATE), createVendorController);
router.get('/get-vendor/:id', isAuthenticated, authorize(PERMISSIONS.VENDORS_VIEW), getVendorByIdController);
router.get('/all-vendors', isAuthenticated, authorize(PERMISSIONS.VENDORS_VIEW), getAllVendorsController);
router.put('/update-vendor/:id', isAuthenticated, authorize(PERMISSIONS.VENDORS_UPDATE), updateVendorController);
router.delete('/delete-vendor/:id', isAuthenticated, authorize(PERMISSIONS.VENDORS_DELETE), deleteVendorController);

// Item Groups
router.post('/create-item-group', isAuthenticated, authorize(PERMISSIONS.SERVICES_CREATE), createItemGroupController);
router.get('/get-item-group/:id', isAuthenticated, authorize(PERMISSIONS.SERVICES_VIEW), getItemGroupByIdController);
router.get('/all-item-groups', isAuthenticated, authorize(PERMISSIONS.SERVICES_VIEW), getAllItemGroupsController);
router.put('/update-item-group/:id', isAuthenticated, authorize(PERMISSIONS.SERVICES_UPDATE), updateItemGroupController);
router.delete('/delete-item-group/:id', isAuthenticated, authorize(PERMISSIONS.SERVICES_DELETE), deleteItemGroupController);

// Subscriptions
router.post('/subscription/:id/reminder', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_SEND_REMINDER), sendReminderController);
router.get('/subscriptions', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_VIEW), getSubscriptionsController);
router.post('/subscriptions', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_CREATE), createSubscription);
router.get('/subscriptions/:id', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_VIEW), getSubscriptionByIdController);
router.get('/subscriptions/:id/history', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_VIEW), getSubscriptionHistoryController);
router.put('/subscriptions/:id', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_UPDATE), updateSubscriptionController);
router.delete('/subscriptions/:id', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_DELETE), deleteSubscriptionController);
router.post('/subscriptions/:id/renew', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_UPDATE), renewSubscriptionController);
router.post('/subscriptions/:id/archive', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_UPDATE), archiveSubscriptionController);
router.post('/subscriptions/:id/enqueue-reminders', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_SEND_REMINDER), enqueueRemindersController);

// Reminder Policies
router.get('/reminder-policies', isAuthenticated, authorize(PERMISSIONS.REMINDER_POLICIES_VIEW), listReminderPoliciesController);
router.get('/reminder-policies/:id', isAuthenticated, authorize(PERMISSIONS.REMINDER_POLICIES_VIEW), getReminderPolicyController);
router.post('/reminder-policies', isAuthenticated, authorize(PERMISSIONS.REMINDER_POLICIES_CREATE), createReminderPolicyController);
router.put('/reminder-policies/:id', isAuthenticated, authorize(PERMISSIONS.REMINDER_POLICIES_UPDATE), updateReminderPolicyController);
router.delete('/reminder-policies/:id', isAuthenticated, authorize(PERMISSIONS.REMINDER_POLICIES_DELETE), deleteReminderPolicyController);

// Email Templates
router.get('/email-templates', isAuthenticated, authorize(PERMISSIONS.EMAIL_TEMPLATES_VIEW), listEmailTemplatesController);
router.get('/email-templates/:id', isAuthenticated, authorize(PERMISSIONS.EMAIL_TEMPLATES_VIEW), getEmailTemplateController);
router.post('/email-templates', isAuthenticated, authorize(PERMISSIONS.EMAIL_TEMPLATES_CREATE), upsertEmailTemplateController);
router.put('/email-templates/:id', isAuthenticated, authorize(PERMISSIONS.EMAIL_TEMPLATES_UPDATE), updateEmailTemplateController);
router.delete('/email-templates/:id', isAuthenticated, authorize(PERMISSIONS.EMAIL_TEMPLATES_DELETE), deleteEmailTemplateController);
router.post('/email-templates/:id/preview', isAuthenticated, authorize(PERMISSIONS.EMAIL_TEMPLATES_VIEW), previewEmailTemplateController);

// Notification Logs
router.get('/notification-logs', isAuthenticated, authorize(PERMISSIONS.NOTIFICATION_LOGS_VIEW), listNotificationLogsController);
router.get('/notification-logs/:id', isAuthenticated, authorize(PERMISSIONS.NOTIFICATION_LOGS_VIEW), getNotificationLogController);

// Taxes Rates
router.get('/all-taxes', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getAllTaxes);
router.get('/tax/:id', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getTaxByIdController);
router.post('/add-tax', isAuthenticated, authorize(PERMISSIONS.TAXES_CREATE), createTax);
router.put('/edit-tax/:id', isAuthenticated, authorize(PERMISSIONS.TAXES_UPDATE), editTax);
router.delete('/delete-tax/:id', isAuthenticated, authorize(PERMISSIONS.TAXES_DELETE), deleteTax);
router.get('/default-tax-preference', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getDefaultTaxPref);
router.post('/set-default-tax-preference', isAuthenticated, authorize(PERMISSIONS.TAXES_CONFIGURE), setDefaultTaxPref);
router.get('/tax-rates', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getAllActiveTaxRates);

// Tax Groups
router.get('/tax-groups', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getAllTaxGroupsController);
router.get('/tax-groups/:id', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getTaxGroupByIdController);
router.post('/tax-groups', isAuthenticated, authorize(PERMISSIONS.TAXES_CREATE), createTaxGroupController);
router.put('/tax-groups/:id', isAuthenticated, authorize(PERMISSIONS.TAXES_UPDATE), updateTaxGroupController);
router.delete('/tax-groups/:id', isAuthenticated, authorize(PERMISSIONS.TAXES_DELETE), deleteTaxGroupController);

// New default intra/inter preferences
router.get('/default-tax-preferences', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getDefaultTaxPreferencesController);
router.post('/default-tax-preferences', isAuthenticated, authorize(PERMISSIONS.TAXES_CONFIGURE), setDefaultTaxPreferencesController);

// GST Settings
router.get('/get-gst-settings', isAuthenticated, authorize(PERMISSIONS.TAXES_VIEW), getGSTSettingsController);
router.put('/update-gst-settings', isAuthenticated, authorize(PERMISSIONS.TAXES_CONFIGURE), updateGSTSettingsController);

// User Management
router.get('/users', isAuthenticated, authorize(PERMISSIONS.USERS_VIEW), getallUsers);
// Allow self-view without USERS_VIEW permission (handled in controller)
router.get('/users/:username', isAuthenticated, getUser);
router.post('/users', isAuthenticated, authorize([PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_ASSIGN_ROLES]), createUserController);
// Allow self-updates without USERS_UPDATE permission (handled in controller)
router.put('/users/:username', isAuthenticated, updateUserController);
router.delete('/users/:username', isAuthenticated, authorize(PERMISSIONS.USERS_DELETE), deleteUserController);

// Activity Logs (admin only)
router.get('/activity-logs', isAuthenticated, authorize(PERMISSIONS.ACTIVITY_LOGS_VIEW), getLogs);

// RBAC Management
router.get('/rbac/roles', isAuthenticated, authorize(PERMISSIONS.ROLES_VIEW), listRolesController);
router.post('/rbac/roles', isAuthenticated, authorize(PERMISSIONS.ROLES_CREATE), createRoleController);
router.put('/rbac/roles/:roleId', isAuthenticated, authorize(PERMISSIONS.ROLES_UPDATE), updateRoleController);
router.delete('/rbac/roles/:roleId', isAuthenticated, authorize(PERMISSIONS.ROLES_DELETE), deleteRoleController);
router.put('/rbac/roles/:roleId/permissions', isAuthenticated, authorize(PERMISSIONS.ROLES_ASSIGN_PERMISSIONS), assignPermissionsController);
router.get('/rbac/permissions', isAuthenticated, authorize(PERMISSIONS.ROLES_VIEW), listPermissionsController);

// Dashboard
router.get('/dashboard', isAuthenticated, authorize(PERMISSIONS.DASHBOARD_VIEW), getDashboardController);
router.get('/dashboard/renewals', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_VIEW), getRenewalsController);
router.get('/dashboard/expired-services', isAuthenticated, authorize(PERMISSIONS.SUBSCRIPTIONS_VIEW), getExpiredServicesController);
router.get('/dashboard/birthdays', isAuthenticated, authorize(PERMISSIONS.DASHBOARD_VIEW), getBirthdaysController);

// Quick Tools
router.get('/quick-tools', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_VIEW), listToolsController);
router.get('/quick-tools/all', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_MANAGE), listAllToolsController);
router.get('/quick-tools/:id', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_MANAGE), getToolController);
router.post('/quick-tools', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_MANAGE), createToolController);
router.put('/quick-tools/:id', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_MANAGE), updateToolController);
router.delete('/quick-tools/:id', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_MANAGE), deleteToolController);
router.post('/quick-tools/preview', isAuthenticated, authorize(PERMISSIONS.QUICK_TOOLS_MANAGE), previewUrlController);

// DCR (Daily Call Report)
router.post('/dcr', isAuthenticated, authorize(PERMISSIONS.DCR_CREATE), createDcr);
router.get('/dcr', isAuthenticated, authorize(PERMISSIONS.DCR_VIEW), getDcrList);
router.get('/dcr/week-meta', isAuthenticated, authorize(PERMISSIONS.DCR_VIEW), getWeekMeta);
router.get('/dcr/stats', isAuthenticated, authorize(PERMISSIONS.DCR_VIEW), getDcrStats);
router.get('/dcr/users', isAuthenticated, authorize(PERMISSIONS.DCR_VIEW), getDcrUsers);
router.get('/dcr/:id', isAuthenticated, authorize(PERMISSIONS.DCR_VIEW), getDcrById);
router.put('/dcr/:id', isAuthenticated, authorize(PERMISSIONS.DCR_UPDATE), updateDcr);
router.delete('/dcr/:id', isAuthenticated, authorize(PERMISSIONS.DCR_DELETE), deleteDcr);



// Contacts
router.get('/contacts', isAuthenticated, authorize(PERMISSIONS.CONTACTS_VIEW), getContacts);
router.post('/contacts', isAuthenticated, authorize(PERMISSIONS.CONTACTS_CREATE), createContact);
router.get('/contacts/:id', isAuthenticated, authorize(PERMISSIONS.CONTACTS_VIEW), getContactById);
router.put('/contacts/:id', isAuthenticated, authorize(PERMISSIONS.CONTACTS_UPDATE), updateContact);
router.delete('/contacts/:id', isAuthenticated, authorize(PERMISSIONS.CONTACTS_DELETE), deleteContact);

// Contacts (DCR integration - keeping for compatibility)
router.post('/contacts/from-dcr', isAuthenticated, authorize(PERMISSIONS.DCR_CREATE), createContactFromDcrController);


export default router;
