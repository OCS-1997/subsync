import {
    getRenewalsWithFilters,
    getExpiredServices,
    getExpiringTodayCount
} from '../models/dashboardModel.js';
import { getUpcomingBirthdays } from '../models/birthdayModel.js';

/**
 * GET /api/dashboard
 * Get dashboard data - simplified for Renewals focus
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

        res.json({
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
