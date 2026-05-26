import { scheduledTasksQueue } from '../queues/queueConfig.js';

/**
 * Sync all scheduled (cron) tasks to BullMQ as repeatable jobs.
 * This replaces node-cron with BullMQ's built-in scheduling, allowing
 * monitoring and manual triggering from the Bull Board dashboard.
 */
export async function syncScheduledTasks() {
    try {
        // Clear existing repeatable jobs first to avoid duplicates or pattern mismatches
        const repeatableJobs = await scheduledTasksQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            await scheduledTasksQueue.removeRepeatableByKey(job.key);
        }

        // 1. Reconciliation Cron (Daily at 06:30 IST / 01:00 UTC)
        await scheduledTasksQueue.add(
            'reconciliation',
            { taskName: 'reconciliation' },
            {
                repeat: { pattern: '0 1 * * *', tz: 'UTC' }
            }
        );

        // 2. Archival Cron (Daily at 07:30 IST / 02:00 UTC)
        await scheduledTasksQueue.add(
            'archival',
            { 
                taskName: 'archival', 
                params: { delayDays: parseInt(process.env.ARCHIVAL_DELAY_DAYS || '30', 10) } 
            },
            {
                repeat: { pattern: '0 2 * * *', tz: 'UTC' }
            }
        );

        // 3. Birthday Email Cron (Daily at 14:30 IST / 09:00 UTC)
        await scheduledTasksQueue.add(
            'birthday_emails',
            { taskName: 'birthday_emails' },
            {
                repeat: { pattern: '0 9 * * *', tz: 'UTC' }
            }
        );

        // 4. DCR Daily Report Cron (Daily at 18:30 IST / 13:00 UTC)
        await scheduledTasksQueue.add(
            'dcr_daily_report',
            { taskName: 'dcr_daily_report' },
            {
                repeat: { pattern: '0 13 * * *', tz: 'UTC' }
            }
        );

        // 5. Daily Time Tracking Report (Daily at 00:00 IST / 18:30 UTC)
        await scheduledTasksQueue.add(
            'time_tracking_report',
            { taskName: 'time_tracking_report' },
            {
                repeat: { pattern: '30 18 * * *', tz: 'UTC' }
            }
        );

        // 6. Birthday Sync (Every 6 hours)
        await scheduledTasksQueue.add(
            'birthday_sync',
            { taskName: 'birthday_sync' },
            {
                repeat: { pattern: '0 0,6,12,18 * * *', tz: 'UTC' }
            }
        );

        // 7. Directory Sync (Every 4 hours)
        await scheduledTasksQueue.add(
            'directory_sync',
            { taskName: 'directory_sync' },
            {
                repeat: { pattern: '0 0,4,8,12,16,20 * * *', tz: 'UTC' }
            }
        );

        // 8. Appraisal Reminders (Daily at 09:30 IST / 04:00 UTC)
        await scheduledTasksQueue.add(
            'appraisal_reminders',
            { taskName: 'appraisal_reminders' },
            {
                repeat: { pattern: '0 4 * * *', tz: 'UTC' }
            }
        );

        console.log('✅ All scheduled tasks synced to BullMQ');
    } catch (error) {
        console.error('❌ Error syncing scheduled tasks to BullMQ:', error);
    }
}

/**
 * Setup all cron jobs (legacy wrapper for index.js)
 */
export function setupCronJobs() {
    syncScheduledTasks();
}

