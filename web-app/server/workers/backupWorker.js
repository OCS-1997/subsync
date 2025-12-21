import { Worker } from 'bullmq';
import { backupTasksQueue, redisConnection } from '../queues/queueConfig.js';
import { triggerBackup } from '../services/backupService.js';

const WORKER_CONCURRENCY = parseInt(process.env.BACKUP_WORKER_CONCURRENCY || '2', 10);

/**
 * Process backup task job
 * @param {Object} job
 * @returns {Promise<void>}
 */
async function processBackupJob(job) {
    const { configId, triggeredBy } = job.data;
    const attempt = job.attemptsMade + 1;

    console.log(JSON.stringify({
        jobId: job.id,
        configId,
        triggeredBy,
        attempt,
        status: 'processing',
        timestamp: new Date().toISOString()
    }));

    try {
        const result = await triggerBackup(configId);

        if (result.success) {
            console.log(JSON.stringify({
                jobId: job.id,
                configId,
                status: 'completed',
                historyId: result.historyId,
                timestamp: new Date().toISOString()
            }));
        } else {
            console.error(JSON.stringify({
                jobId: job.id,
                configId,
                status: 'failed',
                error: result.error,
                timestamp: new Date().toISOString()
            }));
            throw new Error(result.error || 'Backup execution failed');
        }
    } catch (error) {
        console.error(JSON.stringify({
            jobId: job.id,
            configId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        }));
        throw error;
    }
}

/**
 * Create and start backup worker
 * @returns {Worker}
 */
export function createBackupWorker() {
    const worker = new Worker(
        backupTasksQueue.name,
        async (job) => {
            return await processBackupJob(job);
        },
        {
            connection: redisConnection,
            concurrency: WORKER_CONCURRENCY,
            removeOnComplete: {
                age: 2 * 24 * 3600, // 2 days
                count: 100,
            },
            removeOnFail: {
                age: 7 * 24 * 3600, // 7 days
            },
        }
    );

    worker.on('completed', (job) => {
        console.log(`Backup job ${job.id} (Config: ${job.data.configId}) completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Backup job ${job?.id} (Config: ${job?.data?.configId}) failed: ${err.message}`);
    });

    worker.on('error', (err) => {
        console.error('Backup Worker error:', err);
    });

    console.log(`Backup worker started with concurrency: ${WORKER_CONCURRENCY}`);

    return worker;
}
