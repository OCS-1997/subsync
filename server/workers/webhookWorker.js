import { Worker } from 'bullmq';
import { webhookDeliveryQueue, redisConnection } from '../queues/queueConfig.js';
import appDB from '../db/subsyncDB.js';
import crypto from 'crypto';

/**
 * Worker to process outbound webhook events delivery to the Helpdesk.
 */

async function processWebhookDelivery(job) {
    const { eventId } = job.data;
    console.log(`[WebhookWorker] Processing event ${eventId} (attempt ${job.attemptsMade + 1})...`);

    // 1. Fetch the event record from database
    const [events] = await appDB.query("SELECT * FROM webhook_events WHERE event_id = ?", [eventId]);
    if (events.length === 0) {
        throw new Error(`Webhook event not found in history: ${eventId}`);
    }
    const eventRecord = events[0];

    // 2. Fetch active helpdesk settings
    const [settings] = await appDB.query("SELECT * FROM helpdesk_settings LIMIT 1");
    if (settings.length === 0) {
        throw new Error("Helpdesk Integration Settings not found in database.");
    }
    const { helpdesk_url, webhook_secret } = settings[0];

    if (!helpdesk_url) {
        throw new Error("Helpdesk integration URL is empty/not configured.");
    }

    const payload = typeof eventRecord.payload === 'string' ? JSON.parse(eventRecord.payload) : eventRecord.payload;

    // 3. Compute headers
    const timestamp = Date.now().toString();
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    const signature = crypto.createHmac('sha256', webhook_secret)
        .update(message)
        .digest('hex');

    // 4. Update the event history: increment attempts and set state to retrying
    await appDB.query(
        "UPDATE webhook_events SET attempts = attempts + 1, delivery_status = 'retrying' WHERE event_id = ?",
        [eventId]
    );

    let responseStatus = null;
    let responseBody = null;
    let errorMessage = null;

    try {
        console.log(`[WebhookWorker] POST to ${helpdesk_url} with event: ${payload.event}`);
        
        const response = await fetch(helpdesk_url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature,
                'X-Timestamp': timestamp
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000) // 10s timeout
        });

        responseStatus = response.status;
        responseBody = await response.text();

        if (response.ok) {
            // Success! Update event status to success
            await appDB.query(
                "UPDATE webhook_events SET delivery_status = 'success' WHERE event_id = ?",
                [eventId]
            );

            // Log attempt
            await appDB.query(
                "INSERT INTO webhook_delivery_logs (event_id, attempt, request_url, response_status, response_body) VALUES (?, ?, ?, ?, ?)",
                [eventId, job.attemptsMade + 1, helpdesk_url, responseStatus, responseBody.substring(0, 2000)]
            );

            console.log(`[WebhookWorker] Event ${eventId} delivered successfully! Status: ${responseStatus}`);
            return { success: true, status: responseStatus };
        } else {
            throw new Error(`Helpdesk server returned error status ${responseStatus}: ${responseBody.substring(0, 500)}`);
        }
    } catch (err) {
        errorMessage = err.message;
        console.error(`[WebhookWorker] Error sending event ${eventId}:`, errorMessage);

        // Log failed attempt
        await appDB.query(
            "INSERT INTO webhook_delivery_logs (event_id, attempt, request_url, response_status, response_body, error_message) VALUES (?, ?, ?, ?, ?, ?)",
            [
                eventId,
                job.attemptsMade + 1,
                helpdesk_url,
                responseStatus,
                responseBody ? responseBody.substring(0, 2000) : null,
                errorMessage
            ]
        );

        // Check if we have exhausted all attempts
        const maxAttempts = job.opts.attempts || 5;
        if (job.attemptsMade + 1 >= maxAttempts) {
            await appDB.query(
                "UPDATE webhook_events SET delivery_status = 'failed' WHERE event_id = ?",
                [eventId]
            );
        }

        // Re-throw to trigger BullMQ retry
        throw err;
    }
}

/**
 * Creates and returns the Webhook Worker instance.
 */
export function createWebhookWorker() {
    const concurrency = parseInt(process.env.WEBHOOK_WORKER_CONCURRENCY || '5', 10);
    const worker = new Worker(
        webhookDeliveryQueue.name,
        async (job) => {
            return await processWebhookDelivery(job);
        },
        {
            connection: redisConnection,
            concurrency: concurrency,
        }
    );

    worker.on('completed', (job) => {
        console.log(`[WebhookWorker] Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[WebhookWorker] Job ${job?.id} failed after attempts: ${err.message}`);
    });

    worker.on('error', (err) => {
        console.error('[WebhookWorker] General worker error:', err);
    });

    console.log(`Webhook worker started with concurrency: ${concurrency}`);
    return worker;
}
