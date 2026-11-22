import { renewSubscription, enqueueReminders } from '../services/reminderService.js';
import { getSubscriptionById } from '../models/subscriptionModel.js';
import { getCustomerById } from '../models/customerModel.js';
import { logActivity } from '../models/activityLogModel.js';
import { buildTemplateContext, renderEmailTemplate, sendReminderEmail, getSubscriptionItems } from '../services/emailService.js';
import appDB from '../db/subsyncDB.js';

/**
 * POST /api/subscriptions/:id/renewal-preview
 * Generate a preview of the renewal confirmation email
 */
export const previewRenewalEmailController = async (req, res) => {
    try {
        const { id } = req.params;
        const { end_date } = req.body || {};

        const subscription = await getSubscriptionById(id);
        if (!subscription) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        const customer = await getCustomerById(subscription.customer_id);
        const items = await getSubscriptionItems(id);

        const oldEndDateFormatted = subscription.end_date
            ? new Date(subscription.end_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';

        // Prepare simulated subscription with the target new end date
        const simulatedSub = { ...subscription };
        if (end_date) {
            simulatedSub.end_date = end_date;
        }

        const context = buildTemplateContext(simulatedSub, customer, items, new Date());
        context.renewal_date = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
        context.old_end_date = oldEndDateFormatted;

        const { subject, html } = await renderEmailTemplate('renewal_confirmation', context);

        let recipientEmail = '';
        if (subscription.email_list && Array.isArray(subscription.email_list) && subscription.email_list.length > 0) {
            recipientEmail = subscription.email_list.join(', ');
        } else if (customer?.primary_email) {
            recipientEmail = customer.primary_email;
        }

        res.json({
            success: true,
            subject,
            html,
            to: recipientEmail,
            customer_name: customer?.display_name || customer?.first_name || 'Customer',
            domain_name: subscription.domain_name,
            new_end_date: simulatedSub.end_date
        });
    } catch (error) {
        console.error('Error previewing renewal email:', error);
        res.status(500).json({ error: error.message || 'Failed to preview renewal email' });
    }
};

/**
 * POST /api/subscriptions/:id/renew
 * Renew a subscription, optionally send confirmation email, and enqueue new reminders
 */
export const renewSubscriptionController = async (req, res) => {
    try {
        const { id } = req.params;
        const { end_date, send_email = true, recipient_email = null, custom_subject = null } = req.body || {};
        const userId = req.user?.id || null;

        const subscription = await getSubscriptionById(id);
        const oldEndDateFormatted = subscription?.end_date
            ? new Date(subscription.end_date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
            : null;

        const result = await renewSubscription(id, end_date || null, userId);

        let emailResult = null;
        if (send_email) {
            try {
                emailResult = await sendReminderEmail(id, 'renewal_confirmation', new Date(), {
                    isManual: true,
                    to: recipient_email ? recipient_email.split(',').map(e => e.trim()).filter(Boolean) : undefined,
                    customSubject: custom_subject || undefined,
                    old_end_date: oldEndDateFormatted
                });
            } catch (err) {
                console.error('Error sending renewal confirmation email:', err);
                emailResult = { success: false, error: err.message };
            }
        }

        if (req.user?.username) {
            await logActivity({
                username: req.user.username,
                action: 'RENEW_SUBSCRIPTION',
                resourceType: 'Subscription',
                resourceId: id,
                ipAddress: req.ip,
                details: {
                    end_date: result.newEndDate,
                    enqueued: result.enqueued,
                    emailSent: emailResult ? emailResult.success : false,
                    recipient: recipient_email || undefined
                },
            });
        }

        res.json({
            message: result.message,
            success: true,
            newEndDate: result.newEndDate,
            enqueued: result.enqueued,
            emailSent: send_email ? (emailResult?.success || false) : false,
            emailError: emailResult && !emailResult.success ? emailResult.error : null
        });
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

