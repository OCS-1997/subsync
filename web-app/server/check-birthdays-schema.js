import appDB from "./db/subsyncDB.js";

async function checkSchema() {
    try {
        const [columns] = await appDB.query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'birthdays' 
            AND COLUMN_NAME = 'user_id'
        `);

        if (columns.length > 0) {
            const col = columns[0];
            console.log("Current user_id column type:", col.DATA_TYPE);
            console.log("Max length:", col.CHARACTER_MAXIMUM_LENGTH);

            if (col.DATA_TYPE === 'bigint' || col.DATA_TYPE === 'int') {
                console.log("❌ Migration needed: user_id is still INTEGER type");
                console.log("Run: node run-migration.js");
            } else if (col.DATA_TYPE === 'varchar') {
                console.log("✅ Migration already applied: user_id is VARCHAR");
            }
        } else {
            console.log("❌ birthdays table or user_id column not found");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
}

checkSchema();


