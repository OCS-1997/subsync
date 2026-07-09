import appDB from '../db/subsyncDB.js';
import assert from 'assert';
import { getCustomerById } from '../models/customerModel.js';
import { addSubscription, updateSubscriptionById, deleteSubscriptionById } from '../models/subscriptionModel.js';

async function runTests() {
    console.log("==================================================");
    console.log("STARTING CUSTOMER SUBSCRIBED SERVICES TESTS");
    console.log("==================================================");

    const testSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const customerId = 'CID_T' + testSuffix;
    const domainId1 = 'DID_1' + testSuffix;
    const domainId2 = 'DID_2' + testSuffix;
    const domainName1 = 'test-domain-1-' + testSuffix + '.com';
    const domainName2 = 'test-domain-2-' + testSuffix + '.com';

    // Service names and SKUs
    const serviceA = 'Service A ' + testSuffix;
    const serviceB = 'Service B ' + testSuffix;
    const serviceC = 'Service C ' + testSuffix;

    const skuA = 'SKUA' + testSuffix;
    const skuB = 'SKUB' + testSuffix;
    const skuC = 'SKUC' + testSuffix;

    let idA, idB, idC;

    try {
        // 1. Create a test customer
        console.log("\n[Test Setup] Creating test customer...");
        await appDB.query(`
            INSERT INTO customers (customer_id, salutation, first_name, last_name, primary_email, country_code, primary_phone_number, customer_address, company_name, display_name, gst_treatment, customer_status, payment_terms, subscribed_services)
            VALUES (?, 'Mr.', 'Test', 'User', 'testuser@example.com', '+91', '9999999999', '{}', 'Test Company', ?, 'iGST', 'Active', '{}', '[]')
        `, [customerId, 'Test Display ' + testSuffix]);

        // 2. Verify initial subscribed services is empty
        console.log("[Test 1] Verifying initial customer subscribed services is empty...");
        let cust = await getCustomerById(customerId);
        let parsedServices = typeof cust.subscribed_services === 'string' ? JSON.parse(cust.subscribed_services) : cust.subscribed_services;
        assert.deepStrictEqual(parsedServices || [], []);
        console.log("✅ Initial subscribed_services is empty: PASS");

        // 3. Create test domains
        console.log("[Test Setup] Creating test domains...");
        await appDB.query(`
            INSERT INTO domains (domain_id, customer_id, customer_name, domain_name, registration_date, registered_with, domain_status)
            VALUES (?, ?, 'Test Display', ?, '2026-07-08', 'Others', 'Active')
        `, [domainId1, customerId, domainName1]);

        await appDB.query(`
            INSERT INTO domains (domain_id, customer_id, customer_name, domain_name, registration_date, registered_with, domain_status)
            VALUES (?, ?, 'Test Display', ?, '2026-07-08', 'Others', 'Active')
        `, [domainId2, customerId, domainName2]);

        // 4. Create test services
        console.log("[Test Setup] Creating test services...");
        const insertService = async (name, sku) => {
            const [res] = await appDB.query(`
                INSERT INTO services (service_name, stock_keepers_unit, item_group, sales_info, purchase_info, default_tax_rates)
                VALUES (?, ?, '1', '{}', '{}', '{}')
            `, [name, sku]);
            return res.insertId;
        };

        idA = await insertService(serviceA, skuA);
        idB = await insertService(serviceB, skuB);
        idC = await insertService(serviceC, skuC);

        // 5. Add Subscription 1 for Domain 1 (Service A, Service B)
        console.log("\n[Test 2] Adding Subscription 1 (Service A, Service B) under Domain 1...");
        const { subId: subId1 } = await addSubscription({
            domain_name: domainName1,
            customerID: customerId,
            startDate: '2026-07-08 00:00:00',
            endDate: '2027-07-08 00:00:00',
            items: [
                { service_id: idA, service_name: serviceA, quantity: 1, rate: 100 },
                { service_id: idB, service_name: serviceB, quantity: 1, rate: 200 }
            ]
        });

        cust = await getCustomerById(customerId);
        parsedServices = typeof cust.subscribed_services === 'string' ? JSON.parse(cust.subscribed_services) : cust.subscribed_services;
        assert.ok(parsedServices.includes(serviceA));
        assert.ok(parsedServices.includes(serviceB));
        assert.strictEqual(parsedServices.length, 2);
        console.log("✅ Subscription 1 added and synced successfully: PASS");

        // Wait 1.1s to avoid duplicate subscription ID generation
        await new Promise(resolve => setTimeout(resolve, 1100));

        // 6. Add Subscription 2 for Domain 2 (Service B, Service C)
        console.log("\n[Test 3] Adding Subscription 2 (Service B, Service C) under Domain 2...");
        const { subId: subId2 } = await addSubscription({
            domain_name: domainName2,
            customerID: customerId,
            startDate: '2026-07-08 00:00:00',
            endDate: '2027-07-08 00:00:00',
            items: [
                { service_id: idB, service_name: serviceB, quantity: 1, rate: 200 },
                { service_id: idC, service_name: serviceC, quantity: 1, rate: 300 }
            ]
        });

        cust = await getCustomerById(customerId);
        parsedServices = typeof cust.subscribed_services === 'string' ? JSON.parse(cust.subscribed_services) : cust.subscribed_services;
        assert.ok(parsedServices.includes(serviceA));
        assert.ok(parsedServices.includes(serviceB));
        assert.ok(parsedServices.includes(serviceC));
        assert.strictEqual(parsedServices.length, 3); // Deduplication check
        console.log("✅ Subscription 2 added, deduplicated, and synced successfully: PASS");

        // 7. Update Subscription 1 to only have Service A
        console.log("\n[Test 4] Updating Subscription 1 to only contain Service A...");
        await updateSubscriptionById(subId1, {
            domain_name: domainName1,
            customerID: customerId,
            startDate: '2026-07-08 00:00:00',
            endDate: '2027-07-08 00:00:00',
            items: [
                { service_id: idA, service_name: serviceA, quantity: 1, rate: 100 }
            ]
        });

        cust = await getCustomerById(customerId);
        parsedServices = typeof cust.subscribed_services === 'string' ? JSON.parse(cust.subscribed_services) : cust.subscribed_services;
        // Should still contain Service A, Service B, Service C because Subscription 2 still has Service B and Service C
        assert.ok(parsedServices.includes(serviceA));
        assert.ok(parsedServices.includes(serviceB));
        assert.ok(parsedServices.includes(serviceC));
        assert.strictEqual(parsedServices.length, 3);
        console.log("✅ Subscription 1 updated successfully: PASS");

        // 8. Delete Subscription 2 (removing Service B and Service C from that domain/subscription)
        console.log("\n[Test 5] Deleting Subscription 2...");
        await deleteSubscriptionById(subId2);

        cust = await getCustomerById(customerId);
        parsedServices = typeof cust.subscribed_services === 'string' ? JSON.parse(cust.subscribed_services) : cust.subscribed_services;
        // Should now only contain Service A (since Subscription 1 only has Service A, and Subscription 2 is deleted)
        assert.ok(parsedServices.includes(serviceA));
        assert.ok(!parsedServices.includes(serviceB));
        assert.ok(!parsedServices.includes(serviceC));
        assert.strictEqual(parsedServices.length, 1);
        console.log("✅ Subscription 2 deleted and customer services synced successfully: PASS");

        // 9. Clean up Subscription 1
        console.log("\n[Test Cleanup] Cleaning up subscription 1...");
        await deleteSubscriptionById(subId1);

    } finally {
        console.log("\n[Test Cleanup] Cleaning up test records from database...");
        // Delete subscriptions first
        try {
            await appDB.query("DELETE FROM subscriptions WHERE customer_id = ?", [customerId]);
        } catch (e) {
            console.error("Cleanup subscriptions failed:", e.message);
        }
        // Delete domains
        try {
            await appDB.query("DELETE FROM domains WHERE customer_id = ?", [customerId]);
        } catch (e) {
            console.error("Cleanup domains failed:", e.message);
        }
        // Delete customer
        try {
            await appDB.query("DELETE FROM customers WHERE customer_id = ?", [customerId]);
        } catch (e) {
            console.error("Cleanup customer failed:", e.message);
        }
        // Delete services
        try {
            if (idA) await appDB.query("DELETE FROM services WHERE service_id = ?", [idA]);
            if (idB) await appDB.query("DELETE FROM services WHERE service_id = ?", [idB]);
            if (idC) await appDB.query("DELETE FROM services WHERE service_id = ?", [idC]);
        } catch (e) {
            console.error("Cleanup services failed:", e.message);
        }
    }

    console.log("\n==================================================");
    console.log("ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅");
    console.log("==================================================");
}

runTests().then(() => {
    process.exit(0);
}).catch(err => {
    console.error("❌ TEST RUN ENCOUNTERED AN ERROR:", err);
    process.exit(1);
});
