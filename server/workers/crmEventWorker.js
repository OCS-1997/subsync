import { Worker } from 'bullmq';
import { crmEventsQueue, redisConnection } from '../queues/queueConfig.js';
import appDB from '../db/subsyncDB.js';
import { 
    invalidateDomainsCache, 
    invalidateServicesCache, 
    invalidateSubscriptionsCache,
    invalidateCustomerCache 
} from '../services/crmCacheService.js';

async function processCrmEvent(job) {
    const { eventId, payload } = job.data;
    const { event, entity, entityId, data } = payload;

    console.log(`[CrmEventWorker] Processing event ${eventId}: ${event} for ${entity} ${entityId}...`);

    // Ensure database connection is tested/ready (redundancy check)
    const currentTime = new Date();

    try {
        if (event === 'customer.created') {
            // Check if customer already exists
            const [existing] = await appDB.query("SELECT 1 FROM customers WHERE customer_id = ? LIMIT 1", [entityId]);
            if (existing.length === 0) {
                const customerAddress = JSON.stringify(data.address || {});
                const otherContacts = JSON.stringify(data.contactPersons || []);
                const paymentTerms = JSON.stringify(data.payment_terms || { term_name: "Due on Receipt", days: 0, is_default: true });

                await appDB.query(`
                    INSERT INTO customers (
                        customer_id, salutation, first_name, last_name, primary_email, secondary_email,
                        country_code, primary_phone_number, secondary_phone_number, customer_address,
                        other_contacts, company_name, display_name, gst_in, currency_code, gst_treatment,
                        tax_preference, exemption_reason, payment_terms, notes, customer_status,
                        last_synced_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    entityId, data.salutation || 'Mr.', data.firstName || '', data.lastName || '', data.primaryEmail || data.email,
                    data.secondaryEmail || data.secondary_email || null, data.countryCode || data.country_code || '+91',
                    data.primaryPhone || data.phoneNumber || '', data.secondaryPhone || data.secondaryPhoneNumber || null,
                    customerAddress, otherContacts, data.companyName, data.displayName, data.gstin || data.gst_in || '',
                    data.currencyCode || 'INR', data.gstTreatment || 'iGST', data.taxPreference || 'Taxable',
                    data.exemptionReason || '', paymentTerms, data.notes || '', data.status || 'Active',
                    currentTime
                ]);
                console.log(`[CrmEventWorker] Successfully created customer: ${entityId}`);
            }
        } 
        else if (event === 'customer.updated') {
            // Update ONLY the allowed fields: displayName, companyName, primaryEmail, secondaryEmail, primaryPhone, secondaryPhone, status, lastSyncedAt
            const [existing] = await appDB.query("SELECT 1 FROM customers WHERE customer_id = ? LIMIT 1", [entityId]);
            if (existing.length > 0) {
                await appDB.query(`
                    UPDATE customers SET 
                        display_name = ?,
                        company_name = ?,
                        primary_email = ?,
                        secondary_email = ?,
                        primary_phone_number = ?,
                        secondary_phone_number = ?,
                        customer_status = ?,
                        last_synced_at = ?
                    WHERE customer_id = ?
                `, [
                    data.displayName,
                    data.companyName,
                    data.primaryEmail || data.email,
                    data.secondaryEmail || data.secondary_email || null,
                    data.primaryPhone || data.phoneNumber,
                    data.secondaryPhone || data.secondaryPhoneNumber || null,
                    data.status || 'Active',
                    currentTime,
                    entityId
                ]);
                console.log(`[CrmEventWorker] Successfully updated customer: ${entityId}`);
            } else {
                console.warn(`[CrmEventWorker] Customer ${entityId} not found for update. Skipping update.`);
            }
            // Invalidate cached customer profile
            await invalidateCustomerCache(entityId);
        } 
        else if (event === 'customer.activated') {
            await appDB.query(
                "UPDATE customers SET customer_status = 'Active', last_synced_at = ? WHERE customer_id = ?",
                [currentTime, entityId]
            );
            console.log(`[CrmEventWorker] Activated customer: ${entityId}`);
            await invalidateCustomerCache(entityId);
        } 
        else if (event === 'customer.deactivated') {
            await appDB.query(
                "UPDATE customers SET customer_status = 'Inactive', last_synced_at = ? WHERE customer_id = ?",
                [currentTime, entityId]
            );
            console.log(`[CrmEventWorker] Deactivated customer: ${entityId}`);
            await invalidateCustomerCache(entityId);
        }
        else if (event.startsWith('domain.')) {
            // Invalidate domains cache
            // EntityId should be the customerId, or if it is domainId, the payload should contain customerId
            const customerId = data.customerId || entityId;
            await invalidateDomainsCache(customerId);
            console.log(`[CrmEventWorker] Handled domain event and invalidated cache for customer: ${customerId}`);
        }
        else if (event.startsWith('service.')) {
            // Invalidate services cache
            const customerId = data.customerId || entityId;
            await invalidateServicesCache(customerId);
            console.log(`[CrmEventWorker] Handled service event and invalidated cache for customer: ${customerId}`);
        }
        else if (event.startsWith('subscription.')) {
            // Invalidate subscriptions cache
            const customerId = data.customerId || entityId;
            await invalidateSubscriptionsCache(customerId);
            console.log(`[CrmEventWorker] Handled subscription event and invalidated cache for customer: ${customerId}`);
        }

        // 3. Log success in crm_sync_logs
        await appDB.query(`
            INSERT INTO crm_sync_logs (event_id, entity, entity_id, status, processed_at, errors)
            VALUES (?, ?, ?, 'success', ?, NULL)
            ON DUPLICATE KEY UPDATE status = 'success', processed_at = ?, errors = NULL
        `, [eventId, entity, entityId, currentTime, currentTime]);

    } catch (error) {
        console.error(`[CrmEventWorker] Error processing event ${eventId}:`, error);

        // 4. Log failure in crm_sync_logs
        try {
            await appDB.query(`
                INSERT INTO crm_sync_logs (event_id, entity, entity_id, status, processed_at, errors)
                VALUES (?, ?, ?, 'failed', ?, ?)
                ON DUPLICATE KEY UPDATE status = 'failed', processed_at = ?, errors = ?
            `, [eventId, entity, entityId, currentTime, error.message, currentTime, error.message]);
        } catch (dbErr) {
            console.error('[CrmEventWorker] Failed to write failure log to DB:', dbErr);
        }

        // Re-throw so BullMQ triggers a retry
        throw error;
    }
}

export function createCrmEventWorker() {
    const concurrency = parseInt(process.env.CRM_WORKER_CONCURRENCY || '5', 10);
    const worker = new Worker(
        crmEventsQueue.name,
        async (job) => {
            return await processCrmEvent(job);
        },
        {
            connection: redisConnection,
            concurrency: concurrency,
        }
    );

    worker.on('completed', (job) => {
        console.log(`[CrmEventWorker] Job ${job.id} completed successfully.`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[CrmEventWorker] Job ${job?.id} failed: ${err.message}`);
    });

    worker.on('error', (err) => {
        console.error('[CrmEventWorker] General worker error:', err);
    });

    console.log(`CRM Event worker started with concurrency: ${concurrency}`);
    return worker;
}
