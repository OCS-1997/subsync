import appDB from '../db/subsyncDB.js';

async function up() {
    try {
        console.log('Adding service_credit column to services table...');
        // Check if column already exists
        const [columns] = await appDB.query("SHOW COLUMNS FROM services LIKE 'service_credit'");
        if (columns.length === 0) {
            await appDB.query("ALTER TABLE services ADD COLUMN service_credit INT NULL");
            console.log('Added column service_credit to services table.');
        } else {
            console.log('Column service_credit already exists. Skipping ALTER TABLE.');
        }
        console.log('✅ Service credit migration up complete!');
    } catch (error) {
        console.error('❌ Error during migration up:', error);
        throw error;
    }
}

async function down() {
    try {
        console.log('Dropping service_credit column from services table...');
        const [columns] = await appDB.query("SHOW COLUMNS FROM services LIKE 'service_credit'");
        if (columns.length > 0) {
            await appDB.query("ALTER TABLE services DROP COLUMN service_credit");
            console.log('Dropped column service_credit.');
        } else {
            console.log('Column service_credit does not exist. Skipping ALTER TABLE.');
        }
        console.log('✅ Migration down complete!');
    } catch (error) {
        console.error('❌ Error during migration down:', error);
        throw error;
    }
}

// Run migration if called directly
if (process.argv[1] && (process.argv[1].endsWith('20260713_add_service_credit_to_services.js') || process.argv[1].endsWith('20260713_add_service_credit_to_services'))) {
    try {
        await up();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export { up, down };
