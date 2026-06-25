import appDB from '../db/subsyncDB.js';

/**
 * Migration: Create Helpdesk Integration Tables & Indexes
 * Run: node server/migrations/20260625_create_helpdesk_integration_tables.js
 */

async function up() {
    try {
        console.log('Creating helpdesk_settings table...');
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS helpdesk_settings (
                setting_id INT AUTO_INCREMENT PRIMARY KEY,
                helpdesk_url VARCHAR(500) NOT NULL,
                api_key VARCHAR(255) NOT NULL,
                webhook_secret VARCHAR(255) NOT NULL,
                retry_count INT NOT NULL DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Seed default row if empty
        const [existingSettings] = await appDB.query("SELECT COUNT(*) as count FROM helpdesk_settings");
        if (existingSettings[0].count === 0) {
            console.log('Seeding default helpdesk_settings...');
            await appDB.query(`
                INSERT INTO helpdesk_settings (helpdesk_url, api_key, webhook_secret, retry_count)
                VALUES (?, ?, ?, ?)
            `, [
                'http://localhost:3000/api/integrations/crm/customer-event',
                'crm_apikey_default_123456',
                'crm_whsecret_default_123456',
                5
            ]);
        }

        console.log('Creating webhook_events table...');
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS webhook_events (
                event_id VARCHAR(50) PRIMARY KEY,
                event_type VARCHAR(50) NOT NULL,
                customer_id VARCHAR(15) NOT NULL,
                payload JSON NOT NULL,
                delivery_status ENUM('pending', 'success', 'failed', 'retrying') NOT NULL DEFAULT 'pending',
                attempts INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('Creating webhook_delivery_logs table...');
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id VARCHAR(50) NOT NULL,
                attempt INT NOT NULL,
                request_url VARCHAR(500) NOT NULL,
                response_status INT NULL,
                response_body TEXT NULL,
                error_message TEXT NULL,
                delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES webhook_events(event_id) ON DELETE CASCADE,
                INDEX idx_log_event (event_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('Adding performance indexes on customers table...');
        try {
            await appDB.query("CREATE INDEX idx_customers_status ON customers(customer_status)");
            console.log('Added index idx_customers_status');
        } catch (e) {
            if (e.message && (e.message.includes('Duplicate key name') || e.message.includes('already exists'))) {
                console.log('Index idx_customers_status already exists. Skipping.');
            } else {
                throw e;
            }
        }

        try {
            await appDB.query("CREATE INDEX idx_customers_email ON customers(primary_email)");
            console.log('Added index idx_customers_email');
        } catch (e) {
            if (e.message && (e.message.includes('Duplicate key name') || e.message.includes('already exists'))) {
                console.log('Index idx_customers_email already exists. Skipping.');
            } else {
                throw e;
            }
        }

        console.log('✅ Helpdesk Integration tables and indexes created successfully!');
    } catch (error) {
        console.error('❌ Error in Helpdesk Integration migration:', error);
        throw error;
    }
}

async function down() {
    try {
        console.log('Dropping Helpdesk Integration tables...');
        await appDB.query('DROP TABLE IF EXISTS webhook_delivery_logs');
        await appDB.query('DROP TABLE IF EXISTS webhook_events');
        await appDB.query('DROP TABLE IF EXISTS helpdesk_settings');
        
        try {
            await appDB.query("DROP INDEX idx_customers_status ON customers");
            console.log('Dropped index idx_customers_status');
        } catch (e) {}

        try {
            await appDB.query("DROP INDEX idx_customers_email ON customers");
            console.log('Dropped index idx_customers_email');
        } catch (e) {}

        console.log('✅ Helpdesk Integration tables dropped successfully!');
    } catch (error) {
        console.error('❌ Error dropping Helpdesk Integration tables:', error);
        throw error;
    }
}

// Run migration if called directly
if (process.argv[1] && (process.argv[1].endsWith('create_helpdesk_integration_tables.js') || process.argv[1].endsWith('create_helpdesk_integration_tables'))) {
    try {
        await up();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export { up, down };
