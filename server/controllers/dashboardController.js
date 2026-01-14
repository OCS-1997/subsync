import {
    getRenewalsWithFilters,
    getExpiredServices,
    getExpiringTodayCount,
    getDashboardStats
} from '../models/dashboardModel.js';
import { getUpcomingBirthdays } from '../models/birthdayModel.js';

/**
 * GET /api/dashboard
 * Get dashboard data - with stats for Overview
 */
export const getDashboardController = async (req, res) => {
    try {
        const user = req.user;
        const { filterType = 'today', startDate, endDate } = req.query;

        // Get renewals based on filter
        const renewals = await getRenewalsWithFilters({
            filterType,
            startDate,
            endDate
        });

        // Get expired services (with optional date filter)
        const expiredServices = await getExpiredServices({
            startDate: req.query.expiredStartDate,
            endDate: req.query.expiredEndDate
        });

        // Get expiring today count
        const expiringTodayCount = await getExpiringTodayCount();

        // Get birthdays
        const birthdays = await getUpcomingBirthdays();

        // Get dashboard stats
        const stats = await getDashboardStats();

        res.json({
            stats,
            renewals: {
                data: renewals,
                count: renewals.length,
                expiringTodayCount
            },
            expiredServices: {
                data: expiredServices,
                count: expiredServices.length
            },
            birthdays: birthdays
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch dashboard data' });
    }
};

/**
 * GET /api/dashboard/renewals
 * Get renewals with filters
 */
export const getRenewalsController = async (req, res) => {
    try {
        const { filterType = 'today', startDate, endDate } = req.query;
        const renewals = await getRenewalsWithFilters({ filterType, startDate, endDate });
        res.json(renewals);
    } catch (error) {
        console.error('Error fetching renewals:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch renewals' });
    }
};

/**
 * GET /api/dashboard/expired-services
 * Get expired services with date filter
 */
export const getExpiredServicesController = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const expired = await getExpiredServices({ startDate, endDate });
        res.json(expired);
    } catch (error) {
        console.error('Error fetching expired services:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch expired services' });
    }
};

/**
 * GET /api/dashboard/birthdays
 * Get upcoming birthdays
 */
export const getBirthdaysController = async (req, res) => {
    try {
        const birthdays = await getUpcomingBirthdays();
        res.json(birthdays);
    } catch (error) {
        console.error('Error fetching birthdays:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch birthdays' });
    }
};

/**
 * GET /api/dashboard/revenue-trend
 * Get monthly revenue trend for last 6 months
 */
export const getRevenueTrendController = async (req, res) => {
    try {
        const { getMonthlyRevenueTrend } = await import('../models/dashboardModel.js');
        const trend = await getMonthlyRevenueTrend();
        res.json(trend);
    } catch (error) {
        console.error('Error fetching revenue trend:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch revenue trend' });
    }
};

/**
 * GET /api/dashboard/config
 * Get user's visible tabs and widgets based on their role
 */
export const getDashboardConfigController = async (req, res) => {
    try {
        const { getDashboardConfig, getAllDashboardTabs, getAllDashboardWidgets } = await import('../models/dashboardModel.js');
        const roleId = req.user?.roleId;

        // If no role ID, return all tabs/widgets (fallback for admin or legacy users)
        if (!roleId) {
            const [tabs, widgets] = await Promise.all([
                getAllDashboardTabs(),
                getAllDashboardWidgets()
            ]);
            return res.json({
                tabs: tabs.map(t => ({ tabKey: t.tab_key, name: t.name, icon: t.icon })),
                widgets: widgets.map(w => w.widget_key)
            });
        }

        const config = await getDashboardConfig(roleId);
        res.json({
            tabs: config.tabs.map(t => ({ tabKey: t.tab_key, name: t.name, icon: t.icon })),
            widgets: config.widgets
        });
    } catch (error) {
        console.error('Error fetching dashboard config:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch dashboard config' });
    }
};

/**
 * GET /api/dashboard/admin/tabs
 * Get all tabs with permissions for a specific role (admin only)
 */
export const getAdminTabsController = async (req, res) => {
    try {
        const { roleId } = req.query;
        const { getAllDashboardTabs, getTabPermissionsForRole } = await import('../models/dashboardModel.js');

        if (roleId) {
            const permissions = await getTabPermissionsForRole(parseInt(roleId));
            return res.json(permissions);
        }

        const tabs = await getAllDashboardTabs();
        res.json(tabs);
    } catch (error) {
        console.error('Error fetching admin tabs:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch tabs' });
    }
};

/**
 * GET /api/dashboard/admin/widgets
 * Get all widgets with permissions for a specific role (admin only)
 */
export const getAdminWidgetsController = async (req, res) => {
    try {
        const { roleId } = req.query;
        const { getAllDashboardWidgets, getWidgetPermissionsForRole } = await import('../models/dashboardModel.js');

        if (roleId) {
            const permissions = await getWidgetPermissionsForRole(parseInt(roleId));
            return res.json(permissions);
        }

        const widgets = await getAllDashboardWidgets();
        res.json(widgets);
    } catch (error) {
        console.error('Error fetching admin widgets:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch widgets' });
    }
};

/**
 * PUT /api/dashboard/admin/role/:roleId/tabs
 * Update tab visibility for a role (admin only)
 */
export const updateRoleTabsController = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'permissions must be an array' });
        }

        const { setTabPermissionsForRole } = await import('../models/dashboardModel.js');
        await setTabPermissionsForRole(parseInt(roleId), permissions);

        res.json({ message: 'Tab permissions updated successfully' });
    } catch (error) {
        console.error('Error updating role tabs:', error);
        res.status(500).json({ error: error.message || 'Failed to update tab permissions' });
    }
};

/**
 * PUT /api/dashboard/admin/role/:roleId/widgets
 * Update widget visibility for a role (admin only)
 */
export const updateRoleWidgetsController = async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: 'permissions must be an array' });
        }

        const { setWidgetPermissionsForRole } = await import('../models/dashboardModel.js');
        await setWidgetPermissionsForRole(parseInt(roleId), permissions);

        res.json({ message: 'Widget permissions updated successfully' });
    } catch (error) {
        console.error('Error updating role widgets:', error);
        res.status(500).json({ error: error.message || 'Failed to update widget permissions' });
    }
};
