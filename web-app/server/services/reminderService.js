import { subscriptionRemindersQueue } from '../queues/queueConfig.js';
import { getReminderPolicyById, getDefaultReminderPolicy, getActivePolicyOffsets } from '../models/reminderPolicyModel.js';
import { getSubscriptionById } from '../models/subscriptionModel.js';
import { isNotificationSent, upsertNotificationLog } from '../models/notificationLogModel.js';
import appDB from '../db/subsyncDB.js';

/**
 * Convert IST time to UTC for scheduling
 * IST is UTC+5:30, so 18:00 IST = 12:30 UTC
 * @param {Date} istDate
 * @returns {Date}
 */
function istToUtc(istDate) {
    // IST is UTC+5:30
    const utcDate = new Date(istDate);
    utcDate.setHours(utcDate.getHours() - 5);
    utcDate.setMinutes(utcDate.getMinutes() - 30);
    return utcDate;
}

/**
 * Convert UTC to IST
 * @param {Date} utcDate
 * @returns {Date}
 */
function utcToIst(utcDate) {
    const istDate = new Date(utcDate);
    istDate.setHours(istDate.getHours() + 5);
    istDate.setMinutes(istDate.getMinutes() + 30);
    return istDate;
}

/**
 * Enqueue reminder jobs for a subscription based on its reminder policy
 * @param {string} subscriptionId
 * @param {number|null} userId User ID who triggered this (for logging)
 * @returns {Promise<{enqueued: number, cancelled: number}>}
 */
