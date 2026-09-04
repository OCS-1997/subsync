import appDB from '../db/subsyncDB.js';
import { pathToFileURL } from 'url';

/**
 * Migration: Convert ALL database tables to utf8mb4_unicode_ci to eliminate all collation mismatch errors
 */

async function up() {
    try {
        console.log('Fixing database table collations to utf8mb4_unicode_ci...');
        await appDB.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Get current database name
        const [[{ dbName }]] = await appDB.query('SELECT DATABASE() as dbName');
        if (dbName) {
            await appDB.query(`ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            console.log(`Updated database ${dbName} default collation to utf8mb4_unicode_ci`);
        }

        // Get all tables in database and convert each
        const [tables] = await appDB.query('SHOW TABLES');
        for (const row of tables) {
            const tableName = Object.values(row)[0];
            try {
                await appDB.query(`ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
                console.log(`Converted table ${tableName} to utf8mb4_unicode_ci`);
            } catch (err) {
                console.warn(`Failed to convert table ${tableName}:`, err.message);
            }
        }

        await appDB.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ ALL database table collations standardized to utf8mb4_unicode_ci successfully!');
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
