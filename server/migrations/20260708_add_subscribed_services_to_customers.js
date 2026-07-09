import appDB from '../db/subsyncDB.js';

async function up() {
    try {
        console.log('Adding subscribed_services column to customers table...');
        // Check if column already exists
        const [columns] = await appDB.query("SHOW COLUMNS FROM customers LIKE 'subscribed_services'");
        if (columns.length === 0) {
            await appDB.query("ALTER TABLE customers ADD COLUMN subscribed_services JSON NULL");
            console.log('Added column subscribed_services to customers table.');
        } else {
            console.log('Column subscribed_services already exists. Skipping ALTER TABLE.');
        }

        // Run synchronization to populate subscribed_services for all existing customers
        console.log('Synchronizing subscribed_services for existing customers...');
        const [customers] = await appDB.query("SELECT customer_id FROM customers");
        console.log(`Found ${customers.length} customers to sync.`);
        
        for (const customer of customers) {
            const customerId = customer.customer_id;
            
            // Query unique services across all subscriptions for this customer
            const [rows] = await appDB.query(
                `SELECT DISTINCT COALESCE(si.service_name, ser.service_name) AS service_name
                 FROM subscription_items si
                 JOIN subscriptions s ON si.sub_id = s.sub_id
                 LEFT JOIN services ser ON si.service_id = ser.service_id
                 WHERE s.customer_id = ?`,
                [customerId]
            );

            const services = rows
                .map(r => r.service_name)
                .filter(name => name !== null && name !== undefined && name !== '');

            await appDB.query(
                "UPDATE customers SET subscribed_services = ? WHERE customer_id = ?",
                [JSON.stringify(services), customerId]
            );
        }
        console.log('✅ Subscribed services synchronization complete!');
    } catch (error) {
        console.error('❌ Error during migration up:', error);
        throw error;
    }
}

async function down() {
    try {
        console.log('Dropping subscribed_services column from customers table...');
        const [columns] = await appDB.query("SHOW COLUMNS FROM customers LIKE 'subscribed_services'");
        if (columns.length > 0) {
            await appDB.query("ALTER TABLE customers DROP COLUMN subscribed_services");
            console.log('Dropped column subscribed_services.');
        } else {
            console.log('Column subscribed_services does not exist. Skipping ALTER TABLE.');
        }
        console.log('✅ Migration down complete!');
    } catch (error) {
        console.error('❌ Error during migration down:', error);
        throw error;
    }
}

// Run migration if called directly
if (process.argv[1] && (process.argv[1].endsWith('20260708_add_subscribed_services_to_customers.js') || process.argv[1].endsWith('20260708_add_subscribed_services_to_customers'))) {
    try {
        await up();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export { up, down };
