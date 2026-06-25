import appDB from '../db/subsyncDB.js';
import { generateID } from '../middlewares/generateID.js';
import { webhookDeliveryQueue } from '../queues/queueConfig.js';

/**
 * Publishes a customer event.
 * Creates an entry in webhook_events and adds a job to BullMQ for delivery.
 * 
 * @param {string} customerId 
 * @param {string} eventType - customer.created, customer.updated, customer.activated, customer.deactivated
 */
export async function publishCustomerEvent(customerId, eventType) {
    try {
        console.log(`[WebhookService] Publishing event: ${eventType} for customer: ${customerId}`);
        
        const eventId = generateID("EVT");
        const timestamp = new Date().toISOString();
        const payload = {
            event: eventType,
            customerId: customerId,
            timestamp: timestamp
        };

        // 1. Log event in DB
        await appDB.query(
            "INSERT INTO webhook_events (event_id, event_type, customer_id, payload, delivery_status) VALUES (?, ?, ?, ?, 'pending')",
            [eventId, eventType, customerId, JSON.stringify(payload)]
        );

        // 2. Fetch configured retry count from helpdesk_settings
        const [settings] = await appDB.query("SELECT retry_count FROM helpdesk_settings LIMIT 1");
        const retryCount = settings.length > 0 ? settings[0].retry_count : 5;

        // 3. Queue the delivery job in BullMQ
        await webhookDeliveryQueue.add(
            'deliverWebhook',
            { eventId },
            {
                attempts: retryCount,
                backoff: {
                    type: 'exponential',
                    delay: 5000 // 5s initial delay
                }
            }
        );

        console.log(`[WebhookService] Enqueued webhook job for event: ${eventId} (attempts: ${retryCount})`);
    } catch (error) {
        console.error(`[WebhookService] Error publishing customer event ${eventType} for customer ${customerId}:`, error);
    }
}
