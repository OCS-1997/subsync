import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const runMigration = async (filePath) => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        console.log(`Running migration: ${filePath}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        await connection.query(sql);
        console.log(`Migration successful: ${filePath}`);
    } catch (error) {
        console.error(`Migration failed: ${filePath}`, error);
        throw error;
    } finally {
        await connection.end();
    }
};

const migrations = [
    '20260117_asset_management_schema.sql',
    '20260117_asset_management_permissions.sql',
    '20260117_asset_management_dashboard.sql'
];

(async () => {
    for (const m of migrations) {
        await runMigration(path.join('migrations', m));
    }
})().catch(err => {
    console.error('Migration process failed', err);
    process.exit(1);
});
