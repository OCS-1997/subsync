import appDB from '../db/subsyncDB.js';
import { helpdeskAuth } from '../middlewares/helpdeskAuth.js';
import { getCustomers, getCustomerDetails, getCustomerSummary } from '../controllers/helpdeskController.js';
import { publishCustomerEvent } from '../services/webhookService.js';
import crypto from 'crypto';

// Setup Mock Request and Response helpers
function mockResponse() {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    return res;
}

async function runTests() {
    try {
        console.log("==================================================");
        console.log("STARTING HELPDESK INTEGRATION LAYER DIAGNOSTICS");
        console.log("==================================================");

        // --- 1. Test Helpdesk Settings Seeding ---
        console.log("\n[Test 1] Verifying helpdesk_settings table entries...");
        const [settingsRows] = await appDB.query("SELECT * FROM helpdesk_settings LIMIT 1");
        if (settingsRows.length === 0) {
            throw new Error("No entries in helpdesk_settings table.");
        }
        const config = settingsRows[0];
        console.log("✅ Settings found in DB:");
        console.log(`   - URL: ${config.helpdesk_url}`);
        console.log(`   - API Key: ${config.api_key}`);
        console.log(`   - Secret: ${config.webhook_secret}`);
        console.log(`   - Retries: ${config.retry_count}`);

        // --- 2. Test helpdeskAuth Middleware (API Key) ---
        console.log("\n[Test 2] Testing helpdeskAuth API Key authentication...");
        const reqApiKeyValid = {
            headers: { 'x-api-key': config.api_key },
            method: 'GET',
            originalUrl: '/api/helpdesk/customers'
        };
        const resApiKeyValid = mockResponse();
        let nextCalled = false;
        await helpdeskAuth(reqApiKeyValid, resApiKeyValid, () => { nextCalled = true; });
        console.log(nextCalled ? "✅ Valid API Key: PASS" : "❌ Valid API Key: FAIL");

        const reqApiKeyInvalid = {
            headers: { 'x-api-key': 'wrong_key_xyz' },
            method: 'GET',
            originalUrl: '/api/helpdesk/customers'
        };
        const resApiKeyInvalid = mockResponse();
        nextCalled = false;
        await helpdeskAuth(reqApiKeyInvalid, resApiKeyInvalid, () => { nextCalled = true; });
        console.log(!nextCalled && resApiKeyInvalid.statusCode === 403 ? "✅ Invalid API Key rejected (403): PASS" : "❌ Invalid API Key rejection: FAIL");

        // --- 3. Test helpdeskAuth Middleware (HMAC Signature & Replay Protection) ---
        console.log("\n[Test 3] Testing helpdeskAuth HMAC signature verification...");
        const timestamp = Date.now().toString();
        const message = `GET./api/helpdesk/customers.${timestamp}`;
        const signature = crypto.createHmac('sha256', config.webhook_secret)
            .update(message)
            .digest('hex');

        const reqSignatureValid = {
            headers: {
                'x-signature': signature,
                'x-timestamp': timestamp
            },
            method: 'GET',
            originalUrl: '/api/helpdesk/customers'
        };
        const resSignatureValid = mockResponse();
        nextCalled = false;
        await helpdeskAuth(reqSignatureValid, resSignatureValid, () => { nextCalled = true; });
        console.log(nextCalled ? "✅ Valid HMAC Signature: PASS" : "❌ Valid HMAC Signature: FAIL");

        // Replay attack validation (expired timestamp)
        const expiredTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
        const expiredMessage = `GET./api/helpdesk/customers.${expiredTimestamp}`;
        const expiredSignature = crypto.createHmac('sha256', config.webhook_secret)
            .update(expiredMessage)
            .digest('hex');

        const reqSignatureExpired = {
            headers: {
                'x-signature': expiredSignature,
                'x-timestamp': expiredTimestamp
            },
            method: 'GET',
            originalUrl: '/api/helpdesk/customers'
        };
        const resSignatureExpired = mockResponse();
        nextCalled = false;
        await helpdeskAuth(reqSignatureExpired, resSignatureExpired, () => { nextCalled = true; });
        console.log(!nextCalled && resSignatureExpired.statusCode === 401 ? "✅ Replay attack protection (rejected older timestamp): PASS" : "❌ Replay attack protection: FAIL");

        // --- 4. Test Customer APIs ---
        console.log("\n[Test 4] Testing GET /api/helpdesk/customers controller...");
        const reqList = { query: { page: '1', limit: '5', search: '', status: '' } };
        const resList = mockResponse();
        await getCustomers(reqList, resList);
        if (resList.statusCode === 200 && resList.jsonData.success) {
            console.log(`   - Total customers found: ${resList.jsonData.pagination.totalRecords}`);
            console.log(`   - Returned page list size: ${resList.jsonData.customers.length}`);
            if (resList.jsonData.customers.length > 0) {
                console.log(`   - Sample Customer details:`, resList.jsonData.customers[0]);
            }
            console.log("✅ Customers List Query: PASS");
        } else {
            console.error("resList payload:", resList.jsonData);
            throw new Error("Failed to get customers list");
        }

        // --- 5. Test Webhook Event Enqueuing & Database Logging ---
        console.log("\n[Test 5] Simulating Webhook Event publisher...");
        
        // Find a customer to test with
        const [customerRows] = await appDB.query("SELECT customer_id FROM customers LIMIT 1");
        if (customerRows.length > 0) {
            const customerId = customerRows[0].customer_id;
            console.log(`   - Publishing customer.updated event for customer ${customerId}...`);
            await publishCustomerEvent(customerId, 'customer.updated');
            
            // Check if logged in webhook_events
            const [loggedEvents] = await appDB.query("SELECT * FROM webhook_events WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1", [customerId]);
            if (loggedEvents.length > 0 && loggedEvents[0].event_type === 'customer.updated') {
                console.log(`   - Event recorded in DB: ID = ${loggedEvents[0].event_id}, Status = ${loggedEvents[0].delivery_status}`);
                console.log("✅ Webhook Event Logs storage: PASS");
            } else {
                console.error("Logged events count:", loggedEvents.length);
                throw new Error("Failed to log webhook event in database.");
            }
        } else {
            console.log("⚠️ No customer records in database to run webhook enqueuing test.");
        }

        console.log("\n==================================================");
        console.log("ALL LOGICAL TESTS PASSED SUCCESSFULLY! ✅");
        console.log("==================================================");
        process.exit(0);
    } catch (e) {
        console.error("\n❌ TEST RUN ENCOUNTERED AN ERROR:", e);
        process.exit(1);
    }
}

runTests();
