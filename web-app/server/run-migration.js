import appDB from "./db/subsyncDB.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const migrationFile = path.join(__dirname, "migrations", "20241205_enhance_birthdays_module.sql");

    try {
        console.log("Reading migration file...");
        const sql = fs.readFileSync(migrationFile, "utf8");

        console.log("Connecting to database...");
        const connection = await appDB.getConnection();
        console.log("Connected! Executing migration...");

        try {
            await connection.beginTransaction();

            // Remove START TRANSACTION and COMMIT, then split by semicolon
            const cleanedSql = sql
                .replace(/START TRANSACTION;/gi, "")
                .replace(/COMMIT;/gi, "");

            const statements = cleanedSql
                .split(";")
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith("--"));

            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement) {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    await connection.query(statement);
                }
            }

            await connection.commit();
            console.log("✅ Migration completed successfully!");
        } catch (error) {
            await connection.rollback();
            console.error("Error executing migration:", error.message);
            throw error;
        } finally {
            connection.release();
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();


