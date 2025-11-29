import { getNotificationLogs, getNotificationLogById } from '../models/notificationLogModel.js';

/**
 * GET /api/notification-logs
 * List notification logs with filters
 */
export const listNotificationLogsController = async (req, res) => {
    try {
        const {
            subscription_id,
            template_key,
            start_date,
            end_date,
            status,
            page = 1,
            limit = 50,
        } = req.query;

        const result = await getNotificationLogs({
            subscription_id,
            template_key,
            start_date,
            end_date,
            status,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching notification logs:', error);
        res.status(500).json({ error: 'Failed to fetch notification logs' });
    }
};

/**
 * GET /api/notification-logs/:id
 * Get notification log by ID
 */
export const getNotificationLogController = async (req, res) => {
    try {
        const { id } = req.params;
        const log = await getNotificationLogById(parseInt(id, 10));
        if (!log) {
            return res.status(404).json({ error: 'Notification log not found' });
        }
        res.json(log);
    } catch (error) {
        console.error('Error fetching notification log:', error);
        res.status(500).json({ error: 'Failed to fetch notification log' });
    }
};

