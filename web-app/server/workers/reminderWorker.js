import { Worker } from 'bullmq';
import { subscriptionRemindersQueue } from '../queues/queueConfig.js';
import { sendReminderEmail } from '../services/emailService.js';
import { upsertNotificationLog, logFailedJob } from '../models/notificationLogModel.js';
import { isNotificationSent } from '../models/notificationLogModel.js';
import {redisConnection} from '../queues/queueConfig.js';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '10', 10);

/**
 * Process reminder job
 * @param {Object} job
 * @returns {Promise<void>}
 */
async function processReminderJob(job) {
    const { subscriptionId, templateKey, runAtISO, createdBy } = job.data;
    const runAt = new Date(runAtISO);
    const attempt = job.attemptsMade + 1;

    console.log(JSON.stringify({
        jobId: job.id,
        subscriptionId,
        templateKey,
        runAtISO,
        attempt,
        status: 'processing',
    }));

    try {
        // Idempotency check: has this notification already been sent?
        const alreadySent = await isNotificationSent(subscriptionId, templateKey, runAt);
        if (alreadySent) {
            console.log(JSON.stringify({
                jobId: job.id,
                subscriptionId,
                templateKey,
                runAtISO,
                attempt,
                status: 'skipped',
                reason: 'already_sent',
            }));

            await upsertNotificationLog({
                subscription_id: subscriptionId,
                template_key: templateKey,
                sent_at: runAt,
                status: 'skipped',
                user_id: createdBy,
                attempt,
                error: 'Notification already sent (idempotency check)',
            });

            return; // Job completed successfully (skipped)
        }

        // Send reminder email (invoices embedded in email body, no PDF attachments)
        const result = await sendReminderEmail(subscriptionId, templateKey, runAt, {
            attachInvoice: false, // Invoices are embedded in email HTML, not attached as PDFs
        });

        if (result.success) {
            // Log success
            await upsertNotificationLog({
                subscription_id: subscriptionId,
                template_key: templateKey,
                sent_at: runAt,
                status: 'sent',
                user_id: createdBy,
                provider_id: result.providerId,
                attempt,
                error: null,
            });

            console.log(JSON.stringify({
                jobId: job.id,
                subscriptionId,
                templateKey,
                runAtISO,
                attempt,
                status: 'sent',
                providerId: result.providerId,
            }));
        } else {
            // Log failure
            await upsertNotificationLog({
                subscription_id: subscriptionId,
                template_key: templateKey,
                sent_at: runAt,
                status: 'failed',
                user_id: createdBy,
                attempt,
                error: result.error,
            });

            console.error(JSON.stringify({
                jobId: job.id,
                subscriptionId,
                templateKey,
                runAtISO,
                attempt,
                status: 'failed',
                error: result.error,
            }));

            // Throw error to trigger retry
            throw new Error(result.error || 'Failed to send email');
        }
    } catch (error) {
        // Log error
        await upsertNotificationLog({
            subscription_id: subscriptionId,
            template_key: templateKey,
            sent_at: runAt,
            status: 'failed',
            user_id: createdBy,
            attempt,
            error: error.message || 'Unknown error',
        });

        console.error(JSON.stringify({
            jobId: job.id,
            subscriptionId,
            templateKey,
            runAtISO,
            attempt,
            status: 'error',
            error: error.message,
        }));

        throw error; // Re-throw to trigger retry
    }
}

/**
 * Create and start reminder worker
 * @returns {Worker}
 */
export function createReminderWorker() {
    const worker = new Worker(
        subscriptionRemindersQueue.name,
        async (job) => {
            return await processReminderJob(job);
        },
        {
            connection: redisConnection,
            concurrency: WORKER_CONCURRENCY,
            removeOnComplete: {
                age: 7 * 24 * 3600, // 7 days
                count: 1000,
            },
            removeOnFail: {
                age: 30 * 24 * 3600, // 30 days
            },
        }
    );

    // Event handlers
    worker.on('completed', (job) => {
        console.log(JSON.stringify({
            event: 'job_completed',
            jobId: job.id,
            subscriptionId: job.data.subscriptionId,
            templateKey: job.data.templateKey,
        }));
    });

    worker.on('failed', async (job, err) => {
        console.error(JSON.stringify({
            event: 'job_failed',
            jobId: job?.id,
            subscriptionId: job?.data?.subscriptionId,
            templateKey: job?.data?.templateKey,
            error: err.message,
            attempts: job?.attemptsMade,
        }));

        // If job exhausted all retries, log to failed_jobs table
        if (job && job.attemptsMade >= (job.opts?.attempts || 5)) {
            try {
                await logFailedJob({
                    job_name: 'send_reminder',
                    payload: job.data,
                    error: err.message,
                    attempts: job.attemptsMade,
                });

                // Optionally send alert to ops (webhook, email, etc.)
                if (process.env.ADMIN_EMAILS) {
                    const adminEmails = process.env.ADMIN_EMAILS.split(',');
                    console.warn(`Alert: Job ${job.id} failed after ${job.attemptsMade} attempts. Admins: ${adminEmails.join(', ')}`);
                    // In production, you might want to send an email or webhook notification here
                }
            } catch (logError) {
                console.error('Error logging failed job:', logError);
            }
        }
    });

    worker.on('error', (err) => {
        console.error('Worker error:', err);
    });

    console.log(`Reminder worker started with concurrency: ${WORKER_CONCURRENCY}`);

    return worker;
}

