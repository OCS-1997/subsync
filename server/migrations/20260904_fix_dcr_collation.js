import appDB from '../db/subsyncDB.js';
import { pathToFileURL } from 'url';

/**
 * Migration: Fix collation mismatch between dcr_entries, users, contacts, and domains
 */

async function up() {
    try {
        console.log('Fixing database table collations to utf8mb4_unicode_ci...');
        await appDB.query('SET FOREIGN_KEY_CHECKS = 0');
        
        await appDB.query('ALTER TABLE dcr_entries CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('Converted dcr_entries to utf8mb4_unicode_ci');

        await appDB.query('ALTER TABLE contacts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('Converted contacts to utf8mb4_unicode_ci');

        await appDB.query('ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('Converted users to utf8mb4_unicode_ci');

        await appDB.query('ALTER TABLE domains CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('Converted domains to utf8mb4_unicode_ci');

        await appDB.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Table collations standardized successfully!');
    } catch (error) {
        console.error('❌ Error fixing collations:', error);
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

export { up };
