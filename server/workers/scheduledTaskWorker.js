import { Worker } from 'bullmq';
import { scheduledTasksQueue, redisConnection } from '../queues/queueConfig.js';
import { reconciliationCron, archiveOldSubscriptions } from '../services/reminderService.js';
import { sendTodayBirthdayEmails } from '../services/birthdayService.js';
import { sendDailyDcrReportEmail } from '../services/dcrService.js';
import { sendDailyTimeTrackingReports } from '../services/timeTrackingReportService.js';
import { syncBirthdays } from '../models/birthdayModel.js';
import { syncDirectory } from '../services/directoryService.js';
import { sendAppraisalReminders } from '../services/appraisalService.js';

const WORKER_CONCURRENCY = parseInt(process.env.SCHEDULED_TASK_CONCURRENCY || '1', 10);

/**
 * Process scheduled systemic tasks
 * @param {Object} job 
 */
async function processScheduledTask(job) {
    const { taskName, params } = job.data;
    console.log(`[ScheduledTaskWorker] Processing task: ${taskName} (Job ID: ${job.id})`);

    try {
        let result;
        switch (taskName) {
            case 'reconciliation':
                result = await reconciliationCron();
                break;
            case 'archival':
                const delayDays = params?.delayDays || parseInt(process.env.ARCHIVAL_DELAY_DAYS || '30', 10);
                result = await archiveOldSubscriptions(delayDays);
                break;
            case 'birthday_emails':
                result = await sendTodayBirthdayEmails();
                break;
            case 'dcr_daily_report':
                const reportDate = params?.reportDate ? new Date(params.reportDate) : null;
                result = await sendDailyDcrReportEmail(reportDate);
                break;
            case 'time_tracking_report':
                result = await sendDailyTimeTrackingReports(new Date());
                break;
            case 'birthday_sync':
                result = await syncBirthdays();
                break;
            case 'directory_sync':
                result = await syncDirectory();
                break;
            case 'appraisal_reminders':
                result = await sendAppraisalReminders();
                break;
            default:
                throw new Error(`Unknown task name: ${taskName}`);
        }

        console.log(`[ScheduledTaskWorker] Task ${taskName} completed successfully`, result);
        return result;
    } catch (error) {
        console.error(`[ScheduledTaskWorker] Task ${taskName} failed:`, error);
        throw error;
    }
}

/**
 * Create and start the scheduled task worker
 * @returns {Worker}
 */
export function createScheduledTaskWorker() {
    const worker = new Worker(
        scheduledTasksQueue.name,
        async (job) => {
            return await processScheduledTask(job);
        },
        {
            connection: redisConnection,
            concurrency: WORKER_CONCURRENCY,
        }
    );

    worker.on('completed', (job) => {
        console.log(`[ScheduledTaskWorker] Job ${job.id} (${job.data.taskName}) completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[ScheduledTaskWorker] Job ${job?.id} (${job?.data?.taskName}) failed: ${err.message}`);
    });

    worker.on('error', (err) => {
        console.error('[ScheduledTaskWorker] Worker error:', err);
    });

    console.log(`Scheduled task worker started with concurrency: ${WORKER_CONCURRENCY}`);
    return worker;
}
