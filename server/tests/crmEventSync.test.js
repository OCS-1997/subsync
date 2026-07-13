import appDB from '../db/subsyncDB.js';
import assert from 'assert';
import crypto from 'crypto';
import { redisClient } from '../queues/queueConfig.js';
import { getOrFetchDomains } from '../services/crmCacheService.js';

// Setup Mock Request/Response or make real HTTP requests to the running server.
// Since nodemon index.js is running in the background on port 3000, we can make real HTTP requests!
const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log("==================================================");
    console.log("STARTING CRM REAL-TIME EVENT SYNC & CACHE DIAGNOSTICS");
    console.log("==================================================");

    const testSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const customerId = 'C_' + testSuffix;
    const eventId1 = 'EVT_CRM_1_' + testSuffix;
    const eventId2 = 'EVT_CRM_2_' + testSuffix;

    try {
        // Retrieve settings for auth
        const [settingsRows] = await appDB.query("SELECT api_key, webhook_secret FROM helpdesk_settings LIMIT 1");
        if (settingsRows.length === 0) {
            throw new Error("No settings in helpdesk_settings table to perform tests.");
        }
        const { api_key: apiKey, webhook_secret: secret } = settingsRows[0];

        // --- Test 1: Webhook receiver endpoint accepts customer.created ---
        console.log("\n[Test 1] POST customer.created webhook event...");
        const payload1 = {
            eventId: eventId1,
            event: 'customer.created',
            entity: 'customer',
            entityId: customerId,
            data: {
                salutation: 'Mr.',
                firstName: 'CRM',
                lastName: 'SyncTest',
                displayName: 'CRM Sync Customer',
                companyName: 'CRM Sync LLC',
                primaryEmail: `crmtest_${testSuffix}@example.com`,
                phoneNumber: '9876543210',
                status: 'Active',
                notes: 'Created via CRM Webhook test'
            }
        };

        const response1 = await fetch(`${BASE_URL}/integrations/crm/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(payload1)
        });

        assert.strictEqual(response1.status, 202);
        const resJson1 = await response1.json();
        assert.strictEqual(resJson1.success, true);
        assert.strictEqual(resJson1.eventId, eventId1);
        console.log("✅ Webhook customer.created accepted: PASS");

        // Wait for BullMQ worker to process
        console.log("Waiting 3 seconds for BullMQ worker to process...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if customer was inserted in local mirror
        const [custRows] = await appDB.query("SELECT * FROM customers WHERE customer_id = ?", [customerId]);
        assert.strictEqual(custRows.length, 1);
        assert.strictEqual(custRows[0].display_name, 'CRM Sync Customer');
        assert.strictEqual(custRows[0].company_name, 'CRM Sync LLC');
        assert.strictEqual(custRows[0].customer_status, 'Active');
        console.log("✅ Customer created in local mirror table: PASS");

        // --- Test 2: Idempotency check ---
        console.log("\n[Test 2] Testing webhook idempotency with duplicate eventId...");
        const responseDuplicate = await fetch(`${BASE_URL}/integrations/crm/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(payload1)
        });
        assert.strictEqual(responseDuplicate.status, 200);
        const resDupJson = await responseDuplicate.json();
        assert.strictEqual(resDupJson.message, 'Event already processed or queued');
        console.log("✅ Duplicate event successfully ignored (idempotency): PASS");

        // --- Test 3: customer.updated with allowed and restricted fields ---
        console.log("\n[Test 3] POST customer.updated webhook event...");
        const payload2 = {
            eventId: eventId2,
            event: 'customer.updated',
            entity: 'customer',
            entityId: customerId,
            data: {
                displayName: 'CRM Updated Name',
                companyName: 'CRM Updated LLC',
                primaryEmail: `crmupdated_${testSuffix}@example.com`,
                phoneNumber: '9876540000',
                status: 'Inactive',
                // Restricted fields (should be ignored and NOT overwrite anything)
                Password: 'hacked_password',
                Role: 'admin',
                SLA: 'Platinum',
                CreditHours: 100,
                SupportPlan: 'Premium'
            }
        };

        const response2 = await fetch(`${BASE_URL}/integrations/crm/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(payload2)
        });

        assert.strictEqual(response2.status, 202);
        console.log("✅ Webhook customer.updated accepted: PASS");

        console.log("Waiting 3 seconds for BullMQ worker to process...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if customer was updated in local mirror
        const [updatedCustRows] = await appDB.query("SELECT * FROM customers WHERE customer_id = ?", [customerId]);
        assert.strictEqual(updatedCustRows.length, 1);
        assert.strictEqual(updatedCustRows[0].display_name, 'CRM Updated Name');
        assert.strictEqual(updatedCustRows[0].company_name, 'CRM Updated LLC');
        assert.strictEqual(updatedCustRows[0].primary_email, `crmupdated_${testSuffix}@example.com`);
        assert.strictEqual(updatedCustRows[0].customer_status, 'Inactive');
        assert.ok(updatedCustRows[0].last_synced_at !== null);
        console.log("✅ Customer updated in local mirror table: PASS");

        // --- Test 4: Verify domains fetch and caching ---
        console.log("\n[Test 4] Verifying domains fetch & cache integration...");
        // Setup mock domains in database table (which acts as CRM source of truth)
        const domainId = 'D_' + testSuffix;
        const domainName = `crm-test-${testSuffix}.com`;
        await appDB.query(`
            INSERT INTO domains (domain_id, customer_id, customer_name, domain_name, registration_date, registered_with, domain_status)
            VALUES (?, ?, 'CRM Sync Customer', ?, '2026-07-13', 'Others', 'Active')
        `, [domainId, customerId, domainName]);

        // Trigger request to /helpdesk/customers/:customerId/domains
        const responseDomains = await fetch(`${BASE_URL}/helpdesk/customers/${customerId}/domains`, {
            method: 'GET',
            headers: {
                'X-API-Key': apiKey
            }
        });
        assert.strictEqual(responseDomains.status, 200);
        const domainsJson = await responseDomains.json();
        assert.ok(domainsJson.success);
        assert.strictEqual(domainsJson.domains.length, 1);
        assert.strictEqual(domainsJson.domains[0].domainName, domainName);
        console.log("✅ Domains fetched live from CRM API: PASS");

        // Check if key is now cached in Redis
        const cachedKey = `crm:cache:domains:${customerId}`;
        const cacheVal = await redisClient.get(cachedKey);
        assert.ok(cacheVal !== null);
        const parsedCache = JSON.parse(cacheVal);
        assert.strictEqual(parsedCache.length, 1);
        assert.strictEqual(parsedCache[0].domainName, domainName);
        console.log("✅ Domains successfully stored in Redis cache (5m TTL): PASS");

        // --- Test 5: domain.updated webhook invalidates cache ---
        console.log("\n[Test 5] POST domain.updated webhook to trigger invalidation...");
        const domainEventId = 'EVT_DOM_1_' + testSuffix;
        const payloadDomain = {
            eventId: domainEventId,
            event: 'domain.updated',
            entity: 'domain',
            entityId: domainId,
            data: {
                customerId: customerId,
                domainId: domainId,
                status: 'Expired'
            }
        };

        const responseDomWebhook = await fetch(`${BASE_URL}/integrations/crm/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(payloadDomain)
        });
        assert.strictEqual(responseDomWebhook.status, 202);

        console.log("Waiting 3 seconds for webhook processing...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Redis cache key should now be deleted/invalidated
        const cacheValAfter = await redisClient.get(cachedKey);
        assert.strictEqual(cacheValAfter, null);
        console.log("✅ Domain cache immediately invalidated: PASS");

        // --- Test 6: Verify crm_sync_logs entry ---
        console.log("\n[Test 6] Verifying crm_sync_logs history...");
        const [logs] = await appDB.query("SELECT * FROM crm_sync_logs WHERE event_id = ?", [eventId2]);
        assert.strictEqual(logs.length, 1);
        assert.strictEqual(logs[0].status, 'success');
        assert.ok(logs[0].processed_at !== null);
        console.log("✅ Log correctly stored in database: PASS");

    } finally {
        console.log("\n[Test Cleanup] Cleaning up test records from database...");
        try {
            await appDB.query("DELETE FROM crm_sync_logs WHERE event_id LIKE ?", [`%${testSuffix}`]);
            await appDB.query("DELETE FROM domains WHERE customer_id = ?", [customerId]);
            await appDB.query("DELETE FROM customers WHERE customer_id = ?", [customerId]);
            await redisClient.del(`crm:cache:domains:${customerId}`);
        } catch (e) {
            console.error("Cleanup failed:", e.message);
        }
    }

    console.log("\n==================================================");
    console.log("ALL REAL-TIME CRM SYNC TESTS PASSED! ✅");
    console.log("==================================================");
}

runTests().then(() => {
    process.exit(0);
}).catch(err => {
    console.error("❌ TEST RUN ENCOUNTERED AN ERROR:", err);
    process.exit(1);
});
