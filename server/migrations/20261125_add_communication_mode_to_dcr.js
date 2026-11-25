import appDB from '../db/subsyncDB.js';
import { pathToFileURL } from 'url';

/**
 * Migration: Add communication_mode to dcr_entries
 * Values: 'phone_call', 'whatsapp_message' (Default: 'phone_call')
 */

async function up() {
    try {
        console.log('Adding communication_mode to dcr_entries...');

        const [columns] = await appDB.query("SHOW COLUMNS FROM dcr_entries LIKE 'communication_mode'");
        if (columns.length === 0) {
            await appDB.query(`
                ALTER TABLE dcr_entries
                ADD COLUMN communication_mode ENUM('phone_call', 'whatsapp_message') NOT NULL DEFAULT 'phone_call'
                AFTER call_type
            `);
            console.log('Added communication_mode column.');
        } else {
            console.log('communication_mode column already exists.');
        }

        const [indexes] = await appDB.query("SHOW INDEX FROM dcr_entries WHERE Key_name = 'idx_communication_mode'");
        if (indexes.length === 0) {
            await appDB.query(`
                ALTER TABLE dcr_entries
                ADD INDEX idx_communication_mode (communication_mode)
            `);
            console.log('Added index idx_communication_mode.');
        } else {
            console.log('idx_communication_mode already exists.');
        }

        console.log('✅ Migration up completed successfully!');
    } catch (error) {
        console.error('❌ Error applying migration:', error);
        throw error;
    }
}

async function down() {
    try {
        console.log('Reverting communication_mode from dcr_entries...');

        const [indexes] = await appDB.query("SHOW INDEX FROM dcr_entries WHERE Key_name = 'idx_communication_mode'");
        if (indexes.length > 0) {
            await appDB.query('ALTER TABLE dcr_entries DROP INDEX idx_communication_mode');
        }

        const [columns] = await appDB.query("SHOW COLUMNS FROM dcr_entries LIKE 'communication_mode'");
        if (columns.length > 0) {
            await appDB.query('ALTER TABLE dcr_entries DROP COLUMN communication_mode');
        }

        console.log('✅ Migration down completed successfully!');
    } catch (error) {
        console.error('❌ Error reverting migration:', error);
        throw error;
    }
}

const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
    try {
        await up();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export { up, down };
