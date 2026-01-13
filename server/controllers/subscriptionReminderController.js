import { renewSubscription, enqueueReminders } from '../services/reminderService.js';
import { getSubscriptionById } from '../models/subscriptionModel.js';
import { logActivity } from '../models/activityLogModel.js';
import appDB from '../db/subsyncDB.js';

/**
 * POST /api/subscriptions/:id/renew
 * Renew a subscription and enqueue new reminders
 */
export const renewSubscriptionController = async (req, res) => {
    try {
        const { id } = req.params;
        const { end_date } = req.body;
        const userId = req.user?.id || null;

        if (!end_date) {
            return res.status(400).json({ error: 'end_date is required' });
        }

        const result = await renewSubscription(id, end_date, userId);

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'RENEW_SUBSCRIPTION',
                resourceType: 'Subscription',
                resourceId: id,
                ipAddress: req.ip,
                details: { end_date },
            });
        }

        res.json({ message: result.message, success: true });
    } catch (error) {
        console.error('Error renewing subscription:', error);
        res.status(500).json({ error: error.message || 'Failed to renew subscription' });
    }
};

/**
 * POST /api/subscriptions/:id/archive
 * Archive a subscription
 */
export const archiveSubscriptionController = async (req, res) => {
    try {
        const { id } = req.params;

        const subscription = await getSubscriptionById(id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        // Archive subscription - only set archived_at, don't change status
        // Status remains as is (active/paused/cancelled) since ENUM doesn't include 'archived'
        await appDB.query(`
            UPDATE subscriptions
            SET archived_at = NOW(),
                updated_at = NOW()
            WHERE sub_id = ?
        `, [id]);

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'ARCHIVE_SUBSCRIPTION',
                resourceType: 'Subscription',
                resourceId: id,
                ipAddress: req.ip,
            });
        }

        res.json({ message: 'Subscription archived successfully' });
    } catch (error) {
        console.error('Error archiving subscription:', error);
        res.status(500).json({ error: error.message || 'Failed to archive subscription' });
    }
};

/**
 * POST /api/subscriptions/:id/unarchive
 * Unarchive a subscription and restore it to active status
 */
export const unarchiveSubscriptionController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || null;

        const subscription = await getSubscriptionById(id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        if (!subscription.archived_at) {
            return res.status(400).json({ error: 'Subscription is not archived' });
        }

        // Unarchive subscription - set archived_at to NULL
        await appDB.query(`
            UPDATE subscriptions
            SET archived_at = NULL,
                updated_at = NOW()
            WHERE sub_id = ?
        `, [id]);

        // Re-enqueue reminders if subscription hasn't expired
        const now = new Date();
        const endDate = new Date(subscription.end_date);
        if (endDate > now) {
            try {
                await enqueueReminders(id, userId);
            } catch (reminderError) {
                console.error('Error re-enqueueing reminders after unarchive:', reminderError);
                // Don't fail the unarchive if reminder enqueueing fails
            }
        }

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'UNARCHIVE_SUBSCRIPTION',
                resourceType: 'Subscription',
                resourceId: id,
                ipAddress: req.ip,
            });
        }

        res.json({ message: 'Subscription unarchived successfully' });
    } catch (error) {
        console.error('Error unarchiving subscription:', error);
        res.status(500).json({ error: error.message || 'Failed to unarchive subscription' });
    }
};

/**
 * POST /api/subscriptions/:id/enqueue-reminders
 * Manually enqueue reminders for a subscription
 */
export const enqueueRemindersController = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || null;

        const subscription = await getSubscriptionById(id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const result = await enqueueReminders(id, userId);

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'ENQUEUE_REMINDERS',
                resourceType: 'Subscription',
                resourceId: id,
                ipAddress: req.ip,
            });
        }

        res.json({
            message: `Enqueued ${result.enqueued} reminder(s)`,
            enqueued: result.enqueued,
            cancelled: result.cancelled,
        });
    } catch (error) {
        console.error('Error enqueueing reminders:', error);
        res.status(500).json({ error: error.message || 'Failed to enqueue reminders' });
    }
};

