import appDB from '../db/subsyncDB.js';
import { generateID } from '../middlewares/generateID.js';
import { webhookDeliveryQueue } from '../queues/queueConfig.js';

/**
 * Generic Helpdesk Event Publisher.
 *
 * Publishes a domain event to the Helpdesk after a successful CRM CRUD operation.
 * Caller is responsible for only calling this AFTER the database transaction has committed.
 *
 * Payload schema (matches Helpdesk crm-queue.service.ts expectations):
 * {
 *   eventId: string,
 *   event: string,           // e.g. "domain.created"
 *   entityType: string,      // e.g. "domain"
 *   entityId: string,        // CRM entity ID
 *   crmCustomerId: string,   // Always required for cache/DB targeting
 *   timestamp: string,
 *   version: 1,
 *   data: { ...entityFields }
 * }
 *
 * @param {string} entityType  - "customer" | "domain" | "subscription" | "service"
 * @param {string} eventType   - e.g. "domain.created", "subscription.cancelled"
 * @param {string} crmCustomerId - The CRM customer this entity belongs to
 * @param {string} entityId    - The primary entity ID (domain ID, subscription ID, etc.)
 * @param {object} data        - Entity payload (fields relevant to the Helpdesk)
 */
export async function publishHelpdeskEvent(entityType, eventType, crmCustomerId, entityId, data = {}) {
    try {
        console.log(`[WebhookService] Publishing event: ${eventType} for ${entityType} ${entityId} (customer: ${crmCustomerId})`);

        const eventId = generateID('EVT');
        const timestamp = new Date().toISOString();

        const payload = {
            eventId,
            event: eventType,
            entityType,
            entityId: String(entityId),
            crmCustomerId: String(crmCustomerId),
            timestamp,
            version: 1,
            data: {
                ...data,
                crmCustomerId: String(crmCustomerId),
            },
        };

        // 1. Persist event record in DB
        await appDB.query(
            "INSERT INTO webhook_events (event_id, event_type, customer_id, payload, delivery_status) VALUES (?, ?, ?, ?, 'pending')",
            [eventId, eventType, crmCustomerId, JSON.stringify(payload)]
        );

        // 2. Fetch configured retry count from helpdesk_settings
        const [settings] = await appDB.query('SELECT retry_count FROM helpdesk_settings LIMIT 1');
        const retryCount = settings.length > 0 ? settings[0].retry_count : 5;

        // 3. Enqueue delivery to BullMQ (exponential backoff, configurable retries)
        await webhookDeliveryQueue.add(
            'deliverWebhook',
            { eventId },
            {
                attempts: retryCount,
                backoff: {
                    type: 'exponential',
                    delay: 5000, // 5s initial delay
                },
            }
        );

        console.log(`[WebhookService] Enqueued webhook job for event: ${eventId} (${eventType}, attempts: ${retryCount})`);
    } catch (error) {
        // Never crash the CRM CRUD operation because of webhook publishing failure.
        // Log and continue — Helpdesk will eventually re-sync via scheduled import.
        console.error(`[WebhookService] Error publishing event ${eventType} for ${entityType} ${entityId}:`, error);
    }
}

/**
 * Backward-compatible customer event publisher.
 * Thin wrapper over publishHelpdeskEvent for customer.* events.
 *
 * @param {string} customerId
 * @param {string} eventType - e.g. "customer.created", "customer.updated"
 * @param {object} data      - Optional extra fields to include in the payload
 */
export async function publishCustomerEvent(customerId, eventType, data = {}) {
    return publishHelpdeskEvent('customer', eventType, customerId, customerId, data);
}
