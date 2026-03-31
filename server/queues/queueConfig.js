import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis connection configuration
export const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    // Only include password if it's set and not empty
    ...(process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== ''
        ? { password: process.env.REDIS_PASSWORD.trim() }
        : {}),
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
};

// Create Redis client for direct operations if needed
export const redisClient = new Redis(redisConnection);

// Add connection event handlers for debugging
redisClient.on('connect', () => {
    console.log('✅ Redis Client Connected');
});

redisClient.on('ready', () => {
    console.log('✅ Redis Client Ready');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
    if (err.message.includes('NOAUTH')) {
        console.error('💡 Redis authentication error. Check REDIS_PASSWORD in .env file matches Redis requirepass setting.');
    }
});

redisClient.on('close', () => {
    console.log('⚠️ Redis Client Connection Closed');
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis Client Reconnecting...');
});

// Queue names
export const QUEUE_NAMES = {
    SUBSCRIPTION_REMINDERS: 'subscriptionReminders',
    PDF_GENERATION: 'pdfGeneration',
    BACKUP_TASKS: 'backupTasks',
    SCHEDULED_TASKS: 'scheduledTasks',
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

export const backupTasksQueue = new Queue(QUEUE_NAMES.BACKUP_TASKS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 300000, // 5 minutes
        },
        removeOnComplete: {
            age: 2 * 24 * 3600, // Keep completed jobs for 2 days
            count: 100,
        },
        removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
    },
});

export const scheduledTasksQueue = new Queue(QUEUE_NAMES.SCHEDULED_TASKS, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 60000,
        },
        removeOnComplete: {
            age: 7 * 24 * 3600,
            count: 500,
        },
        removeOnFail: {
            age: 30 * 24 * 3600,
        },
    },
});

// Queue events for monitoring
export const subscriptionRemindersQueueEvents = new QueueEvents(QUEUE_NAMES.SUBSCRIPTION_REMINDERS, {
    connection: redisConnection,
});


// Helper function to get queue by name
export function getQueueByName(queueName) {
    switch (queueName) {
        case QUEUE_NAMES.SUBSCRIPTION_REMINDERS:
            return subscriptionRemindersQueue;
        case QUEUE_NAMES.PDF_GENERATION:
            return pdfGenerationQueue;
        case QUEUE_NAMES.BACKUP_TASKS:
            return backupTasksQueue;
        case QUEUE_NAMES.SCHEDULED_TASKS:
            return scheduledTasksQueue;
        default:
            throw new Error(`Unknown queue name: ${queueName}`);
    }
}

// Graceful shutdown
export async function closeQueues() {
    await Promise.all([
        subscriptionRemindersQueue.close(),
        pdfGenerationQueue.close(),
        backupTasksQueue.close(),
        scheduledTasksQueue.close(),
        subscriptionRemindersQueueEvents.close(),
        redisClient.quit(),
    ]);
}