export async function enqueueReminders(subscriptionId, userId = null) {
    try {
        const subscription = await getSubscriptionById(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        // Skip if subscription is archived
        if (subscription.archived_at) {
            return { enqueued: 0, cancelled: 0 };
        }

        // For never-expiring subscriptions, use the calculated end_date (start_date + repeat_every) for scheduling reminders
        // They will receive reminder emails but will NOT be archived or auto-renewed
        let effectiveEndDate = subscription.end_date;

        if (subscription.never_expires === 1) {
            // Calculate virtual end date from start_date + repeat_every for reminder scheduling
            if (!subscription.start_date) {
                console.warn(`Subscription ${subscriptionId} never expires but has no start_date, skipping reminder scheduling`);
                return { enqueued: 0, cancelled: 0 };
            }

            if (!subscription.repeat_every_value || !subscription.repeat_every_unit) {
                console.warn(`Subscription ${subscriptionId} never expires but has no repeat_every, skipping reminder scheduling`);
                return { enqueued: 0, cancelled: 0 };
            }

            // Calculate virtual end date: start_date + repeat_every
            const startDateObj = new Date(subscription.start_date);
            const calculatedEnd = new Date(startDateObj);
            const value = parseInt(subscription.repeat_every_value, 10);

            if (subscription.repeat_every_unit === 'days') {
                calculatedEnd.setDate(calculatedEnd.getDate() + value);
            } else if (subscription.repeat_every_unit === 'weeks') {
                calculatedEnd.setDate(calculatedEnd.getDate() + (value * 7));
            } else if (subscription.repeat_every_unit === 'months') {
                calculatedEnd.setMonth(calculatedEnd.getMonth() + value);
            } else if (subscription.repeat_every_unit === 'years') {
                calculatedEnd.setFullYear(calculatedEnd.getFullYear() + value);
            }

            effectiveEndDate = calculatedEnd.toISOString().slice(0, 19).replace('T', ' ');
            console.log(`Subscription ${subscriptionId} never expires, using calculated end_date ${effectiveEndDate} for reminder scheduling`);
        }

        if (!effectiveEndDate) {
            console.warn(`Subscription ${subscriptionId} has no end_date, skipping reminder scheduling`);
            return { enqueued: 0, cancelled: 0 };
        }

        // Get reminder policy
        let policy = null;
        if (subscription.reminder_policy_id) {
            policy = await getReminderPolicyById(subscription.reminder_policy_id);
        }

        if (!policy) {
            policy = await getDefaultReminderPolicy();
        }

        if (!policy) {
            console.warn(`No reminder policy found for subscription ${subscriptionId}`);
            return { enqueued: 0, cancelled: 0 };
        }

        // Get active offsets
        const offsets = await getActivePolicyOffsets(policy.id);
        if (offsets.length === 0) {
            console.warn(`No active offsets found for policy ${policy.id}`);
            return { enqueued: 0, cancelled: 0 };
        }

        // Cancel existing pending jobs for this subscription
        await cancelPendingReminderJobs(subscriptionId);

        const endDate = new Date(effectiveEndDate);
        const now = new Date();
        let enqueued = 0;

        // Enqueue jobs for each offset
        for (const offset of offsets) {
            // Calculate runAt: end_date + days_offset
            const runAt = new Date(endDate);
            runAt.setDate(runAt.getDate() + offset.days_offset);

            // Only enqueue if runAt is in the future
            if (runAt <= now) {
                // If in the past, check if we should still send (within last 7 days)
                const daysPast = Math.floor((now.getTime() - runAt.getTime()) / (1000 * 60 * 60 * 24));
                if (daysPast > 7) {
                    continue; // Too old, skip
                }
            }

            // Check idempotency: has this notification already been sent?
            const alreadySent = await isNotificationSent(subscriptionId, offset.template_key, runAt);
            if (alreadySent) {
                console.log(`Notification already sent for ${subscriptionId}, ${offset.template_key}, ${runAt.toISOString()}`);
                continue;
            }

            // Calculate delay in milliseconds
            const delay = Math.max(0, runAt.getTime() - now.getTime());

            // Create job payload
            const jobPayload = {
                subscriptionId,
                templateKey: offset.template_key,
                runAtISO: runAt.toISOString(),
                createdBy: userId,
            };

            // Add job to queue
            await subscriptionRemindersQueue.add(
                'send_reminder',
                jobPayload,
                {
                    delay,
                    jobId: `reminder_${subscriptionId}_${offset.template_key}_${runAt.toISOString().split('T')[0]}`,
                }
            );

            // Log as queued
            await upsertNotificationLog({
                subscription_id: subscriptionId,
                template_key: offset.template_key,
                sent_at: runAt,
                status: 'queued',
                user_id: userId,
                attempt: 0,
            });

            enqueued++;
        }

        return { enqueued, cancelled: 0 };
    } catch (error) {
        console.error(`Error enqueueing reminders for ${subscriptionId}:`, error);
        throw error;
    }
}

/**
 * Cancel pending reminder jobs for a subscription
 * @param {string} subscriptionId
 * @returns {Promise<number>} Number of jobs cancelled
 */
export async function cancelPendingReminderJobs(subscriptionId) {
    try {
        // Get all jobs in the queue
        const jobs = await subscriptionRemindersQueue.getJobs(['delayed', 'waiting']);

        let cancelled = 0;
        for (const job of jobs) {
            if (job.data.subscriptionId === subscriptionId) {
                await job.remove();
                cancelled++;
            }
        }

        return cancelled;
    } catch (error) {
        console.error(`Error cancelling pending jobs for ${subscriptionId}:`, error);
        throw error;
    }
}

/**
 * Reconciliation cron: Check for missing reminders and enqueue them
 * @returns {Promise<{checked: number, enqueued: number}>}
 */
export async function reconciliationCron() {
    try {
        const now = new Date();
        const maxOffsetDays = 60; // Check subscriptions expiring within 60 days

        // Get all active subscriptions with end_date in the range
        // Include never-expiring subscriptions - they use calculated end_date for reminder scheduling
        const [subscriptions] = await appDB.query(`
            SELECT 
                s.sub_id,
                s.end_date,
                s.start_date,
                s.repeat_every_value,
                s.repeat_every_unit,
                s.reminder_policy_id,
                s.archived_at,
                s.never_expires
            FROM subscriptions s
            WHERE s.archived_at IS NULL
                AND (
                    (s.never_expires = 0 AND s.end_date IS NOT NULL
                     AND s.end_date >= DATE_SUB(?, INTERVAL ? DAY)
                     AND s.end_date <= DATE_ADD(?, INTERVAL ? DAY))
                    OR
                    (s.never_expires = 1 AND s.start_date IS NOT NULL 
                     AND s.repeat_every_value IS NOT NULL AND s.repeat_every_unit IS NOT NULL)
                )
        `, [now, maxOffsetDays, now, maxOffsetDays]);

        let checked = 0;
        let enqueued = 0;

        for (const sub of subscriptions) {
            checked++;

            // Get policy
            let policy = null;
            if (sub.reminder_policy_id) {
                policy = await getReminderPolicyById(sub.reminder_policy_id);
            }
            if (!policy) {
                policy = await getDefaultReminderPolicy();
            }
            if (!policy) continue;

            // Get active offsets
            const offsets = await getActivePolicyOffsets(policy.id);

            // Calculate effective end date (for never-expiring, use calculated date)
            let effectiveEndDate = sub.end_date;
            if (sub.never_expires === 1 && sub.start_date && sub.repeat_every_value && sub.repeat_every_unit) {
                const startDateObj = new Date(sub.start_date);
                const calculatedEnd = new Date(startDateObj);
                const value = parseInt(sub.repeat_every_value, 10);

                if (sub.repeat_every_unit === 'days') {
                    calculatedEnd.setDate(calculatedEnd.getDate() + value);
                } else if (sub.repeat_every_unit === 'weeks') {
                    calculatedEnd.setDate(calculatedEnd.getDate() + (value * 7));
                } else if (sub.repeat_every_unit === 'months') {
                    calculatedEnd.setMonth(calculatedEnd.getMonth() + value);
                } else if (sub.repeat_every_unit === 'years') {
                    calculatedEnd.setFullYear(calculatedEnd.getFullYear() + value);
                }

                effectiveEndDate = calculatedEnd.toISOString().slice(0, 19).replace('T', ' ');
            }

            if (!effectiveEndDate) {
                continue; // Skip if no effective end date
            }

            const endDate = new Date(effectiveEndDate);

            // Check each offset
            for (const offset of offsets) {
                const runAt = new Date(endDate);
                runAt.setDate(runAt.getDate() + offset.days_offset);

                // Check if notification should have been sent (within last 7 days or future)
                const daysDiff = Math.floor((runAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff < -7 || daysDiff > 60) {
                    continue; // Too old or too far in future
                }

                // Check if already sent
                const alreadySent = await isNotificationSent(sub.sub_id, offset.template_key, runAt);
                if (alreadySent) {
                    continue;
                }

                // Check if job already exists
                const jobs = await subscriptionRemindersQueue.getJobs(['delayed', 'waiting', 'active']);
                const jobExists = jobs.some(job =>
                    job.data.subscriptionId === sub.sub_id &&
                    job.data.templateKey === offset.template_key &&
                    job.data.runAtISO === runAt.toISOString()
                );

                if (jobExists) {
                    continue;
                }

                // Enqueue missing job
                const delay = Math.max(0, runAt.getTime() - now.getTime());
                await subscriptionRemindersQueue.add(
                    'send_reminder',
                    {
                        subscriptionId: sub.sub_id,
                        templateKey: offset.template_key,
                        runAtISO: runAt.toISOString(),
                        createdBy: null,
                    },
                    {
                        delay,
                        jobId: `reminder_${sub.sub_id}_${offset.template_key}_${runAt.toISOString().split('T')[0]}`,
                    }
                );

                await upsertNotificationLog({
                    subscription_id: sub.sub_id,
                    template_key: offset.template_key,
                    sent_at: runAt,
                    status: 'queued',
                    user_id: null,
                    attempt: 0,
                });

                enqueued++;
            }
        }

        return { checked, enqueued };
    } catch (error) {
        console.error('Error in reconciliation cron:', error);
        throw error;
    }
}

/**
 * Archive old subscriptions
 * @param {number} archivalDelayDays Default 30
 * @returns {Promise<{archived: number}>}
 */
export async function archiveOldSubscriptions(archivalDelayDays = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - archivalDelayDays);

        // Archive subscriptions - only set archived_at, don't change status
        const [result] = await appDB.query(`
            UPDATE subscriptions
            SET archived_at = NOW()
            WHERE archived_at IS NULL
                AND end_date IS NOT NULL
                AND end_date <= ?
                AND never_expires = 0
        `, [cutoffDate]);

        return { archived: result.affectedRows || 0 };
    } catch (error) {
        console.error('Error archiving old subscriptions:', error);
        throw error;
    }
}

/**
 * Renew a subscription: update end_date and enqueue new reminders
 * @param {string} subscriptionId
 * @param {Date|string} newEndDate
 * @param {number|null} userId
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function renewSubscription(subscriptionId, newEndDate, userId = null) {
    try {
        const subscription = await getSubscriptionById(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        const endDate = newEndDate instanceof Date ? newEndDate : new Date(newEndDate);

        // Update subscription end_date and unarchive if archived
        await appDB.query(`
            UPDATE subscriptions
            SET end_date = ?,
                archived_at = NULL,
                updated_at = NOW()
            WHERE sub_id = ?
        `, [endDate, subscriptionId]);

        // Cancel old pending jobs
        await cancelPendingReminderJobs(subscriptionId);

        // Enqueue new reminders
        const { enqueued } = await enqueueReminders(subscriptionId, userId);

        return {
            success: true,
            message: `Subscription renewed. ${enqueued} reminders enqueued.`,
        };
    } catch (error) {
        console.error(`Error renewing subscription ${subscriptionId}:`, error);
        throw error;
    }
}

