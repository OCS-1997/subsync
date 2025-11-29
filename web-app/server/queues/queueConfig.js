import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis connection configuration
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

// Create Redis client for direct operations if needed
export const redisClient = new Redis(redisConnection);

// Queue names
export const QUEUE_NAMES = {
    SUBSCRIPTION_REMINDERS: 'subscriptionReminders',
    DCR_DAILY_REPORT: 'dcrDailyReport',
    PDF_GENERATION: 'pdfGeneration',
};

// Create queues
export const subscriptionRemindersQueue = new Queue(QUEUE_NAMES.SUBSCRIPTION_REMINDERS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 60000, // Start with 1 minute
        },
        removeOnComplete: {
            age: 7 * 24 * 3600, // Keep completed jobs for 7 days
            count: 1000,
        },
        removeOnFail: {
            age: 30 * 24 * 3600, // Keep failed jobs for 30 days
        },
    },
});



export const pdfGenerationQueue = new Queue(QUEUE_NAMES.PDF_GENERATION, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 30000,
        },
    },
});

export const dcrDailyReportQueue = new Queue(QUEUE_NAMES.DCR_DAILY_REPORT, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 60000, // Start with 1 minute
        },
        removeOnComplete: {
            age: 7 * 24 * 3600, // Keep completed jobs for 7 days
            count: 100,
        },
        removeOnFail: {
            age: 30 * 24 * 3600, // Keep failed jobs for 30 days
        },
    },
});

// Queue events for monitoring
export const subscriptionRemindersQueueEvents = new QueueEvents(QUEUE_NAMES.SUBSCRIPTION_REMINDERS, {
    connection: redisConnection,
});

export const dcrDailyReportQueueEvents = new QueueEvents(QUEUE_NAMES.DCR_DAILY_REPORT, {
    connection: redisConnection,
});

// Helper function to get queue by name
export function getQueueByName(queueName) {
    switch (queueName) {
        case QUEUE_NAMES.SUBSCRIPTION_REMINDERS:
            return subscriptionRemindersQueue;
        case QUEUE_NAMES.DCR_DAILY_REPORT:
            return dcrDailyReportQueue;
        case QUEUE_NAMES.PDF_GENERATION:
            return pdfGenerationQueue;
        default:
            throw new Error(`Unknown queue name: ${queueName}`);
    }
}

// Graceful shutdown
export async function closeQueues() {
    await Promise.all([
        subscriptionRemindersQueue.close(),
        dcrDailyReportQueue.close(),
        pdfGenerationQueue.close(),
        subscriptionRemindersQueueEvents.close(),
        dcrDailyReportQueueEvents.close(),
        redisClient.quit(),
    ]);
}

