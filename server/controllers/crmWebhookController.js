import appDB from '../db/subsyncDB.js';
import { crmEventsQueue } from '../queues/queueConfig.js';

export const handleCrmEvent = async (req, res) => {
    try {
        const payload = req.body || {};
        const eventId = payload.eventId || payload.event_id;
        const event = payload.event || payload.eventType || payload.event_type;
        const entity = payload.entity || (event ? event.split('.')[0] : 'unknown');
        const entityId = payload.entityId || payload.entity_id || (payload.data ? (payload.data.customerId || payload.data.customer_id || payload.data.domainId || payload.data.domain_id || payload.data.subscriptionId || payload.data.sub_id) : 'unknown');
        const data = payload.data || payload.payload || payload;

        if (!eventId) {
            return res.status(400).json({ success: false, error: 'eventId is required' });
        }

        if (!event) {
            return res.status(400).json({ success: false, error: 'event type is required' });
        }

        // 1. Check idempotency: ignore duplicate eventIds
        const [existing] = await appDB.query("SELECT status FROM crm_sync_logs WHERE event_id = ? LIMIT 1", [eventId]);
        if (existing.length > 0) {
            console.log(`[CrmWebhookController] Duplicate event detected. Ignoring: ${eventId}`);
            return res.status(200).json({ 
                success: true, 
                message: 'Event already processed or queued', 
                status: existing[0].status 
            });
        }

        // 2. Log event in crm_sync_logs as pending
        await appDB.query(`
            INSERT INTO crm_sync_logs (event_id, entity, entity_id, status, received_at)
            VALUES (?, ?, ?, 'pending', NOW())
        `, [eventId, entity, entityId]);

        // 3. Queue the event in BullMQ
        await crmEventsQueue.add(
            'processCrmEvent',
            {
                eventId,
                payload: {
                    event,
                    entity,
                    entityId,
                    data
                }
            }
        );

        console.log(`[CrmWebhookController] Enqueued event ${eventId} (${event}) successfully.`);

        // 4. Return success immediately (never fail API because processing fails)
        return res.status(202).json({
            success: true,
            message: 'Event accepted and queued for processing',
            eventId
        });

    } catch (error) {
        console.error('[CrmWebhookController] Error handling CRM event:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const getCrmSyncLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const [logs] = await appDB.query(
            "SELECT event_id AS eventId, entity, entity_id AS entityId, status, received_at AS receivedAt, processed_at AS processedAt, errors FROM crm_sync_logs ORDER BY received_at DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );

        const [[{ total }]] = await appDB.query("SELECT COUNT(*) as total FROM crm_sync_logs");
        const totalPages = Math.ceil(total / limit);

        return res.status(200).json({
            success: true,
            logs,
            pagination: {
                totalRecords: total,
                totalPages,
                page,
                limit
            }
        });
    } catch (error) {
        console.error('[CrmWebhookController] Error fetching crm sync logs:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch crm sync logs.' });
    }
};
