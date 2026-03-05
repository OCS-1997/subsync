
import appDB from '../db/subsyncDB.js';
import { pathToFileURL } from 'url';

/**
 * Migration: Extend dcr_entries table to support phone-call-sourced DCR entries
 * 
 * Run: node migrations/003_extend_dcr_for_phone_calls.js
 */

async function up() {
    try {
        console.log('Extending dcr_entries for phone call support...');

        // 1. Check if call_source column exists
        const [columns] = await appDB.query("SHOW COLUMNS FROM dcr_entries LIKE 'call_source'");
        if (columns.length === 0) {
            console.log('Adding call_source column...');
            await appDB.query(`
                ALTER TABLE dcr_entries
                ADD COLUMN call_source ENUM('manual', 'phone') NOT NULL DEFAULT 'manual'
                AFTER notes
            `);
        } else {
            console.log('call_source column already exists.');
        }

        // 2. Check if call_duration_seconds column exists
        const [durationCols] = await appDB.query("SHOW COLUMNS FROM dcr_entries LIKE 'call_duration_seconds'");
        if (durationCols.length === 0) {
            console.log('Adding call_duration_seconds column...');
            await appDB.query(`
                ALTER TABLE dcr_entries
                ADD COLUMN call_duration_seconds INT NULL
                AFTER call_source
            `);
        } else {
            console.log('call_duration_seconds column already exists.');
        }

        // 3. Check for idx_call_source index
        const [indexes] = await appDB.query("SHOW INDEX FROM dcr_entries WHERE Key_name = 'idx_call_source'");
        if (indexes.length === 0) {
            console.log('Adding index idx_call_source...');
            await appDB.query(`
                ALTER TABLE dcr_entries
                ADD INDEX idx_call_source (call_source)
            `);
        } else {
            console.log('index idx_call_source already exists.');
        }

        // 4. Check for idx_phone_number index (on contact_phone_number)
        const [phoneIndexes] = await appDB.query("SHOW INDEX FROM dcr_entries WHERE Key_name = 'idx_phone_number'");
        if (phoneIndexes.length === 0) {
            console.log('Adding index idx_phone_number...');
            await appDB.query(`
                ALTER TABLE dcr_entries
                ADD INDEX idx_phone_number (contact_phone_number)
            `);
        } else {
            console.log('index idx_phone_number already exists.');
        }

        console.log('✅ dcr_entries extended for phone calls successfully!');
    } catch (error) {
        console.error('❌ Error extending dcr_entries:', error);
        throw error;
    }
}

async function down() {
    try {
        console.log('Reverting dcr_entries phone call extensions...');

        // Check and drop indexes first
        const [idx1] = await appDB.query("SHOW INDEX FROM dcr_entries WHERE Key_name = 'idx_phone_number'");
        if (idx1.length > 0) await appDB.query('ALTER TABLE dcr_entries DROP INDEX idx_phone_number');
        
        const [idx2] = await appDB.query("SHOW INDEX FROM dcr_entries WHERE Key_name = 'idx_call_source'");
        if (idx2.length > 0) await appDB.query('ALTER TABLE dcr_entries DROP INDEX idx_call_source');

        // Check and drop columns
        const [col1] = await appDB.query("SHOW COLUMNS FROM dcr_entries LIKE 'call_duration_seconds'");
        if (col1.length > 0) await appDB.query('ALTER TABLE dcr_entries DROP COLUMN call_duration_seconds');

        const [col2] = await appDB.query("SHOW COLUMNS FROM dcr_entries LIKE 'call_source'");
        if (col2.length > 0) await appDB.query('ALTER TABLE dcr_entries DROP COLUMN call_source');

        console.log('✅ dcr_entries revert successful!');
    } catch (error) {
        console.error('❌ Error reverting dcr_entries:', error);
        throw error;
    }
}

// Run migration if called directly
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
