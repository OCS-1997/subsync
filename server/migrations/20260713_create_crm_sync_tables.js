import appDB from '../db/subsyncDB.js';

async function up() {
    try {
        console.log('Adding last_synced_at to customers table...');
        const [columns] = await appDB.query("SHOW COLUMNS FROM customers LIKE 'last_synced_at'");
        if (columns.length === 0) {
            await appDB.query("ALTER TABLE customers ADD COLUMN last_synced_at TIMESTAMP NULL");
            console.log('Added column last_synced_at to customers table.');
        } else {
            console.log('Column last_synced_at already exists.');
        }

        console.log('Creating crm_sync_logs table...');
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS crm_sync_logs (
                event_id VARCHAR(100) PRIMARY KEY,
                entity VARCHAR(50) NOT NULL,
                entity_id VARCHAR(50) NOT NULL,
                status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
                received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP NULL,
                errors TEXT NULL,
                INDEX idx_crm_sync_entity (entity, entity_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ CRM sync tables migration completed successfully.');
    } catch (e) {
        console.error('❌ Error during CRM sync tables migration up:', e);
        throw e;
    }
}

async function down() {
    try {
        await appDB.query("DROP TABLE IF EXISTS crm_sync_logs");
        const [columns] = await appDB.query("SHOW COLUMNS FROM customers LIKE 'last_synced_at'");
        if (columns.length > 0) {
            await appDB.query("ALTER TABLE customers DROP COLUMN last_synced_at");
        }
        console.log('✅ CRM sync tables migration down completed.');
    } catch (e) {
        console.error('❌ Error during CRM sync tables migration down:', e);
        throw e;
    }
}

if (process.argv[1] && (process.argv[1].endsWith('20260713_create_crm_sync_tables.js') || process.argv[1].endsWith('20260713_create_crm_sync_tables'))) {
    try {
        await up();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export { up, down };
