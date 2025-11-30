import { Worker } from 'bullmq';
import { dcrDailyReportQueue } from '../queues/queueConfig.js';
import { generateAndSendDailyReport } from '../services/dcrService.js';
import { upsertNotificationLog } from '../models/notificationLogModel.js';
import {redisConnection} from '../queues/queueConfig.js';

const WORKER_CONCURRENCY = 1; // Process one report at a time

/**
 * Process DCR daily report job
 * @param {Object} job
 * @returns {Promise<Object>}
 */
async function processDcrReportJob(job) {
    const { date } = job.data;
    const reportDate = date || new Date().toISOString().split('T')[0];

    console.log(`Processing DCR daily report for date: ${reportDate}`);

    try {
        const result = await generateAndSendDailyReport(reportDate);

        if (!result.success) {
            throw new Error(result.error || 'Failed to send DCR report');
        }

        console.log(`DCR daily report sent successfully for ${reportDate}:`, {
            totalCalls: result.totalCalls,
            totalTime: result.totalTimeHours
        });

        return {
            success: true,
            date: reportDate,
            totalCalls: result.totalCalls,
            totalTime: result.totalTimeHours
        };
    } catch (error) {
        console.error(`Error processing DCR report for ${reportDate}:`, error);

        // Log to notification_logs
        await upsertNotificationLog({
            subscription_id: 'DCR_DAILY_REPORT',
            template_key: 'dcr_daily_report',
            sent_at: new Date(),
            status: 'failed',
            error: error.message || 'Unknown error',
            attempt: job.attemptsMade || 0
        });

        throw error; // Re-throw to trigger retry
    }
}

/**
 * Create and start DCR report worker
 * @returns {Worker}
 */
export function createDcrReportWorker() {
    const worker = new Worker(
        dcrDailyReportQueue.name,
        async (job) => {
            return await processDcrReportJob(job);
        },
        {
            connection: redisConnection,
            concurrency: WORKER_CONCURRENCY,
            removeOnComplete: {
                age: 7 * 24 * 3600, // 7 days
                count: 100,
            },
            removeOnFail: {
                age: 30 * 24 * 3600, // 30 days
            },
        }
    );

    // Event handlers
    worker.on('completed', (job) => {
        console.log(JSON.stringify({
            event: 'dcr_report_completed',
            jobId: job.id,
            date: job.data.date,
        }));
    });

    worker.on('failed', async (job, err) => {
        console.error(JSON.stringify({
            event: 'dcr_report_failed',
            jobId: job?.id,
            date: job?.data?.date,
            error: err.message,
            attempts: job?.attemptsMade || 0,
        }));

        // Log to notification_logs
        if (job) {
            await upsertNotificationLog({
                subscription_id: 'DCR_DAILY_REPORT',
                template_key: 'dcr_daily_report',
                sent_at: new Date(),
                status: 'failed',
                error: err.message || 'Unknown error',
                attempt: job.attemptsMade || 0
            });
        }
    });

    worker.on('error', (error) => {
        console.error('DCR report worker error:', error);
    });

    return worker;
}

