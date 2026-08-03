import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import appDB from '../db/subsyncDB.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runGoalsMigration() {
    try {
        console.log("Running Goals Module Schema Migration...");
        const schemaSql = fs.readFileSync(path.join(__dirname, '../migrations/20260803_goals_module_schema.sql'), 'utf8');
        
        // Split multi-statement SQL by semicolon (ignoring comments/empty lines)
        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            await appDB.query(statement);
        }
        console.log("Goals Schema Migration completed successfully.");

        console.log("Running Goals Module Permissions Migration...");
        const permSql = fs.readFileSync(path.join(__dirname, '../migrations/20260803_goals_permissions.sql'), 'utf8');
        const permStatements = permSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && s.toUpperCase() !== 'START TRANSACTION' && s.toUpperCase() !== 'COMMIT');

        for (const statement of permStatements) {
            await appDB.query(statement);
        }
        console.log("Goals Permissions Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

runGoalsMigration();
